import os
import time
from dataclasses import asdict
from datetime import datetime
from typing import Any

import pymysql.cursors
import pymysqlpool
from models import Course, GradeElement, Segment
from pymysql import OperationalError
from pymysql.cursors import DictCursor
from pymysqlpool import ConnectionPool

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
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci """,
        #
        """-- sql
        CREATE TABLE IF NOT EXISTS `grade` (
            id CHAR(16) PRIMARY KEY,
            course_id1 VARCHAR(15),
            class_id VARCHAR(5),
            lecturer VARCHAR(15),
            semester CHAR(5),

            segments VARCHAR(100) 
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci """,
        #
        """-- sql
        CREATE TABLE IF NOT EXISTS `user` (
            student_id CHAR(9) PRIMARY KEY,
            token CHAR(24)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci 
        """,
    ]
    return commands


# ---------------------------------------------------------------------------- #
#                              Database Interface                              #
# ---------------------------------------------------------------------------- #


class DatabaseConnectionError(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)


class Database:
    # connection: "pymysql.Connection[DictCursor]"
    connection_pool: pymysqlpool.ConnectionPool

    def __init__(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        db: str,
        init_commands: list[str],
        timeout=5,
    ) -> None:
        self.connection_pool = None  # type: ignore

        config = {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "database": db,
            "cursorclass": DictCursor,
        }

        # TODO: current is blocking, perhaps change to async?
        st = datetime.now()
        print("try to connect db:")
        print(host, port, user, password)
        while (datetime.now() - st).seconds < timeout:
            try:
                # self.connection = pymysql.connect(**config)
                self.connection_pool = ConnectionPool(**config, maxsize=10)
                break
            except OperationalError as e:
                print(e)
                time.sleep(1)
                pass
        if not self.connection_pool:
            # raise Exception(f"Cannot connect to db after timeout {timeout} secs.")
            raise DatabaseConnectionError()

        self.post_init(init_commands)

    def get_connection(self, *args, **kwargs) -> "pymysql.Connection[DictCursor]":
        return self.connection_pool.get_connection()

    def post_init(self, init_commands: list[str]):
        with self.get_connection() as connection:
            with connection.cursor() as cursor:
                for cmd in init_commands:
                    cursor.execute(cmd)
            connection.commit()


_db: Database = None  # type: ignore


def db_init():
    if os.getenv("MODE") == "DEV":
        host = "db"
        port = 3306
        user = "root"
        password = "root"
        db = "db"
    else:
        host = os.getenv("DB_HOST", "localhost")
        port = int(os.getenv("DB_PORT", 3333))
        user = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "root")
        db = os.getenv("DB_DATABASE", "db")

    commands = gen_sql_init_commands()

    global _db
    _db = Database(host, port, user, password, db, commands)


def get_db():
    global _db
    if not _db:
        db_init()
    return _db


# ---------------------------------- Course ---------------------------------- #


# TODO: prevent SQLi
def insert_course(course: Course):
    db = get_db()
    with db.get_connection() as con:
        with con.cursor() as cursor:
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
        con.commit()


def insert_courses(courses: list[Course]):
    db = get_db()
    with db.get_connection() as con:
        with con.cursor() as cursor:
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
        con.commit()


# ----------------------------------- Grade ---------------------------------- #


# todo: use background task
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
        # if field == "semester":
        #     return quote("-".join(map(str, val)))
        if val is None:
            return "NULL"
        return "'" + val + "'"

    def get_field(g: GradeElement, f: str):
        if f == "course_id1":
            return parse_value(f, getattr(g, "course").id1)
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
    with db.get_connection() as con:
        with con.cursor() as cursor:
            cursor.execute(cmd)
        con.commit()


# ----------------------------------- Query ---------------------------------- #


def do_query_grades(fields: dict[str, str], filters: dict[str, str]) -> list[GradeElement]:
    def quote(x: str):
        return "'" + x + "'"

    def str2Segments(s: str):
        return list(Segment.from_iterable(map(float, seg.split(","))) for seg in s.split(";"))

    def dict2GradeElement(d: dict[str, Any], c: Course):
        new_d = {}
        for k, v in d.items():
            if k == "segments":
                new_d[k] = str2Segments(v)
            # elif k == "semester":
            #     new_d[k] = to_semester(v)
            else:
                new_d[k] = v
        return GradeElement(**new_d, course=c)

    # TODO: use pattern matching for `title`
    field_s = " AND ".join(f"{k}={quote(v)}" for k, v in fields.items())
    cmd = f"""-- sql
    SELECT * FROM `course` WHERE {field_s}
    """

    db = get_db()
    with db.get_connection() as con:
        with con.cursor() as cursor:
            cursor.execute(cmd)
            courses = cursor.fetchall()
            ids = ("",) + tuple(c["id1"] for c in courses)  # type: ignore
            id1_filter_s = "course_id1 in (" + ",".join(quote(id1) for id1 in ids) + ")"

            filter_s = " AND ".join(
                (
                    id1_filter_s,
                    *(f"{k}={quote(v) if type(v)==str else v }" for k, v in filters.items()),
                )
            )
            cmd = f"""-- sql
            SELECT * FROM `grade` WHERE {filter_s}
            """

            cursor.execute(cmd)
            results = cursor.fetchall()
            return [
                dict2GradeElement(d, Course(**c))
                for d in results
                if (c := list(filter(lambda c: c["id1"] == d["course_id1"], courses))[0])
            ]


# ----------------------------------- Test ----------------------------------- #


def test():
    db = get_db()
    with db.get_connection() as connection:
        with connection.cursor() as cursor:
            # Read a single record
            sql = """SELECT 'HELLO WORLD!'"""
            cursor.execute(sql)
            result = cursor.fetchone()
            return result  # {'HELLO WORLD!': 'HELLO WORLD!'} expected
