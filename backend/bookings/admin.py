from django.contrib import admin
from .models import Booking, Service, BookingService, Payment

admin.site.register(Booking)
admin.site.register(Service)
admin.site.register(BookingService)
admin.site.register(Payment)