from rest_framework import serializers
from .models import Payment, Withdrawal

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class WithdrawalSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Withdrawal
        fields = ['id', 'username', 'amount', 'wallet_address', 'network', 'currency', 'status', 'tx_hash', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'status', 'tx_hash', 'created_at', 'updated_at']


class CreateWithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=6, min_value=1)
    wallet_address = serializers.CharField(max_length=100)
    
    def validate_wallet_address(self, value):
        # Basic TRC20 address validation (starts with T, 34 chars)
        if not value.startswith('T') or len(value) != 34:
            raise serializers.ValidationError("Invalid TRC20 wallet address")
        return value
