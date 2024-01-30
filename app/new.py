from functools import wraps
from inspect import Parameter, signature
from typing import Annotated

from auth import get_student_id, get_token
from page import parse_page

parse_page(open("./app/example.html", encoding="utf-8").read())
