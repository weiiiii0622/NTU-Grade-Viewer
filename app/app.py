from inspect import signature
import os
from re import escape
from typing import Annotated
from urllib.parse import quote


from fastapi import Cookie, Depends, FastAPI, HTTPException, Header, Request, Response, status, Path
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
import uvicorn
from auth import add_user, auth_required
from grade import handle_grade_infos

from utils import hashCode, addAuth, checkAuth, test_only


from dotenv import load_dotenv
from db import DatabaseConnectionError, do_query_grades, test

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from models import QUERY_FIELDS, QUERY_FILTERS, GradeElement, Page, StudentId
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
def get_root(a: int):
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


class PageResponse(BaseModel):
    message: str
    token: str


@app.post("/page", status_code=200)
def submit_page(page: Page, response: Response) -> PageResponse:
    if hashCode(page.content) != page.hashCode:
        # Fail to submit score
        # response.status_code = status.HTTP_400_BAD_REQUEST
        # return {"message": "Failed to Submit Score!"}
        raise RequestValidationError([])

    student_id, results = parse_page(page.content)
    handle_grade_infos(results)

    token = add_user(student_id)
    response.set_cookie("token", token)

    return PageResponse(**{"message": "Successfully Submit Score!", "token": token})


@app.get("/grades/all")
@auth_required
@test_only
def get_all_grades() -> list[GradeElement]:
    return do_query_grades({"1": "1"}, {})


async def get_query_dict(
    id1: str = "",
    id2: str = "",
    title: str = "",
    class_id: str = "",
    semester: str = "",
):
    d = locals()
    keys = QUERY_FIELDS + QUERY_FILTERS
    return {k: v for k in keys if (v := d[k])}


@app.get("/query/grades")
@auth_required
def query_grades(query: dict = Depends(get_query_dict)) -> list[GradeElement]:
    fields = {k: v for k, v in query.items() if k in QUERY_FIELDS}
    filters = {k: v for k, v in query.items() if k in QUERY_FILTERS}

    if not fields:
        raise HTTPException(status_code=400, detail="At least one field has to be specified!")

    return do_query_grades(fields, filters)


# * Testing db is working.
@app.get("/db")
def db_test():
    return test()


@app.get("/test")
@auth_required
def f(a: int):
    return a + 1


@app.get("/add-auth/{studentId}")
@test_only
def _add_auth(studentId: StudentId, response: Response):
    token = add_user(studentId)
    print(token, quote(token))
    response.set_cookie("cookie_token", quote(token))
    return studentId


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.args[0]
    if any(err["loc"] == ("cookie", "token") for err in errors):
        # print(errors)
        # print(request.cookies)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no token specified")

    return JSONResponse({"detail": errors}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


@app.exception_handler(DatabaseConnectionError)
async def db_connection_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse({"msg": "db error"}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    # raise RequestValidationError([])


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
# print(PORT, HOST)
if __name__ == "__main__":
    uvicorn.run("app:app", port=PORT, host="0.0.0.0", reload=True)
