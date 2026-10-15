from django.contrib import admin

from .models import Deposit, PesapalConfig


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount_cents", "currency", "status", "order_tracking_id", "at")
    list_filter = ("status", "currency")
    search_fields = ("id", "reference", "order_tracking_id", "user__email")
    readonly_fields = ("id", "at", "credited_at", "last_status_payload")


@admin.register(PesapalConfig)
class PesapalConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "ipn_id", "ipn_url", "registered_at")
