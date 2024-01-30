import math
import re

import bs4
from bs4 import Tag
from fastapi.exceptions import RequestValidationError

from models import Course, GradeInfo


GRADES = ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F")
RE_SEMESTER = re.compile(r"\d+-\d+")


def get_infos(row: Tag, classes: list[str]) -> list[str]:
    return [row.select(f".{cls}")[0].text for cls in classes]


def parse_page(text: str) -> tuple[str, list[tuple[Course, GradeInfo]]]:
    """
    Return (student_id, results)
    """

    soup = bs4.BeautifulSoup(text, "html.parser")

    rank_rows = soup.select(".table-rank .table-rows")
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
    results = []
    for row in grade_rows:
        infos = get_infos(row, extract_cls)
        semester, id1, id2, class_id, title, grade = infos
        if not class_id:
            class_id = None

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

        course = Course(id1, id2, title)
        grade = GradeInfo(
            course_id1=id1,
            semester=semester,
            lecturer=None,
            class_id=class_id,
            grade=grade,
            dist=dist,
        )
        results.append((course, grade))

    return student_id, results


# example = open("./example.html", encoding="utf-8").read()
# print(parse(example))
