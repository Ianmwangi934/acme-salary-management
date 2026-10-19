
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EmployeeViewSet,
    DepartmentViewSet,
    country_currency_options,
)

router = DefaultRouter()

router.register(
    "",
    EmployeeViewSet,
    basename="employee",
)

urlpatterns = [
    # Global countries and currencies
    path(
        "country-currency-options/",
        country_currency_options,
        name="country-currency-options",
    ),

    # Departments
    path(
        "departments/",
        DepartmentViewSet.as_view({"get": "list"}),
        name="department-list",
    ),

    # Employee CRUD and custom actions
    path("", include(router.urls)),
]
