"""
Searching information from official NTU website.
"""

from math import inf
from typing import Literal, TypeAlias

import aiohttp
import requests
from bs4 import BeautifulSoup, Tag
from models import Course, GradeBase

from .general import edit_distance

GLOBAL_SESSION: aiohttp.ClientSession | None = None


def global_session(session: aiohttp.ClientSession | None = None):
    if not session:
        session = aiohttp.ClientSession()
    global GLOBAL_SESSION
    GLOBAL_SESSION = session

    class GlobalSession:
        async def __aenter__(self):
            pass

        async def __aexit__(self, type, value, traceback):
            global GLOBAL_SESSION
            GLOBAL_SESSION = None
            assert session
            await session.close()

    return GlobalSession()


def course_table_url(course: Course, grade: GradeBase):
    BASE = "https://nol.ntu.edu.tw/nol/coursesearch/print_table.php"
    return BASE + f"?course_id={course.id2}&semester={grade.semester}&class={grade.class_id or ''}"


SEARCH_URL = "https://nol.ntu.edu.tw/nol/coursesearch/search_result.php"


default_params = {
    "alltime": "yes",
    "allproced": "yes",
    "allsel": "yes",
    "page_cnt": "1000",
    "Submit22": "查詢",
}


cstype_map = {"title": 1, "lecturer": 2, "id1": 3, "id2": 5}


Key: TypeAlias = Literal["id1", "id2", "title", "class_id", "semester", "lecturer"]


async def fetch_by(
    key: Key,
    value: str,
    semester: str,
    session: aiohttp.ClientSession | None = None,
) -> str:

    params = default_params | {
        "current_sem": semester,
        "cstype": f"{cstype_map[key]}",
        "csname": value,
    }

    if not session:
        if not GLOBAL_SESSION:
            return requests.get(
                SEARCH_URL, params=params, headers={"Content-Type": "text/html; charset=utf-8"}
            ).text
        return await (
            await GLOBAL_SESSION.get(
                SEARCH_URL, params=params, headers={"Content-Type": "text/html; charset=utf-8"}
            )
        ).text()
    return await (
        await session.get(
            SEARCH_URL, params=params, headers={"Content-Type": "text/html; charset=utf-8"}
        )
    ).text()


# ! use -1 for unbound
DEFAULT_THRES: dict[Key, int] = {
    "id1": 0,
    "id2": 0,
    "title": 2,
    "lecturer": 1,
    "class_id": 0,
    "semester": 0,
}


async def _search_course(
    filters: dict[Key, str],
    thresholds: dict[Key, int] = {},
    session: aiohttp.ClientSession | None = None,
    fetch_key: Key | None = None,
) -> dict[Key, str] | None:
    """
    Search the closest matched result from the official NTU website.
    """

    thresholds = DEFAULT_THRES | thresholds

    if "semester" not in filters:
        raise ValueError("Semester not provided.")

    fallbacks = ("id1", "id2", "title")
    text = ""
    if not fetch_key:
        for key in fallbacks:
            if key in filters:
                text = await fetch_by(
                    key, filters[key], semester=filters["semester"], session=session
                )
                break
    else:
        text = await fetch_by(
            fetch_key, filters[fetch_key], semester=filters["semester"], session=session
        )
    if not text:
        raise ValueError("At least one of `id1, id2, title` must be provided.")

    res = await extract(text, filters, thresholds)
    return res


async def search_course(
    filters: dict[Key, str],
    thresholds: dict[Key, int] = {},
    session: aiohttp.ClientSession | None = None,
) -> dict[Key, str] | None:

    # print(filters)

    for key in filters.keys():
        # can't use empty field for search
        if key in ["semester", "class_id"] or not filters[key]:
            continue
        # print("try: ", key)

        res = await _search_course(filters, thresholds, session, key)

        # ? special case
        if not res and "title" in filters and "（" in filters["title"]:
            filters["title"] = filters["title"].replace("（", "(").replace("）", ")")
            res = await _search_course(filters, thresholds, session, key)
        if not res and "title" in filters and "：" in filters["title"]:
            filters["title"] = filters["title"].replace("：", ":")
            res = await _search_course(filters, thresholds, session, key)
        if res:
            return res
    return None


async def extract(text: str, filters: dict[Key, str], thresholds: dict[Key, int]):

    def row_to_dict(row: Tag) -> dict[Key, str]:
        entries: list[tuple[int, Key]] = [
            (2, "id1"),
            (3, "class_id"),
            (4, "title"),
            (7, "id2"),
            (10, "lecturer"),
        ]

        datas: list[Tag] = row.find_all("td")
        res = {"semester": filters["semester"]} | {
            key: datas[idx].text.strip() for idx, key in entries
        }
        res["lecturer"] = res["lecturer"].replace(" ", "").replace("\u3000", "")
        return res  # type: ignore

    soup = BeautifulSoup(text, "html.parser")
    table: Tag = soup.find_all("table")[6]  # magic number
    rows: list[Tag] = table.find_all("tr")[1:]
    results = [row_to_dict(row) for row in rows]

    # ? some weird case e.g. "902E46100"
    for res in results:
        s = res["id2"]
        s = f"{s[:3]} {s[4:]}"
        res["id2"] = s

    # * Now sort result rows by relavance

    # How many edit distance can the matched row have maximally
    def indicator(key: Key, dist: int) -> float:
        return dist if thresholds[key] == -1 or dist <= thresholds[key] else inf

    def key_fn(res: dict[Key, str]):
        return sum(indicator(k, edit_distance(res[k], filters[k])) for k in filters.keys())

    sorted_results = sorted(results, key=key_fn)
    # print("sorted: ", sorted_results)

    if not sorted_results or key_fn(sorted_results[0]) == inf:
        # print("not close enough")
        return None  # result is not close enough

    # * if two result have same relavance, just give up
    if (
        len(sorted_results) > 1
        and key_fn(sorted_results[0]) == key_fn(sorted_results[1])
        and sorted_results[0] != sorted_results[1]
    ):
        # print(filters)
        # print(sorted_results[0])
        # print(sorted_results[1])
        # print()
        return None

    res = sorted_results[0]
    assert all(
        thresholds[k] == -1 or edit_distance(filters[k], res[k]) <= thresholds[k]
        for k in filters.keys()
    )
    return res
