
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsHRStaffOrReadOnly(BasePermission):
    """
    Authenticated users can read employee data.
    Only HR staff can create or modify records.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.is_staff
            or request.user.groups.filter(name="HR").exists()
        )


class IsHRStaff(BasePermission):
    """
    Restrict sensitive operations to HR staff.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.groups.filter(name="HR").exists()
            )
        )
