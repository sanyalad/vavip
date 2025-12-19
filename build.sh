#!/bin/bash
# Скрипт для быстрой сборки Docker с BuildKit
# Использование: ./build.sh [prod|dev]

ENV=${1:-dev}

# Включаем BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "Building Docker images with BuildKit..."

if [ "$ENV" = "prod" ]; then
    echo "Building PRODUCTION images..."
    docker-compose -f docker-compose.prod.yml build --parallel
    echo "To start: docker-compose -f docker-compose.prod.yml up -d"
else
    echo "Building DEVELOPMENT images..."
    docker-compose build --parallel
    echo "To start: docker-compose up"
fi

echo "Build complete!"

