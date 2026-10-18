
from django.urls import path

from .views import (
    WorkforceOverviewView,
    DepartmentAnalyticsView,
    CountryAnalyticsView,
    CompensationSummaryView,
    SalaryDistributionView,
)

app_name = "analytics"

urlpatterns = [
    path(
        "overview/",
        WorkforceOverviewView.as_view(),
        name="overview",
    ),
    path(
        "departments/",
        DepartmentAnalyticsView.as_view(),
        name="departments",
    ),
    path(
        "countries/",
        CountryAnalyticsView.as_view(),
        name="countries",
    ),
    path(
        "compensation-summary/",
        CompensationSummaryView.as_view(),
        name="compensation-summary",
    ),
    path(
        "salary-distribution/",
        SalaryDistributionView.as_view(),
        name="salary-distribution",
    ),
]
