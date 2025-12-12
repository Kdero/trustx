from django.urls import path
from . import views

app_name = 'crypto_payments'

urlpatterns = [
    # Создание платежа
    path('payment/create', views.create_payment, name='create_payment'),
    
    # Проверка статуса платежа
    path('payment/<str:payment_id>/status', views.check_payment, name='check_payment'),
    
    # Детали платежа с транзакциями
    path('payment/<str:payment_id>/detail', views.payment_detail, name='payment_detail'),
    
    # Платежи текущего пользователя
    path('payments/my', views.my_payments, name='my_payments'),
    
    # Проверка адреса
    path('verify-address', views.verify_address, name='verify_address'),
    
    # Баланс адреса
    path('balance/<str:address>', views.get_balance, name='get_balance'),
    
    # ========== ADMIN ENDPOINTS ==========
    # Список всех депозитов (для админов)
    path('admin/deposits', views.admin_list_deposits, name='admin_list_deposits'),
    
    # Подтвердить депозит
    path('admin/deposits/<str:payment_id>/approve', views.admin_approve_deposit, name='admin_approve_deposit'),
    
    # Отклонить депозит
    path('admin/deposits/<str:payment_id>/reject', views.admin_reject_deposit, name='admin_reject_deposit'),
]
