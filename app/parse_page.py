from dataclasses import dataclass
import re

import bs4
from bs4 import Tag

from module.course import Course, GradeInfo, GRADES


def get_infos(row: Tag, classes: list[str]) -> list[str]:
    return [row.select(f".{cls}")[0].text for cls in classes]


def parse(text: str) -> list[GradeInfo]:
    soup = bs4.BeautifulSoup(text, "html.parser")
    grade_rows = soup.select(".table-grade .table-rows")

    extract_cls = [
        "table-column_academic-year",
        "table-column_course-number",
        "table-column-curriculum-identity-number",
        "table-column-course-title ",
        "table-column-grade",
    ]
    results: list[GradeInfo] = []
    for row in grade_rows:
        infos = get_infos(row, extract_cls)
        semester, id1, id2, title, grade = infos
        if any(not s for s in infos) or grade not in GRADES:
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
            assert semester == "112-1"
            continue
        if len(dist) != 3 or abs(sum(dist) - 100) > 1:
            assert semester == "112-1"
            continue

        course = Course(id1, id2, title)
        grade = GradeInfo(course, semester, grade, dist)
        results.append(grade)
    return results


example = open("./example.html", encoding="utf-8").read()
print(parse(example))
