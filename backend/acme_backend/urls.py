from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "acme-salary-management",
    })


urlpatterns = [
    # Django administration
    path("admin/", admin.site.urls),

    # Health check
    path("api/health/", health_check, name="health-check"),

    # API documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # Application routes
    path(
        "api/employees/",
        include("employees.urls"),
    ),
    path(
        "api/compensation/",
        include("compensation.urls"),
    ),
    path(
        "api/analytics/",
        include("analytics.urls"),
    ),
]