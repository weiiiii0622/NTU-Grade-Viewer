from dataclasses import dataclass, field
from typing import List

from module.course import GRADES

@dataclass
class DistNode:
    grade: tuple[int, int]      # [A+, C] close interval
    isLeaf: bool = False        # Whether it is a leaf or not


@dataclass
class Distrubution:
    dist: List[float] = field(default_factory=lambda: [100.0] + [0.0] * 9)