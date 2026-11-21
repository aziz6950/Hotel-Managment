from django.db.models import Sum

from bookings.models import Booking, Payment

# (tier, minimum completed stays)
TIERS = [('Platinum', 10), ('Gold', 5), ('Silver', 3), ('Bronze', 0)]


def loyalty_tier(stays):
    for name, minimum in TIERS:
        if stays >= minimum:
            return name


def next_tier(stays):
    """Porer tier ar koyta stay lagbe. Platinum hole None."""
    for name, minimum in reversed(TIERS):
        if stays < minimum:
            return {'name': name, 'stays_needed': minimum - stays}
    return None


def guest_stats(user):
    bookings = Booking.objects.filter(guest=user)
    stays = bookings.filter(status='checked_out').count()
    spent = Payment.objects.filter(booking__guest=user).aggregate(t=Sum('amount'))['t'] or 0
    return {
        'total_bookings': bookings.count(),
        'completed_stays': stays,
        'total_spent': spent,
        'tier': loyalty_tier(stays),
        'next_tier': next_tier(stays),
    }
