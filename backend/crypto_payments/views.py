from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from decimal import Decimal
from django.utils import timezone
from .models import CryptoPayment
from .serializers import (
    CreatePaymentSerializer, 
    PaymentStatusSerializer,
    PaymentDetailSerializer,
)
from .services import PaymentService
from auth_app.models import BalanceHistory


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    Создать новый крипто-платёж.
    
    POST /api/v1/crypto/payment/create
    {
        "amount": "100.00",
        "currency": "USDT",  // опционально, по умолчанию USDT
        "metadata": {"order_id": "123"},  // опционально
        "callback_url": "https://yoursite.com/callback"  // опционально
    }
    """
    serializer = CreatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = PaymentService()
        
        # Пользователь уже авторизован (IsAuthenticated)
        user = request.user
        
        payment = service.create_payment(
            amount=Decimal(str(serializer.validated_data['amount'])),
            currency=serializer.validated_data.get('currency', 'USDT'),
            user=user,
            metadata=serializer.validated_data.get('metadata', {}),
            callback_url=serializer.validated_data.get('callback_url'),
        )
        
        return Response({
            'success': True,
            'payment': {
                'payment_id': payment.payment_id,
                'address': payment.payment_address.address,
                'amount': str(payment.amount_expected),
                'currency': payment.currency,
                'expires_at': payment.expires_at.isoformat(),
                'status': payment.status,
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_payment(request, payment_id):
    """
    Проверить статус платежа.
    
    GET /api/v1/crypto/payment/<payment_id>/status
    """
    try:
        payment = CryptoPayment.objects.select_related('payment_address').get(
            payment_id=payment_id
        )
    except CryptoPayment.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Payment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Проверяем обновления
        service = PaymentService()
        service.check_payment(payment)
        
        # Обновляем объект из БД
        payment.refresh_from_db()
        
        serializer = PaymentStatusSerializer(payment)
        return Response({
            'success': True,
            'payment': serializer.data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_detail(request, payment_id):
    """
    Получить детальную информацию о платеже с транзакциями.
    
    GET /api/v1/crypto/payment/<payment_id>/detail
    """
    try:
        payment = CryptoPayment.objects.select_related(
            'payment_address'
        ).prefetch_related('transactions').get(payment_id=payment_id)
    except CryptoPayment.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Payment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = PaymentDetailSerializer(payment)
    return Response({
        'success': True,
        'payment': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_payments(request):
    """
    Получить список платежей текущего пользователя.
    
    GET /api/v1/crypto/payments/my
    """
    payments = CryptoPayment.objects.filter(
        user=request.user
    ).select_related('payment_address').order_by('-created_at')
    
    serializer = PaymentStatusSerializer(payments, many=True)
    return Response({
        'success': True,
        'payments': serializer.data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_address(request):
    """
    Проверить валидность TRON адреса.
    
    POST /api/v1/crypto/verify-address
    {
        "address": "TXyz..."
    }
    """
    address = request.data.get('address', '')
    
    # Проверяем формат TRON адреса
    is_valid = (
        address.startswith('T') and 
        len(address) == 34 and 
        address.isalnum()
    )
    
    return Response({
        'success': True,
        'address': address,
        'is_valid': is_valid
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_balance(request, address):
    """
    Получить баланс USDT на адресе.
    
    GET /api/v1/crypto/balance/<address>
    """
    try:
        service = PaymentService()
        balance = service.trongrid.get_usdt_balance(address)
        
        return Response({
            'success': True,
            'address': address,
            'balance': str(balance),
            'currency': 'USDT'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== ADMIN ENDPOINTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_deposits(request):
    """
    Получить список всех депозитов (только для админов).
    
    GET /api/v1/crypto/admin/deposits
    """
    # Проверяем права админа
    if not request.user.is_staff and not request.user.is_superuser:
        return Response({
            'error': 'Access denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    payments = CryptoPayment.objects.select_related(
        'user', 'payment_address'
    ).order_by('-created_at')
    
    deposits_data = []
    for p in payments:
        deposits_data.append({
            'payment_id': p.payment_id,
            'user': {
                'id': p.user.id,
                'username': p.user.username,
                'email': p.user.email,
            } if p.user else None,
            'currency': p.currency,
            'amount_expected': float(p.amount_expected),
            'amount_received': float(p.amount_received),
            'status': p.status,
            'wallet_address': p.payment_address.address if p.payment_address else None,
            'tx_hash': p.tx_hash,
            'created_at': p.created_at.isoformat(),
            'expires_at': p.expires_at.isoformat(),
        })
    
    return Response(deposits_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_deposit(request, payment_id):
    """
    Подтвердить депозит и начислить баланс пользователю.
    
    POST /api/v1/crypto/admin/deposits/<payment_id>/approve
    """
    # Проверяем права админа
    if not request.user.is_staff and not request.user.is_superuser:
        return Response({
            'error': 'Access denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        payment = CryptoPayment.objects.select_related('user').get(payment_id=payment_id)
    except CryptoPayment.DoesNotExist:
        return Response({
            'error': 'Платёж не найден'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if payment.status == 'completed':
        return Response({
            'error': 'Платёж уже подтверждён'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not payment.user:
        return Response({
            'error': 'Пользователь не указан'
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
        
        return Response({
            'success': True,
            'message': f'Баланс ${amount_to_add} начислен пользователю {payment.user.username}'
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_deposit(request, payment_id):
    """
    Отклонить депозит.
    
    POST /api/v1/crypto/admin/deposits/<payment_id>/reject
    """
    # Проверяем права админа
    if not request.user.is_staff and not request.user.is_superuser:
        return Response({
            'error': 'Access denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        payment = CryptoPayment.objects.get(payment_id=payment_id)
    except CryptoPayment.DoesNotExist:
        return Response({
            'error': 'Платёж не найден'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if payment.status == 'completed':
        return Response({
            'error': 'Нельзя отклонить завершённый платёж'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    payment.status = 'failed'
    payment.save()
    
    return Response({
        'success': True,
        'message': 'Платёж отклонён'
    })

