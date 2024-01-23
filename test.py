from typing import Annotated, TypeAlias

from pydantic import AfterValidator, BaseModel


A: TypeAlias = Annotated[str, AfterValidator(lambda x: x + "after")]


class B(BaseModel):
    x: A


print(B(x="s"))
