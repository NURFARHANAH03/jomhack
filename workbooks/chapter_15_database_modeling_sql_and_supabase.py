#example 1 - safe SQL practice data
from contextlib import closing
import sqlite3

conn = sqlite3.connect(":memory:")
rows = conn.execute("""
WITH workshops(id, title, capacity) AS (
    VALUES ('w1', 'Python', 20), ('w2', 'SQL', 5)
)
SELECT title, capacity FROM workshops
WHERE capacity >= 10
ORDER BY title;
""").fetchall()

print(rows)

#example 2 - Aggregating a relationship
EXAMPLE_2 = """WITH registrations(workshop_id, participant_id) AS (
    VALUES ('w1', 'p1'), ('w1', 'p2'), ('w2','p1')
)
SELECT workshop_id, COUNT(*) AS registered_count
FROM registrations GROUP BY workshop_id ORDER BY workshop_id;
"""
print("\nWORKED EXAMPLE 2: Aggregating a relationship")
with closing(sqlite3.connect(":memory:")) as connection:
    rows = connection.execute(EXAMPLE_2).fetchall()
print(rows)