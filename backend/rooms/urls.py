from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RoomTypeViewSet, RoomViewSet, AvailableRoomsView

router = DefaultRouter()
router.register('room-types', RoomTypeViewSet)
router.register('rooms', RoomViewSet)

urlpatterns = [
    # 'available' ta router er age thakte hobe, nahole rooms/<id> bhabe nibe
    path('rooms/available/', AvailableRoomsView.as_view()),
    path('', include(router.urls)),
]