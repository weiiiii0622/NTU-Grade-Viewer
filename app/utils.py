from functools import wraps
from typing import Any, TypeVar


def hashCode(s: str):
    """
    Used to verify valid page content.
    """

    MAGIC = "TH3_M5G1C_OF_NTU" * 3
    magic_idx = []
    cur = 0
    for m in MAGIC:
        cur += ord(m)
        cur %= len(s)
        magic_idx.append(cur)

    h = 0
    a = []
    for c in [s[idx] for idx in magic_idx]:
        a.append(ord(c))
        h = (h << 5) - h + ord(c)

        h &= 1 << 63 - 1
        # print(h)

    # print(len(a))
    # print(a)
    return h


def extract_dict(keys: list[str], d: dict[str, Any]):
    return {k: v for k, v in d.items() if k in keys}


def add_decorator_doc(dec):
    @wraps(dec)
    def _dec(*args, **kwargs):
        f = dec(*args, **kwargs)
        f.__doc__ =f"@{dec.__name__}\n"+(f.__doc__ or "")
        return f
    return _dec


@add_decorator_doc
def test_only(f):
    # TODO: use some special header
    @wraps(f)
    def _f(*args, **kwargs):
        return f(*args, **kwargs)

    return _f


# Add student to auth list
def addAuth(studentId: int):
    # ...
    return


# Check student is in auth list
def checkAuth(studentId: str):
    # ...
    return True
