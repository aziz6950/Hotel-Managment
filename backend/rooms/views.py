from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_date

from users.permissions import IsStaffOrReadOnly
from bookings.utils import booked_room_ids
from .models import RoomType, Room
from .serializers import RoomTypeSerializer, RoomSerializer


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer
    permission_classes = [IsStaffOrReadOnly]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('room_type').all()
    serializer_class = RoomSerializer
    permission_classes = [IsStaffOrReadOnly]


class AvailableRoomsView(APIView):
    """GET /api/rooms/available/?check_in=2026-12-10&check_out=2026-12-13&guests=2"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        check_in = parse_date(request.query_params.get('check_in', ''))
        check_out = parse_date(request.query_params.get('check_out', ''))

        if not check_in or not check_out:
            return Response({'error': 'check_in ar check_out dite hobe (YYYY-MM-DD)'}, status=400)
        if check_out <= check_in:
            return Response({'error': 'check_out must be after check_in'}, status=400)

        try:
            guests = int(request.query_params.get('guests', 1))
        except ValueError:
            guests = 1

        rooms = (Room.objects
                 .filter(status='available', room_type__capacity__gte=guests)
                 .exclude(id__in=booked_room_ids(check_in, check_out))
                 .select_related('room_type'))

        return Response(RoomSerializer(rooms, many=True).data)