from django.urls import path

from . import views

urlpatterns = [
    path("fx/usd-kes", views.usd_kes),
]
