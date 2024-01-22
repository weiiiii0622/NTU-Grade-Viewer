import os
from typing import Literal
from fastapi import FastAPI, Response, status, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from utils import hashCode, addAuth, checkAuth

# from parse_page import Course, parse

from dotenv import load_dotenv

load_dotenv("../.env")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://if190.aca.ntu.edu.tw"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class Page(BaseModel):
    studentId: int
    content: str
    hashCode: int

# Determine user is authorized of not (Has submit score?)
@app.get("/auth/{studentId}", status_code=200)
def getUserAuth(response: Response, studentId: str = Path(title="The ID of the student")):
    # Check User is in Auth List?
    isAuth = checkAuth(studentId)

    if(isAuth == False):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "message": "Not authenticated"
        }

    return {
        "message": "Successfully authenticated!"
    }

@app.post("/page", status_code=200)
def submit_page(page: Page, response: Response):
    
    if hashCode(page.content) != page.hashCode:
        # Fail to submit score
        response.status_code = status.HTTP_400_BAD_REQUEST
        return{
            "message": "Failed to Submit Score!"
        }

    # Success!
    # Add user to auth list
    addAuth(page.studentId)

    return {
        "message": "Successfully Submit Score!"
    }
    grades = parse(page.content)


# @app.get("/grade-charts")
# def get_grade_chart(query_type: Literal["id1", "id2", "title"]) -> GradeChart:
#     return GradeChart()


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
uvicorn.run(app, port=PORT, host=HOST)
