
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


def is_hr_user(user):
    return (
        user.is_authenticated
        and (
            user.is_staff
            or user.groups.filter(name="HR").exists()
        )
    )


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set."})


@require_POST
def login_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"detail": "Invalid JSON."},
            status=400,
        )

    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse(
            {"detail": "Username and password are required."},
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"detail": "Invalid credentials."},
            status=400,
        )

    if not is_hr_user(user):
        return JsonResponse(
            {"detail": "HR access is required."},
            status=403,
        )

    login(request, user)

    return JsonResponse({
        "id": user.id,
        "username": user.get_username(),
        "is_hr": True,
    })


@require_GET
def me_view(request):
    if not is_hr_user(request.user):
        return JsonResponse(
            {"detail": "Authentication required."},
            status=401,
        )

    return JsonResponse({
        "id": request.user.id,
        "username": request.user.get_username(),
        "is_hr": True,
    })


@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Logged out."})
