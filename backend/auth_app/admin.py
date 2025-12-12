from django.contrib import admin
from .models import UserProfile, Device, PaymentCountry, PaymentRequisite


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_verified', 'created_at', 'verified_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'verified_at')
    
    fieldsets = (
        ('Информация пользователя', {
            'fields': ('user',)
        }),
        ('Верификация', {
            'fields': ('is_verified', 'verified_at')
        }),
        ('Даты', {
            'fields': ('created_at',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Сохранить модель и отправить уведомление при верификации"""
        from .telegram_notifier import send_notification_sync
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Проверяем, был ли изменен статус верификации
        if change:
            old_obj = UserProfile.objects.get(pk=obj.pk)
            if old_obj.is_verified != 'verified' and obj.is_verified == 'verified':
                # Пользователь только что был верифицирован
                from django.utils import timezone
                obj.verified_at = timezone.now()
                
                # Отправляем уведомление
                try:
                    send_notification_sync(obj.user.username, event_type="verified")
                except Exception as e:
                    logger.error(f"Failed to send verification notification: {e}")
        
        super().save_model(request, obj, form, change)


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'model', 'imei', 'user', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('user__username', 'name', 'imei')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Информация об устройстве', {
            'fields': ('user', 'name', 'model', 'imei')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PaymentCountry)
class PaymentCountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'flag', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Информация о стране', {
            'fields': ('name', 'code', 'flag', 'is_active')
        }),
        ('Даты', {
            'fields': ('created_at',)
        }),
    )


@admin.register(PaymentRequisite)
class PaymentRequisiteAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'user', 'method', 'currency', 'country', 'masked_card', 'is_active', 'created_at')
    list_filter = ('method', 'currency', 'is_active', 'created_at', 'country')
    search_fields = ('user__username', 'payment_id', 'card_number')
    readonly_fields = ('payment_id', 'created_at', 'updated_at', 'masked_card')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'payment_id', 'is_active')
        }),
        ('Реквизиты платежа', {
            'fields': ('currency', 'method', 'country', 'device')
        }),
        ('Данные карты', {
            'fields': ('card_number', 'card_holder', 'masked_card')
        }),
        ('Лимиты', {
            'fields': ('min_limit', 'max_limit')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def masked_card(self, obj):
        return obj.mask_card()
    masked_card.short_description = 'Маскированная карта'

