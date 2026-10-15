from django.urls import path

from . import views

urlpatterns = [
    path("payments/deposit", views.start_deposit),
    path("payments/status/<str:order_tracking_id>", views.status),
    path("payments/ipn", views.ipn),
    path("payments/callback", views.callback),
]
