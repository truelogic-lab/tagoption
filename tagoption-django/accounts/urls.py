from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup", views.signup),
    path("auth/login", views.login),
    path("auth/refresh", views.refresh),
    path("auth/me", views.me),

    path("notifications", views.notifications_list),
    path("notifications/unread-count", views.notifications_unread_count),
    path("notifications/<str:notification_id>/read", views.notification_mark_read),
    path("notifications/read-all", views.notifications_mark_all_read),
    path("notifications/clear", views.notifications_clear),
]
