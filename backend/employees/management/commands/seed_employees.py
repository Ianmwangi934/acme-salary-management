
import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from employees.models import Department, Employee
from compensation.models import Compensation


DEPARTMENTS = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Finance",
    "Human Resources",
    "Operations",
    "Customer Support",
    "Legal",
]

COUNTRIES = {
    "US": ("USD", Decimal("85000")),
    "KE": ("KES", Decimal("1800000")),
    "KW": ("KWD", Decimal("18000")),
    "GB": ("GBP", Decimal("55000")),
    "DE": ("EUR", Decimal("65000")),
    "IN": ("INR", Decimal("1500000")),
    "JP": ("JPY", Decimal("7500000")),
    "BR": ("BRL", Decimal("140000")),
    "RU": ("RUB", Decimal("2400000")),
}

JOB_TITLES = [
    "Software Engineer",
    "Senior Software Engineer",
    "Product Manager",
    "Data Analyst",
    "UX Designer",
    "Sales Executive",
    "Financial Analyst",
    "HR Specialist",
    "Operations Specialist",
    "Support Specialist",
]

FIRST_NAMES = [
    "Alex", "Jane", "Michael", "Sarah", "David",
    "Emma", "Daniel", "Grace", "James", "Sophia",
]

LAST_NAMES = [
    "Smith", "Kim", "Patel", "Mwangi", "Brown",
    "Garcia", "Wilson", "Chen", "Johnson", "Miller",
]


class Command(BaseCommand):
    help = "Seed 10,000 deterministic synthetic employees."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=10000,
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count = options["count"]
        rng = random.Random(options["seed"])

        if count <= 0:
            raise CommandError(
                "Employee count must be greater than zero."
            )

        # Avoid overwriting existing seeded records.
        if Employee.objects.filter(
            employee_id__startswith="SEED"
        ).exists():
            raise CommandError(
                "Seed employees already exist. "
                "Refusing to insert duplicates."
            )

        departments = {}

        for name in DEPARTMENTS:
            department, _ = Department.objects.get_or_create(
                name=name
            )
            departments[name] = department

        employees = []
        country_codes = list(COUNTRIES)

        for index in range(1, count + 1):
            country = rng.choice(country_codes)
            department_name = rng.choice(DEPARTMENTS)

            hire_date = date(2026, 1, 1) - timedelta(
                days=rng.randint(0, 3650)
            )

            employees.append(
                Employee(
                    employee_id=f"SEED{index:07d}",
                    first_name=rng.choice(FIRST_NAMES),
                    last_name=rng.choice(LAST_NAMES),
                    email=(
                        f"seed{index:07d}@example.com"
                    ),
                    department=departments[
                        department_name
                    ],
                    job_title=rng.choice(JOB_TITLES),
                    country=country,
                    hire_date=hire_date,
                    employment_status=(
                        "ACTIVE"
                        if rng.random() < 0.92
                        else "INACTIVE"
                    ),
                )
            )

        Employee.objects.bulk_create(
            employees,
            batch_size=1000,
        )

        # Query the inserted records so primary keys
        # are available for compensation foreign keys.
        saved_employees = list(
            Employee.objects.filter(
                employee_id__startswith="SEED"
            ).order_by("employee_id")
        )

        compensations = []

        for employee in saved_employees:
            currency, base_salary = COUNTRIES[
                employee.country
            ]

            # Synthetic variation: 70% to 160% of base.
            multiplier = Decimal(
                rng.randint(70, 160)
            ) / Decimal("100")

            salary = (
                base_salary * multiplier
            ).quantize(Decimal("0.001"))

            compensations.append(
                Compensation(
                    employee=employee,
                    annual_base_salary=salary,
                    currency=currency,
                    effective_date=employee.hire_date,
                )
            )

        Compensation.objects.bulk_create(
            compensations,
            batch_size=1000,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {count} synthetic employees "
                f"and {len(compensations)} "
                "compensation records."
            )
        )
