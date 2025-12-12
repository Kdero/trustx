import asyncio
import logging
from telegram import Bot
from telegram.error import TelegramError

logger = logging.getLogger(__name__)


class TelegramNotifier:
    """Класс для отправки уведомлений в Telegram"""
    
    def __init__(self, bot_token: str, chat_id: str):
        """
        Args:
            bot_token: Токен бота Telegram (получить от @BotFather)
            chat_id: ID чата или канала для отправки сообщений
        """
        self.bot = Bot(token=bot_token)
        self.chat_id = chat_id
    
    async def send_registration_notification(self, username: str, telegram: str = None):
        """Отправить уведомление о новой регистрации"""
        try:
            message = (
                f"🎉 <b>Новая регистрация!</b>\n\n"
                f"👤 <b>Пользователь:</b> <code>{username}</code>\n"
                + (f"💬 <b>Telegram:</b> <a href='https://t.me/{telegram.lstrip('@')}'><code>{telegram}</code></a>\n" if telegram else "")
                + f"⏰ <b>Время:</b> только что\n"
                + f"❌ <b>Статус:</b> Не верифицирован"
            )
            
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode="HTML"
            )
            logger.info(f"Notification sent for user: {username}")
        except TelegramError as e:
            logger.error(f"Failed to send Telegram notification: {e}")
    
    async def send_login_notification(self, username: str):
        """Отправить уведомление о входе пользователя"""
        try:
            message = (
                f"🔓 <b>Вход в систему!</b>\n\n"
                f"👤 <b>Пользователь:</b> <code>{username}</code>\n"
                f"⏰ <b>Время:</b> только что"
            )
            
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode="HTML"
            )
            logger.info(f"Login notification sent for user: {username}")
        except TelegramError as e:
            logger.error(f"Failed to send Telegram notification: {e}")
    
    async def send_verification_notification(self, username: str):
        """Отправить уведомление о верификации пользователя"""
        try:
            message = (
                f"✅ <b>Пользователь верифицирован!</b>\n\n"
                f"👤 <b>Пользователь:</b> <code>{username}</code>\n"
                f"⏰ <b>Время:</b> только что\n"
                f"✔️ <b>Статус:</b> Верифицирован"
            )
            
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode="HTML"
            )
            logger.info(f"Verification notification sent for user: {username}")
        except TelegramError as e:
            logger.error(f"Failed to send Telegram notification: {e}")


def get_notifier() -> TelegramNotifier:
    """Получить экземпляр TelegramNotifier с параметрами из конфигурации"""
    from django.conf import settings
    
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    chat_id = getattr(settings, 'TELEGRAM_CHAT_ID', '')
    
    if not bot_token or not chat_id:
        logger.warning("Telegram bot token or chat ID not configured")
        return None
    
    return TelegramNotifier(bot_token=bot_token, chat_id=chat_id)


def send_notification_sync(username: str, event_type: str = "registration", telegram: str = None):
    """Синхронная функция для отправки уведомлений"""
    notifier = get_notifier()
    if not notifier:
        return
    
    try:
        if event_type == "registration":
            asyncio.run(notifier.send_registration_notification(username, telegram))
        elif event_type == "login":
            asyncio.run(notifier.send_login_notification(username))
        elif event_type == "verified":
            asyncio.run(notifier.send_verification_notification(username))
    except Exception as e:
        logger.error(f"Error sending notification: {e}")

