import os
from contextlib import contextmanager
from pathlib import Path

IMAGES_DIR = Path(__file__).parent / "../../upload/images"

if not IMAGES_DIR.exists():
    IMAGES_DIR.mkdir()


def get_image_path(name: str):
    return IMAGES_DIR / name


@contextmanager
def open_image(name: str, mode: str = "r"):
    try:
        path = get_image_path(name)
        file = path.open(mode)
        yield file
    finally:
        if file:
            file.close()