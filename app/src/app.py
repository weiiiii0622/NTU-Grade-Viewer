import os
from datetime import datetime, time
from typing import Annotated
from urllib.parse import quote

import requests
import routes
import uvicorn
from api_analytics.fastapi import Analytics
from auth import get_token
from db import db_init, get_engine, get_session
from dotenv import load_dotenv
from errors import (
    BadRequestResponse,
    InternalErrorResponse,
    UnauthorizedErrorDetail,
    UnauthorizedErrorResponse,
    ValidationErrorResponse,
)
from fastapi import (
    Cookie,
    Depends,
    FastAPI,
    HTTPException,
    Path,
    Request,
    Response,
    status,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from models import Course, CourseRead, Id1, SemesterStr, StudentId, User
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlmodel import Session, select
from utils.general import test_only

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"), override=True)

if os.getenv("MODE") == "DEV":
    # os.environ["DB_URL"] = "mysql+pymysql://root:root@db:3306/db"
    os.environ["APP_URL"] = "http://localhost:5000"


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     db_init()
#     yield


app = FastAPI(
    # lifespan=lifespan,
    responses={
        400: {"model": BadRequestResponse},
        401: {"model": UnauthorizedErrorResponse},
        422: {"model": ValidationErrorResponse},
        500: {"model": InternalErrorResponse},
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if api_key := os.getenv("APP_ANALYTICS_KEY"):
    app.add_middleware(Analytics, api_key=api_key)


for router in routes.ROUTERS:
    app.include_router(router)


@app.get("/course/{id1}")
def get_course(*, session: Session = Depends(get_session), id1: Id1) -> CourseRead:
    course = session.exec(select(Course).where(Course.id1 == id1)).one_or_none()
    if not course:
        raise HTTPException(404)
    return CourseRead.model_validate(course)


# ---------------------------------- Config ---------------------------------- #


@app.get("/semester")
def get_semester() -> SemesterStr:
    return os.getenv("CONFIG_SEMESTER", "111-2")


@app.get("/time-to-live")
def get_TTL() -> int:
    """
    Time-to-live in seconds.
    """
    ttl = int(os.getenv("CONFIG_TTL", 1800))
    return ttl


# ----------------------------------- Test ----------------------------------- #
@app.get("/")
def get_root():
    return "HELLO ROOT"


@app.get("/db")
def db_test():
    return Session(get_engine()).execute(text("SELECT 'HELLO WORLD'")).scalar()


@app.get("/add-auth/{student_id}")
@test_only
def _add_auth(
    *,
    session: Session = Depends(get_session),
    student_id: Annotated[StudentId, Path(description="A student's id, e.g. b10401006.")],
    response: Response,
):
    """
    Add a user to database. This will set `token` in cookies.

    Returns:
        Token generated by given student id.
    """
    user = User(id=student_id, last_semester="112-1")
    session.add(user)
    session.commit()

    token = get_token(student_id)
    response.set_cookie("cookie_token", quote(token))
    return token


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    exc.__class__.__name__
    # todo: hide error message in production
    resp = InternalErrorResponse(detail=f"{exc.__class__.__name__}: {exc.args}")
    # todo: why is args of validation error empty
    return JSONResponse(resp.model_dump(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.exception_handler(RequestValidationError)
async def request_validation_error(request: Request, exc: RequestValidationError):
    print(await request.body())
    raise HTTPException(422, detail=exc.args[0])


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    print(exc.args)
    match exc.status_code:
        case 401:
            try:
                detail = UnauthorizedErrorDetail(type=exc.detail)  # type: ignore
            except:
                detail = UnauthorizedErrorDetail(type="invalid")
            resp = UnauthorizedErrorResponse(detail=detail)
        case 422:
            resp = ValidationErrorResponse(detail=exc.detail)  # type: ignore
        case _:
            resp = BadRequestResponse(detail=f"HTTPException ({exc.status_code}): {exc.detail}")

    return JSONResponse(resp.model_dump(), status_code=exc.status_code)


# ---------------------------------- Utility --------------------------------- #


@app.get("/analytics")
def get_analytics(admin: Annotated[str, Cookie()]):
    if not (admin_token := os.getenv("APP_ADMIN")) or admin != admin_token:
        raise HTTPException(401, "Fxxk off 🤬")

    if api_key := os.getenv("APP_ANALYTICS_KEY"):
        user_id = requests.get(f"https://www.apianalytics-server.com/api/user-id/{api_key}").text
        user_id = user_id[1:-1].replace("-", "")  # get rid of quote
        url = f"https://www.apianalytics.dev/dashboard/{user_id}"
        return RedirectResponse(url)

    return HTTPException(404, "Oops")


from admin import site

if site:
    site.mount_app(app)
else:
    print("no site QQ")


@app.middleware("http")
async def admin_auth(request: Request, call_next):
    if request.url.path.startswith("/admin"):
        if (
            not (admin_token := os.getenv("APP_ADMIN"))
            or request.cookies.get("admin") != admin_token
        ):
            return JSONResponse("You don't belong here 👻", status_code=401)
    response = await call_next(request)
    return response


# ----------------------------------- Main ----------------------------------- #

PORT = int(os.getenv("PORT_DEV", 4000))
# HOST = str(os.getenv("HOST_DEV"))
if __name__ == "__main__":
    uvicorn.run("app:app", port=PORT, host="0.0.0.0", reload=False)
