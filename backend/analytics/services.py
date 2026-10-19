
from django.db.models import (
    Avg,
    Count,
    Max,
    Min,
    Sum,
)

from employees.models import Employee, Department
from compensation.models import Compensation
from django.db.models import Avg, Count, Max, Min, Q, Sum


def get_workforce_overview():
    employee_stats = Employee.objects.aggregate(
        total_employees=Count("id"),
        active_employees=Count(
            "id",
            filter=Q(employment_status="ACTIVE"),
        ),
    )

    return {
        **employee_stats,
        "total_departments": Department.objects.count(),
        "total_countries": (
            Employee.objects.values("country")
            .distinct()
            .count()
        ),
    }


def get_department_analytics():
    return list(
        Employee.objects.values(
            "department__name"
        )
        .annotate(
            employee_count=Count("id")
        )
        .order_by("department__name")
    )


def get_country_analytics():
    return list(
        Employee.objects.values("country")
        .annotate(
            employee_count=Count("id")
        )
        .order_by("country")
    )


def get_compensation_summary():
    return list(
        Compensation.objects.values("currency")
        .annotate(
            employee_count=Count("id"),
            average_salary=Avg("annual_base_salary"),
            minimum_salary=Min("annual_base_salary"),
            maximum_salary=Max("annual_base_salary"),
            total_salary=Sum("annual_base_salary"),
        )
        .order_by("currency")
    )


def get_salary_distribution(currency):
    """
    Calculate salary distribution for a single currency.
    """

    salaries = Compensation.objects.filter(
        currency=currency
    ).values_list(
        "annual_base_salary",
        flat=True,
    )

    salary_ranges = {
        "0-25000": 0,
        "25000-50000": 0,
        "50000-75000": 0,
        "75000-100000": 0,
        "100000+": 0,
    }

    for salary in salaries:
        if salary < 25000:
            salary_ranges["0-25000"] += 1
        elif salary < 50000:
            salary_ranges["25000-50000"] += 1
        elif salary < 75000:
            salary_ranges["50000-75000"] += 1
        elif salary < 100000:
            salary_ranges["75000-100000"] += 1
        else:
            salary_ranges["100000+"] += 1

    return {
        "currency": currency,
        "distribution": [
            {"range": key, "count": value}
            for key, value in salary_ranges.items()
        ],
    }


def get_department_compensation_analytics():
    """
    Calculate salary statistics by department and currency.

    Grouping by currency prevents averaging salaries
    denominated in different currencies.
    """
    return list(
        Compensation.objects.values(
            "employee__department_id",
            "employee__department__name",
            "currency",
        )
        .annotate(
            employee_count=Count("id"),
            average_salary=Avg("annual_base_salary"),
            minimum_salary=Min("annual_base_salary"),
            maximum_salary=Max("annual_base_salary"),
            total_salary=Sum("annual_base_salary"),
        )
        .order_by(
            "employee__department__name",
            "currency",
        )
    )


def get_country_compensation_analytics():
    """
    Calculate salary statistics by country and currency.
    """
    return list(
        Compensation.objects.values(
            "employee__country",
            "currency",
        )
        .annotate(
            employee_count=Count("id"),
            average_salary=Avg("annual_base_salary"),
            minimum_salary=Min("annual_base_salary"),
            maximum_salary=Max("annual_base_salary"),
            total_salary=Sum("annual_base_salary"),
        )
        .order_by(
            "employee__country",
            "currency",
        )
    )

