from django.urls import include,path
from rest_framework.routers import DefaultRouter

from .views import CompensationViewSet

router = DefaultRouter()
router.register(
    "",
    CompensationViewSet,
    basename="compensation",
)

app_name = "compensation"

urlpatterns = [
    path("", include(router.urls)),
]

