from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from .auth_views import csrf_view, login_view, logout_view, me_view

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
    path("api/auth/csrf/", csrf_view),
    path("api/auth/login/", login_view),
    path("api/auth/me/", me_view),
    path("api/auth/logout/", logout_view),
    ]