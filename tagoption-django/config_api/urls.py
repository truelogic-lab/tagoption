from django.urls import path

from . import views

urlpatterns = [
    path("config", views.config),
    path("admin/config", views.admin_config),
]
