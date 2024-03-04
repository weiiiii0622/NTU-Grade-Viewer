import os
from functools import wraps
from inspect import Parameter, signature
from typing import Annotated

from fastapi import APIRouter, Cookie, FastAPI, HTTPException

NO_SCHEMA = "__no_schema__"
APP_MODE = os.getenv("MODE", "DEV")


def wrap_router(router: APIRouter):
    api_route = router.api_route

    def api_route_wrapped(path: str, **kwargs):
        def decorator_wrapped(func):
            if hasattr(func, NO_SCHEMA):
                kwargs["include_in_schema"] = False
                dec = api_route(path, **kwargs)
            else:
                dec = api_route(path, **kwargs)
            return dec(func)

        return decorator_wrapped

    router.api_route = api_route_wrapped  # type: ignore


def add_decorator_doc(dec):
    @wraps(dec)
    def _dec(f):
        prefix = f"@{dec.__name__}\n"
        if (
            not getattr(f, "__decorated_doc__", None)
            and f.__doc__
            and not f.__doc__.startswith("\n")
        ):
            prefix += "\n"

        _f = dec(f)
        _f.__doc__ = prefix + (_f.__doc__ or "")
        setattr(_f, "__decorated_doc__", True)
        return _f

    return _dec


def is_admin(admin: str | None):
    return (admin_token := os.getenv("APP_ADMIN")) and admin == admin_token


def admin_required(f):

    @wraps(f)
    def _f(admin: str, *args, **kwargs):
        if APP_MODE == "PROD" and not is_admin(admin):
            raise HTTPException(401, "Fxxk off 🤬")

        return f(*args, **kwargs)

    sig = signature(f)
    new_params = [
        *sig.parameters.values(),
        Parameter(
            "admin",
            Parameter.KEYWORD_ONLY,
            annotation=Annotated[
                str,
                Cookie(),
            ],
            default="",
        ),
    ]
    setattr(_f, "__signature__", sig.replace(parameters=new_params))
    _f.__setattr__(NO_SCHEMA, None)

    return _f


def test_only(f):
    """
    Test-only function will not be included in schema, and will be disabled in production.
    """

    # TODO: use some special header or ban in PROD mode
    # todo: not generate openapi
    @wraps(f)
    def _f(*args, **kwargs):
        if APP_MODE == "PROD":
            return
        return f(*args, **kwargs)

    _f.__setattr__(NO_SCHEMA, None)
    return _f
