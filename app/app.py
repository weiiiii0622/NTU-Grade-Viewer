import os
from typing import Literal


from fastapi import FastAPI, Request, Response, status, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from grade import handle_grade_infos

from utils import hashCode, addAuth, checkAuth


from dotenv import load_dotenv
from db import do_query_grades, test

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from models import QUERY_FIELDS, QUERY_FILTERS, GradeElement, Page
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
def get_all_grades():
    return do_query_grades({"1": "1"}, {})


@app.get("/query/grades")
def query_grades(req: Request, res: Response):
    query = dict(req.query_params)
    fields = {k: v for k, v in query.items() if k in QUERY_FIELDS}
    filters = {k: v for k, v in query.items() if k in QUERY_FILTERS}

    if not fields:
        res.status_code = status.HTTP_400_BAD_REQUEST
        return "At least one field has to be specified!"

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
