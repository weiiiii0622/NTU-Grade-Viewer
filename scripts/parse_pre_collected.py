from curses import raw
from dataclasses import dataclass, field
from enum import Enum
import math
from pathlib import Path
import pickle
import re
from typing import Annotated, TypeAlias
from openpyxl import load_workbook

from openpyxl.cell.cell import Cell
from pydantic import Field

# * Define parsed datatype
GradeInt: TypeAlias = Annotated[int, Field(ge=0, lt=10)]  # A+=9, F=0

GRADES = tuple(reversed(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F"]))
MAX = 9
MIN = 0


WIDTH = 8
GRADES_HEADER = "".join(f"{x.ljust(WIDTH)}" for x in reversed(GRADES))


@dataclass
class Segment:
    l: GradeInt
    r: GradeInt
    value: float

    def __post_init__(self):
        if not 0 <= self.value <= 1:
            if 0 <= self.value <= 100:
                self.value /= 100
            else:
                assert math.isclose(self.value, 0, abs_tol=0.01), f"{self.value}"

    def __len__(self):
        return self.r - self.l + 1


@dataclass
class ParsedGradeInfo:
    title: str
    lecturer: str
    semester: Annotated[str, Field(pattern=r"\d+-\d+")]
    segments: list[Segment]
    cls: str = field(default="")

    def __post_init__(self):
        self.title.replace("(", "（")
        self.title.replace(")", "）")

        # Some data may missing orange part
        # Often the case is we have A+
        if self.segments[0].l != MIN and self.segments[-1].r == MAX:
            other_sum = sum(seg.value for seg in self.segments)
            self.segments.insert(0, Segment(0, self.segments[0].l - 1, 1 - other_sum))

        # ? maybe we leave this part to server side
        # validate_segments(self.segments)

    def readable_str(self):
        total = 19
        info = 10
        title = self.title[: total - info]
        title = title.ljust(total - info, "　")
        s = title + f"　{self.lecturer}　{self.semester}"[:info].ljust(info, "　") + " | "
        seg_idx = len(self.segments) - 1
        for i in range(MAX, MIN - 1, -1):
            seg = self.segments[seg_idx]
            if i == seg.r:
                val = f"{seg.value:.2%}"
                if seg.l == seg.r:
                    s += val.ljust(WIDTH)
                else:
                    s += f"({val.center(WIDTH*len(seg)-3)}) "
                seg_idx -= 1
        # s += "\n"
        return s


def validate_segments(segments: list[Segment]):
    try:
        for i in range(len(segments) - 1):
            assert segments[i].r + 1 == segments[i + 1].l
        assert math.isclose(sum(seg.value for seg in segments), 1, abs_tol=0.01)
    except Exception as e:
        raise Exception(f"seg: {segments}\n")


def extract_cls(raw_lecturer: str):
    if obj := re.match(r"(.+).*?\((.+?)\)", raw_lecturer):
        # print('hi')
        return obj.group(1).strip(), obj.group(2)
    return raw_lecturer, ""
# s = "林明仁(02)" 
# if obj := re.match(r"(.*)\((.*)\)", s):
#     print(obj.group(1), obj.group(2))

# * Color
class Color(Enum):
    BLACK = 0
    BLUE = 1
    ORANGE = 2


def getColor(cell: Cell):
    theme_map = {1: 0, 4: 1, 8: 2}
    if cell.font.color.theme:
        try:
            return Color(theme_map[int(cell.font.color.theme)])
        except:
            pass

    color_map = {
        "FF000000": 0,
        "FF4285F4": 1,
        "FFFF6D01": 2,
        "FFFF9900": 2,
        "FFED7D31": 2,
    }
    if cell.font.color.rgb:
        return Color(color_map[cell.font.color.rgb])

    else:
        print(cell)
        print(cell.font.color)
        raise Exception()


# * Row parser
def parse_row(row: tuple[Cell, ...]):
    title, lecturer, semester = [str(c.value) for c in row[:3]]
    lecturer, cls = extract_cls(lecturer.replace("（", '(').replace("）", ")"))
    # if c:
    #     print(repr(l), repr(c))
    print(lecturer)

    segments: list[Segment] = []
    st = -1
    end = -1
    blue_val: float = -1

    # * Note the row is reversed
    for i, c in enumerate(reversed(row[3:13])):
        if c.value:
            assert (
                type(c.value) == float or type(c.value) == int
            ), f"{c}, {c.value}: {type(c.value)}"

            match getColor(c):
                case Color.BLACK:
                    if st != -1:
                        segments.append(Segment(st, end, blue_val))
                        st = -1
                        end = -1
                        blue_val = -1
                    segments.append(Segment(i, i, c.value))
                case Color.BLUE:
                    if st == -1:
                        st = i
                    end = i
                    blue_val = c.value
                case Color.ORANGE:
                    assert end == -1
                    if segments:
                        # this should be "higher than"
                        segments.append(Segment(i, MAX, c.value))
                    else:
                        # "lower than"
                        segments.append(Segment(MIN, i, c.value))
    assert st == -1 and end == -1, f"{st}, {end}, {segments}"

    grade = ParsedGradeInfo(title, lecturer, semester, segments)
    # print(grade.readable_str())
    return grade


def main():
    data_dir = Path(__file__).parent / "../data/pre-collected/"

    wb = load_workbook(str(data_dir / "raw/106-110學年NTU課程成績比例.xlsx"))
    ws = wb.worksheets[0]
    rows = list(ws.rows)

    # print("　" * 14 + " " * 8 + GRADES_HEADER)

    grades = []
    for row in rows[1:]:
        if not row[0].value:
            break
        grade = parse_row(row)
        grades.append(grade)

    with open(str(data_dir / "parsed/106-110_data"), "+wb") as f:
        pickle.dump(grades, f)


main()
