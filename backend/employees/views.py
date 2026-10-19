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
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .id_generator import suggest_employee_id
from rest_framework import status
from django.utils.decorators import method_decorator
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from .country_currency import get_global_country_currency_options


# Create your views here.

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def country_currency_options(request):
    return Response(
        get_global_country_currency_options()
    )

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

    
    @action(
        detail=False,
        methods=["get"],
        url_path="suggest-id",
    )
    def suggest_id(self, request):
        department_id = request.query_params.get("department")

        if not department_id:
            raise ValidationError({
                "department": "Please select a department."
            })

        try:
            department = Department.objects.get(
                pk=department_id
            )
        except (Department.DoesNotExist, ValueError):
            raise ValidationError({
                "department": "Invalid department selected."
            })

        return Response({
            "suggested_id": suggest_employee_id(department),
        })

    
    def create(self, request, *args, **kwargs):
        # Validate onboarding data, including initial compensation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the employee and compensation atomically
        employee = serializer.save()

        # Return employee information using the correct serializer
        response_serializer = EmployeeSerializer(
            employee,
            context=self.get_serializer_context(),
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )



