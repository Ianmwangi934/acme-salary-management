
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from moneyed import get_currency
from moneyed.classes import CurrencyDoesNotExist


def validate_currency_code(value):
    if not isinstance(value, str):
        raise ValidationError(
            "Currency must be a string."
        )

    if len(value) != 3 or not value.isascii() or not value.isalpha() or value != value.upper():
        raise ValidationError(
            "Currency must be a three-letter uppercase ISO code."
        )

    try:
        get_currency(value)
    except CurrencyDoesNotExist:
        raise ValidationError(
            f"Unsupported currency code: {value}"
        )


def validate_salary_amount(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError("Invalid salary amount.")

    if not amount.is_finite() or amount < 0:
        raise ValidationError(
            "Salary must be a finite, non-negative amount."
        )

    if amount.as_tuple().exponent < -3:
        raise ValidationError(
            "Salary cannot have more than three decimal places."
        )
