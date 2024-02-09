# @app.get("/grades/all")

from functools import wraps

from auth import auth_required, auth_required_dependency
from db import do_query_grades
from fastapi import APIRouter, Depends
from models import GradeElement
from utils.general import add_decorator_doc, test_only

router = APIRouter(prefix="/grade")


@router.get("/all")
@auth_required
@test_only
def get_all_grades() -> list[GradeElement]:
    """
    Just get all grades.
    """

    return do_query_grades({"1": "1"}, {})
