"""
Django management команда для мониторинга крипто-платежей.
Запускается как фоновый процесс для проверки входящих транзакций.

Использование:
    python manage.py monitor_payments
    python manage.py monitor_payments --interval=30  # проверка каждые 30 секунд
"""
import time
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from crypto_payments.models import CryptoPayment
from crypto_payments.services import PaymentService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Мониторинг входящих крипто-платежей TRC20'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=15,
            help='Интервал проверки в секундах (по умолчанию: 15)'
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help='Выполнить одну проверку и завершить'
        )
    
    def handle(self, *args, **options):
        interval = options['interval']
        once = options['once']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Запуск мониторинга крипто-платежей...')
        )
        self.stdout.write(f'   Интервал проверки: {interval} сек.')
        
        service = PaymentService()
        
        while True:
            try:
                self._check_payments(service)
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'❌ Ошибка при проверке платежей: {e}')
                )
                logger.exception('Error in payment monitoring')
            
            if once:
                break
            
            time.sleep(interval)
    
    def _check_payments(self, service: PaymentService):
        """Проверить все ожидающие и подтверждаемые платежи"""
        
        # Получаем платежи для проверки
        payments = CryptoPayment.objects.filter(
            status__in=['pending', 'confirming']
        ).select_related('payment_address')
        
        if not payments.exists():
            self.stdout.write(f'[{timezone.now().strftime("%H:%M:%S")}] Нет активных платежей')
            return
        
        self.stdout.write(
            f'[{timezone.now().strftime("%H:%M:%S")}] Проверка {payments.count()} платежей...'
        )
        
        for payment in payments:
            try:
                # Проверяем истечение срока
                if payment.expires_at < timezone.now() and payment.status == 'pending':
                    payment.status = 'expired'
                    payment.save()
                    self.stdout.write(
                        self.style.WARNING(f'   ⏰ Платёж #{payment.payment_id} истёк')
                    )
                    continue
                
                # Проверяем транзакции
                changed = service.check_payment(payment)
                
                if changed:
                    payment.refresh_from_db()
                    status_emoji = {
                        'pending': '⏳',
                        'confirming': '🔄',
                        'completed': '✅',
                        'expired': '⏰',
                        'failed': '❌',
                    }
                    emoji = status_emoji.get(payment.status, '❓')
                    
                    msg = f'   {emoji} Платёж #{payment.payment_id}: {payment.status}'
                    if payment.amount_received > 0:
                        msg += f' ({payment.amount_received}/{payment.amount_expected} {payment.currency})'
                    
                    style = self.style.SUCCESS if payment.status == 'completed' else self.style.WARNING
                    self.stdout.write(style(msg))
                    
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'   ❌ Ошибка проверки #{payment.payment_id}: {e}')
                )
