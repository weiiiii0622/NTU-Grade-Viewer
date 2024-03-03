from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.route import test_only, wrap_router

router = APIRouter(prefix="/test")
wrap_router(router)


@router.get("/assertion-error")
@test_only
def assertion_error():
    assert 0


@router.get("/validation-error")
@test_only
def validation_error():
    class A(BaseModel):
        a: int

    A(a="a")  # type: ignore


@router.get("/401")
@test_only
def error_401():
    raise HTTPException(401, "foo")


@router.get("/400")
@test_only
def error_400():
    raise HTTPException(400, "foo")


@router.get("/422")
@test_only
def error_422(a: int):
    pass
