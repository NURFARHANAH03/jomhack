#example 1
title = "Python"#the number represent index of the character in the string, starting from 0
print(title[0], title[-1]) #-1 is the last character, -2 is the second to last character, etc
print(title[ :3]) #output: it will the first 3 characters, before 3 as 0 1 2 
print(title[3: ]) #output it will be the last 3 characters
print(title[20:]) #nothing as it exceed the length of characters word

#example 2
name = " Ada Lovelace "
email = " ADA@EXAMPLE.COM "
print(name.strip())
print(email.strip().lower())

#example 3
capacity_text = input("Capacity: ")
registered_text = input("Registered: ")
capacity = int(capacity_text)#only numerical input is accepted since int
registered = int(registered_text)
print(f"Remaining: {capacity - registered}")

#exercise 3
valid_text = input("Valid: ")
fee = float(valid_text)#convert to float sbb ada decimal places
message = f"Fee: {fee:.2f}"#fee is converted to 2 decimal places
print(message)