"""
Сервис для работы с TRON блокчейном и TRC20 токенами.
Использует TronGrid API для мониторинга транзакций.
"""
import os
import hashlib
import requests
from decimal import Decimal
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from cryptography.fernet import Fernet
from base58 import b58encode_check, b58decode_check
import ecdsa
import logging

logger = logging.getLogger(__name__)


# ============================================
# КОНФИГУРАЦИЯ - ЗАПОЛНИТЕ СВОИ ДАННЫЕ
# ============================================

# TronGrid API ключ (получить на https://www.trongrid.io/)
TRONGRID_API_KEY = os.environ.get('TRONGRID_API_KEY', 'YOUR_TRONGRID_API_KEY')

# Ключ шифрования для приватных ключей (сгенерируйте: Fernet.generate_key())
ENCRYPTION_KEY = os.environ.get('CRYPTO_ENCRYPTION_KEY', 'YOUR_FERNET_KEY')

# USDT TRC20 контракт (mainnet)
USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

# ВАШ ОСНОВНОЙ КОШЕЛЁК для приёма всех платежей
MERCHANT_WALLET_ADDRESS = 'TMDLvTzQLeLp2SrcjwAwJ4CcZqiji12XZ6'

# Сеть: 'mainnet' или 'shasta' (тестнет)
TRON_NETWORK = os.environ.get('TRON_NETWORK', 'mainnet')

# Минимальное количество подтверждений
MIN_CONFIRMATIONS = 19

# Время жизни платежа (минуты)
PAYMENT_EXPIRY_MINUTES = 60

# ============================================


class TronGridAPI:
    """
    Класс для работы с TronGrid API.
    """
    
    BASE_URLS = {
        'mainnet': 'https://api.trongrid.io',
        'shasta': 'https://api.shasta.trongrid.io',
    }
    
    def __init__(self):
        self.base_url = self.BASE_URLS.get(TRON_NETWORK, self.BASE_URLS['mainnet'])
        self.api_key = TRONGRID_API_KEY
        self.headers = {
            'TRON-PRO-API-KEY': self.api_key,
            'Content-Type': 'application/json',
        }
    
    def get_account_info(self, address: str) -> Optional[Dict]:
        """Получить информацию об аккаунте"""
        try:
            url = f"{self.base_url}/v1/accounts/{address}"
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [{}])[0] if data.get('data') else None
            return None
        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            return None
    
    def get_trc20_transactions(self, address: str, limit: int = 50, 
                                only_confirmed: bool = True,
                                min_timestamp: int = None) -> List[Dict]:
        """
        Получить TRC20 транзакции для адреса.
        """
        try:
            url = f"{self.base_url}/v1/accounts/{address}/transactions/trc20"
            params = {
                'limit': limit,
                'only_confirmed': str(only_confirmed).lower(),
            }
            if min_timestamp:
                params['min_timestamp'] = min_timestamp
            
            response = requests.get(url, headers=self.headers, params=params, timeout=15)
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            return []
        except Exception as e:
            logger.error(f"Error getting TRC20 transactions: {e}")
            return []
    
    def get_transaction_info(self, tx_hash: str) -> Optional[Dict]:
        """Получить информацию о транзакции"""
        try:
            url = f"{self.base_url}/v1/transactions/{tx_hash}"
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [{}])[0] if data.get('data') else None
            return None
        except Exception as e:
            logger.error(f"Error getting transaction info: {e}")
            return None
    
    def get_current_block(self) -> Optional[int]:
        """Получить номер текущего блока"""
        try:
            url = f"{self.base_url}/wallet/getnowblock"
            response = requests.post(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('block_header', {}).get('raw_data', {}).get('number')
            return None
        except Exception as e:
            logger.error(f"Error getting current block: {e}")
            return None
    
    def get_usdt_balance(self, address: str) -> Decimal:
        """Получить баланс USDT TRC20"""
        try:
            account_info = self.get_account_info(address)
            if not account_info:
                return Decimal('0')
            
            trc20_balances = account_info.get('trc20', [])
            for token in trc20_balances:
                if USDT_CONTRACT_ADDRESS in token:
                    # USDT имеет 6 decimals
                    raw_balance = int(token[USDT_CONTRACT_ADDRESS])
                    return Decimal(raw_balance) / Decimal(10**6)
            return Decimal('0')
        except Exception as e:
            logger.error(f"Error getting USDT balance: {e}")
            return Decimal('0')


class TronWalletGenerator:
    """
    Генератор TRON кошельков.
    Без использования HD-wallet для максимальной простоты.
    """
    
    @staticmethod
    def generate_keypair() -> Tuple[str, str]:
        """
        Генерирует пару приватный/публичный ключ и TRON адрес.
        Returns: (private_key_hex, tron_address)
        """
        # Генерируем приватный ключ
        sk = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
        private_key = sk.to_string().hex()
        
        # Получаем публичный ключ
        vk = sk.get_verifying_key()
        public_key = vk.to_string().hex()
        
        # Генерируем TRON адрес из публичного ключа
        address = TronWalletGenerator._public_key_to_address(public_key)
        
        return private_key, address
    
    @staticmethod
    def _public_key_to_address(public_key: str) -> str:
        """Конвертирует публичный ключ в TRON адрес"""
        # Keccak256 хеш публичного ключа
        public_key_bytes = bytes.fromhex(public_key)
        
        # Используем sha3_256 как замену keccak256
        import hashlib
        keccak = hashlib.sha3_256(public_key_bytes).digest()
        
        # Берём последние 20 байт
        address_bytes = keccak[-20:]
        
        # Добавляем префикс 0x41 для TRON mainnet
        address_with_prefix = b'\x41' + address_bytes
        
        # Base58Check encode
        address = b58encode_check(address_with_prefix).decode('utf-8')
        
        return address
    
    @staticmethod
    def private_key_to_address(private_key: str) -> str:
        """Получает адрес из приватного ключа"""
        sk = ecdsa.SigningKey.from_string(bytes.fromhex(private_key), curve=ecdsa.SECP256k1)
        vk = sk.get_verifying_key()
        public_key = vk.to_string().hex()
        return TronWalletGenerator._public_key_to_address(public_key)


class CryptoEncryption:
    """
    Шифрование приватных ключей.
    """
    
    def __init__(self):
        if ENCRYPTION_KEY == 'YOUR_FERNET_KEY':
            raise ValueError("CRYPTO_ENCRYPTION_KEY не настроен! Сгенерируйте ключ.")
        self.fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    
    def encrypt(self, data: str) -> str:
        """Зашифровать данные"""
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Расшифровать данные"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()


class PaymentService:
    """
    Главный сервис для управления крипто-платежами.
    Все платежи идут на один фиксированный кошелёк.
    Идентификация платежей по уникальной сумме.
    """
    
    def __init__(self):
        self.trongrid = TronGridAPI()
        self.wallet_generator = TronWalletGenerator()
        try:
            self.encryption = CryptoEncryption()
        except ValueError:
            self.encryption = None
            logger.warning("Encryption not configured - private keys will not be encrypted!")
    
    def create_payment(self, amount: Decimal, currency: str = 'USDT',
                       user=None, metadata: Dict = None, 
                       callback_url: str = None) -> 'CryptoPayment':
        """
        Создать новый платёж на фиксированный кошелёк.
        Верификация платежей выполняется вручную через админ-панель.
        """
        from .models import PaymentAddress, CryptoPayment
        
        # Используем фиксированный адрес кошелька
        wallet_address = MERCHANT_WALLET_ADDRESS
        
        # Получаем или создаём запись адреса
        payment_address, created = PaymentAddress.objects.get_or_create(
            address=wallet_address,
            defaults={
                'private_key_encrypted': 'EXTERNAL_WALLET',
                'derivation_index': 0,
            }
        )
        
        # Создаём платёж
        expires_at = timezone.now() + timedelta(minutes=PAYMENT_EXPIRY_MINUTES)
        
        payment = CryptoPayment.objects.create(
            user=user,
            payment_address=payment_address,
            currency=currency,
            amount_expected=amount,
            expires_at=expires_at,
            metadata=metadata or {},
            callback_url=callback_url,
        )
        
        return payment
    
    def check_payment(self, payment: 'CryptoPayment') -> bool:
        """
        Проверить статус платежа.
        Returns: True если статус изменился
        """
        from .models import TransactionLog
        
        if payment.status in ['completed', 'expired']:
            return False
        
        # Проверяем истечение срока
        if payment.expires_at < timezone.now() and payment.status == 'pending':
            payment.status = 'expired'
            payment.save()
            return True
        
        # Получаем транзакции на адрес
        address = payment.payment_address.address
        transactions = self.trongrid.get_trc20_transactions(
            address,
            only_confirmed=True,
            min_timestamp=int(payment.created_at.timestamp() * 1000)
        )
        
        status_changed = False
        
        for tx in transactions:
            # Проверяем что это USDT
            token_info = tx.get('token_info', {})
            if token_info.get('address') != USDT_CONTRACT_ADDRESS:
                continue
            
            # Проверяем что транзакция входящая
            if tx.get('to') != address:
                continue
            
            tx_hash = tx.get('transaction_id')
            
            # Проверяем, не обрабатывали ли уже эту транзакцию
            if TransactionLog.objects.filter(tx_hash=tx_hash).exists():
                continue
            
            # Получаем сумму (USDT имеет 6 decimals)
            raw_amount = int(tx.get('value', 0))
            amount = Decimal(raw_amount) / Decimal(10**6)
            
            # Получаем информацию о блоке для подтверждений
            current_block = self.trongrid.get_current_block()
            tx_block = tx.get('block_timestamp', 0)
            confirmations = 0
            
            if current_block and tx.get('block'):
                confirmations = current_block - tx.get('block', current_block)
            
            # Логируем транзакцию
            tx_log = TransactionLog.objects.create(
                tx_hash=tx_hash,
                from_address=tx.get('from', ''),
                to_address=address,
                amount=amount,
                currency='USDT',
                block_number=tx.get('block', 0),
                confirmations=confirmations,
                payment=payment,
            )
            
            # Обновляем платёж
            payment.amount_received += amount
            payment.tx_hash = tx_hash
            payment.confirmations = confirmations
            
            # Проверяем достаточно ли подтверждений
            if confirmations >= MIN_CONFIRMATIONS:
                if payment.amount_received >= payment.amount_expected:
                    payment.status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.payment_address.is_used = True
                    payment.payment_address.save()
                    
                    # Отправляем callback
                    self._send_callback(payment)
                else:
                    payment.status = 'confirming'
            else:
                payment.status = 'confirming'
            
            tx_log.processed = True
            tx_log.save()
            status_changed = True
        
        if status_changed:
            payment.save()
        
        return status_changed
    
    def _send_callback(self, payment: 'CryptoPayment'):
        """Отправить callback о завершении платежа"""
        if not payment.callback_url:
            return
        
        try:
            payload = {
                'payment_id': payment.payment_id,
                'status': payment.status,
                'amount_expected': str(payment.amount_expected),
                'amount_received': str(payment.amount_received),
                'currency': payment.currency,
                'tx_hash': payment.tx_hash,
                'metadata': payment.metadata,
            }
            
            requests.post(
                payment.callback_url,
                json=payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
        except Exception as e:
            logger.error(f"Failed to send callback for payment {payment.payment_id}: {e}")
    
    def get_payment_status(self, payment_id: str) -> Optional[Dict]:
        """Получить статус платежа по ID"""
        from .models import CryptoPayment
        
        try:
            payment = CryptoPayment.objects.get(payment_id=payment_id)
            
            # Проверяем обновления
            self.check_payment(payment)
            
            return {
                'payment_id': payment.payment_id,
                'status': payment.status,
                'address': payment.payment_address.address,
                'currency': payment.currency,
                'amount_expected': str(payment.amount_expected),
                'amount_received': str(payment.amount_received),
                'confirmations': payment.confirmations,
                'expires_at': payment.expires_at.isoformat(),
                'created_at': payment.created_at.isoformat(),
                'tx_hash': payment.tx_hash,
            }
        except CryptoPayment.DoesNotExist:
            return None
