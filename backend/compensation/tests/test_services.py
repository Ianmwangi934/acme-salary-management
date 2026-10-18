from django.test import TestCase
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from employees.models import Department, Employee
from compensation.models import Compensation, SalaryHistory
from compensation.services import update_employee_salary
# Create your tests here.
class SalaryUpdateServiceTests(TestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="hr_manager",
            password="test-password-123",
        )

        department = Department.objects.create(
            name="Engineering"
        )

        self.employee = Employee.objects.create(
            employee_id="EMP00001",
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            department=department,
            job_title="Software Engineer",
            country="KE",
            hire_date=date(2025, 1, 1),
        )

        Compensation.objects.create(
            employee=self.employee,
            annual_base_salary=Decimal("80000.000"),
            currency="USD",
            effective_date=date(2025, 1, 1),
        )

    def test_salary_update_creates_history(self):
        compensation, history = update_employee_salary(
            employee_id=self.employee.pk,
            new_salary=Decimal("95000.000"),
            new_currency="USD",
            effective_date=date(2026, 10, 18),
            changed_by=self.user,
        )

        compensation.refresh_from_db()

        self.assertEqual(
            compensation.annual_base_salary,
            Decimal("95000.000"),
        )

        self.assertEqual(
            history.previous_salary,
            Decimal("80000.000"),
        )

        self.assertEqual(
            history.new_salary,
            Decimal("95000.000"),
        )

        self.assertEqual(
            SalaryHistory.objects.count(),
            1,
        )

