#example 1 - standard-library namespaces
import math
from pathlib import Path

print(math.ceil(4.2))
print(Path("backend")/"app"/"main.py")

#example 2: json round trip
import json

records = [{"title": "Python", "capacity": 20}]
text = json.dumps(records, indent=2)
restored = json.loads(text)
print(restored == records)
print(restored[0]["capacity"])