import os
import pathlib
from typing import Annotated, Any, List, Literal, Tuple


from fastapi import FastAPI, Response, status, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from grade import handle_grade_info

from utils import hashCode, addAuth, checkAuth

# from parse_page import Course, parse

from dotenv import load_dotenv
from db import insert_courses, test

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from models import GradeElement, Page
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
    # for course, grade_info in results:
    #     handle_grade_info(course, grade_info)
    insert_courses([c for c, _ in results])

    # Success!
    # Add user to auth list
    addAuth(page.studentId)

    return {"message": "Successfully Submit Score!"}


# * Testing db is working.
@app.get("/db")
def db_test():
    return test()


class A(BaseModel):
    a: int


@app.post("/db/inc")
def db_inc(a: A):
    pass


@app.get("/grade-charts")
def get_grade_chart(query_type: Literal["id1", "id2", "title"]) -> GradeElement:
    ...


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
# print(PORT, HOST)
if __name__ == "__main__":
    uvicorn.run("app:app", port=PORT, host="0.0.0.0", reload=True)
