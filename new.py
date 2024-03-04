from importlib import import_module
from pathlib import Path

# m = import_module("new_")
# print(getattr(m, "b", None))

print(list(Path().glob("*"))[10].name)
