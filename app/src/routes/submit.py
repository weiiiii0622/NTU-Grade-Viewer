import asyncio
import math
import re

import bs4
from auth import get_token
from bs4 import Tag
from db import engine, get_session
from fastapi import APIRouter, BackgroundTasks, Depends, Response
from fastapi.exceptions import RequestValidationError

# from models import (
#     GRADE_MAP_INV,
#     GRADES,
#     Course,
#     GradeElement,
#     GradeUpdate,
#     Page,
#     Segment,
# )
from models import *
from pydantic import BaseModel
from utils.general import extract_dict, test_only
from utils.grade import get_grade_element
from utils.search import global_session, search_course

router = APIRouter(prefix="/submit")


async def insert_grades(*, grades: list[GradeWithUpdate]):
    session = Session(engine)

    async with global_session():
        await asyncio.gather(*[set_lecturer(grade) for grade in grades])
    grades = [grade for grade in grades if grade.lecturer]

    print("inserting grades...")
    for grade in grades:
        try:
            assert grade.id
            course: CourseBase = grade.course
            update: UpdateBase = grade.update

            db_course = session.get(Course, (course.id1, course.id2)) or Course.model_validate(
                course
            )
            db_grade = session.get(Grade, grade.id) or Grade(
                **{k: v for k, v in grade.model_dump().items() if k != "course"}
            )
            db_update = Update(grade_id=grade.id, **update.model_dump())
            print("update: ", update)
            print("db_update: ", db_update)

            # objs += [db_course, db_grade, db_update]
            session.add(db_course)  # todo: (optimize) no need to add if exists
            session.add(db_grade)
            session.add(db_update)
        except Exception as e:
            print("error: ", e.with_traceback(None))
            pass

    session.commit()
    session.close()


class PageResponse(BaseModel):
    token: str
    message: str


async def set_lecturer(grade: GradeWithUpdate) -> None:
    # * Get lecturer
    course: Course = grade.course
    assert not grade.lecturer
    result = await search_course(
        {
            **extract_dict(["id1", "id2", "title"], course.model_dump()),
            **extract_dict(["class_id", "semester", "lecturer"], grade.model_dump()),
        },
        thresholds={"lecturer": -1},  # lecturer unknown, hence unbound
    )

    assert result, grade
    assert result["lecturer"]
    grade.lecturer = result["lecturer"]


@router.post("/page")
async def submit_page(
    *,
    session: Session = Depends(get_session),
    page: Page,
    response: Response,
    background: BackgroundTasks,
) -> PageResponse:

    student_id, results = parse_page(page.content)

    semesters: list[str] = [grade.semester for grade in results]
    last_semester = sorted(semesters, key=lambda s: tuple(map(int, s.split("-"))))[-1]

    user = session.get(User, student_id)
    if user:
        user.last_semester = last_semester
    else:
        user = User(id=student_id, last_semester=last_semester)
    session.add(user)
    session.commit()

    background.add_task(insert_grades, grades=results)

    token = get_token(user.id)
    response.set_cookie("token", token)

    return PageResponse(token=token, message="success")


@test_only
@router.post("/grade")
def submit_grade(
    *, session: Session = Depends(get_session), grade: GradeWithUpdate
) -> GradeElement:
    course: CourseBase = grade.course
    db_course = session.get(Course, (course.id1, course.id2))
    if not db_course:
        db_course = session.add(Course.model_validate(course))

    db_grade = session.get(Grade, grade.id)
    if not db_grade:
        session.add(Grade(**(grade.model_dump() | {"course": db_course})))

    db_update = Update(**(grade.update.model_dump() | {"grade_id": grade.id}))
    session.add(db_update)

    session.commit()
    print(db_update)
    return get_grade_element(session.exec(select(Grade).where(Grade.id == grade.id)).one())


@test_only
@router.post("/grades")
def submit_grades(
    *, session: Session = Depends(get_session), grades: list[GradeWithUpdate]
) -> list[GradeElement]:
    return [submit_grade(grade=grade) for grade in grades]


def parse_page(text: str) -> tuple[str, list[GradeWithUpdate]]:
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
    results: list[GradeWithUpdate] = []
    for row in grade_rows:
        infos = get_infos(row, extract_cls)
        semester, id1, id2, class_id, title, grade_str = infos
        # if not class_id:
        #     class_id = None

        if grade_str not in GRADES:
            continue

        # ! fuck bs4 typing
        dropdown: Tag = row.next_sibling  # type: ignore
        if dropdown == "\n":
            dropdown = dropdown.next_sibling  # type: ignore
        assert (raw := str(dropdown)) and id2 in raw, raw  # note: id1 may be html-encoded

        try:
            dist = tuple(
                Decimal(obj.group(1))
                for p in dropdown.select("p")
                if (obj := re.match(r"(\d+(\.\d+)?)\%", p.text))
            )
        except ValueError:
            # assert semester == "112-1"
            continue
        if len(dist) != 3 or not math.isclose(sum(dist, 0), 100, abs_tol=1):
            # assert semester == "112-1"
            continue

        course = CourseBase(**extract_dict(["id1", "id2", "title"], locals()))
        update = UpdateBase(pos=GRADE_MAP_INV[grade_str], lower=dist[0], higher=dist[-1])
        grade = GradeWithUpdate(
            course_id1=id1,
            course_id2=id2,
            course=course,
            semester=semester,
            class_id=class_id,
            lecturer="",
            update=update,
        )
        results.append(grade)

    return student_id, results
