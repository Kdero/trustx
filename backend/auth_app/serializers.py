from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, Device, BalanceHistory, PaymentCountry, PaymentRequisite


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['public_id', 'is_verified', 'verified_at', 'balance', 'telegram', 'created_at']


class UpdateProfileSerializer(serializers.Serializer):
    """Сериализатор для обновления профиля"""
    username = serializers.CharField(required=False, allow_blank=True)
    telegram = serializers.CharField(required=False, allow_blank=True)
    
    def validate_username(self, value):
        if value and User.objects.filter(username=value).exclude(id=self.context.get('user_id')).exists():
            raise serializers.ValidationError("Этот username уже занят")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор для смены пароля"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
    
    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Пароль должен содержать минимум 6 символов")
        return value


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    telegram = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Этот username уже занят")
        return value

    def validate_telegram(self, value):
        if not value.startswith('@'):
            raise serializers.ValidationError('Telegram должен начинаться с @')
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Пароли не совпадают")
        if not data.get("telegram"):
            raise serializers.ValidationError("Telegram обязателен для регистрации")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"]
        )
        # Создаем профиль пользователя с telegram
        UserProfile.objects.create(
            user=user,
            telegram=validated_data.get("telegram", "")
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Неверное имя пользователя или пароль")
        data["user"] = user
        return data


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'profile', 'role']
    
    def get_role(self, obj):
        """Возвращает роль пользователя"""
        if obj.is_superuser:
            return 'admin'
        return 'user'


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'device_id', 'model', 'name', 'imei', 'created_at', 'updated_at']
        read_only_fields = ['id', 'device_id', 'created_at', 'updated_at']

    def validate_imei(self, value):
        """Проверяем, что IMEI содержит только цифры и имеет правильную длину"""
        if not value.isdigit():
            raise serializers.ValidationError("IMEI должен содержать только цифры")
        if len(value) not in [15]:
            raise serializers.ValidationError("IMEI должен содержать 15 цифр")
        return value


class AddDeviceSerializer(serializers.ModelSerializer):
    """Сериализатор для добавления устройства"""
    class Meta:
        model = Device
        fields = ['model', 'name', 'imei']
    
    def validate_imei(self, value):
        """Проверяем, что IMEI содержит только цифры и имеет правильную длину"""
        if not value.isdigit():
            raise serializers.ValidationError("IMEI должен содержать только цифры")
        if len(value) not in [15]:
            raise serializers.ValidationError("IMEI должен содержать 15 цифр")
        return value


class BalanceHistorySerializer(serializers.ModelSerializer):
    """Сериализатор для истории баланса"""
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = BalanceHistory
        fields = ['id', 'transaction_type', 'transaction_type_display', 'amount', 
                  'balance_before', 'balance_after', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class PaymentCountrySerializer(serializers.ModelSerializer):
    """Сериализатор для стран платежей"""
    class Meta:
        model = PaymentCountry
        fields = ['id', 'name', 'code', 'flag', 'is_active']


class PaymentRequisiteSerializer(serializers.ModelSerializer):
    """Сериализатор для платежных реквизитов"""
    masked_card = serializers.SerializerMethodField()
    device_name = serializers.CharField(source='device.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    country_flag = serializers.CharField(source='country.flag', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    
    class Meta:
        model = PaymentRequisite
        fields = ['id', 'payment_id', 'currency', 'currency_display', 'method', 'method_display',
                  'card_number', 'card_holder', 'masked_card', 'device', 'device_name',
                  'country', 'country_name', 'country_flag', 'min_limit', 'max_limit',
                  'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'payment_id', 'is_active', 'created_at', 'updated_at']
    
    def get_masked_card(self, obj):
        return obj.mask_card()


class CreatePaymentRequisiteSerializer(serializers.ModelSerializer):
    """Сериализатор для создания платежных реквизитов"""
    class Meta:
        model = PaymentRequisite
        fields = ['currency', 'method', 'card_number', 'card_holder', 'device', 'country',
                  'min_limit', 'max_limit']
    
    def validate_card_number(self, value):
        """Валидация номера карты"""
        # Удаляем пробелы и дефисы
        cleaned = value.replace(' ', '').replace('-', '')
        
        if not cleaned.isdigit():
            raise serializers.ValidationError("Номер карты должен содержать только цифры")
        
        if len(cleaned) < 13 or len(cleaned) > 19:
            raise serializers.ValidationError("Номер карты должен содержать от 13 до 19 цифр")
        
        return cleaned
    
    def validate_card_holder(self, value):
        """Валидация имени владельца"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Имя владельца должно содержать минимум 3 символа")
        return value.upper()
    
    def validate_min_limit(self, value):
        """Валидация минимального лимита"""
        if value < 10:
            raise serializers.ValidationError("Минимальный лимит не может быть меньше $10")
        return value
    
    
    def validate_max_limit(self, value):
        """Валидация максимального лимита"""
        if value > 1000:
            raise serializers.ValidationError("Максимальный лимит не может быть больше $1000")
        return value
    
    def validate(self, data):
        """Валидация соотношения лимитов"""
        if data.get('min_limit') >= data.get('max_limit'):
            raise serializers.ValidationError("Минимальный лимит должен быть меньше максимального")
        return data


