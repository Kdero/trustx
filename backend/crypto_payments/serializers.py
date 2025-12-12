from rest_framework import serializers
from .models import CryptoPayment, PaymentAddress, TransactionLog


class PaymentAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAddress
        fields = ['address', 'created_at']


class CreatePaymentSerializer(serializers.Serializer):
    """Сериализатор для создания платежа"""
    amount = serializers.DecimalField(max_digits=18, decimal_places=6, min_value=0.01)
    currency = serializers.ChoiceField(choices=['USDT', 'TRX'], default='USDT')
    metadata = serializers.JSONField(required=False, default=dict)
    callback_url = serializers.URLField(required=False, allow_null=True)


class PaymentStatusSerializer(serializers.ModelSerializer):
    """Сериализатор статуса платежа"""
    address = serializers.CharField(source='payment_address.address', read_only=True)
    
    class Meta:
        model = CryptoPayment
        fields = [
            'payment_id',
            'status',
            'address',
            'currency',
            'amount_expected',
            'amount_received',
            'confirmations',
            'tx_hash',
            'expires_at',
            'created_at',
            'metadata',
        ]


class TransactionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionLog
        fields = [
            'tx_hash',
            'from_address',
            'to_address',
            'amount',
            'currency',
            'block_number',
            'confirmations',
            'created_at',
        ]


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Детальная информация о платеже"""
    address = serializers.CharField(source='payment_address.address', read_only=True)
    transactions = TransactionLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = CryptoPayment
        fields = [
            'payment_id',
            'status',
            'address',
            'currency',
            'amount_expected',
            'amount_received',
            'confirmations',
            'tx_hash',
            'expires_at',
            'created_at',
            'completed_at',
            'metadata',
            'transactions',
        ]
