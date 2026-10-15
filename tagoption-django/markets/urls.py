from django.urls import path

from . import views

urlpatterns = [
    path("markets", views.markets_list),
    path("markets/<str:market_id>/price", views.market_tick),
]
