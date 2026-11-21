from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    ROLES = [
        ('admin', 'Admin'),
        ('receptionist', 'Receptionist'),
        ('guest', 'Guest'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLES, default='guest')
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"