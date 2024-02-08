import asyncio
from datetime import datetime
from typing import Literal

import aiohttp
import requests
from bs4 import BeautifulSoup, Tag
from models import Course, GradeBase
from routes.submit import parse_page
from src.utils.general import extract_dict
from utils.search import course_table_url, search_course


async def test1():
    example = open("./app/error.html", encoding="utf-8").read()
    _, results = parse_page(example)
    for c, g in results:
        lec = await search_course({**extract_dict(["id1", "id2", "title"], c), **extract_dict(["semester", "class_id"], g)})  # type: ignore
        print(c.title, lec)


async def test2():
    example = open("./app/error.html", encoding="utf-8").read()
    # example = open("./app/example.html", encoding="utf-8").read()
    _, results = parse_page(example)

    for c, g in results:
        lec = await search_course({**extract_dict(["id1", "id2", "title"], c), **extract_dict(["semester", "class_id"], g)})  # type: ignore
        print(c.title, lec)


async def main():
    example = open("./app/example.html", encoding="utf-8").read()
    _, results = parse_page(example)

    st = datetime.now()
    async with aiohttp.ClientSession() as session:
        # ? async: 0:00:01.741525
        pass
        # results = await asyncio.gather(*(query_lecturer_async(session, c, g) for c, g in results))

        # ? sync:  0:00:14.845645
        # for c, g in results:
        #     lec = await query_lecturer_async(session, c, g)
    print((datetime.now() - st))


asyncio.gather(test1(), test2())
