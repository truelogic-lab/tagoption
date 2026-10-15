from django.urls import path

from . import views

urlpatterns = [
    path("account/password", views.change_password),
    path("account/profile", views.update_profile),
    path("account/verification", views.verification_status),
    path("account/verification/submit", views.verification_submit),
    path("account/2fa/enable", views.enable_2fa),
    path("account/2fa/disable", views.disable_2fa),
    path("auth/logout", views.logout),
]
