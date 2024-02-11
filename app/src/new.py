import asyncio
import json
import typing
from decimal import Decimal
from pathlib import Path
from time import time
from urllib.parse import quote

import requests
from auth import get_student_id, get_token
from models import Course, GradeWithUpdate, Page, Update, UpdateBase
from pydantic import BaseModel, Field



# * Submit page
content = open(str(Path(__file__).parent / "../examples/wei.html")).read()
print("send")
t = time()
r = requests.post(
    "http://localhost:5000/submit/page",
    json={"content": content, "hashCode": Page.get_hash_code(content)},
)
print(f"recv: {time()-t}")

exit(0)

# * Submit single grade (doesn't have to exists)
print("send")
t = time()
data = GradeWithUpdate(
    course_id1="CSIE1310",
    course_id2="902 10130",
    semester="100-1",
    class_id="",
    lecturer="",
    course=Course(id1="CSIE1310", id2="902 10130", title="網路管理與系統管理實驗"),
    update=UpdateBase(
        pos=1,
        higher=Decimal("25.55"),
        lower=Decimal("24.45"),
    ),
).model_dump_json()
r = requests.post(
    "http://localhost:5000/submit/grade",
    # headers={"Content-Type": "application/json"},
    # data=data,
    json=json.loads(data),
)
print(f"recv: {time()-t}")
print(r.text)
