from dataclasses import dataclass, field
from typing import List

import re


GRADES = {"A+": 0, "A": 1, "A-": 2, "B+": 3, "B": 4, "B-": 5, "C+": 6, "C": 7, "C-": 8, "F": 9}
RE_SEMESTER = re.compile(r"\d+-\d+")

@dataclass
class Course:
    id1: str  # 課號 e.g. CSIE1212
    id2: str  # 課程識別碼 e.g. 902 10750
    title: str

@dataclass
class GradeInfo:
    course: Course
    semester: str
    grade: str
    dist: tuple[float, float, float]  # lower, same, higher

    def __postinit__(self):
        assert sum(self.dist) - 100 < 1 and len(self.dist) == 3
        assert self.grade in GRADES
        assert RE_SEMESTER.match(self.semester)

