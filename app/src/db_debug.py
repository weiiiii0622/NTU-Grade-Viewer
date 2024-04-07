import os

from db import db_init, get_session
from models import Course, Grade, Update, User
from sqlmodel import delete, select
from tqdm import tqdm
from utils.grade import get_grade_element

db_url = os.getenv("DB_URL_EXTERNAL", "")

db_init(db_url)
session = next(get_session())


# ---------------------------------- Models ---------------------------------- #

# ? There are these 4 models in db
_models = [User, Course, Grade, Update]


# --------------------------------- Examples --------------------------------- #

# * Use .exec(): similar to SQL query
# users = session.exec(select(User)).all()
# courses = session.exec(select(Course).where(Course.title == "資料結構與演算法")).all()

# * Use .get(<model>, <id>)
# dsa = session.get(Course, ("CSIE1212", "902 10750"))
# kc = session.get(User, "B10401006")
# grade = session.get(Grade, "10345946")
# if grade:
#     print(grade.course)
#     print(grade.updates)

# --------------------------------- Your code -------------------------------- #

# ----------------------------- Remove non-solid ----------------------------- #

# statement = delete(Update).where(Update.solid == False)
# updates = session.exec(statement)
# session.commit()

# -------------------------- Prev: handle sum > 100 -------------------------- #

# for g in tqdm(session.exec(select(Grade)).all()):
#     grade = get_grade_element(g)
#     if not grade:
#         print(g.course)
#         print(g.course.title)  # type hint break, I dont know why QQ

# The code above find two course with error:
# id1='MATH4006' title='微積分1' id2='201 49810'
# id1='MATH4008' title='微積分3' id2='201 49830'

# c1 = session.get(Course, ("MATH4006", "201 49810"))
# if c1:
#     for g in c1.grades:
#         grade = get_grade_element(g)
#         if not grade:
#             print(g.updates)
