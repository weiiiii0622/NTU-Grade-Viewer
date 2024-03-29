import asyncio
import math
import re
from time import sleep
from typing import Union

import bs4
import requests
from auth import get_token
from bs4 import Tag
from db import get_engine, get_session
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
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
from sqlmodel import Session, select
from tqdm import tqdm
from utils.general import extract_dict
from utils.grade import get_grade_element
from utils.route import test_only
from utils.search import global_session, search_course
from utils.static import get_static_path

router = APIRouter(prefix="/submit")


# todo: not insert if same semester, class_id and update.pos exist
async def insert_grades(*, grades: list[GradeWithUpdate]):
    session = Session(get_engine())

    async with global_session():
        await asyncio.gather(*[set_lecturer(grade) for grade in grades])
    grades = [grade for grade in grades if grade.lecturer]

    print("inserting grades...")
    for grade in tqdm(grades):
        try:
            assert grade.id
            course: CourseBase = grade.course
            update: UpdateBase = grade.update

            if u := session.exec(
                select(Update).where(
                    Update.grade_id == grade.id,
                    Update.pos == update.pos,
                    Update.solid == True,
                )
            ).first():
                continue

            db_course = session.get(Course, (course.id1, course.id2)) or Course.model_validate(
                course
            )
            db_grade = session.get(Grade, grade.id) or Grade(
                **{k: v for k, v in grade.model_dump().items() if k != "course"}
            )
            db_update = Update(grade_id=grade.id, **update.model_dump())
            # print("update: ", update)
            # print("db_update: ", db_update)

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
    assert not grade.lecturer or not grade.update.solid
    if grade.lecturer:
        return

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


i = 0


@router.post("/page")
async def submit_page(
    *,
    session: Session = Depends(get_session),
    page: Page,
    cookie: str,
    response: Response,
    background: BackgroundTasks,
) -> PageResponse:

    # ---------------------- Request GradePage from back-end --------------------- #

    url = "https://if190.aca.ntu.edu.tw/graderanking/Stu?lang=zh"
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-TW,zh;q=0.9",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    if not cookie:
        raise HTTPException(422, "Empty cookie")

    max_retries = 5
    retry_wait = 0.1  # s
    student_id = None
    results = None
    for _ in range(max_retries):
        print(f"{_} try")
        res = requests.get(url, headers=headers)
        try:
            student_id, results = parse_page(res.text)
            break
        except:
            sleep(retry_wait)

    if not student_id or not results:
        print("Cookies: ", cookie)
        print("Try to parse user from frontend...")
        try:
            student_id, results = parse_page(
                page.content
            )  # Uncomment this to parse the page from front-end
        except:
            pass

    if not student_id or not results:
        global i
        i += 1
        open(str(get_static_path() / f"error{i}.html"), "+w", encoding="utf-8").write(res.text)
        raise HTTPException(500)

    # ---------------------------------------------------------------------------- #

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
) -> Union[GradeElement, None]:
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
) -> list[Union[GradeElement, None]]:
    return [submit_grade(grade=grade) for grade in grades]


def parse_page(text: str) -> tuple[str, list[GradeWithUpdate]]:
    """
    Returns:
        (student_id, [(course1, grade1), ...])
    """

    soup = bs4.BeautifulSoup(text, "html.parser")

    def get_infos(row: Tag, classes: list[str]) -> list[str]:
        return [row.select(f".{cls}")[0].text for cls in classes]

    student_id = None
    try:
        student_id = soup.select("label#regno")[0].text
    except:
        rank_rows = soup.select(".table-rank .table-rows")
        extract_cls = ["table-column-uid"]
        for row in rank_rows:
            try:
                if uid := get_infos(row, extract_cls)[0]:
                    student_id = uid
                    break
            except:
                pass

    if not student_id:
        raise RequestValidationError(["Cannot find student id"])

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
        try:
            infos = get_infos(row, extract_cls)
        except:
            continue
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
