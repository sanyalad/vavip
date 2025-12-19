#!/bin/bash
# Скрипт для быстрой сборки Docker с BuildKit
# Использование: ./build.sh [prod|dev]

ENV=${1:-dev}

# Включаем BuildKit (необходимо для cache mounts)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "Building Docker images with BuildKit..."

# Проверяем доступность BuildKit
if ! docker buildx version &>/dev/null; then
    echo "Warning: BuildKit may not be available. Installing buildx..."
    docker buildx install || echo "Could not install buildx. Build will continue with legacy builder."
fi

if [ "$ENV" = "prod" ]; then
    echo "Building PRODUCTION images..."
    docker-compose -f docker-compose.prod.yml build --parallel
    echo ""
    echo "To start: docker-compose -f docker-compose.prod.yml up -d"
else
    echo "Building DEVELOPMENT images..."
    docker-compose build --parallel
    echo ""
    echo "To start: docker-compose up"
fi

echo ""
echo "Build complete!"

