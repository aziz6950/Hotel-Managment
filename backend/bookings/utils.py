from datetime import timedelta
from decimal import Decimal

from .models import Booking

# Ei status er booking gulo room ke "booked" hishebe dhore na
INACTIVE_STATUSES = ['cancelled', 'checked_out']

# ---- Dynamic pricing rules (ekhane change korlei price change hobe) ----
WEEKEND_DAYS = (4, 5)            # Friday=4, Saturday=5 (Bangladesh weekend)
WEEKEND_EXTRA = Decimal('0.20')  # weekend e +20%
PEAK_MONTHS = (12, 1)            # December, January
PEAK_EXTRA = Decimal('0.30')     # peak season e +30%
VAT_RATE = Decimal('0.15')       # 15% VAT


def overlapping_bookings(check_in, check_out):
    """Ei date range er shathe overlap kore emon shob booking"""
    return Booking.objects.filter(
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exclude(status__in=INACTIVE_STATUSES)


def booked_room_ids(check_in, check_out):
    return overlapping_bookings(check_in, check_out).values_list('room_id', flat=True)


def is_room_free(room, check_in, check_out):
    return not overlapping_bookings(check_in, check_out).filter(room=room).exists()


def night_price(room, night):
    """Ek raat er price. Weekend ar peak season e extra charge."""
    extra = Decimal('0')
    reasons = []

    if night.weekday() in WEEKEND_DAYS:
        extra += WEEKEND_EXTRA
        reasons.append('weekend +20%')
    if night.month in PEAK_MONTHS:
        extra += PEAK_EXTRA
        reasons.append('peak season +30%')

    price = (room.room_type.base_price * (1 + extra)).quantize(Decimal('0.01'))
    return price, reasons


def price_breakdown(room, check_in, check_out):
    """Prottek raat er price ar total return kore"""
    nights = []
    total = Decimal('0')
    night = check_in

    while night < check_out:
        price, reasons = night_price(room, night)
        nights.append({
            'date': str(night),
            'price': price,
            'note': ', '.join(reasons) or 'normal',
        })
        total += price
        night += timedelta(days=1)

    return nights, total


def calculate_price(room, check_in, check_out):
    return price_breakdown(room, check_in, check_out)[1]


def build_invoice(booking):
    """Booking er pura bill: room + extra service + VAT - payment"""
    extras = []
    services_total = Decimal('0')

    for item in booking.services.select_related('service'):
        line_total = item.service.price * item.quantity
        services_total += line_total
        extras.append({
            'service': item.service.name,
            'price': item.service.price,
            'quantity': item.quantity,
            'total': line_total,
        })

    room_total = booking.total_price
    subtotal = room_total + services_total
    vat = (subtotal * VAT_RATE).quantize(Decimal('0.01'))
    grand_total = subtotal + vat
    paid = sum((p.amount for p in booking.payments.all()), Decimal('0'))

    return {
        'booking_id': booking.id,
        'guest': booking.guest.username,
        'room': booking.room.room_number,
        'check_in': booking.check_in,
        'check_out': booking.check_out,
        'status': booking.status,
        'nights': (booking.check_out - booking.check_in).days,
        'room_total': room_total,
        'extra_services': extras,
        'services_total': services_total,
        'subtotal': subtotal,
        'vat': vat,
        'grand_total': grand_total,
        'paid': paid,
        'due': grand_total - paid,
    }