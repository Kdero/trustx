#!/bin/bash

# ==============================================
# TrustX Docker Deployment Script
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   TrustX Docker Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo -e "${YELLOW}   Copying from .env.docker...${NC}"
    cp .env.docker .env
    echo -e "${RED}❌ Please edit .env file with your settings and run again!${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    exit 1
fi

# Parse arguments
ACTION=${1:-up}

case $ACTION in
    up)
        echo -e "${GREEN}🚀 Starting TrustX...${NC}"
        docker compose up -d --build
        echo -e "${GREEN}✅ TrustX is running!${NC}"
        echo -e "${GREEN}   Frontend: http://localhost${NC}"
        echo -e "${GREEN}   Admin: http://localhost/admin${NC}"
        echo -e "${GREEN}   API: http://localhost/api/${NC}"
        ;;
    down)
        echo -e "${YELLOW}🛑 Stopping TrustX...${NC}"
        docker compose down
        echo -e "${GREEN}✅ TrustX stopped${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting TrustX...${NC}"
        docker compose restart
        echo -e "${GREEN}✅ TrustX restarted${NC}"
        ;;
    logs)
        docker compose logs -f ${2:-}
        ;;
    build)
        echo -e "${GREEN}🔨 Building TrustX...${NC}"
        docker compose build --no-cache
        echo -e "${GREEN}✅ Build complete${NC}"
        ;;
    clean)
        echo -e "${RED}🧹 Cleaning up...${NC}"
        docker compose down -v --rmi all
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    shell-backend)
        docker compose exec backend bash
        ;;
    shell-db)
        docker compose exec db psql -U postgres -d trustx
        ;;
    migrate)
        echo -e "${GREEN}🔄 Running migrations...${NC}"
        docker compose exec backend python manage.py migrate
        ;;
    collectstatic)
        echo -e "${GREEN}📦 Collecting static files...${NC}"
        docker compose exec backend python manage.py collectstatic --noinput
        ;;
    createsuperuser)
        docker compose exec backend python manage.py createsuperuser
        ;;
    *)
        echo "Usage: $0 {up|down|restart|logs|build|clean|shell-backend|shell-db|migrate|collectstatic|createsuperuser}"
        echo ""
        echo "Commands:"
        echo "  up              - Start all services"
        echo "  down            - Stop all services"
        echo "  restart         - Restart all services"
        echo "  logs [service]  - View logs (optional: specific service)"
        echo "  build           - Rebuild all images"
        echo "  clean           - Remove all containers, volumes, and images"
        echo "  shell-backend   - Open shell in backend container"
        echo "  shell-db        - Open PostgreSQL shell"
        echo "  migrate         - Run Django migrations"
        echo "  collectstatic   - Collect static files"
        echo "  createsuperuser - Create Django superuser"
        exit 1
        ;;
esac
