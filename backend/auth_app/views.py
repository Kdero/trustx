from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (RegisterSerializer, LoginSerializer, UserDetailSerializer, DeviceSerializer, 
                         AddDeviceSerializer, BalanceHistorySerializer, PaymentCountrySerializer, 
                         PaymentRequisiteSerializer, CreatePaymentRequisiteSerializer,
                         UpdateProfileSerializer, ChangePasswordSerializer)
from .models import UserProfile, Device, BalanceHistory, PaymentCountry, PaymentRequisite
from .telegram_notifier import send_notification_sync
from django.views.decorators.csrf import csrf_exempt
import logging
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta

logger = logging.getLogger(__name__)


class RegisterUser(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            telegram = request.data.get('telegram', '')
            # Отправляем уведомление в Telegram
            try:
                send_notification_sync(user.username, event_type="registration", telegram=telegram)
            except Exception as e:
                logger.error(f"Failed to send Telegram notification: {e}")
            
            return Response({
                "message": "Регистрация успешна",
                "username": user.username,
                "telegram": telegram,
                "role": "user",
                "is_verified": False,
                "balance": 0.0
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginUser(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token, created = Token.objects.get_or_create(user=user)
            
            # Получаем или создаем профиль пользователя
            profile, _ = UserProfile.objects.get_or_create(user=user)
            is_verified = profile.is_verified == 'verified'
            balance = float(profile.balance)
            
            # Определяем роль пользователя
            role = 'admin' if user.is_superuser else 'user'
            
            # Отправляем уведомление о входе в Telegram
            try:
                send_notification_sync(user.username, event_type="login")
            except Exception as e:
                logger.error(f"Failed to send Telegram notification: {e}")
            
            return Response({
                "message": "Авторизация успешна",
                "username": user.username,
                "token": token.key,
                "role": role,
                "is_verified": is_verified,
                "balance": balance
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """Получить информацию о текущем пользователе"""
    
    def get(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
            profile, _ = UserProfile.objects.get_or_create(user=user)
            role = 'admin' if user.is_superuser else 'user'
            
            return Response({
                "id": user.id,
                "username": user.username,
                "role": role,
                "telegram": profile.telegram or "",
                "is_verified": profile.is_verified == 'verified',
                "balance": float(profile.balance),
                "created_at": profile.created_at.isoformat() if profile.created_at else None
            })
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class UpdateProfileView(APIView):
    """Обновить профиль пользователя (логин, телеграм)"""
    
    def patch(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = UpdateProfileSerializer(data=request.data, context={'user_id': user.id})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Обновляем username, если указан
        new_username = data.get('username', '').strip()
        if new_username:
            user.username = new_username
            user.save()
        
        # Обновляем telegram, если указан
        new_telegram = data.get('telegram', '').strip()
        if new_telegram:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.telegram = new_telegram
            profile.save()
        
        # Получаем обновленные данные
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        return Response({
            "message": "Профиль обновлен",
            "username": user.username,
            "telegram": profile.telegram
        })


class ChangePasswordView(APIView):
    """Изменить пароль пользователя"""
    
    def post(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Проверяем текущий пароль
        if not user.check_password(data['current_password']):
            return Response(
                {"error": "Неверный текущий пароль"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Устанавливаем новый пароль
        user.set_password(data['new_password'])
        user.save()
        
        # Создаем новый токен (старый токен становится недействительным после смены пароля)
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)
        
        return Response({
            "message": "Пароль успешно изменен",
            "token": new_token.key
        })


class VerifyUserView(APIView):
    """Верифицировать пользователя (только для администратора)"""
    
    def post(self, request, user_id):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверяем, что это администратор
        if not user.is_staff:
            return Response(
                {"error": "У вас нет прав для выполнения этого действия"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Получаем или создаем профиль
            profile, _ = UserProfile.objects.get_or_create(user_id=user_id)
            profile.is_verified = 'verified'
            profile.verified_at = timezone.now()
            profile.save()
            
            # Отправляем уведомление о верификации
            try:
                send_notification_sync(
                    profile.user.username,
                    event_type="verified"
                )
            except Exception as e:
                logger.error(f"Failed to send verification notification: {e}")
            
            return Response({
                "message": f"Пользователь {profile.user.username} верифицирован",
                "is_verified": True
            })
        except Exception as e:
            return Response(
                {"error": f"Ошибка: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND
            )


class ListUsersView(APIView):
    """Получить список всех пользователей (только для администратора)"""
    
    def get(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверяем, что это администратор
        if not user.is_staff:
            return Response(
                {"error": "У вас нет прав для выполнения этого действия"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        users = UserProfile.objects.all()
        data = []
        for profile in users:
            role = 'admin' if profile.user.is_superuser else 'user'
            data.append({
                "id": profile.user.id,
                "public_id": profile.public_id,
                "username": profile.user.username,
                "role": role,
                "is_verified": profile.is_verified == 'verified',
                "balance": float(profile.balance),
                "created_at": profile.created_at,
                "verified_at": profile.verified_at
            })
        
        return Response(data)


class GetDevicesView(APIView):
    """Получить список устройств текущего пользователя"""
    
    def get(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Получаем устройства пользователя
        devices = Device.objects.filter(user=user)
        serializer = DeviceSerializer(devices, many=True)
        return Response(serializer.data)


class AddDeviceView(APIView):
    """Добавить новое устройство для текущего пользователя"""
    
    def post(self, request):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = AddDeviceSerializer(data=request.data)
        if serializer.is_valid():
            # Создаем устройство для текущего пользователя
            device = Device.objects.create(
                user=user,
                model=serializer.validated_data['model'],
                name=serializer.validated_data['name'],
                imei=serializer.validated_data['imei']
            )
            
            result_serializer = DeviceSerializer(device)
            return Response({
                "message": "Устройство успешно добавлено",
                "device": result_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteDeviceView(APIView):
    """Удалить устройство пользователя"""
    
    def delete(self, request, device_id):
        # Проверяем наличие токена
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
        except Token.DoesNotExist:
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            device = Device.objects.get(id=device_id, user=user)
            device.delete()
            return Response({
                "message": "Устройство успешно удалено"
            })
        except Device.DoesNotExist:
            return Response(
                {"error": "Устройство не найдено"},
                status=status.HTTP_404_NOT_FOUND
            )


class GetBalanceStatsView(APIView):
    """Получить статистику баланса за разные периоды"""
    
    def get(self, request):
        # Проверяем авторизацию через header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({"error": "Не авторизован"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response({"error": "Неверный токен"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Получаем профиль пользователя
        profile = UserProfile.objects.get(user=user)
        
        # Вычисляем статистику
        now = timezone.now()
        
        # За день (последние 24 часа)
        day_start = now - timedelta(days=1)
        day_history = BalanceHistory.objects.filter(
            user=user,
            created_at__gte=day_start
        )
        day_income = day_history.filter(
            transaction_type__in=['deposit', 'refund']
        ).aggregate(total=Sum('amount'))['total'] or 0
        day_expense = day_history.filter(
            transaction_type__in=['withdrawal', 'charge']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # За неделю (последние 7 дней)
        week_start = now - timedelta(days=7)
        week_history = BalanceHistory.objects.filter(
            user=user,
            created_at__gte=week_start
        )
        week_income = week_history.filter(
            transaction_type__in=['deposit', 'refund']
        ).aggregate(total=Sum('amount'))['total'] or 0
        week_expense = week_history.filter(
            transaction_type__in=['withdrawal', 'charge']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # За месяц (последние 30 дней)
        month_start = now - timedelta(days=30)
        month_history = BalanceHistory.objects.filter(
            user=user,
            created_at__gte=month_start
        )
        month_income = month_history.filter(
            transaction_type__in=['deposit', 'refund']
        ).aggregate(total=Sum('amount'))['total'] or 0
        month_expense = month_history.filter(
            transaction_type__in=['withdrawal', 'charge']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Получаем последние транзакции для графика
        recent_transactions = BalanceHistory.objects.filter(
            user=user,
            created_at__gte=month_start
        ).order_by('-created_at')[:50]
        
        # Получаем период из запроса
        period = request.GET.get('period', 'month')
        
        # Определяем количество дней для графика
        if period == 'day':
            days_count = 1
        elif period == 'week':
            days_count = 7
        else:  # month
            days_count = 30
        
        # Формируем данные для графика со всеми днями
        from collections import defaultdict
        from datetime import date
        
        chart_data = defaultdict(float)
        
        # Заполняем все дни периода нулями
        for i in range(days_count):
            day = now - timedelta(days=days_count - 1 - i)
            date_str = day.strftime('%d.%m')
            chart_data[date_str] = 0.0
        
        # Добавляем реальные данные
        period_start = now - timedelta(days=days_count)
        period_transactions = BalanceHistory.objects.filter(
            user=user,
            created_at__gte=period_start
        )
        for tx in period_transactions:
            date_str = tx.created_at.strftime('%d.%m')
            if tx.transaction_type in ['deposit', 'refund']:
                chart_data[date_str] += float(tx.amount)
        
        # Сортируем по дате
        chart = [{'date': k, 'value': v} for k, v in chart_data.items()]
        
        return Response({
            "current_balance": float(profile.balance),
            "frozen_deposit": 0.0,
            "periods": {
                "day": {
                    "income": float(day_income),
                    "expense": float(day_expense),
                    "net": float(day_income - day_expense),
                    "transactions": 0
                },
                "week": {
                    "income": float(week_income),
                    "expense": float(week_expense),
                    "net": float(week_income - week_expense),
                    "transactions": 0
                },
                "month": {
                    "income": float(month_income),
                    "expense": float(month_expense),
                    "net": float(month_income - month_expense),
                    "transactions": 0
                }
            },
            "chart": chart,
            # Legacy format for backwards compatibility
            "day": {
                "income": float(day_income),
                "expense": float(day_expense),
                "net": float(day_income - day_expense)
            },
            "week": {
                "income": float(week_income),
                "expense": float(week_expense),
                "net": float(week_income - week_expense)
            },
            "month": {
                "income": float(month_income),
                "expense": float(month_expense),
                "net": float(month_income - month_expense)
            },
            "transactions": BalanceHistorySerializer(recent_transactions, many=True).data
        })


class GetCurrencyPairsView(APIView):
    """Получить все доступные пары валют для конвертации"""
    
    def get(self, request):
        """
        Получает список доступных криптовалют и их курсы к RUB
        """
        try:
            import requests
            
            # Популярные криптовалюты для конвертации
            currencies = {
                'USDT': 'Tether',
                'BTC': 'Bitcoin',
                'ETH': 'Ethereum',
                'BNB': 'Binance Coin',
                'XRP': 'Ripple',
                'ADA': 'Cardano',
                'SOL': 'Solana',
                'DOGE': 'Dogecoin',
            }
            
            try:
                # Получаем курсы через Bybit API
                pair_rates = {}
                
                for symbol, name in currencies.items():
                    try:
                        response = requests.get(
                            'https://api.bybit.com/v5/market/tickers',
                            params={
                                'category': 'spot',
                                'symbol': f'{symbol}RUB'
                            },
                            timeout=5
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            if data.get('retCode') == 0 and data.get('result', {}).get('list'):
                                ticker = data['result']['list'][0]
                                last_price = float(ticker.get('lastPrice', 0))
                                
                                if last_price > 0:
                                    pair_rates[symbol] = {
                                        'name': name,
                                        'rate': last_price,
                                        'buy': round(last_price * 1.005, 2),
                                        'sell': round(last_price * 0.995, 2)
                                    }
                    except Exception as e:
                        logger.warning(f"Failed to get rate for {symbol}: {e}")
                        continue
                
                # Если удалось получить хотя бы несколько курсов
                if pair_rates:
                    return Response({
                        "success": True,
                        "pairs": pair_rates,
                        "base_currency": "RUB",
                        "timestamp": timezone.now().isoformat(),
                        "source": "Bybit"
                    })
                else:
                    raise Exception("No pairs found")
                    
            except Exception as bybit_error:
                logger.warning(f"Bybit error: {bybit_error}, using fallback...")
                
                # Fallback значения
                fallback_rates = {
                    'USDT': {
                        'name': 'Tether',
                        'rate': 97.50,
                        'buy': 98.50,
                        'sell': 96.50
                    },
                    'BTC': {
                        'name': 'Bitcoin',
                        'rate': 6500000,
                        'buy': 6535000,
                        'sell': 6465000
                    },
                    'ETH': {
                        'name': 'Ethereum',
                        'rate': 250000,
                        'buy': 251250,
                        'sell': 248750
                    },
                    'BNB': {
                        'name': 'Binance Coin',
                        'rate': 61000,
                        'buy': 61305,
                        'sell': 60695
                    },
                    'XRP': {
                        'name': 'Ripple',
                        'rate': 3.50,
                        'buy': 3.52,
                        'sell': 3.48
                    },
                    'ADA': {
                        'name': 'Cardano',
                        'rate': 1.20,
                        'buy': 1.21,
                        'sell': 1.19
                    },
                    'SOL': {
                        'name': 'Solana',
                        'rate': 220,
                        'buy': 221,
                        'sell': 219
                    },
                    'DOGE': {
                        'name': 'Dogecoin',
                        'rate': 0.40,
                        'buy': 0.41,
                        'sell': 0.39
                    },
                }
                
                return Response({
                    "success": True,
                    "pairs": fallback_rates,
                    "base_currency": "RUB",
                    "timestamp": timezone.now().isoformat(),
                    "source": "fallback"
                })
                
        except Exception as e:
            logger.error(f"Error fetching currency pairs: {e}")
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConvertCurrencyView(APIView):
    """Конвертировать валюту"""
    
    def post(self, request):
        """
        Конвертирует одну валюту в другую
        Request: {
            "from_currency": "RUB",
            "to_currency": "USDT",
            "amount": 1000
        }
        """
        # Проверяем авторизацию
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({"error": "Не авторизован"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response({"error": "Неверный токен"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            from_currency = request.data.get('from_currency', 'RUB').upper()
            to_currency = request.data.get('to_currency', 'USDT').upper()
            amount = float(request.data.get('amount', 0))
            
            if amount <= 0:
                return Response({
                    "error": "Сумма должна быть больше 0"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if from_currency == to_currency:
                return Response({
                    "error": "Валюты должны быть разные"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Получаем курс конвертации
            import requests
            
            try:
                # Пытаемся получить курс с Bybit
                if from_currency == 'RUB':
                    # Конвертация из RUB в крипто
                    symbol = f'{to_currency}RUB'
                else:
                    # Конвертация из крипто в RUB
                    symbol = f'{from_currency}RUB'
                
                response = requests.get(
                    'https://api.bybit.com/v5/market/tickers',
                    params={
                        'category': 'spot',
                        'symbol': symbol
                    },
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('retCode') == 0 and data.get('result', {}).get('list'):
                        ticker = data['result']['list'][0]
                        rate = float(ticker.get('lastPrice', 0))
                        
                        if rate > 0:
                            # Вычисляем результат конвертации
                            if from_currency == 'RUB':
                                # RUB -> Крипто (используем более низкий курс)
                                final_rate = rate * 0.995
                                result_amount = amount / final_rate
                            else:
                                # Крипто -> RUB (используем более низкий курс)
                                final_rate = rate * 0.995
                                result_amount = amount * final_rate
                            
                            return Response({
                                "success": True,
                                "from_currency": from_currency,
                                "to_currency": to_currency,
                                "from_amount": amount,
                                "to_amount": round(result_amount, 8),
                                "rate": rate,
                                "final_rate": round(final_rate, 8),
                                "fee_percent": 0.5,
                                "timestamp": timezone.now().isoformat(),
                                "source": "Bybit"
                            })
                
            except Exception as e:
                logger.warning(f"Bybit conversion error: {e}")
            
            # Fallback значения
            fallback_rates = {
                'USDTRUB': 97.50,
                'BTCRUB': 6500000,
                'ETHRUB': 250000,
                'BNBRUB': 61000,
                'XRPRUB': 3.50,
                'ADARUB': 1.20,
                'SOLRUB': 220,
                'DOGECOIN': 0.40,
            }
            
            symbol = f'{to_currency if from_currency == "RUB" else from_currency}RUB'
            symbol = symbol.replace('RUB', '') + 'RUB'
            
            rate = fallback_rates.get(symbol, 100)
            
            if from_currency == 'RUB':
                final_rate = rate * 0.995
                result_amount = amount / final_rate
            else:
                final_rate = rate * 0.995
                result_amount = amount * final_rate
            
            return Response({
                "success": True,
                "from_currency": from_currency,
                "to_currency": to_currency,
                "from_amount": amount,
                "to_amount": round(result_amount, 8),
                "rate": rate,
                "final_rate": round(final_rate, 8),
                "fee_percent": 0.5,
                "timestamp": timezone.now().isoformat(),
                "source": "fallback"
            })
            
        except Exception as e:
            logger.error(f"Error converting currency: {e}")
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPaymentCountriesView(APIView):
    """Получить список доступных стран для платежей"""
    
    DEFAULT_COUNTRIES = [
        {'name': 'Абхазия', 'code': 'AB', 'flag': '🇺🇳', 'is_active': True},
        {'name': 'Аргентина', 'code': 'AR', 'flag': '🇦🇷', 'is_active': True},
        {'name': 'Армения', 'code': 'AM', 'flag': '🇦🇲', 'is_active': True},
        {'name': 'Азербайджан', 'code': 'AZ', 'flag': '🇦🇿', 'is_active': True},
        {'name': 'Беларусь', 'code': 'BY', 'flag': '🇧🇾', 'is_active': True},
        {'name': 'Кипр', 'code': 'CY', 'flag': '🇨🇾', 'is_active': True},
        {'name': 'Казахстан', 'code': 'KZ', 'flag': '🇰🇿', 'is_active': True},
        {'name': 'Киргизия', 'code': 'KG', 'flag': '🇰🇬', 'is_active': True},
        {'name': 'Польша', 'code': 'PL', 'flag': '🇵🇱', 'is_active': True},
        {'name': 'Россия', 'code': 'RU', 'flag': '🇷🇺', 'is_active': True},
        {'name': 'Сербия', 'code': 'RS', 'flag': '🇷🇸', 'is_active': True},
        {'name': 'Словакия', 'code': 'SK', 'flag': '🇸🇰', 'is_active': True},
        {'name': 'Таджикистан', 'code': 'TJ', 'flag': '🇹🇯', 'is_active': True},
        {'name': 'Украина', 'code': 'UA', 'flag': '🇺🇦', 'is_active': True},
        {'name': 'Узбекистан', 'code': 'UZ', 'flag': '🇺🇿', 'is_active': True},
    ]
    
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def ensure_countries_exist(self):
        """Создает страны если их нет в базе"""
        if PaymentCountry.objects.count() == 0:
            for country_data in self.DEFAULT_COUNTRIES:
                PaymentCountry.objects.get_or_create(
                    code=country_data['code'],
                    defaults=country_data
                )
    
    def get(self, request):
        """Получает все активные страны"""
        try:
            # Автоматически создаем страны если их нет
            self.ensure_countries_exist()
            
            countries = PaymentCountry.objects.filter(is_active=True)
            serializer = PaymentCountrySerializer(countries, many=True)
            
            return Response({
                "success": True,
                "countries": serializer.data
            })
        except Exception as e:
            logger.error(f"Error fetching countries: {e}")
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPaymentRequisitesView(APIView):
    """Получить платежные реквизиты пользователя"""
    
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Получает все реквизиты текущего пользователя"""
        # Проверяем авторизацию
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({"error": "Не авторизован"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response({"error": "Неверный токен"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            requisites = PaymentRequisite.objects.filter(user=user).select_related('device', 'country')
            serializer = PaymentRequisiteSerializer(requisites, many=True)
            
            return Response({
                "success": True,
                "requisites": serializer.data,
                "count": requisites.count()
            })
        except Exception as e:
            logger.error(f"Error fetching requisites: {e}")
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddPaymentRequisiteView(APIView):
    """Добавить новый платежный реквизит"""
    
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Создает новый платежный реквизит для пользователя"""
        # Проверяем авторизацию
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({"error": "Не авторизован"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response({"error": "Неверный токен"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            serializer = CreatePaymentRequisiteSerializer(data=request.data)
            
            if serializer.is_valid():
                # Проверяем лимиты на количество реквизитов
                count = PaymentRequisite.objects.filter(user=user).count()
                if count >= 10:
                    return Response({
                        "error": "Максимум 10 платежных реквизитов"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Создаем реквизит
                requisite = serializer.save(user=user)
                
                return Response({
                    "success": True,
                    "message": "Платежный реквизит успешно добавлен",
                    "requisite": PaymentRequisiteSerializer(requisite).data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error adding requisite: {e}")
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeletePaymentRequisiteView(APIView):
    """Удалить платежный реквизит"""
    
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def delete(self, request, requisite_id):
        """Удаляет платежный реквизит пользователя"""
        # Проверяем авторизацию
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({"error": "Не авторизован"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response({"error": "Неверный токен"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            requisite = PaymentRequisite.objects.get(id=requisite_id, user=user)
            requisite.delete()
            
            return Response({
                "success": True,
                "message": "Платежный реквизит успешно удален"
            })
        except PaymentRequisite.DoesNotExist:
            return Response({
                "error": "Реквизит не найден"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting requisite: {e}")
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdjustUserBalanceView(APIView):
    """Изменение баланса пользователя (только для администратора)"""
    
    def post(self, request, user_id):
        # Проверяем авторизацию
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response(
                {"error": "Не авторизован"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            admin_user = token.user
        except (Token.DoesNotExist, IndexError):
            return Response(
                {"error": "Неверный токен"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверяем, что это администратор
        if not admin_user.is_staff:
            return Response(
                {"error": "У вас нет прав для выполнения этого действия"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем данные из запроса
        amount = request.data.get('amount')
        transaction_type = request.data.get('type', 'deposit')  # deposit, withdrawal, charge, refund
        description = request.data.get('description', '')
        
        if amount is None:
            return Response(
                {"error": "Сумма не указана"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response(
                {"error": "Неверный формат суммы"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount <= 0:
            return Response(
                {"error": "Сумма должна быть положительной"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем тип транзакции
        valid_types = ['deposit', 'withdrawal', 'charge', 'refund']
        if transaction_type not in valid_types:
            return Response(
                {"error": f"Неверный тип транзакции. Допустимые: {', '.join(valid_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth.models import User
            target_user = User.objects.get(id=user_id)
            profile = target_user.profile
        except User.DoesNotExist:
            return Response(
                {"error": "Пользователь не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Профиль пользователя не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Сохраняем баланс до операции
        balance_before = float(profile.balance)
        
        # Изменяем баланс в зависимости от типа операции
        if transaction_type in ['deposit', 'refund']:
            # Пополнение или возврат - добавляем
            profile.balance = float(profile.balance) + amount
        else:
            # Вывод или списание - вычитаем
            if float(profile.balance) < amount:
                return Response(
                    {"error": f"Недостаточно средств. Текущий баланс: ${balance_before:.2f}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            profile.balance = float(profile.balance) - amount
        
        balance_after = float(profile.balance)
        profile.save()
        
        # Создаем запись в истории баланса
        if not description:
            type_descriptions = {
                'deposit': 'Пополнение баланса администратором',
                'withdrawal': 'Вывод средств администратором',
                'charge': 'Списание администратором',
                'refund': 'Возврат средств администратором',
            }
            description = type_descriptions.get(transaction_type, 'Операция администратором')
        
        BalanceHistory.objects.create(
            user=target_user,
            transaction_type=transaction_type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description
        )
        
        return Response({
            "success": True,
            "message": f"Баланс пользователя {target_user.username} успешно изменен",
            "balance_before": balance_before,
            "balance_after": balance_after,
            "amount": amount,
            "type": transaction_type
        })





