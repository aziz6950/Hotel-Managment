from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APITestCase

from bookings.models import Booking, Payment
from rooms.models import Room, RoomType
from users.models import Profile
from .models import Feedback, GuestNote
from .utils import loyalty_tier, next_tier


def make_user(username, role='guest', **extra):
    user = User.objects.create_user(username=username, password='Test@12345', **extra)
    Profile.objects.create(user=user, role=role)
    return user


class LoyaltyTierTests(TestCase):
    def test_tiers(self):
        self.assertEqual(loyalty_tier(0), 'Bronze')
        self.assertEqual(loyalty_tier(2), 'Bronze')
        self.assertEqual(loyalty_tier(3), 'Silver')
        self.assertEqual(loyalty_tier(5), 'Gold')
        self.assertEqual(loyalty_tier(10), 'Platinum')

    def test_next_tier(self):
        self.assertEqual(next_tier(0), {'name': 'Silver', 'stays_needed': 3})
        self.assertEqual(next_tier(4), {'name': 'Gold', 'stays_needed': 1})
        self.assertIsNone(next_tier(10))


class CRMBase(APITestCase):
    def setUp(self):
        self.guest = make_user('guest1', email='g1@test.com')
        self.guest2 = make_user('guest2')
        self.staff = make_user('reception1', role='receptionist')
        rtype = RoomType.objects.create(name='Single', base_price=Decimal('2000.00'), capacity=2)
        self.room = Room.objects.create(room_number='101', room_type=rtype)

    def stay(self, guest, status='checked_out', day=1):
        return Booking.objects.create(
            guest=guest, room=self.room, check_in=date(2027, 3, day),
            check_out=date(2027, 3, day + 1), status=status, total_price=Decimal('2000.00'))

    def as_user(self, user):
        self.client.force_authenticate(user=user)


class ProfileTests(CRMBase):
    def test_requires_login(self):
        self.assertEqual(self.client.get('/api/crm/me/').status_code, 401)

    def test_profile_with_stats(self):
        self.stay(self.guest)
        self.stay(self.guest, status='pending', day=5)
        self.as_user(self.guest)
        res = self.client.get('/api/crm/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_bookings'], 2)
        self.assertEqual(res.data['completed_stays'], 1)
        self.assertEqual(res.data['tier'], 'Bronze')

    def test_update_profile(self):
        self.as_user(self.guest)
        res = self.client.patch('/api/crm/me/', {
            'first_name': 'Rafiq', 'phone': '01711111111', 'address': 'Dhaka'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['first_name'], 'Rafiq')
        self.assertEqual(Profile.objects.get(user=self.guest).phone, '01711111111')

    def test_invalid_email_rejected(self):
        self.as_user(self.guest)
        res = self.client.patch('/api/crm/me/', {'email': 'not-an-email'}, format='json')
        self.assertEqual(res.status_code, 400)


class GuestDirectoryTests(CRMBase):
    def test_guest_cannot_view_directory(self):
        self.as_user(self.guest)
        self.assertEqual(self.client.get('/api/crm/guests/').status_code, 403)

    def test_staff_sees_only_guests(self):
        self.as_user(self.staff)
        res = self.client.get('/api/crm/guests/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual({g['username'] for g in res.data}, {'guest1', 'guest2'})

    def test_search(self):
        self.as_user(self.staff)
        res = self.client.get('/api/crm/guests/', {'search': 'guest1'})
        self.assertEqual(len(res.data), 1)

    def test_stats_in_directory(self):
        booking = self.stay(self.guest)
        Payment.objects.create(booking=booking, amount=Decimal('500.00'), method='cash')
        self.as_user(self.staff)
        res = self.client.get('/api/crm/guests/')
        row = next(g for g in res.data if g['username'] == 'guest1')
        self.assertEqual(row['completed_stays'], 1)
        self.assertEqual(row['total_spent'], Decimal('500.00'))


class GuestDetailTests(CRMBase):
    def test_staff_can_view_detail(self):
        self.stay(self.guest)
        self.as_user(self.staff)
        res = self.client.get(f'/api/crm/guests/{self.guest.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['username'], 'guest1')
        self.assertEqual(len(res.data['bookings']), 1)

    def test_guest_cannot_view_detail(self):
        self.as_user(self.guest)
        self.assertEqual(self.client.get(f'/api/crm/guests/{self.guest2.id}/').status_code, 403)

    def test_staff_member_is_not_a_guest(self):
        self.as_user(self.staff)
        self.assertEqual(self.client.get(f'/api/crm/guests/{self.staff.id}/').status_code, 404)

    def test_add_note(self):
        self.as_user(self.staff)
        res = self.client.post(f'/api/crm/guests/{self.guest.id}/notes/',
                               {'text': 'Prefers a quiet room'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(GuestNote.objects.count(), 1)
        detail = self.client.get(f'/api/crm/guests/{self.guest.id}/')
        self.assertEqual(detail.data['notes'][0]['text'], 'Prefers a quiet room')

    def test_empty_note_rejected(self):
        self.as_user(self.staff)
        res = self.client.post(f'/api/crm/guests/{self.guest.id}/notes/',
                               {'text': '  '}, format='json')
        self.assertEqual(res.status_code, 400)


class FeedbackTests(CRMBase):
    def post_feedback(self, booking, rating=5, comment='Great stay'):
        return self.client.post('/api/crm/feedback/', {
            'booking': booking.id, 'rating': rating, 'comment': comment}, format='json')

    def test_feedback_after_checkout(self):
        booking = self.stay(self.guest)
        self.as_user(self.guest)
        self.assertEqual(self.post_feedback(booking).status_code, 201)
        self.assertEqual(Feedback.objects.count(), 1)

    def test_feedback_before_checkout_rejected(self):
        booking = self.stay(self.guest, status='confirmed')
        self.as_user(self.guest)
        self.assertEqual(self.post_feedback(booking).status_code, 400)

    def test_duplicate_feedback_rejected(self):
        booking = self.stay(self.guest)
        self.as_user(self.guest)
        self.post_feedback(booking)
        self.assertEqual(self.post_feedback(booking).status_code, 400)

    def test_invalid_rating_rejected(self):
        booking = self.stay(self.guest)
        self.as_user(self.guest)
        self.assertEqual(self.post_feedback(booking, rating=0).status_code, 400)
        self.assertEqual(self.post_feedback(booking, rating=6).status_code, 400)

    def test_cannot_review_someone_elses_stay(self):
        booking = self.stay(self.guest)
        self.as_user(self.guest2)
        self.assertEqual(self.post_feedback(booking).status_code, 400)

    def test_visibility_guest_vs_staff(self):
        b1 = self.stay(self.guest, day=1)
        b2 = self.stay(self.guest2, day=3)
        Feedback.objects.create(booking=b1, guest=self.guest, rating=5, comment='A')
        Feedback.objects.create(booking=b2, guest=self.guest2, rating=4, comment='B')

        self.as_user(self.guest)
        self.assertEqual(len(self.client.get('/api/crm/feedback/').data), 1)
        self.as_user(self.staff)
        self.assertEqual(len(self.client.get('/api/crm/feedback/').data), 2)


class PublicReviewTests(CRMBase):
    def setUp(self):
        super().setUp()
        b1 = self.stay(self.guest, day=1)
        b2 = self.stay(self.guest2, day=3)
        self.fb1 = Feedback.objects.create(booking=b1, guest=self.guest, rating=5, comment='Great')
        Feedback.objects.create(booking=b2, guest=self.guest2, rating=3, comment='Ok', is_public=False)

    def test_public_reviews_show_only_public(self):
        res = self.client.get('/api/crm/reviews/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['average'], 5.0)
        self.assertEqual(len(res.data['reviews']), 1)

    def test_staff_can_hide_review(self):
        self.as_user(self.staff)
        res = self.client.post(f'/api/crm/feedback/{self.fb1.id}/toggle/')
        self.assertEqual(res.status_code, 200)
        self.fb1.refresh_from_db()
        self.assertFalse(self.fb1.is_public)

    def test_guest_cannot_toggle(self):
        self.as_user(self.guest)
        res = self.client.post(f'/api/crm/feedback/{self.fb1.id}/toggle/')
        self.assertEqual(res.status_code, 403)
