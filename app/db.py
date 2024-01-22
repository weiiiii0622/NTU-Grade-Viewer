import os
from typing import Generic, Type, TypeAlias, TypeVar

from pymysql import Connection, OperationalError
import pymysql.cursors
from pymysql.cursors import Cursor, DictCursor


class Database:
    connection: "pymysql.Connection[DictCursor]"

    def __init__(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        db: str,
        max_retries=20,
    ) -> None:
        for _ in range(max_retries):
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
                pass
        if not self.connection:
            raise Exception("Cannot connect to db.")

        self.post_init()

    def post_init(self):
        with self.connection:
            with self.connection.cursor() as cursor:
                sql = "CREATE TABLE IF NOT EXISTS course (name TEXT)"
                cursor.execute(sql)
                sql = "INSERT INTO course (name) VALUES ('new course')"
                cursor.execute(sql)

            self.connection.commit()

    def test(self):
        with self.connection:
            with self.connection.cursor() as cursor:
                # Read a single record
                sql = "SELECT 'HELLO WORLD!'"
                cursor.execute(sql)
                result = cursor.fetchone()
                return result  # {'HELLO WORLD!': 'HELLO WORLD!'} expected


def get_db():
    in_docker = os.getenv("DOCKER")
    host = "db" if in_docker else "localhost"
    port = 3306 if in_docker else 3333

    return Database(host, port, "root", "root", "db")


def test():
    return get_db().test()


def inc():
    pass


db = get_db()
