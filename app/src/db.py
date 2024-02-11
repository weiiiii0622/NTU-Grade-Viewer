import os
from time import time

from models import *
from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine

engine: Engine | None = None


COOLDOWN = 30
last_try: time = None  # type: ignore


class DatabaseConnectionError(Exception):
    pass


def db_init():
    global engine
    if engine:
        return

    global last_try
    if last_try and time() - last_try <= COOLDOWN:
        raise DatabaseConnectionError()
    last_try = time()

    try:
        sql_url = os.getenv("DB_URL", "")
        print(sql_url)
        # global engine
        engine = create_engine(sql_url, echo=False)
        create_tables()
    except Exception as e:
        print(e)
        # global engine
        engine = None
        raise DatabaseConnectionError()


def create_tables():
    assert engine
    SQLModel.metadata.create_all(engine)


def get_session():
    global engine
    if not engine:
        db_init()
    with Session(engine) as session:
        yield session


def get_engine():
    global engine
    if not engine:
        db_init()
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
