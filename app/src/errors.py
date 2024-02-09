from typing import Literal

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    # status: int
    detail: str

class BadRequestResponse(ErrorResponse):
    pass

class UnauthorizedErrorDetail(BaseModel):
    type: Literal["missing", "invalid"]


class UnauthorizedErrorResponse(ErrorResponse):
    # status: Literal[401] = 401
    detail: UnauthorizedErrorDetail


class ValidationErrorDetail(BaseModel):
    loc: list[int | str]
    msg: str
    type: str


class ValidationErrorResponse(ErrorResponse):
    # status: Literal[422] = 422
    detail: list[ ValidationErrorDetail ]


class InternalErrorResponse(ErrorResponse):
    # status: Literal[500] = 500
    pass
