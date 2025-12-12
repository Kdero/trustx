from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from merchants.models import Merchant
from payments.models import Payment, Withdrawal
from payments.serializers import PaymentSerializer, WithdrawalSerializer, CreateWithdrawalSerializer
from auth_app.models import UserProfile
import random, time, threading
from rest_framework.generics import ListAPIView
from decimal import Decimal

def process_payment(payment_id):
    time.sleep(random.uniform(1, 3))
    payment = Payment.objects.get(id=payment_id)
    payment.status = "success" if random.random() > 0.2 else "fail"
    payment.save()

class CreatePayment(APIView):
    def post(self, request):
        api_key = request.headers.get("X-API-KEY")
        try:
            merchant = Merchant.objects.get(api_key=api_key)
        except Merchant.DoesNotExist:
            return Response({"error": "Invalid API KEY"}, status=403)

        amount = request.data.get("amount")
        payment = Payment.objects.create(
            merchant=merchant,
            amount=amount
        )

        threading.Thread(target=process_payment, args=[payment.id]).start()

        return Response(PaymentSerializer(payment).data)

class ListPayments(ListAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class CreateWithdrawalView(APIView):
    """Create a withdrawal request to USDT TRC20"""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateWithdrawalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        amount = Decimal(str(serializer.validated_data['amount']))
        wallet_address = serializer.validated_data['wallet_address']
        
        # Check user balance
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if profile.balance < amount:
            return Response({"error": "Insufficient balance"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create withdrawal request
        withdrawal = Withdrawal.objects.create(
            user=request.user,
            amount=amount,
            wallet_address=wallet_address,
            network='TRC20',
            currency='USDT',
            status='pending'
        )
        
        # Freeze the amount (deduct from balance)
        profile.balance -= amount
        profile.save()
        
        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)


class ListWithdrawalsView(APIView):
    """List user's withdrawal requests"""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        withdrawals = Withdrawal.objects.filter(user=request.user)
        return Response(WithdrawalSerializer(withdrawals, many=True).data)


class CancelWithdrawalView(APIView):
    """Cancel a pending withdrawal request"""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, withdrawal_id):
        try:
            withdrawal = Withdrawal.objects.get(id=withdrawal_id, user=request.user)
        except Withdrawal.DoesNotExist:
            return Response({"error": "Withdrawal not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if withdrawal.status != 'pending':
            return Response({"error": "Can only cancel pending withdrawals"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Refund the amount
        profile = UserProfile.objects.get(user=request.user)
        profile.balance += withdrawal.amount
        profile.save()
        
        # Update withdrawal status
        withdrawal.status = 'rejected'
        withdrawal.admin_note = 'Cancelled by user'
        withdrawal.save()
        
        return Response({"message": "Withdrawal cancelled successfully"})