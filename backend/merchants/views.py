from rest_framework.views import APIView
from rest_framework.response import Response
from merchants.models import Merchant
from merchants.serializers import MerchantSerializer
from rest_framework.generics import ListAPIView

class RegisterMerchant(APIView):
    def post(self, request):
        name = request.data.get("name")
        webhook_url = request.data.get("webhook_url", None)
        merchant = Merchant.objects.create(name=name, webhook_url=webhook_url)
        return Response(MerchantSerializer(merchant).data)
    
class ListMerchants(ListAPIView):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer
