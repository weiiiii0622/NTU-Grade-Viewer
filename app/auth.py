import base64
from functools import cache, wraps
from inspect import Parameter, signature
import os
from threading import local
from typing import Annotated, Callable
from urllib.parse import quote, unquote
from Crypto.Cipher import AES

from fastapi import Cookie, HTTPException, Header, status
from pydantic import AfterValidator

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
    with db.get_connection() as con:
        with con.cursor() as cursor:
            res = select_by_obj(cursor, "token", "user", obj)
            return bool(res)


def auth_required(f: Callable):
    """
    Either
        - Cookies: `cookie_token`
        - Headers: `X-Token`
    with `=` replaced by `%3D`
    """

    @wraps(f)
    def _f(cookie_token: str, x_token: str, *args, **kwargs):
        print('tokens:')
        print(cookie_token,';', x_token)
        token = cookie_token or x_token
        token = unquote(token)
        if not validate_token(token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
        return f(*args, **kwargs)

    sig = signature(f)
    new_params = [
        *sig.parameters.values(),
        Parameter(
            "x_token",
            Parameter.POSITIONAL_OR_KEYWORD,
            annotation=Annotated[str, Header()],
            default="",
        ),
        Parameter(
            "cookie_token",
            Parameter.POSITIONAL_OR_KEYWORD,
            annotation=Annotated[str, Cookie()],
            default="",
        ),
    ]
    setattr(_f, "__signature__", sig.replace(parameters=new_params))

    _f.__annotations__["x_token"] = Annotated[str, Header()]
    _f.__annotations__["cookie_token"] = Annotated[str, Cookie()]

    return _f


def add_user(student_id: str) -> str:
    token = get_token(student_id)
    db = get_db()
    obj = extract_dict(["token", "student_id"], locals())
    with db.get_connection() as con:
        with con.cursor() as cursor:
            insert_objs(cursor, "user", obj)
        con.commit()
    return token
