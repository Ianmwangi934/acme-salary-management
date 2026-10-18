from django.shortcuts import render
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Compensation, SalaryHistory
from .serializers import (
    CompensationSerializer,
    SalaryHistorySerializer,
    SalaryUpdateSerializer,
)
from .services import update_employee_salary

# Create your views here.
class CompensationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CompensationSerializer
    permission_classes = [IsAuthenticated]

    filterset_fields = [
        "currency",
        "employee__country",
        "employee__department",
    ]

    ordering_fields = [
        "annual_base_salary",
        "effective_date",
    ]

    def get_queryset(self):
        return Compensation.objects.select_related(
            "employee",
            "employee__department",
        ).all()

    @action(
        detail=True,
        methods=["post"],
        url_path="update-salary",
    )
    def update_salary(self, request, pk=None):
        compensation = self.get_object()

        serializer = SalaryUpdateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            updated_compensation, history = (
                update_employee_salary(
                    employee_id=compensation.employee_id,
                    new_salary=serializer.validated_data[
                        "new_salary"
                    ],
                    new_currency=serializer.validated_data[
                        "new_currency"
                    ],
                    effective_date=serializer.validated_data[
                        "effective_date"
                    ],
                    changed_by=request.user,
                )
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        return Response(
            {
                "compensation": CompensationSerializer(
                    updated_compensation
                ).data,
                "history": SalaryHistorySerializer(
                    history
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="history",
    )
    def history(self, request, pk=None):
        compensation = self.get_object()

        queryset = SalaryHistory.objects.filter(
            employee=compensation.employee
        ).select_related("changed_by")

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = SalaryHistorySerializer(
                page,
                many=True,
            )
            return self.get_paginated_response(
                serializer.data
            )

        serializer = SalaryHistorySerializer(
            queryset,
            many=True,
        )
        return Response(serializer.data)
