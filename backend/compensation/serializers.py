
from rest_framework import serializers

from .models import Compensation, SalaryHistory
from .validators import (
    validate_currency_code,
    validate_salary_amount,
)


class CompensationSerializer(serializers.ModelSerializer):
    employee_code = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )
    employee_name = serializers.CharField(
        source="employee.full_name",
        read_only=True,
    )

    class Meta:
        model = Compensation
        fields = [
            "id",
            "employee",
            "employee_code",
            "employee_name",
            "annual_base_salary",
            "currency",
            "effective_date",
            "updated_at",
        ]
        read_only_fields = fields


class SalaryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryHistory
        fields = [
            "id",
            "employee",
            "previous_salary",
            "new_salary",
            "previous_currency",
            "new_currency",
            "effective_date",
            "changed_by",
            "changed_at",
        ]
        read_only_fields = fields


class SalaryUpdateSerializer(serializers.Serializer):
    new_salary = serializers.DecimalField(
        max_digits=15,
        decimal_places=3,
        min_value=0,
    )
    new_currency = serializers.CharField(max_length=3)
    effective_date = serializers.DateField()

    def validate_new_salary(self, value):
        validate_salary_amount(value)
        return value

    def validate_new_currency(self, value):
        validate_currency_code(value)
        return value
