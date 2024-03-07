import os
from time import time

from models import *
from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine

# todo: alembic

engine: Engine | None = None


COOLDOWN = 5
last_try: time = None  # type: ignore


class DatabaseConnectionError(Exception):
    pass


if os.getenv("APP_MODE") == "PROD":
    DB_URL = os.getenv("DB_URL_INTERNAL", "")
elif os.getenv("USE_PROD_DB"):
    # todo: add rollback mechanism
    DB_URL = os.getenv("DB_URL_EXTERNAL", "")
elif os.getenv("DOCKER"):
    DB_URL = "mysql+pymysql://root:root@db:3306/db"
else:
    DB_URL = "mysql+pymysql://root:root@db:3333/db"


def db_init(sql_url=DB_URL):
    global engine
    if engine:
        return

    global last_try
    if last_try and time() - last_try <= COOLDOWN:
        raise DatabaseConnectionError()
    last_try = time()

    try:
        # sql_url = DB_URL

        engine = create_engine(sql_url, echo=False, pool_size=20, max_overflow=100)
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        engine = None
        open(
            "error_",
            "+w",
        ).write(str(e))
        raise DatabaseConnectionError()


def get_session():
    global engine
    if not engine:
        db_init()
    with Session(engine) as session:
        yield session


def get_engine() -> Engine:
    global engine
    if not engine:
        db_init()
    assert engine
    return engine


def update_grade(session: Session, grade_update: GradeWithUpdate):

    if not grade_update.id:
        grade_update.id = Grade.get_id(grade_update)
    update: UpdateBase = grade_update.update

    course: Course = grade_update.course
    grade = Grade.model_validate(grade_update)
    db_update = Update(grade_id=grade_update.id, **update.model_dump())

    session.add(course)
    session.add(grade)
    session.add(db_update)


# todo: insert fake and test-onlt data.
