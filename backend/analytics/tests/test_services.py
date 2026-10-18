
from datetime import date
from decimal import Decimal

from django.test import TestCase

from employees.models import Employee, Department
from compensation.models import Compensation

from analytics.services import (
    get_workforce_overview,
    get_department_analytics,
    get_country_analytics,
    get_compensation_summary,
    get_salary_distribution,
)


class AnalyticsServiceTests(TestCase):

    def setUp(self):
        self.department = Department.objects.create(
            name="Engineering"
        )

        self.employee = Employee.objects.create(
            employee_id="TEST001",
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            department=self.department,
            job_title="Software Engineer",
            country="US",
            employment_status="ACTIVE",
            hire_date=date(2025, 1, 1),
        )

        Compensation.objects.create(
            employee=self.employee,
            annual_base_salary=Decimal("85000.000"),
            currency="USD",
            effective_date=date(2025, 1, 1),
        )

    def test_workforce_overview(self):
        result = get_workforce_overview()

        self.assertEqual(result["total_employees"], 1)
        self.assertEqual(result["active_employees"], 1)
        self.assertEqual(result["total_departments"], 1)
        self.assertEqual(result["total_countries"], 1)

    def test_department_analytics(self):
        result = get_department_analytics()

        self.assertEqual(
            result[0]["employee_count"],
            1,
        )

    def test_country_analytics(self):
        result = get_country_analytics()

        self.assertEqual(result[0]["country"], "US")
        self.assertEqual(result[0]["employee_count"], 1)

    def test_compensation_summary(self):
        result = get_compensation_summary()

        self.assertEqual(result[0]["currency"], "USD")
        self.assertEqual(
            result[0]["average_salary"],
            Decimal("85000.000"),
        )

    def test_salary_distribution(self):
        result = get_salary_distribution("USD")

        distribution = {
            item["range"]: item["count"]
            for item in result["distribution"]
        }

        self.assertEqual(
            distribution["75000-100000"],
            1,
        )
