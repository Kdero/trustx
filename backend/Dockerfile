# Backend Dockerfile - Django
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database\n\
echo "Waiting for PostgreSQL..."\n\
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do\n\
  sleep 1\n\
done\n\
echo "PostgreSQL is ready!"\n\
\n\
# Run migrations\n\
python manage.py migrate --noinput\n\
\n\
# Create superuser if not exists (uses env variables)\n\
python manage.py shell -c "\n\
import os\n\
from django.contrib.auth import get_user_model\n\
User = get_user_model()\n\
username = os.getenv(\"DJANGO_SUPERUSER_USERNAME\", \"admin\")\n\
email = os.getenv(\"DJANGO_SUPERUSER_EMAIL\", \"admin@trustx.io\")\n\
password = os.getenv(\"DJANGO_SUPERUSER_PASSWORD\", \"admin123\")\n\
if not User.objects.filter(username=username).exists():\n\
    User.objects.create_superuser(username, email, password)\n\
    print(f\"Superuser {username} created\")\n\
else:\n\
    print(f\"Superuser {username} already exists\")\n\
" || true\n\
\n\
# Initialize countries\n\
python manage.py init_payment_countries || true\n\
\n\
# Start server\n\
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
