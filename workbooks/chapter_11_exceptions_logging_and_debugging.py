#example 1 - exception handling
text = "twenty"#this is a string, not an integer
try:
    capacity = int(text)#will check if text is an integer, if not it will raise a ValueError exception
except ValueError:
    print("Enter a whole number")
else:
    print(capacity)

#example 2 - domain validation
def valid_capacity(value):
    if type(value) is not int or not 1 <= value <= 500:
        raise ValueError("Capacity must be an integer from 1 to 500")
    return value
print(valid_capacity(20))

#example 3 - safe event logging
import logging #import logging: Imports Python’s built-in module for tracking events and messages during execution.
logger = logging.getLogger("workshop_hub")#You give your notebook a specific name written on the cover: "workshop_hub".
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")#level=logging.INFO: "Only write down things that are important (INFO) or super critical (WARNING, ERROR). Don't waste paper writing down tiny boring secrets like 'I picked up a spoon'."
#format="%(levelname)s:%(message)s": "Every time you write a line, write the importance level first, then a colon :, then the actual message."
workshop_id = "w1"#In simple terms, workshop_id = "w1" is like putting a name tag on a box.
logger.info("Workshop update rejected: id=%s reason=capacity", workshop_id)
