import re
import datetime
from typing import Union


def verify_ratio_params(ratio_params: str, params: list):
    if not ratio_params or len(ratio_params) == 0:
        return True, []

    ratio_params_parts = ratio_params.split(',')
    rp = []
    for ratio_params_part in ratio_params_parts:
        ratio_params = ratio_params_part.split('|')
        if len(ratio_params) != 2:
            return False, []

        if not all([param in params for param in ratio_params]):
            return False, []

        rp.append([ratio_params[0], ratio_params[1]])

    return True, rp


# verifies if username has a valid format
def is_valid_username(username: str):
    if username:
        if len(username) > 15:
            return False
        else:
            # if username contains anything besides lower/uppercase letter or numbers
            if re.match("([^A-Za-z0-9])", username):
                return False
            else:
                return True
    else:
        return False


# Verifies if the given 'val' is an integer
def is_number(val: Union[str, None]) -> bool:
    if not val:
        return False

    return re.search('^-?\\d+$', val) is not None


def is_number_greater_than(val: Union[str, None], greater_than: int) -> bool:
    if not is_number(val):
        return False

    return int(val) > greater_than


# Verifies if the given 'val' is an integer >= 0.
def is_positive_number(val: Union[str, None]) -> bool:
    if not is_number(val):
        return False

    return int(val) >= 0


# Verifies if the 'val' is a valid UCI day (i.e. val >= 1)
def is_valid_day_uci(val: Union[str, None]) -> bool:
    if not is_number(val):
        return False

    return int(val) >= 1


def is_icu_days_input_valid(ids_input: Union[list, None]):
    # uses the same function for verifying patient IDs, since it's the same process
    return is_patient_ids_input_valid(ids_input)


# Verifies if the patient ID input is valid.
def is_patient_ids_input_valid(ids_input: Union[list, None]):
    if not ids_input:
        return False

    for id_input in ids_input:
        if '-' in id_input:
            input_parts = id_input.split('-')
            if len(input_parts) != 2:
                return False
            if not is_positive_number(input_parts[0]) or not is_positive_number(input_parts[1]):
                return False
            if int(input_parts[0]) > int(input_parts[1]):
                return False
        else:
            if not is_positive_number(id_input):
                return False

    return True


# Verifies if the values is a valid float.
def is_float(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


# Verifies if 'val' is an interval.
def is_interval(val: Union[str, None]):
    if not val:
        return False

    return '-' in val


# Verifies if the date has a valid format.
def is_valid_date(date: Union[str, None]):
    if not date:
        return False

    date_parts = date.split('-')
    if len(date_parts) != 3:
        return False

    try:
        datetime.date(year=int(date_parts[0]), month=int(date_parts[1]), day=int(date_parts[2]))
        return True
    except ValueError:
        return False


# Verifies if date1 is greater than date2.
def is_date_greater(date1: str, date2: str) -> bool:
    date1_parts = date1.split('-')
    d1 = datetime.date(year=int(date1_parts[0]), month=int(date1_parts[1]), day=int(date1_parts[2]))

    date2_parts = date2.split('-')
    d2 = datetime.date(year=int(date2_parts[0]), month=int(date2_parts[1]), day=int(date2_parts[2]))

    return d1 > d2
