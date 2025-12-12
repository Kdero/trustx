from django.core.management.base import BaseCommand
from decimal import Decimal
from crypto_payments.models import CryptoPayment
from auth_app.models import BalanceHistory


class Command(BaseCommand):
    help = 'Синхронизировать завершённые депозиты с историей баланса'

    def handle(self, *args, **options):
        completed = CryptoPayment.objects.filter(
            status='completed',
            user__isnull=False
        )
        
        self.stdout.write(f'Найдено {completed.count()} завершённых депозитов')
        
        created = 0
        skipped = 0
        
        for payment in completed:
            # Проверяем, есть ли уже запись
            exists = BalanceHistory.objects.filter(
                description__contains=payment.payment_id
            ).exists()
            
            if exists:
                skipped += 1
                self.stdout.write(f'  {payment.payment_id}: пропущен (уже есть)')
                continue
            
            try:
                profile = payment.user.profile
                
                BalanceHistory.objects.create(
                    user=payment.user,
                    transaction_type='deposit',
                    amount=Decimal(str(payment.amount_expected)),
                    balance_before=0,
                    balance_after=profile.balance,
                    description=f'Крипто депозит #{payment.payment_id}'
                )
                
                created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  {payment.payment_id}: создана запись на ${payment.amount_expected}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  {payment.payment_id}: ошибка - {e}')
                )
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Создано записей: {created}'))
        self.stdout.write(f'Пропущено: {skipped}')
