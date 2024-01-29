import inspect
import json
import os
from pathlib import Path
from pydantic import BaseModel, TypeAdapter, create_model
from app import models


DIR = Path(__file__).parent

r"sed '/\[k: string\]: unknown;/ d' foo.d.ts"

TMP = str(DIR / "../tmp.json")
OUT = str(DIR / "../extension/src/models.d.ts")
with open(TMP, "w+") as f:
    D = {}
    for k, v in models.__dict__.items():
        if inspect.getmodule(v) == models and isinstance(v, type):
            D[v.__name__] = (v, ...)
    json.dump(create_model("_Root_", **D).model_json_schema(), f)

os.chdir(str(DIR / "../extension"))
os.system(f"npx json-schema-to-typescript {TMP} | sed '/\\[k: string\\]: unknown;/ d' > {OUT} ")
os.remove(TMP)
