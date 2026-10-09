#def function_name(parameter):
#def function_name(parameter1, parameter2):

#example 1
def remaining(capacity, registered):
    return capacity - registered   

value = remaining(20, 8)
print(value)
print(remaining(registered=3, capacity=5))

#example 2
def greeting(name, prefix="Hello"):
    return f"{prefix}, {name}"#strings formating in here causing when print prefix will print first

print(greeting("Ada"))
print(greeting("Ada", prefix="Welcome"))

#example 3
def add_title(title, titles=None):
    if titles is None:#titles is None and constructs a brand new, empty list [] specifically for that call.
        titles = []
    return [*titles, title]#use the list unpacking operator (*). It unpacks all existing elements from titles into a new list and appends title at the very end.

print(add_title("Python"))
print(add_title("SQL"))
print(add_title("React", ["Python"]))