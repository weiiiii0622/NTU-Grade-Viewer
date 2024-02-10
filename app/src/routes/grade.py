# @app.get("/grades/all")


from auth import auth_required
from db import get_session
from fastapi import APIRouter, Depends
from models import Grade, GradeElement
from sqlmodel import Session, select
from utils.general import test_only
from utils.grade import get_grade_element

router = APIRouter(prefix="/grade")


@router.get("/all")
@auth_required
@test_only
def get_all_grades(*, session: Session = Depends(get_session)) -> list[GradeElement]:
    """
    Just get all grades.
    """

    return [get_grade_element(grade) for grade in session.exec(select(Grade)).all()]

    # return do_query_grades({"1": "1"}, {})
