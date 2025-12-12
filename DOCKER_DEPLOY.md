# TrustX - Docker Deployment Guide

## 🚀 Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone <your-repo-url>
cd trustX
```

### 2. Настройте переменные окружения
```bash
cp .env.docker .env
nano .env  # или используйте любой текстовый редактор
```

Обязательно заполните:
- `SECRET_KEY` - секретный ключ Django (минимум 50 символов)
- `DB_PASSWORD` - пароль для PostgreSQL
- `TELEGRAM_BOT_TOKEN` - токен бота для уведомлений
- `TELEGRAM_CHAT_ID` - ID чата для уведомлений
- `MERCHANT_WALLET_ADDRESS` - ваш TRC20 кошелёк
- `TRONGRID_API_KEY` - API ключ TronGrid

### 3. Запустите приложение

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh up
```

**Windows:**
```cmd
deploy.bat up
```

**Или напрямую через Docker Compose:**
```bash
docker compose up -d --build
```

### 4. Проверьте работу
- Frontend: http://localhost
- Admin: http://localhost/admin
- API: http://localhost/api/

Логин администратора по умолчанию:
- Username: `admin`
- Password: `admin123`

⚠️ **Обязательно смените пароль после первого входа!**

---

## 📋 Команды управления

| Команда | Описание |
|---------|----------|
| `./deploy.sh up` | Запустить все сервисы |
| `./deploy.sh down` | Остановить все сервисы |
| `./deploy.sh restart` | Перезапустить сервисы |
| `./deploy.sh logs` | Просмотр логов |
| `./deploy.sh logs backend` | Логи только backend |
| `./deploy.sh build` | Пересобрать образы |
| `./deploy.sh shell-backend` | Консоль Django |
| `./deploy.sh shell-db` | Консоль PostgreSQL |
| `./deploy.sh migrate` | Применить миграции |
| `./deploy.sh createsuperuser` | Создать суперпользователя |
| `./deploy.sh clean` | Удалить всё (контейнеры, данные) |

---

## 🔒 Настройка SSL (HTTPS)

### Вариант 1: Let's Encrypt (бесплатно)

1. Укажите домен в `.env`:
```env
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

2. Получите сертификат:
```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your@email.com \
  --agree-tos
```

3. Раскомментируйте HTTPS блок в `nginx/nginx.conf`

4. Перезапустите nginx:
```bash
docker compose restart nginx
```

### Вариант 2: Cloudflare (рекомендуется)

1. Добавьте домен в Cloudflare
2. Включите "Full (strict)" SSL
3. Получите Origin Certificate и добавьте в `nginx/ssl/`

---

## 🏗️ Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Frontend   │     │  Backend    │
│  (port 80)  │     │  (React)    │     │  (Django)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐            │
       └───────────▶│ PostgreSQL  │◀───────────┘
                    │   (db)      │
                    └─────────────┘
```

---

## 📁 Структура файлов

```
trustX/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
├── docker-compose.yml
├── .env.docker
├── deploy.sh
├── deploy.bat
└── DOCKER_DEPLOY.md
```

---

## 🔧 Решение проблем

### Контейнер не запускается
```bash
docker compose logs backend
docker compose logs frontend
```

### База данных не подключается
```bash
docker compose exec db psql -U postgres -c "SELECT 1"
```

### Сброс базы данных
```bash
./deploy.sh down
docker volume rm trustx_postgres_data
./deploy.sh up
```

### Очистка Docker
```bash
docker system prune -a
docker volume prune
```

---

## 🔐 Безопасность

Перед продакшном:

1. ✅ Измените `SECRET_KEY` на случайную строку
2. ✅ Установите `DEBUG=False`
3. ✅ Измените пароль администратора
4. ✅ Настройте SSL/HTTPS
5. ✅ Ограничьте `ALLOWED_HOSTS`
6. ✅ Используйте сложный пароль для PostgreSQL

---

## 📞 Поддержка

- Telegram: @trustx_support
- Email: support@trustx.io
