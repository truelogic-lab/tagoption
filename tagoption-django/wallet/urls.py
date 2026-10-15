from django.urls import path
from . import views

urlpatterns = [
    path("wallet/balance", views.balance),
    path("wallet/history", views.history),
]
