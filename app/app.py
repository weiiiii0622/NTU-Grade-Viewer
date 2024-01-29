import os
from typing import Any, Dict, List, Union


from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status, Path
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from grade import handle_grade_infos

from utils import hashCode, addAuth, checkAuth


from dotenv import load_dotenv
from db import do_query_grades, test

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from models import QUERY_FIELDS, QUERY_FILTERS, GradeElement, Page, QueryField, QueryFilter
from page import parse_page
from utils import hashCode


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://if190.aca.ntu.edu.tw"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def get_root():
    return "HELLO ROOT"


# Determine user is authorized of not (Has submit score?)
@app.get("/auth/{studentId}", status_code=200)
def getUserAuth(response: Response, studentId: str = Path(title="The ID of the student")):
    # Check User is in Auth List?
    isAuth = checkAuth(studentId)

    if isAuth == False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Not authenticated"}

    return {"message": "Successfully authenticated!"}


@app.post("/page", status_code=200)
def submit_page(page: Page, response: Response):
    if hashCode(page.content) != page.hashCode:
        # Fail to submit score
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Failed to Submit Score!"}

    results = parse_page(page.content)
    handle_grade_infos(results)

    # Success!
    # Add user to auth list
    addAuth(page.studentId)

    return {"message": "Successfully Submit Score!"}


@app.get("/grades/all")
def get_all_grades() -> list[GradeElement]:
    return do_query_grades({"1": "1"}, {})


async def get_query_dict(
    id1: str | None = None,
    id2: str | None = None,
    title: str | None = None,
    class_id: str | None = None,
    semester: str | None = None,
):
    d = locals()
    keys = QUERY_FIELDS + QUERY_FILTERS
    return {k: v for k in keys if (v := d[k])}


@app.get("/query/grades")
def query_grades(query: dict = Depends(get_query_dict)) -> list[GradeElement]:
    print(query)
    fields = {k: v for k, v in query.items() if k in QUERY_FIELDS}
    filters = {k: v for k, v in query.items() if k in QUERY_FILTERS}

    if not fields:
        raise HTTPException(status_code=400, detail="At least one field has to be specified!")

    return do_query_grades(fields, filters)


# * Testing db is working.
@app.get("/db")
def db_test():
    return test()


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
# print(PORT, HOST)
if __name__ == "__main__":
    uvicorn.run("app:app", port=PORT, host="0.0.0.0", reload=True)
