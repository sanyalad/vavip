#!/bin/bash
# Скрипт для ПОЛНОГО удаления проекта с сервера
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные проекта включая базу данных!
# Использование: ./server-remove-all.sh [PROJECT_DIR]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="${1:-$(pwd)}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=============================================="
echo -e "${RED}⚠️  ПОЛНОЕ УДАЛЕНИЕ ПРОЕКТА С СЕРВЕРА${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}Этот скрипт удалит:${NC}"
echo "  - Все Docker контейнеры проекта"
echo "  - Все Docker образы проекта"
echo "  - Все Docker volumes (включая БАЗУ ДАННЫХ!)"
echo "  - Директорию проекта: $PROJECT_DIR"
echo ""
echo -e "${RED}⚠️  ВНИМАНИЕ: Все данные будут потеряны безвозвратно!${NC}"
echo ""

# Проверяем что директория существует
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория $PROJECT_DIR не существует!${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Проверяем наличие docker-compose файла
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${YELLOW}⚠️  $COMPOSE_FILE не найден в $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Продолжить удаление директории? (y/N):${NC}"
    read -r CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        echo "Отменено"
        exit 0
    fi
else
    echo -e "${CYAN}📦 Создание backup базы данных...${NC}"
    BACKUP_DIR="/tmp/vavip-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup .env файлов
    if [ -f "backend/.env" ]; then
        cp -r backend/.env "$BACKUP_DIR/backend.env.backup" 2>/dev/null || true
        echo -e "${GREEN}✓ backend/.env сохранен в $BACKUP_DIR${NC}"
    fi
    if [ -f "frontend/.env" ]; then
        cp -r frontend/.env "$BACKUP_DIR/frontend.env.backup" 2>/dev/null || true
        echo -e "${GREEN}✓ frontend/.env сохранен в $BACKUP_DIR${NC}"
    fi
    if [ -f ".env" ]; then
        cp -r .env "$BACKUP_DIR/root.env.backup" 2>/dev/null || true
        echo -e "${GREEN}✓ .env сохранен в $BACKUP_DIR${NC}"
    fi
    
    # Backup базы данных
    echo -e "${CYAN}💾 Создание backup базы данных...${NC}"
    if docker-compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U vavip vavip > "$BACKUP_DIR/database_backup.sql" 2>/dev/null || true
        if [ -f "$BACKUP_DIR/database_backup.sql" ] && [ -s "$BACKUP_DIR/database_backup.sql" ]; then
            echo -e "${GREEN}✓ База данных сохранена в $BACKUP_DIR/database_backup.sql${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  База данных не запущена, backup пропущен${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Backup сохранен в: $BACKUP_DIR${NC}"
    echo ""
fi

# Финальное подтверждение
echo -e "${RED}=============================================="
echo "⚠️  ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!"
echo "=============================================="
echo -e "${NC}"
echo -e "${RED}Вы уверены что хотите УДАЛИТЬ ВСЕ данные проекта?${NC}"
echo -e "${YELLOW}Это действие НЕОБРАТИМО!${NC}"
echo ""
echo "Введите 'DELETE' (заглавными буквами) для подтверждения:"
read -r FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "DELETE" ]; then
    echo -e "${GREEN}✓ Удаление отменено${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}🗑️  Начинаем удаление...${NC}"
echo ""

# Останавливаем и удаляем контейнеры
if [ -f "$COMPOSE_FILE" ]; then
    echo -e "${CYAN}🛑 Останавливаем контейнеры...${NC}"
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}✓ Контейнеры остановлены${NC}"
    echo ""
    
    # Удаляем контейнеры, образы и volumes
    echo -e "${CYAN}🗑️  Удаляем контейнеры, образы и volumes...${NC}"
    docker-compose -f "$COMPOSE_FILE" down -v --rmi all --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}✓ Docker ресурсы удалены${NC}"
    echo ""
fi

# Удаляем образы проекта по имени
echo -e "${CYAN}🗑️  Удаляем образы проекта...${NC}"
PROJECT_NAME=$(basename "$PROJECT_DIR" | tr '[:upper:]' '[:lower:]')
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(vavip|$PROJECT_NAME)" | xargs -r docker rmi -f 2>/dev/null || true
echo -e "${GREEN}✓ Образы удалены${NC}"
echo ""

# Переходим в родительскую директорию
cd "$(dirname "$PROJECT_DIR")"
PROJECT_DIR_NAME=$(basename "$PROJECT_DIR")

# Удаляем директорию проекта
echo -e "${CYAN}🗑️  Удаляем директорию проекта...${NC}"
if [ -d "$PROJECT_DIR_NAME" ]; then
    rm -rf "$PROJECT_DIR_NAME"
    echo -e "${GREEN}✓ Директория $PROJECT_DIR_NAME удалена${NC}"
else
    echo -e "${YELLOW}⚠️  Директория уже не существует${NC}"
fi
echo ""

# Очищаем неиспользуемые Docker ресурсы (опционально)
echo -e "${CYAN}🧹 Очищаем неиспользуемые Docker ресурсы...${NC}"
docker system prune -f --volumes 2>/dev/null || true
echo -e "${GREEN}✓ Docker очищен${NC}"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ Удаление завершено!${NC}"
echo "=============================================="
echo ""
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${CYAN}📦 Backup сохранен в: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}💡 Сохраните backup перед его автоматическим удалением!${NC}"
    echo ""
fi
echo -e "${CYAN}📊 Использование диска Docker:${NC}"
docker system df
echo ""

