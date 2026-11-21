from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_role(user):
    """User er role return kore: admin / receptionist / guest"""
    if not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'admin'
    profile = getattr(user, 'profile', None)
    return profile.role if profile else 'guest'


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'admin'


class IsStaffRole(BasePermission):
    """Admin ba Receptionist"""
    def has_permission(self, request, view):
        return get_role(request.user) in ('admin', 'receptionist')


class IsStaffOrReadOnly(BasePermission):
    """Sobai dekhte pare, shudhu staff add/edit/delete korte pare"""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return get_role(request.user) in ('admin', 'receptionist')