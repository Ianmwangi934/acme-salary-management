
from django.db import transaction

from compensation.services import assign_initial_compensation
from .models import Employee


@transaction.atomic
def create_employee_with_compensation(
    *,
    employee_data,
    salary_data,
):
    """
    Create an employee and assign their initial
    compensation within a single transaction.

    If either operation fails, both are rolled back.
    """

    employee = Employee(**employee_data)

    employee.full_clean()
    employee.save()

    assign_initial_compensation(
        employee=employee,
        annual_base_salary=salary_data["annual_base_salary"],
        currency=salary_data["currency"],
        effective_date=salary_data["effective_date"],
    )

    return employee
