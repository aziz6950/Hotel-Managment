from datetime import date
from rest_framework import serializers

from .models import Booking, Service
from .utils import is_room_free, calculate_price


class BookingSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.username', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'guest', 'guest_name', 'room', 'room_number',
                  'check_in', 'check_out', 'guests_count',
                  'status', 'total_price', 'created_at']
        read_only_fields = ['guest', 'status', 'total_price', 'created_at']

    def validate(self, data):
        check_in = data['check_in']
        check_out = data['check_out']
        room = data['room']

        if check_in < date.today():
            raise serializers.ValidationError('Check-in date ager tarikh hote pare na')
        if check_out <= check_in:
            raise serializers.ValidationError('Check-out date check-in er pore hote hobe')
        if room.status != 'available':
            raise serializers.ValidationError('Ei room ekhon maintenance e ache')
        if data.get('guests_count', 1) > room.room_type.capacity:
            raise serializers.ValidationError(
                f'Ei room e maximum {room.room_type.capacity} jon thakte pare')
        if not is_room_free(room, check_in, check_out):
            raise serializers.ValidationError('Ei date e room ta already booked')

        return data

    def create(self, validated_data):
        validated_data['guest'] = self.context['request'].user
        validated_data['total_price'] = calculate_price(
            validated_data['room'], validated_data['check_in'], validated_data['check_out'])
        return super().create(validated_data)
    
class ServiceSerializer(serializers.ModelSerializer):
   class Meta:
        model = Service
        fields = '__all__'