from db import get_db, insert_course
from models import Course, GradeInfo


def handle_grade_info(course: Course, info: GradeInfo):
    insert_course(course)
