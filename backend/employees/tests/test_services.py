
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from employees.models import Department, Employee
from employees.services import create_employee_with_compensation
from compensation.models import Compensation


class EmployeeOnboardingTests(TestCase):

    def setUp(self):
        self.department = Department.objects.create(
            name="Engineering"
        )

        self.employee_data = {
            "employee_id": "EMP00001",
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane@example.com",
            "department": self.department,
            "job_title": "Software Engineer",
            "country": "KE",
            "hire_date": date(2025, 1, 15),
        }

    def test_employee_and_compensation_created(self):
        employee = create_employee_with_compensation(
            employee_data=self.employee_data,
            salary_data={
                "annual_base_salary": Decimal("85000.000"),
                "currency": "USD",
                "effective_date": date(2025, 1, 15),
            },
        )

        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(Compensation.objects.count(), 1)
        self.assertEqual(
            employee.compensation.annual_base_salary,
            Decimal("85000.000"),
        )

    def test_invalid_salary_rolls_back_employee(self):
        with self.assertRaises(ValidationError):
            create_employee_with_compensation(
                employee_data=self.employee_data,
                salary_data={
                    "annual_base_salary": Decimal("-500.000"),
                    "currency": "USD",
                    "effective_date": date(2025, 1, 15),
                },
            )

        self.assertEqual(Employee.objects.count(), 0)
        self.assertEqual(Compensation.objects.count(), 0)
