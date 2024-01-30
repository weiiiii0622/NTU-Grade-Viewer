from abc import ABC
import base64
from dataclasses import dataclass, field
import hashlib
import math
import re
from typing import Annotated, Iterable, Literal, Optional, TypeAlias
from fastapi.exceptions import RequestValidationError
from pydantic import (
    AfterValidator,
    BaseModel,
    Field,
    ValidationError,
    field_validator,
    model_validator,
    validator,
)

from utils import hashCode


# ---------------------------------- Course ---------------------------------- #


@dataclass
class Course:
    id1: Annotated[str, Field(pattern=r".+?\d+")]  # 課號 e.g. CSIE1212
    id2: Annotated[str, Field(pattern=r"\d{3}\s\d{5}")]  # 課程識別碼 e.g. 902 10750
    title: str


# ----------------------------------- Grade ---------------------------------- #

# Semester: TypeAlias = tuple[Annotated[int, Field(ge=90, le=130)], Annotated[int, Field(ge=1, le=2)]]
# def to_semester(s: Annotated[str, Field(pattern=r"\d+-\d+")]) -> Semester:
#     return tuple(map(int, s.split("-")))  # type: ignore


# ? Change to this def. because I cannot fix openapi tuple issue🥲
def validate_semester(s: str):
    a, b = list(map(int, s.split("-")))
    if 130 >= a >= 90 and 2 >= b >= 1:
        return s
    raise ValidationError()


Semester = Annotated[str, Field(pattern=r"\d+-\d+"), AfterValidator(validate_semester)]


GRADES = ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F")
# A+: 9, A: 8, ..., F: 0
# The order is for segment list to make more sense
GRADE_MAP = {grade: i for grade, i in enumerate(reversed(GRADES))}
GRADE_MAP_INV = {i: grade for grade, i in enumerate(reversed(GRADES))}

GradeInt: TypeAlias = Annotated[int, Field(ge=0, lt=len(GRADES))]


def validate_grade_str(s: str):
    if s in GRADES:
        return s
    raise ValidationError()


GradeStr: TypeAlias = Annotated[str, AfterValidator(validate_grade_str)]


# @dataclass
class GradeBase(ABC, BaseModel):
    course_id1: Annotated[str, Field(pattern=r".+?\d+")]  # 課號 e.g. CSIE1212
    semester: Semester

    # TODO: use scraper to get lecturer
    lecturer: Optional[str]  # ! this can not be obtained from page

    class_id: Optional[str]


# @dataclass
class GradeInfo(GradeBase):
    """
    Grade information extracted from user page submited. The values are between 0~100.
    """

    grade: GradeStr
    dist: tuple[float, float, float]  # same, lower, higher

    @validator("dist")
    def valid_dist(cls, v: tuple[float, float, float]):
        if math.isclose(sum(v), 100, abs_tol=1) and len(v) != 3:
            raise ValidationError()
        return v


# @dataclass
class Segment(BaseModel):
    l: GradeInt
    r: GradeInt
    value: float

    def __iter__(self):
        return iter((self.l, self.r, self.value))

    @staticmethod
    def from_iterable(x: Iterable):
        l, r, value = x
        return Segment(l=l, r=r, value=value)


# @dataclass
class GradeElement(GradeBase):
    """
    Grade element stored in db and consumed by client. The values are between 0~100.
    """

    segments: list[Segment]
    # id: int = field(default=-1)
    id: Annotated[str, Field(min_length=16, max_length=16)] = field(default="")

    def __init__(self, **data):
        super().__init__(**data)
        self.id = self.get_id()

    def get_id(self):
        return hashlib.sha256(
            repr((self.course_id1, self.class_id, self.semester)).encode()
        ).hexdigest()[:16]
        # ! python hash() only return same value in single-run
        # return hash((self.course_id1, self.class_id, self.semester)) % (1 << 31)

    @field_validator("segments")
    def valiadte_grade_eles(cls, v: list[Segment]):
        if not math.isclose(sum(grade.value for grade in v), 100, abs_tol=1):
            raise ValidationError
        for i in range(len(v) - 1):
            assert v[i].r + 1 == v[i + 1].l, v
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "course_id1": "CSIE1212",
                    "semester": "110-2",
                    "lecturer": "林軒田",
                    "class_id": "01",
                    "segments": [{"l": 0, "r": 8, "value": 91}, {"l": 9, "r": 9, "value": 9}],
                    "id": -1,
                }
            ]
        }
    }


class CourseGrade(BaseModel):
    """
    The response data for a query.
    """

    course: Course
    grade_eles: list[GradeElement]


# ----------------------------------- Query ---------------------------------- #

QUERY_FIELDS = ("id1", "id2", "title")
QueryField: TypeAlias = Literal["id1", "id2", "title"]
QUERY_FILTERS = ("class_id", "semester")
QueryFilter: TypeAlias = Literal["class_id", "semester"]


# class QueryCourseResult(BaseModel):
#     course: Course
#     semester: Semester
#     lecturer: str
#     class_id: Optional[str]


# ----------------------------------- Page ----------------------------------- #


class Page(BaseModel):
    """
    Page submitted by user.
    """

    content: str
    hashCode: int

    # @field_validator("content")
    @classmethod
    def parse_content(cls, v: bytes):
        return base64.decodebytes(v)

    # @model_validator(mode="after")
    def validate_hash(self):
        if self.hashCode != hashCode(self.content):
            raise RequestValidationError([])
        return self

# ----------------------------------- User ----------------------------------- #

StudentId = Annotated[str, Field(pattern=r"[a-zA-Z0-9]{9}")]