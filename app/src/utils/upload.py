import os
from contextlib import contextmanager
from pathlib import Path

IMAGES_DIR = Path(__file__).parent / "../../upload/images"

if not IMAGES_DIR.exists():
    IMAGES_DIR.mkdir()


@contextmanager
def open_image(name: str, mode: str = "r"):
    try:
        path = IMAGES_DIR / name
        file = path.open(mode)
        yield file
    finally:
        if file:
            file.close()
