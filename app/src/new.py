import asyncio

from utils.search import search_course

res = asyncio.run(search_course(({"title": "專題研究一", "lecturer": "張宏浩", "semester": "110-1"})))
print(res)
