
from django.db import transaction
from django.db.models import Max

from .models import Department, Employee


DEPARTMENT_PREFIXES = {
    "Engineering": "ENG",
    "Human Resources": "HR",
    "Finance": "FIN",
    "Customer Support": "CS",
    "Marketing": "MKT",
    "Operations": "OPS",
    "Product": "PRD",
    "Design": "DSN",
    "Sales": "SAL",
    "Legal": "LEG",
}


def suggest_employee_id(department):
    prefix = DEPARTMENT_PREFIXES.get(
        department.name,
        "EMP",
    )

    existing_ids = Employee.objects.filter(
        employee_id__startswith=f"{prefix}-"
    ).values_list("employee_id", flat=True)

    highest_number = 10000

    for employee_id in existing_ids.iterator():
        suffix = employee_id.removeprefix(f"{prefix}-")

        if suffix.isdigit():
            highest_number = max(
                highest_number,
                int(suffix),
            )

    return f"{prefix}-{highest_number + 1}"
