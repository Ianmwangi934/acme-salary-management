from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import IsHRStaffOrReadOnly
from .models import Department, Employee
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    EmployeeOnboardingSerializer,
)

# Create your views here.
class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRStaffOrReadOnly]

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]

    filterset_fields = [
        "department",
        "country",
        "employment_status",
    ]

    search_fields = [
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "job_title",
    ]

    ordering_fields = [
        "employee_id",
        "hire_date",
        "created_at",
        "last_name",
    ]

    ordering = ["employee_id"]

    def get_queryset(self):
        return Employee.objects.select_related(
            "department"
        ).all()

    def get_serializer_class(self):
        if self.action == "create":
            return EmployeeOnboardingSerializer
        return EmployeeSerializer

