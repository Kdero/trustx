"""
Скрипт для создания профилей для существующих пользователей
Запустить: python manage.py shell < create_existing_profiles.py
"""

from django.contrib.auth.models import User
from auth_app.models import UserProfile

# Получаем всех пользователей без профилей
users_without_profiles = User.objects.filter(profile__isnull=True)

print(f"Создание профилей для {users_without_profiles.count()} пользователей...")

for user in users_without_profiles:
    UserProfile.objects.create(user=user)
    print(f"✅ Профиль создан для пользователя: {user.username}")

print("✅ Все профили созданы успешно!")
