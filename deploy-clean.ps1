# Скрипт для полной очистки сервера перед деплоем production
# Использование: .\deploy-clean.ps1

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "Production Deployment Cleanup Script" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Проверяем, что мы используем production compose файл
$composeFile = "docker-compose.prod.yml"
if (-not (Test-Path $composeFile)) {
    Write-Host "❌ Error: $composeFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Backing up .env files..." -ForegroundColor Cyan
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

# Находим и сохраняем все .env файлы
Get-ChildItem -Path . -Filter ".env*" -Recurse -File -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $targetPath = Join-Path $tempDir.FullName $relativePath
    $targetDir = Split-Path $targetPath -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item $_.FullName -Destination $targetPath -Force
}

Write-Host "✓ .env files backed up" -ForegroundColor Green
Write-Host ""

# Останавливаем контейнеры (production)
Write-Host "🛑 Stopping production containers..." -ForegroundColor Cyan
docker-compose -f $composeFile down --remove-orphans 2>$null
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Удаляем старые образы проекта
Write-Host "🗑️  Removing old project images..." -ForegroundColor Cyan
docker-compose -f $composeFile down --rmi all --remove-orphans 2>$null

# Удаляем образы по имени проекта
$projectName = (Get-Item (Get-Location)).Name.ToLower()
docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "(vavip|$projectName)" | ForEach-Object {
    docker rmi -f $_.ToString() 2>$null
}
Write-Host "✓ Old images removed" -ForegroundColor Green
Write-Host ""

# Очищаем build cache
Write-Host "🧹 Cleaning Docker build cache..." -ForegroundColor Cyan
docker builder prune -a -f
Write-Host "✓ Build cache cleaned" -ForegroundColor Green
Write-Host ""

# Удаляем остановленные контейнеры
Write-Host "🧹 Removing stopped containers..." -ForegroundColor Cyan
docker container prune -f
Write-Host "✓ Stopped containers removed" -ForegroundColor Green
Write-Host ""

# Удаляем неиспользуемые volumes (ОСТОРОЖНО: только если они не нужны)
Write-Host "⚠️  Checking for unused volumes..." -ForegroundColor Yellow
$unusedVolumes = docker volume ls -q -f dangling=true
if ($unusedVolumes) {
    $count = ($unusedVolumes | Measure-Object).Count
    Write-Host "Found $count unused volumes (keeping project volumes)" -ForegroundColor Yellow
    $unusedVolumes | Where-Object { $_ -notlike "*vavip*" } | ForEach-Object {
        docker volume rm $_ 2>$null
    }
}
Write-Host ""

# Очищаем неиспользуемые сети
Write-Host "🧹 Cleaning unused networks..." -ForegroundColor Cyan
docker network prune -f
Write-Host "✓ Unused networks cleaned" -ForegroundColor Green
Write-Host ""

# Удаляем локальные артефакты сборки
Write-Host "🧹 Cleaning local build artifacts..." -ForegroundColor Cyan

if (Test-Path "frontend/node_modules") {
    Write-Host "  Removing frontend/node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "frontend/node_modules"
}

if (Test-Path "frontend/dist") {
    Write-Host "  Removing frontend/dist..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "frontend/dist"
}

if (Test-Path "backend/__pycache__") {
    Write-Host "  Removing Python cache..." -ForegroundColor Gray
    Get-ChildItem -Path backend -Filter "__pycache__" -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
    Get-ChildItem -Path backend -Filter "*.pyc" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem -Path backend -Filter "*.pyo" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force
}

Write-Host "✓ Local artifacts cleaned" -ForegroundColor Green
Write-Host ""

# Восстанавливаем .env файлы
Write-Host "📥 Restoring .env files..." -ForegroundColor Cyan
if (Test-Path $tempDir) {
    $envFiles = Get-ChildItem -Path $tempDir -Recurse -File
    if ($envFiles.Count -gt 0) {
        foreach ($file in $envFiles) {
            $relativePath = $file.FullName.Replace($tempDir.FullName + "\", "").Replace("/", "\")
            $targetPath = Join-Path (Get-Location) $relativePath
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $file.FullName -Destination $targetPath -Force
        }
        Write-Host "✓ .env files restored" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No .env files to restore" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "==============================================" -ForegroundColor Green
Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Docker disk usage:" -ForegroundColor Yellow
docker system df
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Ensure .env file is configured: ./backend/.env"
Write-Host "   2. Build and start: docker-compose -f $composeFile up -d --build"
Write-Host ""

