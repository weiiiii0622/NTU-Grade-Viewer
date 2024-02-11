import base64
import os
from functools import cache, wraps
from inspect import Parameter, signature
from typing import Annotated, Callable
from urllib.parse import unquote

from Crypto.Cipher import AES
from db import get_engine
from fastapi import Cookie, Header, HTTPException, status
from fastapi.exceptions import RequestValidationError
from models import User
from sqlmodel import Session
from typing_extensions import deprecated
from utils.general import add_decorator_doc, extract_dict

aes_key = os.getenv("APP_AUTH_KEY", "secret_aes_key").encode()[:16].ljust(16)
cipher = AES.new(aes_key, AES.MODE_ECB)


@cache
def get_token(student_id: str) -> str:
    try:
        assert len(student_id) == 9
        return base64.b64encode(cipher.encrypt(student_id.ljust(16).encode())).decode()
    except:
        raise RequestValidationError(
            [{"loc": "student_id", "msg": "get_token failed", "type": "invalid"}]
        )


@cache
def get_student_id(token: str) -> str:
    try:
        return cipher.decrypt(base64.b64decode(token.encode())).decode()[:9]
    except:
        raise RequestValidationError(
            [{"loc": "token", "msg": "get_student_id failed", "type": "invalid"}]
        )


# ? this is not pure function
# @cache
def validate_token(token: str) -> bool:
    session = Session(get_engine())
    try:
        student_id = get_student_id(token)
    except:
        return False

    user = session.get(User, student_id)
    return bool(user)


# ? I end up use this bc this can modify doc.
# @deprecated(
#     "This can be done with fastapi's `dependencies`. But I think this function is still quite cool :)"
# )
@add_decorator_doc
def auth_required(f: Callable):
    """
    Either
        - Cookies: `cookie_token`
        - Headers: `X-Token`
    with `=` replaced by `%3D`
    """

    @wraps(f)
    def _f(cookie_token: str, x_token: str, *args, **kwargs):
        print("tokens:")
        print(cookie_token, ";", x_token)
        token = x_token or cookie_token 
        token = unquote(token)
        if not validate_token(token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
        return f(*args, **kwargs)

    sig = signature(f)
    new_params = [
        *sig.parameters.values(),
        Parameter(
            "x_token",
            Parameter.KEYWORD_ONLY,
            annotation=Annotated[
                str,
                Header(
                    description="Token represented student_id via X-Token header, automatically sent by background.js. Same as `cookie_token`."
                ),
            ],
            default="",
        ),
        Parameter(
            "cookie_token",
            Parameter.KEYWORD_ONLY,
            annotation=Annotated[
                str,
                Cookie(
                    description="Token represented student_id via cookie. Same as `x_token`. This parameter is for testing purpose. You should generally rely on `x_token`."
                ),
            ],
            default="",
        ),
    ]
    setattr(_f, "__signature__", sig.replace(parameters=new_params))

    _f.__annotations__["x_token"] = Annotated[str, Header()]
    _f.__annotations__["cookie_token"] = Annotated[str, Cookie()]

    return _f


def auth_required_dependency(
    x_token: Annotated[
        str,
        Header(
            description="""
            Token represented student_id via cookie.
            Same as `x_token`. This parameter is for testing purpose.
            You should generally rely on `x_token`.
            """,
        ),
    ] = "",
    cookie_token: Annotated[
        str,
        Cookie(
            description="""
            Token represented student_id via cookie. 
            Same as `x_token`.
            This parameter is for testing purpose.
            You should generally rely on `x_token`.
            """,
        ),
    ] = "",
):
    print(cookie_token)
    print(x_token)

    token = cookie_token or x_token
    token = unquote(token)
    if not validate_token(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

