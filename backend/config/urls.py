from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/', include('rooms.urls')),
    path('api/', include('bookings.urls')),
    # Baki shob URL React Router handle korbe
    re_path(r'^(?!api/|admin/|static/).*$', TemplateView.as_view(template_name='index.html')),
]
