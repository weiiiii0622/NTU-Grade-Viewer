from dataclasses import dataclass
import inspect


@dataclass
class A:
    a: int


print("{a.a}".format(a=A(1)))
