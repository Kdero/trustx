from django.contrib import admin
from django.contrib import messages
from django.utils import timezone
from django.utils.html import format_html
from decimal import Decimal
from .models import CryptoWallet, PaymentAddress, CryptoPayment, TransactionLog
from auth_app.models import BalanceHistory


@admin.register(CryptoWallet)
class CryptoWalletAdmin(admin.ModelAdmin):
    list_display = ['address', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['address']
    readonly_fields = ['created_at']


@admin.register(PaymentAddress)
class PaymentAddressAdmin(admin.ModelAdmin):
    list_display = ['address', 'derivation_index', 'is_used', 'created_at']
    list_filter = ['is_used']
    search_fields = ['address']
    readonly_fields = ['created_at', 'derivation_index']


@admin.register(CryptoPayment)
class CryptoPaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_id', 
        'get_username', 
        'currency', 
        'amount_expected', 
        'amount_received', 
        'colored_status', 
        'created_at',
        'get_wallet_address'
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['payment_id', 'tx_hash', 'user__username', 'user__email']
    readonly_fields = [
        'payment_id', 
        'created_at', 
        'updated_at', 
        'completed_at',
        'get_user_info',
        'get_wallet_address_display'
    ]
    raw_id_fields = ['user', 'payment_address']
    list_per_page = 50
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    actions = ['approve_payments', 'reject_payments', 'mark_as_pending']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('payment_id', 'get_user_info', 'currency', 'status')
        }),
        ('Суммы', {
            'fields': ('amount_expected', 'amount_received')
        }),
        ('Адрес для оплаты', {
            'fields': ('payment_address', 'get_wallet_address_display')
        }),
        ('Транзакция', {
            'fields': ('tx_hash', 'confirmations'),
            'classes': ('collapse',)
        }),
        ('Даты', {
            'fields': ('expires_at', 'completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Дополнительно', {
            'fields': ('metadata', 'callback_url'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.display(description='Пользователь')
    def get_username(self, obj):
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        return "—"
    
    @admin.display(description='Информация о пользователе')
    def get_user_info(self, obj):
        if obj.user:
            try:
                profile = obj.user.profile
                return format_html(
                    '<strong>Логин:</strong> {}<br>'
                    '<strong>Email:</strong> {}<br>'
                    '<strong>Текущий баланс:</strong> ${:.2f}<br>'
                    '<strong>ID:</strong> {}',
                    obj.user.username,
                    obj.user.email,
                    profile.balance,
                    profile.public_id
                )
            except:
                return f"{obj.user.username} ({obj.user.email})"
        return "Не указан"
    
    @admin.display(description='Кошелёк')
    def get_wallet_address(self, obj):
        if obj.payment_address:
            addr = obj.payment_address.address
            return f"{addr[:6]}...{addr[-4:]}"
        return "—"
    
    @admin.display(description='Адрес кошелька')
    def get_wallet_address_display(self, obj):
        if obj.payment_address:
            return obj.payment_address.address
        return "—"
    
    @admin.display(description='Статус')
    def colored_status(self, obj):
        colors = {
            'pending': '#f59e0b',      # Оранжевый - ожидает
            'confirming': '#3b82f6',   # Синий - подтверждается
            'completed': '#10b981',    # Зелёный - завершён
            'expired': '#6b7280',      # Серый - истёк
            'failed': '#ef4444',       # Красный - ошибка
        }
        status_labels = {
            'pending': '⏳ Ожидает оплаты',
            'confirming': '🔄 Подтверждается',
            'completed': '✅ Завершён',
            'expired': '⌛ Истёк',
            'failed': '❌ Ошибка',
        }
        color = colors.get(obj.status, '#6b7280')
        label = status_labels.get(obj.status, obj.status)
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, label
        )
    
    @admin.action(description='✅ Подтвердить выбранные платежи и начислить баланс')
    def approve_payments(self, request, queryset):
        """Подтвердить платежи и начислить баланс пользователям"""
        approved_count = 0
        errors = []
        
        for payment in queryset:
            if payment.status == 'completed':
                errors.append(f"#{payment.payment_id} уже подтверждён")
                continue
            
            if not payment.user:
                errors.append(f"#{payment.payment_id} - пользователь не указан")
                continue
            
            try:
                # Начисляем баланс пользователю
                profile = payment.user.profile
                amount_to_add = payment.amount_expected
                
                balance_before = Decimal(str(profile.balance))
                profile.balance = balance_before + Decimal(str(amount_to_add))
                profile.save()
                
                # Создаём запись в истории баланса
                BalanceHistory.objects.create(
                    user=payment.user,
                    transaction_type='deposit',
                    amount=Decimal(str(amount_to_add)),
                    balance_before=balance_before,
                    balance_after=profile.balance,
                    description=f'Крипто депозит #{payment.payment_id}'
                )
                
                # Обновляем статус платежа
                payment.status = 'completed'
                payment.amount_received = amount_to_add
                payment.completed_at = timezone.now()
                payment.save()
                
                approved_count += 1
                
            except Exception as e:
                errors.append(f"#{payment.payment_id} - ошибка: {str(e)}")
        
        if approved_count:
            self.message_user(
                request,
                f"✅ Подтверждено платежей: {approved_count}. Баланс начислен.",
                messages.SUCCESS
            )
        
        if errors:
            self.message_user(
                request,
                f"⚠️ Ошибки: {'; '.join(errors)}",
                messages.WARNING
            )
    
    @admin.action(description='❌ Отклонить выбранные платежи')
    def reject_payments(self, request, queryset):
        """Отклонить платежи"""
        rejected_count = 0
        errors = []
        
        for payment in queryset:
            if payment.status == 'completed':
                errors.append(f"#{payment.payment_id} уже завершён, нельзя отклонить")
                continue
            
            try:
                payment.status = 'failed'
                payment.save()
                rejected_count += 1
            except Exception as e:
                errors.append(f"#{payment.payment_id} - ошибка: {str(e)}")
        
        if rejected_count:
            self.message_user(
                request,
                f"❌ Отклонено платежей: {rejected_count}",
                messages.SUCCESS
            )
        
        if errors:
            self.message_user(
                request,
                f"⚠️ Ошибки: {'; '.join(errors)}",
                messages.WARNING
            )
    
    @admin.action(description='🔄 Вернуть в статус "Ожидает оплаты"')
    def mark_as_pending(self, request, queryset):
        """Вернуть платежи в статус ожидания"""
        count = 0
        for payment in queryset:
            if payment.status != 'completed':
                payment.status = 'pending'
                payment.save()
                count += 1
        
        self.message_user(
            request,
            f"🔄 Возвращено в ожидание: {count} платежей",
            messages.SUCCESS
        )


@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    list_display = ['tx_hash_short', 'from_address_short', 'to_address_short', 'amount', 
                    'currency', 'confirmations', 'processed', 'created_at']
    list_filter = ['currency', 'processed', 'created_at']
    search_fields = ['tx_hash', 'from_address', 'to_address']
    readonly_fields = ['created_at']
    raw_id_fields = ['payment']
    
    @admin.display(description='TX Hash')
    def tx_hash_short(self, obj):
        return f"{obj.tx_hash[:10]}...{obj.tx_hash[-6:]}" if obj.tx_hash else "—"
    
    @admin.display(description='От кого')
    def from_address_short(self, obj):
        return f"{obj.from_address[:6]}...{obj.from_address[-4:]}" if obj.from_address else "—"
    
    @admin.display(description='Кому')
    def to_address_short(self, obj):
        return f"{obj.to_address[:6]}...{obj.to_address[-4:]}" if obj.to_address else "—"
