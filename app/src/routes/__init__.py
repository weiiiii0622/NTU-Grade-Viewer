from importlib import import_module
from pathlib import Path

from fastapi import APIRouter

# from .grade import router as grade_router
# from .query import router as query_router
# from .submit import router as page_router
# from .test import router as test_router
# from .user import router as user_router

# ROUTERS = [page_router, query_router, grade_router, test_router, user_router]

# # # * pylance auto-completion for imports only works for uppercase LOL
ROUTERS: list[APIRouter] = []

for file in Path(__file__).parent.glob("*"):
    if str(file) == __file__ or not file.name.endswith(".py"):
        continue
    m = import_module("." + str(file.name.removesuffix(".py")), __package__)
    if router := getattr(m, "router", None):
        ROUTERS.append(router)


def get_routers():
    return ROUTERS
