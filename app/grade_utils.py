from bs4 import BeautifulSoup, Tag
import requests

from models import Course, GradeBase
from page import parse_page

SEARCH_URL = "https://nol.ntu.edu.tw/nol/coursesearch/search_result.php"

default_params = {
    "alltime": "yes",
    "allproced": "yes",
    "allsel": "yes",
    "page_cnt": "1000",
    "Submit22": "查詢",
}


def fetch_id1(id1: str, semester: str):
    params = default_params | {
        "current_sem": semester,
        "cstype": "3",
        "csname": id1,
    }

    return requests.get(
        SEARCH_URL, params=params, headers={"Content-Type": "text/html; charset=utf-8"}
    ).text


def row_to_dict(row: Tag):
    entries = [
        (2, "id1"),
        (3, "class_id"),
        (4, "title"),
        (7, "id2"),
        (10, "lecturer"),
    ]

    datas = row.find_all("td")
    res = {key: datas[idx].text.strip() for idx, key in entries}
    return res


def extract_lecturer(text: str, course: Course, grade: GradeBase):
    soup = BeautifulSoup(text, "html.parser")
    table: Tag = soup.find_all("table")[6]
    rows: list[Tag] = table.find_all("tr")[1:]
    infos = [row_to_dict(row) for row in rows]

    keys = [
        "id1",
        # "class_id",
        # "title",
        "id2",
        # "lecturer",
    ]

    # ? some weird case e.g. "902E46100"
    for info in infos:
        s = info["id2"]
        s = f"{s[:3]} {s[4:]}"
        info["id2"] = s

    assert all(
        all(k in course.model_fields and info[k] == getattr(course, k) for k in keys)
        for info in infos
    ), (infos, course)

    if not grade.class_id:
        target = infos[0]
        assert target["class_id"] == ""  # TODO: maybe no need if lecture is default ''
    else:
        target = [info for info in infos if info["class_id"] == grade.class_id][0]
    return target["lecturer"]


# TODO: error handling
# TODO: use excel from 課程網 to test
# TODO rewrite with new api
def query_lecturer(course: Course, grade: GradeBase):
    assert course.id1 == grade.course_id1
    text = fetch_id1(course.id1, grade.semester)  # TODO: add fallback for id2?
    return extract_lecturer(text, course, grade)


def test1():
    example = open("./app/error.html", encoding="utf-8").read()
    _, results = parse_page(example)
    for c, g in results:
        lec = query_lecturer(c, g)
        print(c.title, lec)

def test2():
    example = open("./app/example.html", encoding="utf-8").read()
    _, results = parse_page(example)
    for c, g in results:
        lec = query_lecturer(c, g)
        print(c.title, lec)

# test1()
# test2()