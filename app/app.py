from typing import Literal
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from utils import hashCode

from parse_page import parse

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
    if hashCode(page.content) != page.hashCode:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return

    grades = parse(page.content)


class GradeChart(BaseModel):
    pass


@app.get("/grade-charts")
def get_grade_chart(query_type: Literal["id1", "id2", "title"]) -> GradeChart:
    return GradeChart()


uvicorn.run(app)
