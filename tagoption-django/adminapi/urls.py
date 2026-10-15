from django.urls import path

from . import views

urlpatterns = [
    path("admin/users", views.users_list),
    path("admin/users/<str:user_id>", views.user_detail),
    path("admin/users/<str:user_id>/win-rate", views.set_win_rate),
    path("admin/users/<str:user_id>/ban", views.set_banned),
    path("admin/users/<str:user_id>/deposit", views.manual_deposit),

    path("admin/trades", views.trades_list),
    path("admin/trades/<str:trade_id>/settle", views.force_settle),

    path("admin/transactions", views.transactions_list),

    path("admin/withdrawals", views.withdrawals_list),
    path("admin/withdrawals/<str:withdrawal_id>/review", views.withdrawal_review),

    path("admin/audit", views.audit_list),
    path("admin/metrics", views.metrics),
    path("admin/search", views.search),
]
