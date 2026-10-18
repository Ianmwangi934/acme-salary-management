
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from employees.models import Employee
from .models import Compensation, SalaryHistory
from .validators import validate_currency_code, validate_salary_amount


@transaction.atomic
def update_employee_salary(
    *,
    employee_id: int,
    new_salary: Decimal,
    new_currency: str,
    effective_date: date,
    changed_by,
):
    """
    Atomically update employee compensation
    and record an audit trail.
    """

    if not changed_by or not changed_by.is_authenticated:
        raise ValidationError(
            "An authenticated user is required."
        )

    validate_salary_amount(new_salary)
    validate_currency_code(new_currency)

    if not isinstance(effective_date, date):
        raise ValidationError("A valid effective date is required.")

    employee = Employee.objects.get(pk=employee_id)

    compensation = (
        Compensation.objects
        .select_for_update()
        .get(employee=employee)
    )

    previous_salary = compensation.annual_base_salary
    previous_currency = compensation.currency

    new_salary = Decimal(str(new_salary))

    if (
        previous_salary == new_salary
        and previous_currency == new_currency
    ):
        raise ValidationError(
            "The new compensation must differ from the current compensation."
        )

    history = SalaryHistory.objects.create(
        employee=employee,
        previous_salary=previous_salary,
        new_salary=new_salary,
        previous_currency=previous_currency,
        new_currency=new_currency,
        effective_date=effective_date,
        changed_by=changed_by,
    )

    compensation.annual_base_salary = new_salary
    compensation.currency = new_currency
    compensation.effective_date = effective_date

    compensation.full_clean()
    compensation.save(
        update_fields=[
            "annual_base_salary",
            "currency",
            "effective_date",
            "updated_at",
        ]
    )

    return compensation, history
