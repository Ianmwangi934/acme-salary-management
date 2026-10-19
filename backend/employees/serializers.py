
from rest_framework import serializers
from decimal import Decimal
from rest_framework import serializers

from .models import Department, Employee
from compensation.validators import (
    validate_currency_code,
    validate_salary_amount,
)
from .services import create_employee_with_compensation


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "department",
            "department_name",
            "job_title",
            "country",
            "employment_status",
            "hire_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

class EmployeeOnboardingSerializer(serializers.Serializer):
    employee_id = serializers.CharField(max_length=20)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all()
    )
    job_title = serializers.CharField(max_length=150)
    country = serializers.RegexField(regex=r"^[A-Z]{2}$")
    hire_date = serializers.DateField()

    annual_base_salary = serializers.DecimalField(
        max_digits=15,
        decimal_places=3,
        min_value=Decimal("0.000"),
    )
    currency = serializers.CharField(max_length=3)
    salary_effective_date = serializers.DateField()

    def validate_currency(self, value):
        validate_currency_code(value)
        return value

    def validate_annual_base_salary(self, value):
        validate_salary_amount(value)
        return value

    def create(self, validated_data):
        salary_data = {
            "annual_base_salary": validated_data.pop(
                "annual_base_salary"
            ),
            "currency": validated_data.pop("currency"),
            "effective_date": validated_data.pop(
                "salary_effective_date"
            ),
        }

        return create_employee_with_compensation(
            employee_data=validated_data,
            salary_data=salary_data,
        )



    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError(
                "This employee ID is already in use. "
                "Please generate a new ID or enter another one."
            )
        return value


    def validate_email(self, value):
        if Employee.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An employee with this email address already exists."
            )
        return value

