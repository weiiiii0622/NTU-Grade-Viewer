from abc import ABC
import base64
from dataclasses import dataclass
import math
import re
from typing import Annotated, TypeAlias
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

Semester: TypeAlias = tuple[Annotated[int, Field(ge=90, le=130)], Annotated[int, Field(ge=1, le=2)]]


def to_semester(s: Annotated[str, Field(pattern=r"\d+-\d+")]) -> Semester:
    return tuple(map(int, s.split("-")))  # type: ignore


GRADES = ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F")
# A+: 9, A: 8, ..., F: 0
# The order is for segment list to make more sense
GRADE_MAP = {grade: i for grade, i in enumerate(reversed(GRADES))}

GradeInt: TypeAlias = Annotated[int, Field(ge=0, lt=len(GRADES))]
GradeStr: TypeAlias = Annotated[str, AfterValidator(lambda s: s in GRADES)]


@dataclass
class GradeBase(ABC):
    semester: Semester


@dataclass
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
        return 0


@dataclass
class Segment:
    l: GradeInt
    r: GradeInt
    value: float

    def __iter__(self):
        return iter((self.l, self.r, self.value))


@dataclass
class GradeElement(GradeBase):
    """
    Grade element stored in db and consumed by client. The values are between 0~100.
    """

    segments: list[Segment]

    @field_validator("segments")
    def valiadte_grade_eles(cls, v: list[Segment]):
        if not math.isclose(sum(grade.value for grade in v), 100, abs_tol=1):
            raise ValidationError
        for i in range(len(v) - 1):
            assert v[i].l + 1 == v[i + 1].r


class CourseGrade(BaseModel):
    """
    The response data for a query.
    """

    course: Course
    grade_eles: list[GradeElement]


# ----------------------------------- Page ----------------------------------- #


class Page(BaseModel):
    """
    Page submitted by user.
    """

    content: str
    hashCode: int
    studentId: int

    # @field_validator("content")
    @classmethod
    def parse_content(cls, v: bytes):
        return base64.decodebytes(v)

    # @model_validator(mode="after")
    def validate_hash(self):
        if self.hashCode != hashCode(self.content):
            raise RequestValidationError([])
        return self
