from django.db import models


class RoomType(models.Model):
    name = models.CharField(max_length=50)          # Single, Double, Suite
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=8, decimal_places=2)
    capacity = models.PositiveIntegerField(default=2)

    def __str__(self):
        return self.name


class Room(models.Model):
    STATUS = [
        ('available', 'Available'),
        ('maintenance', 'Maintenance'),
    ]

    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')
    floor = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS, default='available')

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type.name})"