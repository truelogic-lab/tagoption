from django.urls import path

from . import views

urlpatterns = [
    path("config", views.config),
    path("site-config", views.site_config),
    path("admin/config", views.admin_config),
    path("admin/site-config", views.admin_site_config),
]
