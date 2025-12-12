from django.contrib import admin
from .models import Payment, Withdrawal

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'merchant', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['id', 'merchant__name']
    readonly_fields = ['id', 'created_at']

@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'currency', 'network', 'wallet_address_short', 'status', 'created_at']
    list_filter = ['status', 'network', 'currency', 'created_at']
    search_fields = ['id', 'user__username', 'wallet_address', 'tx_hash']
    readonly_fields = ['id', 'user', 'amount', 'wallet_address', 'network', 'currency', 'created_at']
    list_editable = ['status']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Request Info', {
            'fields': ('id', 'user', 'amount', 'currency', 'network', 'wallet_address', 'created_at')
        }),
        ('Processing', {
            'fields': ('status', 'tx_hash', 'admin_note')
        }),
    )

    def wallet_address_short(self, obj):
        if obj.wallet_address:
            return f"{obj.wallet_address[:8]}...{obj.wallet_address[-6:]}"
        return "-"
    wallet_address_short.short_description = "Wallet"
