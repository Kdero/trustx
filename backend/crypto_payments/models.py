from django.db import models
from django.conf import settings
import secrets
import string


def generate_payment_id():
    """Генерация уникального 8-символьного ID платежа"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(8))


class CryptoWallet(models.Model):
    """
    Мастер-кошелек для приёма платежей.
    Хранит главный приватный ключ (зашифрованный).
    """
    address = models.CharField(max_length=64, unique=True, verbose_name="TRC20 адрес")
    private_key_encrypted = models.TextField(verbose_name="Зашифрованный приватный ключ")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Крипто кошелёк"
        verbose_name_plural = "Крипто кошельки"
    
    def __str__(self):
        return f"{self.address[:8]}...{self.address[-6:]}"


class PaymentAddress(models.Model):
    """
    Уникальный адрес для каждого платежа.
    Генерируется из HD-кошелька для анонимности.
    """
    address = models.CharField(max_length=64, unique=True, verbose_name="TRC20 адрес")
    private_key_encrypted = models.TextField(verbose_name="Зашифрованный приватный ключ")
    derivation_index = models.IntegerField(verbose_name="Индекс деривации")
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Платёжный адрес"
        verbose_name_plural = "Платёжные адреса"
    
    def __str__(self):
        return f"{self.address[:8]}...{self.address[-6:]}"


class CryptoPayment(models.Model):
    """
    Запись о крипто-платеже.
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('confirming', 'Подтверждается'),
        ('completed', 'Завершён'),
        ('expired', 'Истёк'),
        ('failed', 'Ошибка'),
    ]
    
    CURRENCY_CHOICES = [
        ('USDT', 'USDT TRC20'),
        ('TRX', 'TRON'),
    ]
    
    payment_id = models.CharField(
        max_length=8, 
        unique=True, 
        default=generate_payment_id,
        verbose_name="ID платежа"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='crypto_payments',
        verbose_name="Пользователь"
    )
    payment_address = models.ForeignKey(
        PaymentAddress,
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name="Адрес для оплаты"
    )
    currency = models.CharField(
        max_length=10,
        choices=CURRENCY_CHOICES,
        default='USDT',
        verbose_name="Валюта"
    )
    amount_expected = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        verbose_name="Ожидаемая сумма"
    )
    amount_received = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=0,
        verbose_name="Полученная сумма"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Статус"
    )
    tx_hash = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        verbose_name="Hash транзакции"
    )
    confirmations = models.IntegerField(default=0, verbose_name="Подтверждения")
    expires_at = models.DateTimeField(verbose_name="Истекает")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Завершён")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создан")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлён")
    
    # Метаданные (для callback)
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Метаданные")
    callback_url = models.URLField(blank=True, null=True, verbose_name="Callback URL")
    
    class Meta:
        verbose_name = "Крипто платёж"
        verbose_name_plural = "Крипто платежи"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"#{self.payment_id} - {self.amount_expected} {self.currency}"


class TransactionLog(models.Model):
    """
    Лог всех обнаруженных транзакций.
    """
    tx_hash = models.CharField(max_length=128, unique=True, verbose_name="Hash транзакции")
    from_address = models.CharField(max_length=64, verbose_name="От кого")
    to_address = models.CharField(max_length=64, verbose_name="Кому")
    amount = models.DecimalField(max_digits=18, decimal_places=6, verbose_name="Сумма")
    currency = models.CharField(max_length=10, verbose_name="Валюта")
    block_number = models.BigIntegerField(verbose_name="Номер блока")
    confirmations = models.IntegerField(default=0, verbose_name="Подтверждения")
    payment = models.ForeignKey(
        CryptoPayment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name="Связанный платёж"
    )
    processed = models.BooleanField(default=False, verbose_name="Обработана")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Лог транзакции"
        verbose_name_plural = "Логи транзакций"
    
    def __str__(self):
        return f"{self.tx_hash[:16]}... - {self.amount} {self.currency}"

