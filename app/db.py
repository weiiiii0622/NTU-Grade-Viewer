from dataclasses import asdict
from datetime import datetime
import os
import time
from typing import Any

from pymysql import OperationalError
import pymysql.cursors
from pymysql.cursors import DictCursor

from models import (
    Course,
    GradeElement,
    GradeInfo,
    QueryField,
    QueryFilter,
    Segment,
    to_semester,
)

# ---------------------------------------------------------------------------- #
#                                 Table Schema                                 #
# ---------------------------------------------------------------------------- #


# ? Does a course always have same id1/id2 across semesters
# ---------------------------------- Course ---------------------------------- #
# id1: text
# id2: text
# title: text

# ----------------------------------- Grade ---------------------------------- #
# id: int
# course_id1: text
# ? Note two course with diff "班次" share same id1, id2, title
# class_id?: text
# lecturer: text
# semester: text  // serialize as "112-1"

# segments: text  // serialize segments by l1,r1,value1;l2,r2,value2


def gen_sql_init_commands() -> list[str]:
    # sql = "CREATE TABLE IF NOT EXISTS course (name TEXT)"
    commands = [
        """-- sql
        CREATE TABLE IF NOT EXISTS `course` (
            id1 VARCHAR(15) UNIQUE,
            id2 VARCHAR(15) UNIQUE,
            title VARCHAR(30)
        )""",
        #
        """-- sql
        CREATE TABLE IF NOT EXISTS `grade` (
            id INT PRIMARY KEY,
            course_id1 VARCHAR(15),
            class_id VARCHAR(5),
            lecturer VARCHAR(15),
            semester CHAR(5),

            segments VARCHAR(100) 
        )""",
    ]
    return commands


# ---------------------------------------------------------------------------- #
#                              Database Interface                              #
# ---------------------------------------------------------------------------- #


class Database:
    connection: "pymysql.Connection[DictCursor]"

    def __init__(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        db: str,
        init_commands: list[str] = [],
        timeout=60,
    ) -> None:
        self.connection = None  # type: ignore

        # TODO: current is blocking, perhaps change to async?
        st = datetime.now()
        print("try to connect db:")
        print(host, port, user, password)
        while (datetime.now() - st).seconds < timeout:
            try:
                self.connection = pymysql.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    database=db,
                    cursorclass=DictCursor,
                )
                break
            except OperationalError as e:
                print(e)
                time.sleep(1)
                pass
        if not self.connection:
            raise Exception(f"Cannot connect to db after timeout {timeout} secs.")

        self.post_init(init_commands)

    def post_init(self, init_commands: list[str]):
        with self.connection.cursor() as cursor:
            for cmd in init_commands:
                cursor.execute(cmd)

        self.connection.commit()

    def test(self):
        with self.connection.cursor() as cursor:
            # Read a single record
            sql = """SELECT 'HELLO WORLD!'"""
            cursor.execute(sql)
            result = cursor.fetchone()
            return result  # {'HELLO WORLD!': 'HELLO WORLD!'} expected

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        self.connection.__exit__(*exc_info)

    def close(self):
        self.connection.close()


_db: Database = None  # type: ignore


def db_init():
    in_docker = os.getenv("DOCKER")
    host = "db" if in_docker else "localhost"
    port = 3306 if in_docker else 3333
    commands = gen_sql_init_commands()

    global _db
    _db = Database(host, port, "root", "root", "db", commands)


def get_db():
    global _db
    if not _db:
        db_init()
    return _db


# ---------------------------------- Course ---------------------------------- #


# TODO: prevent SQLi
def insert_course(course: Course):
    db = get_db()
    with db.connection.cursor() as cursor:
        cursor.execute("SELECT * FROM course WHERE id1='{id1}'".format(id1=course.id1))
        print("course", course)
        if res := cursor.fetchone():
            print(res)
            assert Course(**res) == course, f"Existing: {res}, new: {course}"
            print(f"Course {course.title} already exist")
            return
        print("res", res)

        cmd = """-- sql
        INSERT INTO course (
            id1,
            id2,
            title
        ) VALUES (
            '{c.id1}',
            '{c.id2}',
            '{c.title}'
        )
        """.format(
            c=course
        )
        cursor.execute(cmd)
    db.connection.commit()


def insert_courses(courses: list[Course]):
    db = get_db()
    with db.connection.cursor() as cursor:
        values = ",".join("('{c.id1}', '{c.id2}', '{c.title}')".format(c=c) for c in courses)

        # TODO: perhaps need to check duplicates
        cmd = """-- sql
        INSERT IGNORE INTO course (
            id1,
            id2,
            title
        ) VALUES {values} """.format(
            values=values
        )
        cursor.execute(cmd)
    db.connection.commit()


# ----------------------------------- Grade ---------------------------------- #


def insert_grade_elements(grade_eles: list[GradeElement]):
    fields = [
        "id",
        "course_id1",
        "class_id",
        "lecturer",
        "semester",
        "segments",
    ]

    def seg2str(seg: Segment):
        return ",".join(map(str, seg))

    def segs2str(segs: list[Segment]):
        res = ";".join(seg2str(seg) for seg in segs)
        return res

    def quote(x: str):
        return "'" + x + "'"

    def parse_value(field: str, val: Any) -> str:
        if field == "segments":
            return quote(segs2str(val))
        if field == "semester":
            return quote("-".join(map(str, val)))
        if val is None:
            return "NULL"
        return "'" + val + "'"

    def get_id(g: GradeElement):
        return hash((g.course_id1, g.class_id, g.semester)) % (1 << 31)

    def get_field(g: GradeElement, f: str):
        if f == "id":
            return f"{get_id(g)}"
        return parse_value(f, getattr(g, f))

    values = ",".join("(" + ",".join(get_field(g, f) for f in fields) + ")" for g in grade_eles)

    # TODO: perhaps need to rewrite
    cmd = f"""-- sql
    REPLACE INTO grade (
        {",".join(fields)}
    ) VALUES {values} """.format(
        values=values
    )

    db = get_db()
    with db.connection.cursor() as cursor:
        cursor.execute(cmd)
    db.connection.commit()


# ----------------------------------- Query ---------------------------------- #


def do_query_grades(fields: dict[str, str], filters: dict[str, str]) -> list[GradeElement]:
    def quote(x: str):
        return "'" + x + "'"

    def str2Segments(s: str):
        return list(Segment.from_iterable(map(float, seg.split(","))) for seg in s.split(";"))

    def dict2GradeElement(d: dict[str, Any]):
        new_d = {}
        for k, v in d.items():
            if k == "segments":
                new_d[k] = str2Segments(v)
            elif k == "semester":
                new_d[k] = to_semester(v)
            else:
                new_d[k] = v
        return GradeElement(**new_d)

    # TODO: use pattern matching for `title`
    field_s = " AND ".join(f"{k}={quote(v)}" for k, v in fields.items())
    cmd = f"""-- sql
    SELECT * FROM `course` WHERE {field_s}
    """

    db = get_db()
    with db.connection.cursor() as cursor:
        cursor.execute(cmd)
        id1 = cursor.fetchone()["id1"]  # type: ignore

        filters |= {"course_id1": id1}
        filter_s = " AND ".join(
            f"{k}={quote(v) if type(v)==str else v }" for k, v in filters.items()
        )
        cmd = f"""-- sql
        SELECT * FROM `grade` WHERE {filter_s}
        """

        cursor.execute(cmd)
        results = cursor.fetchall()
        return [dict2GradeElement(d) for d in results]


# ----------------------------------- Test ----------------------------------- #


def test():
    return get_db().test()
