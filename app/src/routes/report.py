import imghdr
import os
import re
from base64 import b64decode
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter
from pydantic import AfterValidator, BaseModel, Field
from sqlmodel import SQLModel
from utils.route import wrap_router
from utils.upload import open_image

router = APIRouter(prefix="/report")
wrap_router(router)


class IssueData(BaseModel):
    image_data: Annotated[
        str | None,
        Field(description="base64 encoded jpg file", default=None),
        # todo: validate image type
    ]


@router.post("/issue")
def report_issue(issue: IssueData):

    if issue.image_data:
        name = "test.jpg"
        with open_image(name, "+wb") as img:
            img_data_dec = b64decode(issue.image_data)
            img.write(img_data_dec)
