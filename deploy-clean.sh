#!/bin/bash
# Скрипт для полной очистки сервера перед деплоем production
# Использование: ./deploy-clean.sh

set -e

echo "=============================================="
echo "Production Deployment Cleanup Script"
echo "=============================================="
echo ""

# Проверяем, что мы используем production compose файл
COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found!"
    exit 1
fi

echo "📦 Backing up .env files..."
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Находим и сохраняем все .env файлы
find . -maxdepth 3 -name ".env" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true
find . -maxdepth 3 -name ".env.*" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true

echo "✓ .env files backed up"
echo ""

# Останавливаем контейнеры (production)
echo "🛑 Stopping production containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
echo "✓ Containers stopped"
echo ""

# Удаляем старые образы проекта
echo "🗑️  Removing old project images..."
docker-compose -f $COMPOSE_FILE down --rmi all --remove-orphans 2>/dev/null || true

# Удаляем образы по имени проекта
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]')
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(vavip|$PROJECT_NAME)" | xargs -r docker rmi -f 2>/dev/null || true
echo "✓ Old images removed"
echo ""

# Очищаем build cache
echo "🧹 Cleaning Docker build cache..."
docker builder prune -a -f --filter "until=24h" 2>/dev/null || docker builder prune -a -f
echo "✓ Build cache cleaned"
echo ""

# Удаляем остановленные контейнеры
echo "🧹 Removing stopped containers..."
docker container prune -f
echo "✓ Stopped containers removed"
echo ""

# Удаляем неиспользуемые volumes (ОСТОРОЖНО: только если они не нужны)
echo "⚠️  Checking for unused volumes..."
UNUSED_VOLUMES=$(docker volume ls -q -f dangling=true | wc -l)
if [ "$UNUSED_VOLUMES" -gt 0 ]; then
    echo "Found $UNUSED_VOLUMES unused volumes (keeping project volumes)"
    docker volume ls -q -f dangling=true | grep -v "vavip" | xargs -r docker volume rm 2>/dev/null || true
fi
echo ""

# Очищаем неиспользуемые сети
echo "🧹 Cleaning unused networks..."
docker network prune -f
echo "✓ Unused networks cleaned"
echo ""

# Удаляем локальные артефакты сборки (если есть)
echo "🧹 Cleaning local build artifacts..."

if [ -d "frontend/node_modules" ]; then
    echo "  Removing frontend/node_modules..."
    rm -rf frontend/node_modules
fi

if [ -d "frontend/dist" ]; then
    echo "  Removing frontend/dist..."
    rm -rf frontend/dist
fi

if [ -d "backend/__pycache__" ]; then
    echo "  Removing Python cache..."
    find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find backend -type f -name "*.pyc" -delete 2>/dev/null || true
    find backend -type f -name "*.pyo" -delete 2>/dev/null || true
fi

echo "✓ Local artifacts cleaned"
echo ""

# Восстанавливаем .env файлы
echo "📥 Restoring .env files..."
if [ -d "$TEMP_DIR" ] && [ "$(ls -A $TEMP_DIR 2>/dev/null)" ]; then
    cp -r "$TEMP_DIR"/* . 2>/dev/null || true
    echo "✓ .env files restored"
else
    echo "⚠️  No .env files to restore"
fi
echo ""

echo "=============================================="
echo "✅ Cleanup completed successfully!"
echo "=============================================="
echo ""
echo "📊 Docker disk usage:"
docker system df
echo ""
echo "💡 Next steps:"
echo "   1. Ensure .env file is configured: ./backend/.env"
echo "   2. Build and start: docker-compose -f $COMPOSE_FILE up -d --build"
echo ""

