import asyncio
from pathlib import Path

import requests

from models import Page

content = open(str(Path(__file__).parent / "../examples/error.html")).read()

r = requests.post(
    "http://localhost:5000/submit/page", json={"content": content, "hashCode": Page.get_hash_code(content)}
)

print(r.text)
