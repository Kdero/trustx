# Система ролей пользователей

## Описание

Система TrustX поддерживает две роли пользователей:
- **Admin** - администратор системы с полным доступом
- **User** - обычный пользователь с ограниченным доступом

## Роли и права

### Admin (Администратор)
- ✅ Доступ к админ-панели (`/admin`)
- ✅ Просмотр всех пользователей
- ✅ Верификация пользователей
- ✅ Просмотр мерчантов и платежей
- ✅ Управление системой

### User (Пользователь)
- ✅ Регистрация и авторизация
- ✅ Просмотр своего профиля
- ✅ Ожидание верификации
- ❌ Доступ к админ-панели
- ❌ Управление другими пользователями

## Как создать администратора

### Способ 1: Django Command Line

```bash
cd backend
python manage.py createsuperuser
```

Введите:
- Username: admin
- Email: admin@example.com
- Password: (ваш пароль)

### Способ 2: Django Admin панель

1. Создайте обычного пользователя через регистрацию
2. Перейдите на `http://localhost:8000/admin/`
3. Войдите с существующими супер-пользователем
4. Откройте "Users" (Пользователи)
5. Найдите пользователя
6. Отметьте "Superuser status"
7. Сохраните

## API Endpoints

### Получить текущего пользователя

```
GET /api/v1/auth/me
Authorization: Token YOUR_TOKEN
```

**Ответ:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "profile": {
    "is_verified": true,
    "verified_at": "2025-12-07T12:00:00Z"
  }
}
```

### Получить список пользователей (только админ)

```
GET /api/v1/auth/users
Authorization: Token YOUR_TOKEN
```

**Ответ:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "is_verified": true,
    "created_at": "2025-12-07T12:00:00Z",
    "verified_at": "2025-12-07T12:00:00Z"
  },
  {
    "id": 2,
    "username": "user",
    "role": "user",
    "is_verified": false,
    "created_at": "2025-12-07T12:30:00Z",
    "verified_at": null
  }
]
```

## Frontend интеграция

### Сохранение роли в localStorage

При входе приложение сохраняет роль пользователя:

```javascript
localStorage.setItem("role", res.data.role); // "admin" или "user"
```

### Проверка роли в компонентах

```tsx
const role = localStorage.getItem("role");

if (role === "admin") {
  // Показать админ-функции
}
```

### Условная навигация

В `root.tsx` отображается ссылка на админ-панель только для администраторов:

```tsx
{role === "admin" && (
  <Link to="/admin">Админ панель</Link>
)}
```

### Защита маршрутов

На странице админ-панели (`admin.tsx`) проверяется роль:

```tsx
if (role !== "admin") {
  return <div>❌ Доступ запрещен</div>;
}
```

## Примеры использования

### Проверить, является ли пользователь администратором

```javascript
const isAdmin = localStorage.getItem("role") === "admin";

if (isAdmin) {
  console.log("Это администратор");
} else {
  console.log("Это обычный пользователь");
}
```

### Скрыть/показать элементы в зависимости от роли

```tsx
function SomeComponent() {
  const role = localStorage.getItem("role");

  return (
    <div>
      <p>Привет, пользователь!</p>
      
      {role === "admin" && (
        <button>Управление системой</button>
      )}
      
      {role === "user" && (
        <button>Мой профиль</button>
      )}
    </div>
  );
}
```

## Безопасность

### Backend проверка

Все API endpoints с правами администратора проверяют:

```python
if not request.user.is_staff:
    return Response(
        {"error": "У вас нет прав для выполнения этого действия"},
        status=status.HTTP_403_FORBIDDEN
    )
```

### Frontend проверка

Frontend проверяет роль перед отправкой запроса и отображением UI элементов.

## Миграция существующих пользователей

Если у вас есть существующие пользователи и вы хотите сделать одного администратором:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User

user = User.objects.get(username="username")
user.is_staff = True
user.is_superuser = True
user.save()
```

## Troubleshooting

### Пользователь не видит админ-панель

1. Убедитесь, что пользователь имеет `is_superuser=True` в БД
2. Проверьте localStorage: `console.log(localStorage.getItem("role"))`
3. Убедитесь, что вы вошли заново после изменения роли

### Админ-панель показывает "Доступ запрещен"

1. Проверьте, что это действительно администратор
2. Убедитесь, что token правильно передается в заголовке
3. Проверьте логи backend сервера

## Дополнительно

- Роль хранится в поле `is_superuser` Django User модели
- Можно добавить дополнительные роли через Groups в Django
- Все изменения роли требуют перезагрузки страницы или нового входа
