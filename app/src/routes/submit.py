import asyncio
import math
import re

import bs4
from auth import add_user
from bs4 import ResultSet, Tag
from db import insert_courses, insert_grade_elements
from errors import ValidationErrorResponse
from fastapi import APIRouter, Response
from fastapi.exceptions import RequestValidationError
from models import (
    GRADE_MAP_INV,
    GRADES,
    Course,
    GradeElement,
    GradeUpdate,
    Page,
    Segment,
)
from pydantic import BaseModel, ValidationError
from utils.general import extract_dict
from utils.search import global_session, search_course
from utils.segment_list import SegmentList

router = APIRouter(prefix="/submit")


class PageResponse(BaseModel):
    token: str
    message: str


@router.post("/page")
async def submit_page(page: Page, response: Response) -> PageResponse:

    student_id, results = parse_page(page.content)

    insert_courses([c for c, _ in results])

    # TODO: update grade by incoming info
    async with global_session():
        grade_eles = await asyncio.gather(*[get_grade_element(g, []) for c, g in results])
        insert_grade_elements(grade_eles)

    token = add_user(student_id)
    response.set_cookie("token", token)

    return PageResponse(token=token, message="success")


# TODO
@router.post("/grade")
def submit_grade():
    pass


# TODO
@router.post("/grades")
def submit_grades():
    pass


async def get_grade_element(grade: GradeUpdate, init_segments: list[Segment]):
    course = grade.course

    if not grade.lecturer:
        result = await search_course(
            {
                **extract_dict(["id1", "id2", "title"], course.model_dump()),  # type: ignore
                **extract_dict(["class_id", "semester", "lecturer"], grade.model_dump()),
            },
            thresholds={"lecturer": -1},  # lecturer unknown, hence unbound
        )

        # if result is None:
        #     return
        assert result, grade
        assert result["lecturer"]
        grade.lecturer = result["lecturer"]

    seg_list = SegmentList(10, 100.0, [seg.unpack() for seg in init_segments])
    seg_list.update(GRADE_MAP_INV[grade.grade], *grade.dist)
    segments = [Segment.from_iterable(seg) for seg in seg_list.dump()]

    ele = GradeElement(
        # course_id1=result['lecturer']
        course=grade.course,
        semester=grade.semester,
        lecturer=grade.lecturer,
        class_id=grade.class_id,
        segments=segments,
    )

    return ele


def parse_page(text: str) -> tuple[str, list[tuple[Course, GradeUpdate]]]:
    """
    Returns:
        (student_id, [(course1, grade1), ...])
    """

    soup = bs4.BeautifulSoup(text, "html.parser")

    rank_rows = soup.select(".table-rank .table-rows")

    def get_infos(row: Tag, classes: list[str]) -> list[str]:
        return [row.select(f".{cls}")[0].text for cls in classes]

    extract_cls = ["table-column-uid"]
    uids = [get_infos(row, extract_cls)[0] for row in rank_rows]
    if not uids or any(uid != uids[0] for uid in uids):
        raise RequestValidationError(["Cannot find student id"])
    student_id = uids[0]

    grade_rows = soup.select(".table-grade .table-rows")
    extract_cls = [
        "table-column_academic-year",
        "table-column_course-number",
        "table-column-curriculum-identity-number",
        "table-column-class",
        "table-column-course-title ",
        "table-column-grade",
    ]
    results: list[tuple[Course, GradeUpdate]] = []
    for row in grade_rows:
        infos = get_infos(row, extract_cls)
        semester, id1, id2, class_id, title, grade = infos
        # if not class_id:
        #     class_id = None

        if grade not in GRADES:
            continue

        # ! fuck bs4 typing
        dropdown: Tag = row.next_sibling  # type: ignore
        if dropdown == "\n":
            dropdown = dropdown.next_sibling  # type: ignore
        assert (raw := str(dropdown)) and id2 in raw, raw  # note: id1 may be html-encoded

        try:
            dist = tuple(
                float(obj.group(1))
                for p in dropdown.select("p")
                if (obj := re.match(r"(\d+(\.\d+)?)\%", p.text))
            )
        except ValueError:
            # assert semester == "112-1"
            continue
        if len(dist) != 3 or not math.isclose(sum(dist, 0), 100, abs_tol=1):
            # assert semester == "112-1"
            continue

        course = Course(**extract_dict(["id1", "id2", "title"], locals()))
        grade = GradeUpdate(
            # course_id1=id1,
            course=course,
            semester=semester,
            class_id=class_id,
            grade=grade,
            dist=dist,
        )
        results.append((course, grade))

    return student_id, results
