capacity = 20
price = 12.5
title = "Python Basics"
is_open = True
cancelled_at = None
print(type(capacity).__name__)
print(type(price))#without __name__
print(type(title).__name__)
print(type(is_open).__name__)
print(is_open, cancelled_at)

#exercise 1
print(int("12") + int("8"))#since it had int even though the number had "", it will still treat as number
print(int(12) + int(8))#the usual one
print("12" + "8")

#exercise 2
attendees = 23
group_size = 5

groups = attendees // group_size
leftovers = attendees % group_size #% 'modulus' baki or remainder from division

print("Groups:", groups)
print("Leftovers:", leftovers)

#example 3
registered = 4
registered += 1 #increase by 1, the number can change if you want to increase by other value
print(registered)




