import base64
from functools import cache, wraps
from inspect import Parameter, signature
import os
from threading import local
from typing import Annotated, Callable
from Crypto.Cipher import AES

from fastapi import Cookie, HTTPException, status

from db import get_db
from db_utils import insert_objs, select_by_obj
from utils import extract_dict

aes_key = os.getenv("APP_AUTH_KEY", "secret_aes_key").encode()[:16].ljust(16)
cipher = AES.new(aes_key, AES.MODE_ECB)


@cache
def get_token(studentId: str) -> str:
    assert len(studentId) == 9
    return base64.b64encode(cipher.encrypt(studentId.ljust(16).encode())).decode()


@cache
def get_student_id(token: str) -> str:
    return cipher.decrypt(base64.b64decode(token.encode())).decode()[:9]


@cache
def validate_token(token: str) -> bool:
    try:
        student_id = get_student_id(token)
    except:
        return False

    obj = extract_dict(["student_id", "token"], locals())

    db = get_db()
    with db.connection.cursor() as cursor:
        res = select_by_obj(cursor, "token", "user", obj)
        return bool(res)


def auth_required(f: Callable):
    """
    Client have to put `token=$TOKEN` in cookie to access the route decorated.
    """

    @wraps(f)
    def _f(token: Annotated[str, Cookie()], *args, **kwargs):
        if not validate_token(token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
        return f(*args, **kwargs)

    sig = signature(f)
    new_params = [
        *sig.parameters.values(),
        Parameter("token", Parameter.POSITIONAL_OR_KEYWORD, annotation=Annotated[str, Cookie()]),
    ]
    setattr(_f, "__signature__", sig.replace(parameters=new_params))

    _f.__annotations__["token"] = Annotated[str, Cookie()]

    return _f


def add_user(student_id: str) -> str:
    token = get_token(student_id)
    db = get_db()
    obj = extract_dict(["token", "student_id"], locals())
    with db.connection.cursor() as cursor:
        insert_objs(cursor, "user", obj)

    db.connection.commit()
    return token
