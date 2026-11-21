from decimal import Decimal, InvalidOperation

from django.utils.dateparse import parse_date
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from rooms.models import Room
from users.permissions import IsStaffRole, IsStaffOrReadOnly, get_role
from .models import Booking, Service, BookingService, Payment
from .serializers import BookingSerializer, ServiceSerializer
from .utils import build_invoice, price_breakdown

# Staff kon status theke kon status e jete pare
ALLOWED_TRANSITIONS = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['checked_in', 'cancelled'],
    'checked_in': ['checked_out'],
}


class ServiceViewSet(viewsets.ModelViewSet):
    """Extra service list (Breakfast, Laundry...). Staff add/edit kore."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsStaffOrReadOnly]


class PriceQuoteView(APIView):
    """GET /api/price-quote/?room=1&check_in=2026-12-20&check_out=2026-12-22"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            room = Room.objects.select_related('room_type').get(
                id=request.query_params.get('room'))
        except (Room.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Thik room id dao'}, status=400)

        check_in = parse_date(request.query_params.get('check_in', ''))
        check_out = parse_date(request.query_params.get('check_out', ''))

        if not check_in or not check_out or check_out <= check_in:
            return Response({'error': 'Thik check_in ar check_out dao (YYYY-MM-DD)'}, status=400)

        nights, total = price_breakdown(room, check_in, check_out)
        return Response({
            'room': room.room_number,
            'room_type': room.room_type.name,
            'base_price': room.room_type.base_price,
            'nights': nights,
            'total': total,
        })


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # edit/delete nai

    def get_queryset(self):
        qs = Booking.objects.select_related('room', 'guest').order_by('-created_at')
        if get_role(self.request.user) in ('admin', 'receptionist'):
            return qs                              # staff shob dekhe
        return qs.filter(guest=self.request.user)  # guest shudhu nijer

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ('pending', 'confirmed'):
            return Response({'error': f'{booking.status} booking cancel kora jay na'}, status=400)
        booking.status = 'cancelled'
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'], url_path='set-status',
            permission_classes=[IsStaffRole])
    def set_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('status')
        allowed = ALLOWED_TRANSITIONS.get(booking.status, [])

        if new_status not in allowed:
            return Response(
                {'error': f'{booking.status} theke {new_status} e jawa jay na. Allowed: {allowed}'},
                status=400)

        # Check-out er age shob bill clear thakte hobe
        if new_status == 'checked_out':
            due = build_invoice(booking)['due']
            if due > 0:
                return Response({'error': f'Check-out er age {due} taka due clear korte hobe'},
                                status=400)

        booking.status = new_status
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'], url_path='add-service',
            permission_classes=[IsStaffRole])
    def add_service(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ('cancelled', 'checked_out'):
            return Response({'error': f'{booking.status} booking e service add kora jay na'},
                            status=400)
        try:
            service = Service.objects.get(id=request.data.get('service'))
            quantity = int(request.data.get('quantity', 1))
        except (Service.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Thik service id ar quantity dao'}, status=400)

        if quantity < 1:
            return Response({'error': 'Quantity 1 ba tar beshi hote hobe'}, status=400)

        BookingService.objects.create(booking=booking, service=service, quantity=quantity)
        return Response(build_invoice(booking))

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        return Response(build_invoice(self.get_object()))

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'cancelled':
            return Response({'error': 'Cancelled booking e payment hoy na'}, status=400)

        try:
            amount = Decimal(str(request.data.get('amount')))
        except InvalidOperation:
            return Response({'error': 'Thik amount dao'}, status=400)

        method = request.data.get('method', 'cash')
        if method not in ('cash', 'card', 'mobile'):
            return Response({'error': 'method: cash / card / mobile'}, status=400)

        due = build_invoice(booking)['due']
        if amount <= 0:
            return Response({'error': 'Amount 0 er beshi hote hobe'}, status=400)
        if amount > due:
            return Response({'error': f'Maximum {due} taka dewa jay (due)'}, status=400)

        Payment.objects.create(booking=booking, amount=amount, method=method)

        # Prothom payment hole pending booking auto confirm
        if booking.status == 'pending':
            booking.status = 'confirmed'
            booking.save()

        return Response(build_invoice(booking))

# ---------- Dashboard statistics (staff only) ----------
from django.db.models import Sum
from django.utils import timezone


class StatsView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        today = timezone.localdate()
        by_status = {key: Booking.objects.filter(status=key).count()
                     for key, _ in Booking.STATUS}
        revenue = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'total_rooms': Room.objects.count(),
            'total_bookings': Booking.objects.count(),
            'by_status': by_status,
            'occupied_now': by_status['checked_in'],
            'arrivals_today': Booking.objects.filter(
                check_in=today, status__in=['pending', 'confirmed']).count(),
            'departures_today': Booking.objects.filter(
                check_out=today, status='checked_in').count(),
            'revenue': revenue,
        })
