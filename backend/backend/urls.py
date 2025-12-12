from django.urls import path, include
from django.contrib import admin
from django.views.decorators.csrf import csrf_exempt
from merchants.views import RegisterMerchant, ListMerchants
from payments.views import CreatePayment, ListPayments, CreateWithdrawalView, ListWithdrawalsView, CancelWithdrawalView
from auth_app.views import (RegisterUser, LoginUser, VerifyUserView, ListUsersView, UserDetailView, 
                           GetDevicesView, AddDeviceView, DeleteDeviceView, GetBalanceStatsView, 
                           GetCurrencyPairsView, ConvertCurrencyView,
                           GetPaymentCountriesView, GetPaymentRequisitesView, AddPaymentRequisiteView, 
                           DeletePaymentRequisiteView, AdjustUserBalanceView,
                           UpdateProfileView, ChangePasswordView)

# Настройка заголовков админ-панели
admin.site.site_header = "TrustX Admin"
admin.site.site_title = "TrustX"
admin.site.index_title = "Панель управления"

urlpatterns = [
    # Админ-панель
    path("admin/", admin.site.urls),
    
    path("api/v1/auth/register", RegisterUser.as_view()),
    path("api/v1/auth/login", LoginUser.as_view()),
    path("api/v1/auth/me", UserDetailView.as_view()),
    path("api/v1/auth/profile/update", csrf_exempt(UpdateProfileView.as_view())),
    path("api/v1/auth/password/change", csrf_exempt(ChangePasswordView.as_view())),
    path("api/v1/auth/users", ListUsersView.as_view()),
    path("api/v1/auth/users/<int:user_id>/verify", VerifyUserView.as_view()),
    path("api/v1/auth/users/<int:user_id>/balance", AdjustUserBalanceView.as_view()),
    path("api/v1/auth/balance/stats", GetBalanceStatsView.as_view()),
    path("api/v1/auth/currency/pairs", GetCurrencyPairsView.as_view()),
    path("api/v1/auth/currency/convert", ConvertCurrencyView.as_view()),
    
    # Endpoints for payment requisites
    path("api/v1/payment/countries", csrf_exempt(GetPaymentCountriesView.as_view())),
    path("api/v1/payment/requisites", csrf_exempt(GetPaymentRequisitesView.as_view())),
    path("api/v1/payment/requisites/add", csrf_exempt(AddPaymentRequisiteView.as_view())),
    path("api/v1/payment/requisites/<int:requisite_id>", csrf_exempt(DeletePaymentRequisiteView.as_view())),
    
    # Endpoints for devices
    path("api/v1/devices", GetDevicesView.as_view()),
    path("api/v1/devices/add", AddDeviceView.as_view()),
    path("api/v1/devices/<int:device_id>", DeleteDeviceView.as_view()),

    path("api/v1/merchants/register", RegisterMerchant.as_view()),
    path("api/v1/merchants/all", ListMerchants.as_view()),

    path("api/v1/payment/create", CreatePayment.as_view()),
    path("api/v1/payments/all", ListPayments.as_view()),
    
    # Withdrawal endpoints
    path("api/v1/withdrawals", csrf_exempt(ListWithdrawalsView.as_view())),
    path("api/v1/withdrawals/create", csrf_exempt(CreateWithdrawalView.as_view())),
    path("api/v1/withdrawals/<uuid:withdrawal_id>/cancel", csrf_exempt(CancelWithdrawalView.as_view())),
    
    # Balance stats (aliased for frontend compatibility)
    path("api/v1/payments/stats/", GetBalanceStatsView.as_view()),
    path("api/v1/payments/analytics/", GetBalanceStatsView.as_view()),
    
    # Crypto payments (TRC20 USDT)
    path("api/v1/crypto/", include('crypto_payments.urls')),
]


