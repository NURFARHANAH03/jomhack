#example 1 - strict capacity
from pydantic import BaseModel, Field
class Count(BaseModel):
    capacity: int = Field(ge=1, le=500, strict=True)
print(Count(capacity=20).capacity) #20 is a valid integer between $1$ and $500$, Pydantic creates the Count object cleanly and returns the validated attribute 20

#example 2 - minimal route
from fastapi import FastAPI
from fastapi.testclient import TestClient
mini = FastAPI()
@mini.get("/health")
def health(): return {"status": "ok"}
print(TestClient(mini).get("/health").json())

#example 3 - public schema (ada errors nnti kita fix)
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full name: str
    rule: Literal["participant", "organizer"]
print(sorted(UserOut.model_fields))
