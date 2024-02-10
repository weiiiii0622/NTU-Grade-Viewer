import hashlib
import math
import re
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Iterable, Optional, Self, TypeAlias

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from pydantic import (
    AfterValidator,
    BaseModel,
    ValidationError,
    field_validator,
    model_validator,
)
from sqlalchemy import ForeignKeyConstraint, PrimaryKeyConstraint, UniqueConstraint
from sqlmodel import Field, Relationship, Session, SQLModel, create_engine, select

# ------------------------------- Primary Types ------------------------------ #

# * Course

Id1: TypeAlias = Annotated[
    str,
    Field(
        # pattern=r"^.+?\d+$",
        description="'課號', e.g. 'CSIE1212'"
    ),
]  #
Id2: TypeAlias = Annotated[
    str,
    Field(
        # pattern=r"^.{3}\s.{5}$",
        description="'課程識別碼', e.g. '902 10750'. Note the space character.",
    ),
]


# * Grade


def validate_semester(s: str):
    a, b = list(map(int, s.split("-")))
    if 130 >= a >= 90 and 2 >= b >= 1:
        return s
    raise ValidationError()


SemesterStr = Annotated[
    str,
    Field(
        description="Semester between 90-1 ~ 130-2",
        schema_extra={"examples": ["111-2"]},
        regex=r"^\d+-\d+$",
    ),
    AfterValidator(validate_semester),
]

Lecturer = Annotated[
    str, Field(default="", description="The lecturer.", schema_extra={"examples": "林軒田"})
]


ClassId = Annotated[str, Field(description="'班次'", schema_extra={"examples": "01"}, default="")]


# A+: 9, A: 8, ..., F: 0
GRADES = ("F", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+")
GRADE_MAP = {grade: i for grade, i in enumerate(GRADES)}
GRADE_MAP_INV = {i: grade for grade, i in enumerate(GRADES)}

GradeInt: TypeAlias = Annotated[
    int,
    Field(
        ge=0,
        lt=len(GRADES),
        description="An integer between [0, 9], representing a grade. Example: 0 -> F, 9 -> A+.",
    ),
]


def validate_grade_str(s: str):
    if s in GRADES:
        return s
    raise ValidationError()


GradeStr: TypeAlias = Annotated[str, AfterValidator(validate_grade_str)]

Percent = Annotated[Decimal, Field(ge=0, le=100, decimal_places=2, max_digits=5)]




class Segment(BaseModel):
    """
    The distribution in the range [l, r].
    """

    l: GradeInt
    r: GradeInt
    value: Percent

    def __iter__(self):
        return iter((self.l, self.r, self.value))

    def unpack(self) -> tuple[int, int, Decimal]:
        return self.l, self.r, self.value

    @staticmethod
    def from_iterable(x: tuple[int, int, Decimal]):
        l, r, value = x
        return Segment(l=l, r=r, value=value)

    def __len__(self):
        return self.r - self.l + 1


# * User


def validate_student_id(id: str):
    if re.match(r"[a-zA-Z0-9]{9}", id):
        return id.capitalize()
    raise RequestValidationError([])  # TODO: is this error suitable?


StudentId = Annotated[
    str, Field(description="A student's id, e.g. b10401006."), AfterValidator(validate_student_id)
]


# ------------------------------- Table Schema ------------------------------- #


class HeroBase(SQLModel):
    name: str = Field(index=True)
    secret_name: str
    age: Optional[int] = Field(default=None, index=True)


class Hero(HeroBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CourseBase(SQLModel):
    id1: str = Field()
    id2: str = Field()
    title: str = Field(index=True)


class Course(CourseBase, table=True):
    grades: list["Grade"] = Relationship(back_populates="")

    __table_args__ = (
        PrimaryKeyConstraint("id1", "id2"),
        UniqueConstraint("id1"),
        UniqueConstraint("id2"),
    )


class GradeBase(SQLModel):
    id: Optional[int] = Field(
        primary_key=True,
        default=None,
        description="""
    This id is hashed from course, semester and class_id. 
    You should set id=-1 to let server compute it.
""",
    )

    course_id1: Id1
    course_id2: Id2

    semester: SemesterStr
    class_id: ClassId
    lecturer: Lecturer

    # * Do the composite key ourself
    @staticmethod
    def get_id(grade: "GradeBase") -> int:
        return int.from_bytes(
            hashlib.sha256(
                repr((grade.course_id1, grade.course_id2, grade.semester, grade.class_id)).encode()
            ).digest()[:3]
        )

    @model_validator(mode="after")
    def check_passwords_match(self) -> Self:
        if not self.id:
            self.id = GradeBase.get_id(self)
        elif self.id != GradeBase.get_id(self):
            raise ValueError("Invalid grade.id")
        return self


class Grade(GradeBase, table=True):
    course: "Course" = Relationship(back_populates="grades")
    updates: list["Update"] = Relationship(back_populates="grade")

    # * If two grade has same `semester` and `class_id` but different `lecturer`,
    # * we should just discard that grade.

    __table_args__ = (
        # UniqueConstraint("semester", "class_id"),
        ForeignKeyConstraint(["course_id1", "course_id2"], ["course.id1", "course.id2"]),
    )


class GradeElement(GradeBase):
    """
    Grade element stored in db and consumed by client. The values are between 0~100.
    """

    course: "CourseBase"
    segments: list[Segment] = Field(
        description="A list of segments. The segments are expected to be disjoint, and taking up the whole [0, 9] range. The sum is expected to be (nearly) 100."
    )

    @field_validator("segments")
    def valiadte_grade_eles(cls, v: list[Segment]):
        if not math.isclose(sum(grade.value for grade in v), 100, abs_tol=1):
            raise Exception(f"sum = {sum(grade.value for grade in v)}")
        for i in range(len(v) - 1):
            assert v[i].r + 1 == v[i + 1].l, v
        return v


class UpdateBase(SQLModel):

    pos: GradeInt
    lower: Percent
    higher: Percent



class GradeWithUpdate(GradeBase):
    course: "CourseBase"
    update: "UpdateBase"

    # ? used for pre-collected since their source are not 100% correct.
    # ? if new updates comes, just drop those with `solid` false.
    solid: bool = Field(default=True)


class Update(UpdateBase, table=True):
    id: Optional[int] = Field(primary_key=True, default=None)

    grade_id: int = Field(foreign_key="grade.id")
    grade: Grade = Relationship(back_populates="updates")


class User(SQLModel, table=True):
    id: StudentId = Field(unique=True)
    # token: str
    last_semester: SemesterStr

    __table_args__ = (PrimaryKeyConstraint("id"),)


# ---------------------------- Function Signature ---------------------------- #

# ----------------------------------- Page ----------------------------------- #


class Page(BaseModel):
    """
    Page submitted by user.
    """

    content: str = Field(description="The html content of user's grade page.")
    hashCode: int = Field(description="Hashed value of `content`.")

    @staticmethod
    def get_hash_code(content: str):
        """
        Generate hashcode for page content.
        """

        MAGIC = "TH3_M5G1C_OF_NTU" * 3
        magic_idx = []
        cur = 0
        for m in MAGIC:
            cur += ord(m)
            cur %= len(content)
            magic_idx.append(cur)

        h = 0
        a = []
        for c in [content[idx] for idx in magic_idx]:
            a.append(ord(c))
            h = (h << 5) - h + ord(c)

            h &= 1 << 63 - 1
        return h

    @model_validator(mode="after")
    def validate_hash(self):
        if self.hashCode != self.get_hash_code(self.content):
            raise RequestValidationError([])
        return self


QUERY_FIELDS = ("id1", "id2", "title")
# QueryField: TypeAlias = Literal["id1", "id2", "title"]
QUERY_FILTERS = ("class_id", "semester")