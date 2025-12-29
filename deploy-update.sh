#!/bin/bash
# Скрипт для обновления существующего деплоя на сервере
# Использование: ./deploy-update.sh [BRANCH]
# Пример: ./deploy-update.sh main

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BRANCH="${1:-main}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=============================================="
echo "🔄 Vavip Deployment Update Script"
echo "=============================================="
echo ""

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

# Определяем команду docker compose
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Проверяем что мы в git репозитории
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository!${NC}"
    echo -e "${YELLOW}💡 Use deploy.sh for initial deployment${NC}"
    exit 1
fi

# Проверяем наличие docker-compose.prod.yml
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: $COMPOSE_FILE not found!${NC}"
    exit 1
fi

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${CYAN}📋 Current branch: $CURRENT_BRANCH${NC}"
echo -e "${CYAN}📋 Target branch: $BRANCH${NC}"
echo ""

# Бэкапим .env файлы
echo -e "${CYAN}💾 Backing up .env files...${NC}"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

find . -maxdepth 3 -name ".env" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true
find . -maxdepth 3 -name ".env.*" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true

echo -e "${GREEN}✓ .env files backed up${NC}"
echo ""

# Получаем последние изменения
echo -e "${CYAN}📥 Fetching latest changes from repository...${NC}"
git fetch origin

# Проверяем есть ли изменения
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${YELLOW}⚠️  No new changes to pull (already up to date)${NC}"
    echo -e "${CYAN}💡 To force rebuild, run: $COMPOSE_CMD -f $COMPOSE_FILE up -d --build --force-recreate${NC}"
    exit 0
fi

echo -e "${CYAN}📥 Pulling changes from origin/$BRANCH...${NC}"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Восстанавливаем .env файлы
echo -e "${CYAN}📥 Restoring .env files...${NC}"
if [ -d "$TEMP_DIR" ] && [ "$(ls -A $TEMP_DIR 2>/dev/null)" ]; then
    cp -r "$TEMP_DIR"/* . 2>/dev/null || true
    echo -e "${GREEN}✓ .env files restored${NC}"
fi

echo ""

# Останавливаем контейнеры
echo -e "${CYAN}🛑 Stopping containers...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Запускаем скрипт очистки (опционально, можно пропустить для ускорения)
echo -e "${CYAN}🧹 Cleaning old images (keeping recent builds)...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" down --rmi local --remove-orphans 2>/dev/null || true
docker image prune -f --filter "until=24h" 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup completed${NC}"
echo ""

# Собираем новые образы
echo -e "${CYAN}🏗️  Building new images...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" build --pull

echo -e "${GREEN}✓ Images built${NC}"
echo ""

# Запускаем контейнеры
echo -e "${CYAN}🚀 Starting containers...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d

echo ""

# Ждем запуска сервисов
echo -e "${CYAN}⏳ Waiting for services to start...${NC}"
sleep 10

# Проверяем статус
echo -e "${CYAN}📊 Container status:${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

echo ""

# Проверяем health checks
echo -e "${CYAN}🏥 Checking service health...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

check_backend() {
    curl -f http://localhost:5000/api/health > /dev/null 2>&1
}

check_frontend() {
    curl -f http://localhost > /dev/null 2>&1
}

BACKEND_HEALTHY=false
FRONTEND_HEALTHY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if check_backend; then
        BACKEND_HEALTHY=true
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

echo ""
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if check_frontend; then
        FRONTEND_HEALTHY=true
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

echo ""

# Финальный статус
echo "=============================================="
if [ "$BACKEND_HEALTHY" = true ] && [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ Update completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Service URLs:${NC}"
    echo "   Frontend: http://localhost (port 80)"
    echo "   Backend API: http://localhost:5000/api"
    echo ""
    echo -e "${CYAN}💡 Useful commands:${NC}"
    echo "   View logs: $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    echo "   View backend logs: $COMPOSE_CMD -f $COMPOSE_FILE logs -f backend"
    echo "   View frontend logs: $COMPOSE_CMD -f $COMPOSE_FILE logs -f frontend"
else
    echo -e "${YELLOW}⚠️  Update completed with warnings${NC}"
    echo ""
    echo -e "${YELLOW}Some services may not be healthy yet. Check logs:${NC}"
    echo "   $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100"
fi
echo "=============================================="

