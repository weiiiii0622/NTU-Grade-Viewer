import base64
from dataclasses import dataclass
import math
from typing import Annotated, TypeAlias
from fastapi.exceptions import RequestValidationError
from pydantic import (
    BaseModel,
    Field,
    ValidationError,
    field_validator,
    model_validator,
    validator,
)

from utils import hashCode


# * Course
@dataclass
class Course:
    id1: Annotated[str, Field(pattern=r".+?\d+")]  # 課號 e.g. CSIE1212
    id2: Annotated[str, Field(pattern=r"\d{3}\s\d{5}")]  # 課程識別碼 e.g. 902 10750
    title: str


# * Semester
Semester: TypeAlias = tuple[Annotated[int, Field(ge=90, le=130)], Annotated[int, Field(ge=1, le=2)]]

# * Grade
GRADES = ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F")
# A+: 9, A: 8, ..., F: 0
# The order is for segment list to make more sense
GRADE_MAP = {grade: i for grade, i in enumerate(reversed(GRADES))}

GradeInt: TypeAlias = Annotated[int, Field(ge=0, lt=len(GRADES))]


@dataclass
class GradeInfo:
    """
    Grade information extracted from user page submited.
    """

    course: Course
    semester: Annotated[str, Field(pattern=r"\d+-\d+")]
    grade: str
    dist: tuple[float, float, float]  # same, lower, higher

    @validator("dist")
    def valid_dist(cls, v: tuple[float, float, float]):
        if math.isclose(sum(v), 100, abs_tol=1) and len(v) != 3:
            raise ValidationError()
        return 0


class GradeElement(BaseModel):
    l: GradeInt
    r: GradeInt
    value: float


class GradeChart(BaseModel):
    course: Course
    semester: Semester
    grade_eles: list[GradeElement]

    @field_validator("grade_eles")
    def valiadte_grade_eles(cls, v: list[GradeElement]):
        if not math.isclose(sum(grade.value for grade in v), 100, abs_tol=1):
            raise ValidationError


# * Page
class Page(BaseModel):
    content: str
    hashCode: int
    studentId: int

    # @field_validator("content")
    @classmethod
    def parse_content(cls, v: bytes):
        return base64.decodebytes(v)

    @model_validator(mode="after")
    def validate_hash(self):
        if self.hashCode != hashCode(self.content):
            raise RequestValidationError([])
        return self
