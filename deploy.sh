#!/bin/bash
# Скрипт для первоначального деплоя проекта на сервер
# Использование: ./deploy.sh [REPO_URL] [BRANCH] [DEPLOY_DIR]
# Пример: ./deploy.sh https://github.com/user/vavip2.git main /opt/vavip

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Параметры
REPO_URL="${1:-}"
BRANCH="${2:-main}"
DEPLOY_DIR="${3:-$(pwd)}"

echo "=============================================="
echo "🚀 Vavip Production Deployment Script"
echo "=============================================="
echo ""

# Проверка наличия Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed!${NC}"
    exit 1
fi

# Проверка прав на выполнение Docker
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Error: No permission to run Docker commands!${NC}"
    echo -e "${YELLOW}💡 Hint: Add your user to docker group or run with sudo${NC}"
    exit 1
fi

# Если указан репозиторий, клонируем его
if [ -n "$REPO_URL" ]; then
    echo -e "${CYAN}📦 Cloning repository...${NC}"
    echo "   Repository: $REPO_URL"
    echo "   Branch: $BRANCH"
    echo "   Directory: $DEPLOY_DIR"
    echo ""
    
    # Создаем директорию если не существует
    mkdir -p "$(dirname "$DEPLOY_DIR")"
    
    # Если директория уже существует, делаем backup или удаляем
    if [ -d "$DEPLOY_DIR" ]; then
        if [ -d "$DEPLOY_DIR/.git" ]; then
            echo -e "${YELLOW}⚠️  Directory already exists and contains git repository${NC}"
            echo -e "${CYAN}📥 Updating existing repository...${NC}"
            cd "$DEPLOY_DIR"
            git fetch origin
            git checkout "$BRANCH"
            git pull origin "$BRANCH"
        else
            echo -e "${YELLOW}⚠️  Directory exists but is not a git repository${NC}"
            BACKUP_DIR="${DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
            echo -e "${CYAN}📦 Creating backup to: $BACKUP_DIR${NC}"
            mv "$DEPLOY_DIR" "$BACKUP_DIR"
            git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
        fi
    else
        git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
    fi
    
    cd "$DEPLOY_DIR"
else
    # Если репозиторий не указан, работаем в текущей директории
    echo -e "${CYAN}📂 Using current directory: $(pwd)${NC}"
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo -e "${RED}❌ Error: docker-compose.prod.yml not found!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ Repository ready${NC}"
echo ""

# Проверяем наличие необходимых файлов
echo -e "${CYAN}🔍 Checking required files...${NC}"
REQUIRED_FILES=("docker-compose.prod.yml" "backend/env.example" "frontend/env.example")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required files present${NC}"
echo ""

# Создаем .env файлы если их нет
echo -e "${CYAN}⚙️  Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  .env not found, creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env and set POSTGRES_PASSWORD!${NC}"
    fi
else
    echo -e "${GREEN}✓ .env exists${NC}"
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found, creating from env.example...${NC}"
    cp backend/env.example backend/.env
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit backend/.env with your production values!${NC}"
    echo -e "${YELLOW}⚠️  Make sure DATABASE_URL password matches POSTGRES_PASSWORD in root .env!${NC}"
else
    echo -e "${GREEN}✓ backend/.env exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found, creating from env.example...${NC}"
    cp frontend/env.example frontend/.env
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit frontend/.env with your production values!${NC}"
else
    echo -e "${GREEN}✓ frontend/.env exists${NC}"
fi

echo ""

# Запрашиваем подтверждение перед продолжением
echo -e "${YELLOW}⚠️  IMPORTANT: Make sure you have configured:${NC}"
echo "   1. .env (root) - POSTGRES_PASSWORD"
echo "   2. backend/.env - database, secrets, API keys (DATABASE_URL password must match POSTGRES_PASSWORD)"
echo "   3. frontend/.env - API URLs, analytics keys"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Запускаем скрипт очистки
if [ -f "deploy-clean.sh" ]; then
    echo -e "${CYAN}🧹 Running cleanup script...${NC}"
    chmod +x deploy-clean.sh
    ./deploy-clean.sh
else
    echo -e "${YELLOW}⚠️  deploy-clean.sh not found, skipping cleanup${NC}"
fi

echo ""

# Собираем и запускаем контейнеры
echo -e "${CYAN}🏗️  Building and starting containers...${NC}"
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

$COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
$COMPOSE_CMD -f docker-compose.prod.yml up -d

echo ""

# Ждем пока сервисы запустятся
echo -e "${CYAN}⏳ Waiting for services to start...${NC}"
sleep 10

# Проверяем статус контейнеров
echo -e "${CYAN}📊 Container status:${NC}"
$COMPOSE_CMD -f docker-compose.prod.yml ps

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
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Service URLs:${NC}"
    echo "   Frontend: http://localhost (port 80)"
    echo "   Backend API: http://localhost:5000/api"
    echo ""
    echo -e "${CYAN}💡 Useful commands:${NC}"
    echo "   View logs: $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
    echo "   Stop services: $COMPOSE_CMD -f docker-compose.prod.yml down"
    echo "   Restart services: $COMPOSE_CMD -f docker-compose.prod.yml restart"
    echo "   Update deployment: ./deploy-update.sh"
else
    echo -e "${YELLOW}⚠️  Deployment completed with warnings${NC}"
    echo ""
    echo -e "${YELLOW}Some services may not be healthy yet. Check logs:${NC}"
    echo "   $COMPOSE_CMD -f docker-compose.prod.yml logs"
fi
echo "=============================================="

