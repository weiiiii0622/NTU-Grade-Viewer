import os
from typing import Literal
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from utils import hashCode

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
    content: str
    hashCode: int


@app.post("/page", status_code=200)
def submit_page(page: Page, response: Response):
    print(hashCode(page.content), page.hashCode)
    if hashCode(page.content) != page.hashCode:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return

    return {
        "message": "Successfully Submit Message!"
    }
    grades = parse(page.content)


# @app.get("/grade-charts")
# def get_grade_chart(query_type: Literal["id1", "id2", "title"]) -> GradeChart:
#     return GradeChart()


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
uvicorn.run(app, port=PORT, host=HOST)
