@echo off
REM ==============================================
REM TrustX Docker Deployment Script (Windows)
REM ==============================================

setlocal enabledelayedexpansion

echo ========================================
echo    TrustX Docker Deployment
echo ========================================

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found!
    echo Copying from .env.docker...
    copy .env.docker .env
    echo [ERROR] Please edit .env file with your settings and run again!
    exit /b 1
)

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    exit /b 1
)

REM Parse arguments
set ACTION=%1
if "%ACTION%"=="" set ACTION=up

if "%ACTION%"=="up" (
    echo [INFO] Starting TrustX...
    docker compose up -d --build
    echo.
    echo [SUCCESS] TrustX is running!
    echo    Frontend: http://localhost
    echo    Admin: http://localhost/admin
    echo    API: http://localhost/api/
    goto :eof
)

if "%ACTION%"=="down" (
    echo [INFO] Stopping TrustX...
    docker compose down
    echo [SUCCESS] TrustX stopped
    goto :eof
)

if "%ACTION%"=="restart" (
    echo [INFO] Restarting TrustX...
    docker compose restart
    echo [SUCCESS] TrustX restarted
    goto :eof
)

if "%ACTION%"=="logs" (
    docker compose logs -f %2
    goto :eof
)

if "%ACTION%"=="build" (
    echo [INFO] Building TrustX...
    docker compose build --no-cache
    echo [SUCCESS] Build complete
    goto :eof
)

if "%ACTION%"=="clean" (
    echo [WARNING] Cleaning up...
    docker compose down -v --rmi all
    echo [SUCCESS] Cleanup complete
    goto :eof
)

if "%ACTION%"=="shell-backend" (
    docker compose exec backend bash
    goto :eof
)

if "%ACTION%"=="shell-db" (
    docker compose exec db psql -U postgres -d trustx
    goto :eof
)

if "%ACTION%"=="migrate" (
    echo [INFO] Running migrations...
    docker compose exec backend python manage.py migrate
    goto :eof
)

if "%ACTION%"=="createsuperuser" (
    docker compose exec backend python manage.py createsuperuser
    goto :eof
)

echo Usage: deploy.bat {up^|down^|restart^|logs^|build^|clean^|shell-backend^|shell-db^|migrate^|createsuperuser}
echo.
echo Commands:
echo   up              - Start all services
echo   down            - Stop all services
echo   restart         - Restart all services
echo   logs [service]  - View logs
echo   build           - Rebuild all images
echo   clean           - Remove all containers and images
echo   shell-backend   - Open shell in backend container
echo   shell-db        - Open PostgreSQL shell
echo   migrate         - Run Django migrations
echo   createsuperuser - Create Django superuser
