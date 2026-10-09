#example 1 - dictionary
workshop = {
    "id": "w1",#key:value
    "title": "Python",
    "capacity": 20,
}

print(workshop["title"])#same with print(workshop.get("title"))
print(workshop.get("venue","TBC"))#assign new key 'venue' and value 'TBC'
print("title" in workshop)

#example 2 - duplicate identifiers
participants_ids = ["u2", "u1","u2"]#list contains 2 elements which is u2
unique_ids = set(participants_ids)#convert list to set to remove duplicates
print(sorted(unique_ids))#sort them alphebatically
print("u1" in unique_ids)
print(unique_ids & {"u1", "u3"})#intersection of 2 sets using & operator

#example 3 - filter records
workshops = [
    {"id":"w1","capacity":0},#workshops is a list of dictionaries. Each dictionary represents a workshop with two keys:id and capacity
    {"id":"w2","capacity": 5},
]
open_ids = [row["id"] for row in workshops if row["capacity"]>0]
print(open_ids)

#exercise 2 - registration uniqueness
registration_ids = ["p3", "p1", "p2", "p3"]#list contains 4 elements with a duplicate
unique_registration_ids = set(registration_ids)#convert to set to remove duplicates
print(sorted(unique_registration_ids))#order them alphebatically

#exercise 3 - aggregate capacities (calculate total sum of workshop capacities)
