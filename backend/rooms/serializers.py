from rest_framework import serializers
from .models import RoomType, Room


class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='room_type.name', read_only=True)
    base_price = serializers.DecimalField(source='room_type.base_price',
                                          max_digits=8, decimal_places=2, read_only=True)
    capacity = serializers.IntegerField(source='room_type.capacity', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'room_type', 'type_name',
                  'base_price', 'capacity', 'floor', 'status']