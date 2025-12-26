#!/bin/bash
# Скрипт для очистки сервера с сохранением .env файлов
# Использование: ./server-clean.sh

set -e

echo "Server cleanup script (preserving .env files)"
echo "=============================================="
echo ""

# Сохраняем .env файлы во временную директорию
TEMP_DIR=$(mktemp -d)
echo "Backing up .env files..."

# Находим и сохраняем все .env файлы
find . -name ".env" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true
find . -name ".env.local" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true
find . -name ".env.production" -type f -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || true

echo "✓ .env files backed up"
echo ""

# Останавливаем контейнеры
echo "Stopping containers..."
docker-compose down 2>/dev/null || true
echo "✓ Containers stopped"
echo ""

# Удаляем образы проекта
echo "Removing project images..."
docker-compose down --rmi all 2>/dev/null || true
echo "✓ Project images removed"
echo ""

# Очищаем build cache
echo "Cleaning build cache..."
docker builder prune -a -f
echo "✓ Build cache cleaned"
echo ""

# Удаляем node_modules (если есть)
if [ -d "frontend/node_modules" ]; then
    echo "Removing frontend/node_modules..."
    rm -rf frontend/node_modules
    echo "✓ frontend/node_modules removed"
fi

# Удаляем dist (если есть)
if [ -d "frontend/dist" ]; then
    echo "Removing frontend/dist..."
    rm -rf frontend/dist
    echo "✓ frontend/dist removed"
fi

# Удаляем __pycache__ (если есть)
echo "Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
echo "✓ Python cache removed"
echo ""

# Удаляем .pytest_cache (если есть)
if [ -d "backend/.pytest_cache" ]; then
    echo "Removing backend/.pytest_cache..."
    rm -rf backend/.pytest_cache
    echo "✓ .pytest_cache removed"
fi

# Удаляем instance/ (если есть, кроме .env)
if [ -d "backend/instance" ]; then
    echo "Cleaning backend/instance (preserving .env)..."
    find backend/instance -type f ! -name ".env*" -delete 2>/dev/null || true
    echo "✓ instance/ cleaned"
fi

# Восстанавливаем .env файлы
echo ""
echo "Restoring .env files..."
if [ -d "$TEMP_DIR" ] && [ "$(ls -A $TEMP_DIR 2>/dev/null)" ]; then
    cp -r "$TEMP_DIR"/* . 2>/dev/null || true
    echo "✓ .env files restored"
else
    echo "⚠ No .env files to restore"
fi

# Удаляем временную директорию
rm -rf "$TEMP_DIR"

echo ""
echo "=============================================="
echo "✓ Cleanup completed!"
echo ""
echo "Disk usage:"
docker system df




