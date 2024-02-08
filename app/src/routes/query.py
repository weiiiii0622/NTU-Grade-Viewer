from typing import Annotated, Literal

from auth import auth_required
from db import do_query_grades
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from models import (
    QUERY_FIELDS,
    QUERY_FILTERS,
    GradeElement,
    Id1,
    Id2,
    QueryCourse,
    QueryFilter,
    Semester,
)

router = APIRouter()


# async def get_query_dict(querys: QueryCourse = Depends(), filters: QueryFilter = Depends()):
#     return {*querys, *filters}


async def get_query_dict(
    # id1: Annotated[str, Query(description="'課號', e.g. CSIE1212")] = "",
    # id2: Annotated[
    #     str, Query(description="'課程識別碼', e.g. '902 10750'. Note the space character.")
    # ] = "",
    id1: Literal[""] | Id1 = "",
    id2: Literal[""] | Id2 = "",
    title: Annotated[str, Query(description="'課程名稱'")] = "",
    class_id: Annotated[str, Query(description="'班次'")] = "",
    semester: Annotated[
        Literal[""] | Semester, Query(description="Semester between 90-1 ~ 130-2")
    ] = "",
):
    d = locals()
    keys = QUERY_FIELDS + QUERY_FILTERS
    return {k: v for k in keys if (v := d[k])}


@router.get("/query")
@auth_required
def query_grades(query: dict = Depends(get_query_dict)) -> list[GradeElement]:
    """
    Each query should provide at least one of `id1`, `id2` or `title`. The `class_id` and `semester` parameters are for further filtering results.

    Returns:
        A list of `GradeElement` satisfing given filters.
    """

    fields = {k: v for k, v in query.items() if k in QUERY_FIELDS}
    filters = {k: v for k, v in query.items() if k in QUERY_FILTERS}

    if not fields:
        raise HTTPException(status_code=400, detail="At least one field has to be specified!")

    return do_query_grades(fields, filters)
