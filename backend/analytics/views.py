from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from employees.permissions import IsHRStaff
from .services import (
    get_workforce_overview,
    get_department_analytics,
    get_country_analytics,
    get_compensation_summary,
    get_salary_distribution,
)


# Create your views here.
class WorkforceOverviewView(APIView):
    permission_classes = [IsHRStaff]

    def get(self, request):
        return Response(get_workforce_overview())


class DepartmentAnalyticsView(APIView):
    permission_classes = [IsHRStaff]

    def get(self, request):
        return Response(get_department_analytics())


class CountryAnalyticsView(APIView):
    permission_classes = [IsHRStaff]

    def get(self, request):
        return Response(get_country_analytics())


class CompensationSummaryView(APIView):
    permission_classes = [IsHRStaff]

    def get(self, request):
        return Response(get_compensation_summary())


class SalaryDistributionView(APIView):
    permission_classes = [IsHRStaff]

    def get(self, request):
        currency = request.query_params.get("currency")

        if not currency:
            raise ValidationError({
                "currency": "This parameter is required."
            })

        currency = currency.upper()

        return Response(
            get_salary_distribution(currency)
        )

