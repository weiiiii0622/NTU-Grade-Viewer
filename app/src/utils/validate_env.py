from hashlib import sha256
from pathlib import Path


def validate_env():
    env = Path(__file__).parent / "../../../.env"
    env_sha256 = Path(__file__).parent / "../../../.env.sha256"

    h = sha256(env.open("rb").read()).digest().hex()
    return h == env_sha256.read_text()
