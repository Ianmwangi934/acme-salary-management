from django.contrib import admin
from django.urls import path
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
    path("admin/", admin.site.urls),

    path("api/health/", health_check, name="health-check"),

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
]