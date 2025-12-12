from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
import string
import random


def generate_payment_id():
    """Генерирует 4-значный ID с латинскими буквами и цифрами"""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=4))


def generate_device_id():
    """Генерирует 6-значный ID для устройства"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


def generate_user_id():
    """Генерирует 8-значный уникальный ID для пользователя"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))


class UserProfile(models.Model):
    """Профиль пользователя с информацией о верификации и балансе"""
    
    VERIFICATION_STATUS_CHOICES = [
        ('not_verified', 'Не верифицирован'),
        ('verified', 'Верифицирован'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    public_id = models.CharField(
        max_length=8,
        default=generate_user_id,
        editable=False,
        help_text="Уникальный публичный ID пользователя"
    )
    telegram = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Telegram для связи"
    )
    is_verified = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='not_verified'
    )
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.0,
        help_text="Баланс пользователя в долларах"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_is_verified_display()}"
    
    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"


class BalanceHistory(models.Model):
    """История изменения баланса пользователя"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('deposit', 'Пополнение'),
        ('withdrawal', 'Вывод'),
        ('charge', 'Списание'),
        ('refund', 'Возврат'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='balance_history')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Сумма операции")
    balance_before = models.DecimalField(max_digits=10, decimal_places=2, help_text="Баланс до операции")
    balance_after = models.DecimalField(max_digits=10, decimal_places=2, help_text="Баланс после операции")
    description = models.CharField(max_length=255, blank=True, help_text="Описание операции")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} - {self.amount}$"
    
    class Meta:
        verbose_name = "История баланса"
        verbose_name_plural = "История баланса"
        ordering = ['-created_at']


class Device(models.Model):
    """Устройство пользователя"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=6, default=generate_device_id, help_text="6-значный ID устройства")
    model = models.CharField(max_length=255, help_text="Модель устройства (например: iPhone 15 Pro)")
    name = models.CharField(max_length=255, help_text="Название устройства (например: Мой телефон)")
    imei = models.CharField(max_length=20, unique=True, help_text="IMEI номер устройства")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.model})"
    
    class Meta:
        verbose_name = "Устройство"
        verbose_name_plural = "Устройства"
        ordering = ['-created_at']


class PaymentCountry(models.Model):
    """Страны для платежных реквизитов"""
    
    name = models.CharField(max_length=100, unique=True, help_text="Название страны")
    code = models.CharField(max_length=3, unique=True, help_text="Код страны (например: RU, US)")
    flag = models.CharField(max_length=10, default="🌍", help_text="Флаг эмодзи")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.flag} {self.name}"
    
    class Meta:
        verbose_name = "Страна платежей"
        verbose_name_plural = "Страны платежей"
        ordering = ['name']


class PaymentRequisite(models.Model):
    """Платежные реквизиты пользователя"""
    
    CURRENCY_CHOICES = [
        ('USD', 'USD'),
        ('RUB', 'RUB'),
    ]
    
    METHOD_CHOICES = [
        ('card', 'Карта (Card)'),
        ('sbp', 'СБП (SBP)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_requisites')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True, help_text="Привязанное устройство")
    
    # Основная информация
    payment_id = models.CharField(max_length=4, unique=True, default=generate_payment_id, help_text="4-значный ID")
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    country = models.ForeignKey(PaymentCountry, on_delete=models.SET_NULL, null=True, help_text="Страна платежа")
    
    # Реквизиты
    card_number = models.CharField(max_length=20, help_text="Номер карты")
    card_holder = models.CharField(max_length=255, help_text="Имя владельца карты")
    
    # Лимиты
    min_limit = models.DecimalField(max_digits=10, decimal_places=2, default=10.00, help_text="Минимальный лимит")
    max_limit = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00, help_text="Максимальный лимит")
    
    is_active = models.BooleanField(default=False, help_text="Активен ли реквизит (может быть изменено только администратором)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_currency_display()} {self.payment_id}"
    
    def mask_card(self):
        """Возвращает замаскированный номер карты"""
        if len(self.card_number) >= 4:
            return f"****-****-****-{self.card_number[-4:]}"
        return "****"
    
    class Meta:
        verbose_name = "Платежный реквизит"
        verbose_name_plural = "Платежные реквизиты"
        ordering = ['-created_at']
        unique_together = [['user', 'payment_id']]
