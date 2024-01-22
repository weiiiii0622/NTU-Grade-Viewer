import os
from pathlib import Path


from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from db import test

load_dotenv(str(Path(__file__).parent / "../.env"))

from models import Page
from parse_page import parse
from utils import hashCode


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://if190.aca.ntu.edu.tw"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/page", status_code=200)
def submit_page(page: Page, response: Response):
    if hashCode(page.content) != page.hashCode:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"msg": "Invalid hashCode!"}

    grades = parse(page.content)
    return {"msg": "Successful"}


# * Testing db is working.
@app.get("/db")
def db_test():
    return test()

@app.post("/db/inc")
def db_inc():
    pass

# @app.get("/grade-charts")
# def get_grade_chart(query_type: Literal["id1", "id2", "title"]) -> GradeChart:
#     return GradeChart()


PORT = int(str(os.getenv("PORT_DEV")))
HOST = str(os.getenv("HOST_DEV"))
print(PORT, HOST)
uvicorn.run(app, port=PORT, host=HOST)
