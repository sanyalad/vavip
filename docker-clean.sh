#!/bin/bash
# Скрипт для очистки Docker перед сборкой
# Использование: ./docker-clean.sh [light|medium|full]

MODE=${1:-light}

echo "Docker cleanup script"
echo "Mode: $MODE"
echo ""

case $MODE in
  light)
    echo "Light cleanup: Build cache only..."
    docker builder prune -a -f
    echo "✓ Build cache cleaned"
    ;;
  medium)
    echo "Medium cleanup: Unused images + build cache..."
    docker image prune -a -f
    docker builder prune -a -f
    echo "✓ Unused images and build cache cleaned"
    ;;
  full)
    echo "Full cleanup: Stopping containers, removing images, cleaning cache..."
    docker-compose down 2>/dev/null || true
    docker-compose down --rmi all 2>/dev/null || true
    docker builder prune -a -f
    docker image prune -a -f
    echo "✓ Full cleanup completed"
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [light|medium|full]"
    exit 1
    ;;
esac

echo ""
echo "Disk usage:"
docker system df



