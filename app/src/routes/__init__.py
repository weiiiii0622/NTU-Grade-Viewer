from .grade import router as grade_router
from .query import router as query_router
from .submit import router as page_router
from .test import router as test_router
from .user import router as user_router

# * pylance auto-completion for imports only works for uppercase LOL
ROUTERS = [page_router, query_router, grade_router, test_router, user_router]
