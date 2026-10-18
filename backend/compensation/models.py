from django.db import models
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from employees.models import Employee
from .validators import validate_currency_code

# Create your models here.
class Compensation(models.Model):
    employee = models.OneToOneField(
        Employee,
        on_delete=models.PROTECT,
        related_name="compensation",
    )

    annual_base_salary = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.000"))],
    )

    currency = models.CharField(
        max_length=3,
        validators=[validate_currency_code],
    )

    effective_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.employee.employee_id}: "
            f"{self.annual_base_salary} {self.currency}"
        )


class SalaryHistory(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="salary_history",
    )

    previous_salary = models.DecimalField(
        max_digits=15,
        decimal_places=3,
    )

    new_salary = models.DecimalField(
        max_digits=15,
        decimal_places=3,
    )

    previous_currency = models.CharField(
        max_length=3,
        validators=[validate_currency_code],
    )

    new_currency = models.CharField(
        max_length=3,
        validators=[validate_currency_code],
    )

    effective_date = models.DateField()

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="salary_changes",
    )

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at", "-id"]
        indexes = [
            models.Index(
                fields=["employee", "-changed_at"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee.employee_id}: "
            f"{self.previous_salary} "
            f"{self.previous_currency} -> "
            f"{self.new_salary} "
            f"{self.new_currency}"
        )

