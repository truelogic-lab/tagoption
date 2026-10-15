from django.urls import path

from . import views

urlpatterns = [
    path("trades", views.trades_collection),
    path("trades/history", views.trades_history),
    path("trades/<str:trade_id>/settle", views.settle),
    path("trades/auto/start", views.auto_start),
    path("trades/auto/stop", views.auto_stop),
    path("trades/auto/status", views.auto_status),
]
