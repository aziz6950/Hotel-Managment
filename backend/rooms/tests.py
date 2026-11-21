from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from users.models import Profile
from .models import RoomType, Room


class RoomAPITests(APITestCase):
    def setUp(self):
        self.guest = User.objects.create_user('guest1', password='Test@12345')
        Profile.objects.create(user=self.guest, role='guest')
        self.staff = User.objects.create_user('reception1', password='Test@12345')
        Profile.objects.create(user=self.staff, role='receptionist')

        self.rtype = RoomType.objects.create(
            name='Single', base_price=Decimal('2000.00'), capacity=2)
        Room.objects.create(room_number='101', room_type=self.rtype)

        self.new_room = {
            'room_number': '301', 'room_type': self.rtype.id,
            'floor': 3, 'status': 'available',
        }

    def test_anyone_can_list_rooms(self):
        res = self.client.get('/api/rooms/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_anonymous_cannot_create_room(self):
        res = self.client.post('/api/rooms/', self.new_room, format='json')
        self.assertEqual(res.status_code, 401)

    def test_guest_cannot_create_room(self):
        self.client.force_authenticate(user=self.guest)
        res = self.client.post('/api/rooms/', self.new_room, format='json')
        self.assertEqual(res.status_code, 403)

    def test_staff_can_create_room(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.post('/api/rooms/', self.new_room, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Room.objects.count(), 2)
