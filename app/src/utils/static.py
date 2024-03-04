from pathlib import Path


def get_static_path():
    return Path(__file__).parent / "../static"
