#example 1 - annotated function
def remaining(capacity: int, registered: int) -> int:# : int is the annotation
    return capacity - registered


print(remaining(20, 8))
print(remaining.__annotations__)#if you pass remaining(20.5, 3.2) or remaining("hello", "world"), Python will not block you just because of the : int annotation. Annotations are purely notes for humans and code tools, not rules enforced by Python when running!

#example 2 - dataclass records
from dataclasses import dataclass

@dataclass
class Workshop:
    title: str
    capacity: int

workshop = Workshop("Python", 20)
print(workshop.title, workshop.capacity)