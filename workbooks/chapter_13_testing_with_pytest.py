#example 1 - simple assertion
def remaining(capacity, registered):
    return capacity - registered

def test_remaining():#assert validate TRUE or FALSE
    assert remaining(20, 8) == 12 #right so can run as usual
    assert remaining(5, 5) == 0 #wrong give errors

test_remaining()

#example 2 - parametrized boundaries
import pytest

@pytest.mark.parametrize("value", [1, 500])
def test_valid_capacity(value):
    assert type(value) is int and 1 <= value <= 500

