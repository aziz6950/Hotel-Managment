from django.urls import path

from .views import (MyProfileView, GuestListView, GuestDetailView, GuestNoteView,
                    FeedbackView, FeedbackToggleView, PublicReviewsView)

urlpatterns = [
    path('me/', MyProfileView.as_view()),
    path('guests/', GuestListView.as_view()),
    path('guests/<int:pk>/', GuestDetailView.as_view()),
    path('guests/<int:pk>/notes/', GuestNoteView.as_view()),
    path('feedback/', FeedbackView.as_view()),
    path('feedback/<int:pk>/toggle/', FeedbackToggleView.as_view()),
    path('reviews/', PublicReviewsView.as_view()),
]
