from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient

from rooms.models import RoomType, Room
from users.models import Profile
from .models import Booking, Service, BookingService, Payment
from .utils import night_price, calculate_price, is_room_free, build_invoice


def make_user(username, role='guest'):
    user = User.objects.create_user(username=username, password='Test@12345')
    Profile.objects.create(user=user, role=role)
    return user


class BaseTestCase(APITestCase):
    """Shob test er common setup: user, room, date"""

    def setUp(self):
        self.guest = make_user('guest1')
        self.guest2 = make_user('guest2')
        self.staff = make_user('reception1', role='receptionist')

        self.rtype = RoomType.objects.create(
            name='Single', base_price=Decimal('2000.00'), capacity=2)
        self.room = Room.objects.create(room_number='101', room_type=self.rtype)
        self.room2 = Room.objects.create(room_number='102', room_type=self.rtype)

        self.checkin = date.today() + timedelta(days=10)
        self.checkout = self.checkin + timedelta(days=2)

    def as_user(self, user):
        self.client.force_authenticate(user=user)

    def book(self, room=None, check_in=None, check_out=None, guests=1):
        return self.client.post('/api/bookings/', {
            'room': (room or self.room).id,
            'check_in': str(check_in or self.checkin),
            'check_out': str(check_out or self.checkout),
            'guests_count': guests,
        }, format='json')


# ======================= UNIT TESTS =======================

class PricingUnitTests(BaseTestCase):
    def test_normal_night_price(self):
        price, notes = night_price(self.room, date(2027, 3, 3))  # Wednesday
        self.assertEqual(price, Decimal('2000.00'))
        self.assertEqual(notes, [])

    def test_weekend_night_price(self):
        price, _ = night_price(self.room, date(2027, 3, 5))  # Friday
        self.assertEqual(price, Decimal('2400.00'))

    def test_peak_season_price(self):
        price, _ = night_price(self.room, date(2026, 12, 10))  # Thursday, December
        self.assertEqual(price, Decimal('2600.00'))

    def test_peak_and_weekend_price(self):
        price, _ = night_price(self.room, date(2026, 12, 11))  # Friday, December
        self.assertEqual(price, Decimal('3000.00'))

    def test_total_for_three_nights(self):
        total = calculate_price(self.room, date(2026, 12, 10), date(2026, 12, 13))
        self.assertEqual(total, Decimal('8600.00'))  # 2600 + 3000 + 3000


class OverlapUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        Booking.objects.create(
            guest=self.guest, room=self.room,
            check_in=date(2027, 3, 10), check_out=date(2027, 3, 13),
            status='confirmed')

    def test_same_dates_overlap(self):
        self.assertFalse(is_room_free(self.room, date(2027, 3, 10), date(2027, 3, 13)))

    def test_partial_overlap(self):
        self.assertFalse(is_room_free(self.room, date(2027, 3, 12), date(2027, 3, 15)))

    def test_back_to_back_is_allowed(self):
        # Ekjon 13 e check-out korle onno jon 13 e check-in korte pare
        self.assertTrue(is_room_free(self.room, date(2027, 3, 13), date(2027, 3, 15)))

    def test_dates_before_is_allowed(self):
        self.assertTrue(is_room_free(self.room, date(2027, 3, 8), date(2027, 3, 10)))

    def test_other_room_is_free(self):
        self.assertTrue(is_room_free(self.room2, date(2027, 3, 10), date(2027, 3, 13)))

    def test_cancelled_booking_does_not_block(self):
        Booking.objects.all().update(status='cancelled')
        self.assertTrue(is_room_free(self.room, date(2027, 3, 10), date(2027, 3, 13)))


class InvoiceUnitTests(BaseTestCase):
    def test_invoice_with_service_and_payment(self):
        booking = Booking.objects.create(
            guest=self.guest, room=self.room,
            check_in=date(2027, 3, 3), check_out=date(2027, 3, 5),
            total_price=Decimal('4000.00'))
        service = Service.objects.create(name='Breakfast', price=Decimal('300.00'))
        BookingService.objects.create(booking=booking, service=service, quantity=2)
        Payment.objects.create(booking=booking, amount=Decimal('1000.00'))

        inv = build_invoice(booking)

        self.assertEqual(inv['room_total'], Decimal('4000.00'))
        self.assertEqual(inv['services_total'], Decimal('600.00'))
        self.assertEqual(inv['subtotal'], Decimal('4600.00'))
        self.assertEqual(inv['vat'], Decimal('690.00'))          # 15%
        self.assertEqual(inv['grand_total'], Decimal('5290.00'))
        self.assertEqual(inv['paid'], Decimal('1000.00'))
        self.assertEqual(inv['due'], Decimal('4290.00'))


# ===================== INTEGRATION TESTS =====================

class BookingAPITests(BaseTestCase):
    def test_guest_can_create_booking(self):
        self.as_user(self.guest)
        res = self.book()
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['status'], 'pending')
        self.assertEqual(Booking.objects.count(), 1)

    def test_booking_requires_login(self):
        res = self.book()
        self.assertEqual(res.status_code, 401)

    def test_double_booking_rejected(self):
        self.as_user(self.guest)
        self.book()
        self.as_user(self.guest2)
        res = self.book()
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Booking.objects.count(), 1)

    def test_overlapping_dates_rejected(self):
        self.as_user(self.guest)
        self.book()
        res = self.book(check_in=self.checkin + timedelta(days=1),
                        check_out=self.checkout + timedelta(days=2))
        self.assertEqual(res.status_code, 400)

    def test_past_date_rejected(self):
        self.as_user(self.guest)
        res = self.book(check_in=date.today() - timedelta(days=1),
                        check_out=date.today() + timedelta(days=1))
        self.assertEqual(res.status_code, 400)

    def test_checkout_before_checkin_rejected(self):
        self.as_user(self.guest)
        res = self.book(check_in=self.checkout, check_out=self.checkin)
        self.assertEqual(res.status_code, 400)

    def test_too_many_guests_rejected(self):
        self.as_user(self.guest)
        res = self.book(guests=5)
        self.assertEqual(res.status_code, 400)

    def test_cancelled_booking_frees_room(self):
        self.as_user(self.guest)
        first = self.book()
        self.client.post(f'/api/bookings/{first.data["id"]}/cancel/')
        res = self.book()
        self.assertEqual(res.status_code, 201)

    def test_guest_sees_only_own_bookings(self):
        self.as_user(self.guest)
        self.book()
        self.as_user(self.guest2)
        res = self.client.get('/api/bookings/')
        self.assertEqual(len(res.data), 0)

    def test_staff_sees_all_bookings(self):
        self.as_user(self.guest)
        self.book()
        self.as_user(self.staff)
        res = self.client.get('/api/bookings/')
        self.assertEqual(len(res.data), 1)

    def test_available_rooms_excludes_booked(self):
        self.as_user(self.guest)
        self.book()
        res = self.client.get('/api/rooms/available/', {
            'check_in': str(self.checkin),
            'check_out': str(self.checkout),
            'guests': 2,
        })
        numbers = [r['room_number'] for r in res.data]
        self.assertNotIn('101', numbers)
        self.assertIn('102', numbers)

    def test_available_rooms_requires_dates(self):
        res = self.client.get('/api/rooms/available/')
        self.assertEqual(res.status_code, 400)


class PaymentAndStatusTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.as_user(self.guest)
        self.booking_id = self.book().data['id']

    def pay(self, amount, method='cash'):
        return self.client.post(
            f'/api/bookings/{self.booking_id}/pay/',
            {'amount': str(amount), 'method': method}, format='json')

    def set_status(self, status):
        return self.client.post(
            f'/api/bookings/{self.booking_id}/set-status/',
            {'status': status}, format='json')

    def test_first_payment_confirms_booking(self):
        res = self.pay(100)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Booking.objects.get(id=self.booking_id).status, 'confirmed')

    def test_cannot_overpay(self):
        res = self.pay(10 ** 7)
        self.assertEqual(res.status_code, 400)

    def test_invalid_payment_method_rejected(self):
        res = self.pay(100, method='bitcoin')
        self.assertEqual(res.status_code, 400)

    def test_guest_cannot_change_status(self):
        res = self.set_status('confirmed')
        self.assertEqual(res.status_code, 403)

    def test_guest_cannot_add_service(self):
        service = Service.objects.create(name='Breakfast', price=Decimal('300.00'))
        res = self.client.post(
            f'/api/bookings/{self.booking_id}/add-service/',
            {'service': service.id, 'quantity': 1}, format='json')
        self.assertEqual(res.status_code, 403)

    def test_staff_can_add_service(self):
        service = Service.objects.create(name='Breakfast', price=Decimal('300.00'))
        self.as_user(self.staff)
        res = self.client.post(
            f'/api/bookings/{self.booking_id}/add-service/',
            {'service': service.id, 'quantity': 2}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['services_total'], Decimal('600.00'))

    def test_invalid_status_jump_rejected(self):
        self.as_user(self.staff)
        res = self.set_status('checked_out')  # pending theke direct checked_out hoy na
        self.assertEqual(res.status_code, 400)

    def test_checkout_blocked_when_due(self):
        self.as_user(self.staff)
        self.set_status('confirmed')
        self.set_status('checked_in')
        res = self.set_status('checked_out')
        self.assertEqual(res.status_code, 400)
        self.assertIn('due', res.data['error'])

    def test_checkout_after_full_payment(self):
        due = self.client.get(f'/api/bookings/{self.booking_id}/invoice/').data['due']
        self.pay(due)
        self.as_user(self.staff)
        self.assertEqual(self.set_status('checked_in').status_code, 200)
        self.assertEqual(self.set_status('checked_out').status_code, 200)


class PriceQuoteAPITests(BaseTestCase):
    def test_price_quote(self):
        res = self.client.get('/api/price-quote/', {
            'room': self.room.id,
            'check_in': '2026-12-10',
            'check_out': '2026-12-13',
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total'], Decimal('8600.00'))
        self.assertEqual(len(res.data['nights']), 3)

    def test_price_quote_invalid_room(self):
        res = self.client.get('/api/price-quote/', {
            'room': 9999,
            'check_in': '2026-12-10',
            'check_out': '2026-12-13',
        })
        self.assertEqual(res.status_code, 400)


# ======================== SYSTEM TEST ========================

class SystemTest(APITestCase):
    """End-to-end: register -> login -> search -> book -> pay -> stay -> check-out"""

    def test_complete_hotel_stay(self):
        rtype = RoomType.objects.create(
            name='Suite', base_price=Decimal('6000.00'), capacity=2)
        room = Room.objects.create(room_number='201', room_type=rtype)
        service = Service.objects.create(name='Breakfast', price=Decimal('300.00'))
        staff = make_user('reception1', role='receptionist')

        check_in = date.today() + timedelta(days=30)
        check_out = check_in + timedelta(days=2)
        dates = {'check_in': str(check_in), 'check_out': str(check_out), 'guests': 2}

        # 1. Guest register + login
        guest = APIClient()
        res = guest.post('/api/auth/register/', {
            'username': 'journey_guest', 'email': 'j@test.com',
            'password': 'Hotel@12345', 'phone': '01700000000',
        }, format='json')
        self.assertEqual(res.status_code, 201)

        res = guest.post('/api/auth/login/', {
            'username': 'journey_guest', 'password': 'Hotel@12345',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        guest.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

        # 2. Room search
        res = guest.get('/api/rooms/available/', dates)
        self.assertEqual([r['room_number'] for r in res.data], ['201'])

        # 3. Booking
        res = guest.post('/api/bookings/', {
            'room': room.id, 'check_in': str(check_in),
            'check_out': str(check_out), 'guests_count': 2,
        }, format='json')
        self.assertEqual(res.status_code, 201)
        booking_id = res.data['id']

        # 4. Staff extra service add kore
        staff_client = APIClient()
        staff_client.force_authenticate(user=staff)
        res = staff_client.post(
            f'/api/bookings/{booking_id}/add-service/',
            {'service': service.id, 'quantity': 2}, format='json')
        self.assertEqual(res.status_code, 200)

        # 5. Guest full payment kore
        invoice = guest.get(f'/api/bookings/{booking_id}/invoice/').data
        self.assertGreater(invoice['due'], 0)
        res = guest.post(
            f'/api/bookings/{booking_id}/pay/',
            {'amount': str(invoice['due']), 'method': 'card'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['due'], 0)

        # 6. Check-in ar check-out
        for status in ('checked_in', 'checked_out'):
            res = staff_client.post(
                f'/api/bookings/{booking_id}/set-status/',
                {'status': status}, format='json')
            self.assertEqual(res.status_code, 200)
        self.assertEqual(Booking.objects.get(id=booking_id).status, 'checked_out')

        # 7. Room abar available
        res = guest.get('/api/rooms/available/', dates)
        self.assertEqual(len(res.data), 1)


class StatsAPITests(BaseTestCase):
    def test_stats_is_staff_only(self):
        self.as_user(self.guest)
        self.assertEqual(self.client.get('/api/stats/').status_code, 403)

        self.as_user(self.staff)
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_rooms'], 2)
