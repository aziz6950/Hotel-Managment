from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, ServiceViewSet, PriceQuoteView, StatsView

router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='booking')
router.register('services', ServiceViewSet)

urlpatterns = [
    path('price-quote/', PriceQuoteView.as_view()),
    path('stats/', StatsView.as_view()),
] + router.urls
