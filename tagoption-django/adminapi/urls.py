from django.urls import path

from markets import admin_views as market_views

from . import views

urlpatterns = [
    path("admin/overview", views.overview),
    path("admin/pnl", views.pnl),
    path("admin/metrics", views.metrics),
    path("admin/platform-metrics", views.platform_metrics),

    path("admin/users", views.users_list),
    path("admin/users/<str:user_id>", views.user_detail),
    path("admin/users/<str:user_id>/win-rate", views.set_win_rate),
    path("admin/users/<str:user_id>/ban", views.set_banned),
    path("admin/users/<str:user_id>/adjust", views.adjust_user),
    path("admin/users/<str:user_id>/deposit", views.manual_deposit),

    path("admin/trades", views.trades_list),
    path("admin/trades/<str:trade_id>/settle", views.force_settle),

    path("admin/transactions", views.transactions_list),
    path("admin/transactions/<str:tx_id>/credit", views.credit_transaction),
    path("admin/transactions/<str:tx_id>/approve-withdraw", views.approve_withdraw),

    path("admin/withdrawals", views.withdrawals_list),
    path("admin/withdrawals/<str:withdrawal_id>/review", views.withdrawal_review),

    path("admin/markets", market_views.list_markets),
    path("admin/markets/<str:market_id>/toggle", market_views.toggle_market),
    path("admin/markets/<str:market_id>", market_views.edit_market),

    path("admin/audit", views.audit_list),
    path("admin/search", views.search),
]
