# @app.get("/grades/all")


from db import get_session
from fastapi import APIRouter, Depends
from models import Grade, GradeElement
from sqlmodel import Session, select
from utils.grade import get_grade_element
from utils.route import test_only, wrap_router

router = APIRouter(prefix="/grade")
wrap_router(router)


@router.get("/all")
@test_only
def get_all_grades(*, session: Session = Depends(get_session)) -> list[GradeElement]:
    """
    Just get all grades.
    """

    return [get_grade_element(grade) for grade in session.exec(select(Grade)).all()]

    # return do_query_grades({"1": "1"}, {})
