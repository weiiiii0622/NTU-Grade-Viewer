import math
from typing import TypeAlias
from unittest import TestCase
import unittest

from segment_list import SegmentList

Input: TypeAlias = tuple[tuple[int, int | float], list[tuple[int, int, int, int | float]]]
Output: TypeAlias = list[tuple[int, int, int | float]]


def generate_tests(cls: object):
    inputs: dict[str, Input] = {}
    outputs: dict[str, Output] = {}
    for k, v in cls.__dict__.items():
        if k.startswith("input"):
            inputs[k.removeprefix("input")] = v  # type: ignore
        if k.startswith("output"):
            outputs[k.removeprefix("output")] = v  # type: ignore

    def test_factory(testcase: tuple[Input, Output]):
        input_data, output_data = testcase

        def f(self: TestCase):
            init, updates = input_data

            seg = SegmentList(*init)
            for update in updates:
                seg.update(*update)

            def validate(a: tuple[int, int, int | float], b: tuple[int, int, int | float]):
                return a[0] == b[0] and a[1] == b[1] and math.isclose(a[2], b[2], abs_tol=1)

            self.assertTrue(validate(a, b) for a, b in zip(seg.dump(), output_data))

        return f

    for k, v in inputs.items():
        setattr(cls, f"test_{k}", test_factory((v, outputs[k])))
    print(cls)
    return cls


@generate_tests
class TestGroup1(TestCase):
    input1: Input = ((5, 100), [(0, 100, 0, 0)])
    output1: Output = [(0, 0, 100), (1, 4, 0)]

    input2: Input = ((5, 100), [(2, 50, 20, 30)])
    output2: Output = [(0, 1, 20), (2, 2, 50), (3, 4, 30)]


# print(TestGroup1.__dict__)

# TestGroup1().test_all()
# TestGroup1().test_foo()

unittest.main()
