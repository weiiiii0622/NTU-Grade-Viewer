from base64 import b64decode
from pathlib import Path
from typing import Annotated

from db import get_session
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from models import Issue, IssueBase
from pydantic import Field
from sqlmodel import Session
from utils.route import test_only, wrap_router
from utils.upload import get_image_path, open_image

router = APIRouter(prefix="/issues")
wrap_router(router)


# class IssueData(BaseModel):
#     image_data: Annotated[
#         str | None,
#         Field(description="base64 encoded jpg file", default=None),
#         # todo: validate image type
#     ]
class IssueCreate(IssueBase):

    image_data: Annotated[
        str | None,
        Field(description="base64 encoded jpg file", default=None),
        # todo: validate image type
    ]


class IssueRead(IssueBase):
    id: int
    has_image: bool
    # image_url: str | None


@router.post("/")
def create_issue(*, session: Session = Depends(get_session), issue: IssueCreate) -> IssueRead:

    has_image = bool(issue.image_data)

    db_issue = Issue(
        description=issue.description,
        email=issue.email,
        has_image=has_image,
    )
    session.add(db_issue)
    session.commit()
    session.refresh(db_issue)

    if issue.image_data:
        name = f"{db_issue.id}.jpg"
        with open_image(name, "+wb") as img:
            img_data_dec = b64decode(issue.image_data)
            img.write(img_data_dec)

    return IssueRead.model_validate(db_issue)


@router.get("/{issue_id}", response_model=IssueRead)
def read_issue(*, session: Session = Depends(get_session), issue_id: int):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404)

    return issue


@router.get("/{issue_id}/image")
def read_image(issue_id: int):
    image_name = f"{issue_id}.jpg"
    if (image_path := get_image_path(image_name)) and image_path.exists():
        return FileResponse(str(image_path))
    raise HTTPException(404)


templates = Jinja2Templates(directory=str(Path(__file__).parent / "../templates"))


@router.get("/{id}/preview", response_class=HTMLResponse)
@test_only
def preview_issue(*, request: Request, session: Session = Depends(get_session), id: int):
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(404)
    return templates.TemplateResponse(request=request, name="issue.html", context={"issue": issue})
