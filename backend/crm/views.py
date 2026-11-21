from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Avg, Count, Max, Q, Sum
from django.http import Http404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking, Payment
from users.models import Profile
from users.permissions import IsStaffRole, get_role
from .models import Feedback, GuestNote
from .utils import guest_stats, loyalty_tier


def full_name(user):
    return f"{user.first_name} {user.last_name}".strip() or user.username


def public_name(user):
    if user.first_name:
        initial = f" {user.last_name[:1]}." if user.last_name else ''
        return f"{user.first_name}{initial}"
    return user.username


def feedback_dict(f):
    return {
        'id': f.id, 'booking': f.booking_id, 'room': f.booking.room.room_number,
        'guest': f.guest.username, 'guest_id': f.guest_id, 'guest_name': full_name(f.guest),
        'rating': f.rating, 'comment': f.comment, 'is_public': f.is_public,
        'created_at': f.created_at,
    }


def note_dict(n):
    return {'id': n.id, 'text': n.text,
            'author': n.author.username if n.author else 'Deleted user',
            'created_at': n.created_at}


def get_guest_or_404(pk):
    guest = User.objects.filter(pk=pk, is_superuser=False).select_related('profile').first()
    if not guest:
        raise Http404
    profile = getattr(guest, 'profile', None)
    if profile and profile.role in ('admin', 'receptionist'):
        raise Http404
    return guest


# ---------------- Guest: nijer profile ----------------

class MyProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _data(self, user):
        profile, _ = Profile.objects.get_or_create(user=user)
        return {
            'username': user.username, 'email': user.email,
            'first_name': user.first_name, 'last_name': user.last_name,
            'phone': profile.phone, 'address': profile.address,
            'role': get_role(user), 'member_since': user.date_joined.date(),
            **guest_stats(user),
        }

    def get(self, request):
        return Response(self._data(request.user))

    def patch(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)

        email = request.data.get('email')
        if email:
            try:
                validate_email(email)
            except ValidationError:
                return Response({'error': 'Invalid email address'}, status=400)

        for field in ('first_name', 'last_name', 'email'):
            if field in request.data:
                setattr(user, field, str(request.data[field]).strip())
        for field in ('phone', 'address'):
            if field in request.data:
                setattr(profile, field, str(request.data[field]).strip())
        user.save()
        profile.save()
        return Response(self._data(user))


# ---------------- Staff: guest directory ----------------

class GuestListView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        q = request.query_params.get('search', '').strip()
        guests = (User.objects.filter(is_superuser=False)
                  .exclude(profile__role__in=['admin', 'receptionist'])
                  .select_related('profile'))
        if q:
            guests = guests.filter(
                Q(username__icontains=q) | Q(email__icontains=q) |
                Q(first_name__icontains=q) | Q(last_name__icontains=q) |
                Q(profile__phone__icontains=q))

        guests = guests.annotate(
            total_bookings=Count('bookings', distinct=True),
            completed=Count('bookings', filter=Q(bookings__status='checked_out'), distinct=True),
            last_stay=Max('bookings__check_in'),
        ).order_by('-date_joined')

        spent = dict(Payment.objects.values_list('booking__guest_id').annotate(total=Sum('amount')))

        data = []
        for g in guests:
            profile = getattr(g, 'profile', None)
            data.append({
                'id': g.id, 'username': g.username, 'name': full_name(g), 'email': g.email,
                'phone': profile.phone if profile else '',
                'total_bookings': g.total_bookings, 'completed_stays': g.completed,
                'total_spent': spent.get(g.id, 0), 'last_stay': g.last_stay,
                'tier': loyalty_tier(g.completed), 'joined': g.date_joined.date(),
            })
        return Response(data)


class GuestDetailView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request, pk):
        guest = get_guest_or_404(pk)
        profile = getattr(guest, 'profile', None)
        bookings = Booking.objects.filter(guest=guest).select_related('room').order_by('-created_at')
        feedbacks = guest.feedbacks.select_related('booking__room', 'guest').order_by('-created_at')
        notes = guest.crm_notes.select_related('author').order_by('-created_at')

        return Response({
            'id': guest.id, 'username': guest.username, 'name': full_name(guest),
            'first_name': guest.first_name, 'last_name': guest.last_name, 'email': guest.email,
            'phone': profile.phone if profile else '', 'address': profile.address if profile else '',
            'joined': guest.date_joined.date(),
            **guest_stats(guest),
            'bookings': [{
                'id': b.id, 'room_number': b.room.room_number, 'check_in': b.check_in,
                'check_out': b.check_out, 'status': b.status, 'total_price': b.total_price,
            } for b in bookings],
            'feedback': [feedback_dict(f) for f in feedbacks],
            'notes': [note_dict(n) for n in notes],
        })


class GuestNoteView(APIView):
    permission_classes = [IsStaffRole]

    def post(self, request, pk):
        guest = get_guest_or_404(pk)
        text = str(request.data.get('text', '')).strip()
        if not text:
            return Response({'error': 'Note cannot be empty'}, status=400)
        note = GuestNote.objects.create(guest=guest, author=request.user, text=text[:1000])
        return Response(note_dict(note), status=201)


# ---------------- Feedback ----------------

class FeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Feedback.objects.select_related('guest', 'booking__room').order_by('-created_at')
        if get_role(request.user) not in ('admin', 'receptionist'):
            qs = qs.filter(guest=request.user)
        return Response([feedback_dict(f) for f in qs])

    def post(self, request):
        try:
            booking = Booking.objects.select_related('room').get(
                id=request.data.get('booking'), guest=request.user)
        except (Booking.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Booking not found'}, status=400)

        if booking.status != 'checked_out':
            return Response({'error': 'You can review a stay only after check-out'}, status=400)
        if Feedback.objects.filter(booking=booking).exists():
            return Response({'error': 'You have already reviewed this stay'}, status=400)

        try:
            rating = int(request.data.get('rating'))
        except (TypeError, ValueError):
            return Response({'error': 'Rating must be a number from 1 to 5'}, status=400)
        if not 1 <= rating <= 5:
            return Response({'error': 'Rating must be between 1 and 5'}, status=400)

        comment = str(request.data.get('comment', '')).strip()[:1000]
        fb = Feedback.objects.create(booking=booking, guest=request.user,
                                     rating=rating, comment=comment)
        return Response(feedback_dict(fb), status=201)


class FeedbackToggleView(APIView):
    """Staff review ke public/hide kore"""
    permission_classes = [IsStaffRole]

    def post(self, request, pk):
        try:
            fb = Feedback.objects.select_related('guest', 'booking__room').get(pk=pk)
        except Feedback.DoesNotExist:
            raise Http404
        fb.is_public = not fb.is_public
        fb.save()
        return Response(feedback_dict(fb))


class PublicReviewsView(APIView):
    """Homepage er jonno, login lagbe na"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        public = Feedback.objects.filter(is_public=True)
        agg = public.aggregate(avg=Avg('rating'), count=Count('id'))
        recent = (public.exclude(comment='')
                  .select_related('guest', 'booking__room').order_by('-created_at')[:6])
        return Response({
            'average': round(float(agg['avg']), 1) if agg['avg'] else None,
            'count': agg['count'],
            'reviews': [{
                'id': f.id, 'name': public_name(f.guest), 'rating': f.rating,
                'comment': f.comment, 'created_at': f.created_at,
            } for f in recent],
        })
