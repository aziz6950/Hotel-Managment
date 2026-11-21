from django.contrib.auth.models import User
from django.db import models


class Feedback(models.Model):
    """Guest er review, shudhu check-out er por, ek booking e ekbar"""
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE,
                                   related_name='feedback')
    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.PositiveSmallIntegerField()          # 1 - 5
    comment = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)        # staff hide korte pare
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.guest.username}: {self.rating}/5"


class GuestNote(models.Model):
    """Staff er private note (guest dekhte pay na)"""
    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name='crm_notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                               related_name='written_notes')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note on {self.guest.username}"
