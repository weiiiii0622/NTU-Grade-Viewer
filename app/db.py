from datetime import datetime
import os
import time

from pymysql import OperationalError
import pymysql.cursors
from pymysql.cursors import DictCursor

# ---------------------------------------------------------------------------- #
#                                 Table Schema                                 #
# ---------------------------------------------------------------------------- #


# ? Does a course always have same id1/id2 across semesters
# ---------------------------------- Course ---------------------------------- #
# id1: text
# id2: text
# title: text

# ----------------------------------- Grade ---------------------------------- #
# course_id1: text
# ? Note two course with diff "班次" share same id1, id2, title
# class_id?: text
# lecturer: text
# semester: text  // serialize as "112-1"

# segments: text  // serialize segments by l1,r1,value1;l2,r2,value2


def gen_sql_init_commands() -> list[str]:
    # sql = "CREATE TABLE IF NOT EXISTS course (name TEXT)"
    commands = [
        """CREATE TABLE IF NOT EXISTS `course` (
            id1 VARCHAR(15) UNIQUE,
            id2 VARCHAR(15) UNIQUE,
            title VARCHAR(30)
        )""",
        #
        """CREATE TABLE IF NOT EXISTS `grade` (
            course_id1 VARCHAR(15),
            class_id VARCHAR(5),
            lecturer VARCHAR(10),
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


db: Database = None  # type: ignore


def db_init():
    in_docker = os.getenv("DOCKER")
    host = "db" if in_docker else "localhost"
    port = 3306 if in_docker else 3333
    commands = gen_sql_init_commands()

    global db
    db = Database(host, port, "root", "root", "db", commands)


db_init()


def test():
    return db.test()


def inc():
    pass


# db = get_db()
