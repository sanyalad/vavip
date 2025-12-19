# Скрипт для быстрой сборки Docker с BuildKit
# Использование: .\build.ps1 [prod|dev]

param(
    [Parameter(Position=0)]
    [ValidateSet("prod", "dev")]
    [string]$Env = "dev"
)

# Включаем BuildKit
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

Write-Host "Building Docker images with BuildKit..." -ForegroundColor Green

if ($Env -eq "prod") {
    Write-Host "Building PRODUCTION images..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml build --parallel
    Write-Host "To start: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Cyan
} else {
    Write-Host "Building DEVELOPMENT images..." -ForegroundColor Yellow
    docker-compose build --parallel
    Write-Host "To start: docker-compose up" -ForegroundColor Cyan
}

Write-Host "Build complete!" -ForegroundColor Green

