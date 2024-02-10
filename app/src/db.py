from typing import Literal

from models import *
from sqlmodel import Session, SQLModel, create_engine, select

sql_url = "mysql+pymysql://root:root@db:3306/db"
engine = create_engine(sql_url, echo=False)


def create_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def get_engine():
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

