
# @app.get("/grades/all")

from functools import wraps

from auth import auth_required_dependency
from db import do_query_grades
from fastapi import APIRouter, Depends
from models import GradeElement
from utils.general import add_decorator_doc


@add_decorator_doc
def test_only(f):
    # TODO: use some special header
    @wraps(f)
    def _f(*args, **kwargs):
        return f(*args, **kwargs)

    return _f


router = APIRouter(prefix='/grade')

# @auth_required
@router.get('/all', dependencies=[Depends( auth_required_dependency )])
@test_only
def get_all_grades() -> list[GradeElement]:
    """
    Just get all grades.
    """

    return do_query_grades({"1": "1"}, {})