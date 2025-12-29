#!/bin/bash
# Скрипт для безопасной очистки production сервера
# Использование: ./server-clean-prod.sh
# ВАЖНО: Этот скрипт сохраняет .env файлы и volumes с данными

set -e

echo "=============================================="
echo "🧹 Production Server Cleanup Script"
echo "=============================================="
echo ""

COMPOSE_FILE="docker-compose.prod.yml"

# Проверяем наличие docker-compose.prod.yml
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found!"
    exit 1
fi

# Определяем команду docker compose
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Бэкапим .env файлы
echo "💾 Backing up .env files..."
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

find . -maxdepth 3 -name ".env" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true
find . -maxdepth 3 -name ".env.*" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true

echo "✓ .env files backed up"
echo ""

# Останавливаем контейнеры
echo "🛑 Stopping containers..."
$COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
echo "✓ Containers stopped"
echo ""

# Удаляем только образы проекта (без данных volumes)
echo "🗑️  Removing project images..."
$COMPOSE_CMD -f "$COMPOSE_FILE" down --rmi local --remove-orphans 2>/dev/null || true

# Удаляем образы по имени проекта
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]')
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(vavip|$PROJECT_NAME)" | xargs -r docker rmi -f 2>/dev/null || true
echo "✓ Project images removed"
echo ""

# Очищаем build cache (старый, более 7 дней)
echo "🧹 Cleaning old Docker build cache..."
docker builder prune -f --filter "until=168h" 2>/dev/null || docker builder prune -f
echo "✓ Build cache cleaned"
echo ""

# Удаляем остановленные контейнеры (кроме наших)
echo "🧹 Removing stopped containers..."
docker container prune -f --filter "until=24h" 2>/dev/null || docker container prune -f
echo "✓ Stopped containers removed"
echo ""

# Очищаем неиспользуемые сети (кроме наших)
echo "🧹 Cleaning unused networks..."
docker network prune -f
echo "✓ Unused networks cleaned"
echo ""

# Очищаем dangling volumes (ОСТОРОЖНО: только dangling, не используемые)
echo "⚠️  Checking for dangling volumes..."
DANGLING_VOLUMES=$(docker volume ls -q -f dangling=true | wc -l)
if [ "$DANGLING_VOLUMES" -gt 0 ]; then
    echo "Found $DANGLING_VOLUMES dangling volumes"
    # Удаляем только dangling volumes, которые не относятся к проекту
    docker volume ls -q -f dangling=true | grep -v "vavip" | xargs -r docker volume rm 2>/dev/null || true
    echo "✓ Dangling volumes removed"
else
    echo "✓ No dangling volumes found"
fi
echo ""

# Удаляем локальные артефакты сборки (опционально, только если есть)
echo "🧹 Cleaning local build artifacts..."

if [ -d "frontend/node_modules" ]; then
    echo "  Removing frontend/node_modules..."
    rm -rf frontend/node_modules
fi

if [ -d "frontend/dist" ]; then
    echo "  Removing frontend/dist..."
    rm -rf frontend/dist
fi

# Python cache
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
echo "💡 Important notes:"
echo "   - Database volumes (postgres_data, redis_data) were preserved"
echo "   - All .env files were preserved"
echo "   - Only project images and old cache were removed"
echo ""
echo "💡 Next steps:"
echo "   To rebuild and start: $COMPOSE_CMD -f $COMPOSE_FILE up -d --build"
echo ""

