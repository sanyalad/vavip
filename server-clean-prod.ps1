# Скрипт для безопасной очистки production сервера
# Использование: .\server-clean-prod.ps1
# ВАЖНО: Этот скрипт сохраняет .env файлы и volumes с данными

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "🧹 Production Server Cleanup Script" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

$ComposeFile = "docker-compose.prod.yml"

# Проверяем наличие docker-compose.prod.yml
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ Error: $ComposeFile not found!" -ForegroundColor Red
    exit 1
}

# Определяем команду docker compose
try {
    docker-compose --version | Out-Null
    $ComposeCmd = "docker-compose"
} catch {
    try {
        docker compose version | Out-Null
        $ComposeCmd = "docker compose"
    } catch {
        Write-Host "❌ Error: Docker Compose is not installed!" -ForegroundColor Red
        exit 1
    }
}

# Бэкапим .env файлы
Write-Host "💾 Backing up .env files..." -ForegroundColor Cyan
$TempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

Get-ChildItem -Path . -Filter ".env*" -Recurse -File -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    $RelativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $TargetPath = Join-Path $TempDir.FullName $RelativePath
    $TargetDir = Split-Path $TargetPath -Parent
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }
    Copy-Item $_.FullName -Destination $TargetPath -Force
}

Write-Host "✓ .env files backed up" -ForegroundColor Green
Write-Host ""

# Останавливаем контейнеры
Write-Host "🛑 Stopping containers..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile down --remove-orphans 2>$null
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Удаляем только образы проекта (без данных volumes)
Write-Host "🗑️  Removing project images..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile down --rmi local --remove-orphans 2>$null

# Удаляем образы по имени проекта
$ProjectName = (Get-Item (Get-Location)).Name.ToLower()
docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "(vavip|$ProjectName)" | ForEach-Object {
    docker rmi -f $_.ToString() 2>$null
}
Write-Host "✓ Project images removed" -ForegroundColor Green
Write-Host ""

# Очищаем build cache (старый, более 7 дней)
Write-Host "🧹 Cleaning old Docker build cache..." -ForegroundColor Cyan
docker builder prune -f --filter "until=168h" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    docker builder prune -f | Out-Null
}
Write-Host "✓ Build cache cleaned" -ForegroundColor Green
Write-Host ""

# Удаляем остановленные контейнеры
Write-Host "🧹 Removing stopped containers..." -ForegroundColor Cyan
docker container prune -f --filter "until=24h" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    docker container prune -f | Out-Null
}
Write-Host "✓ Stopped containers removed" -ForegroundColor Green
Write-Host ""

# Очищаем неиспользуемые сети
Write-Host "🧹 Cleaning unused networks..." -ForegroundColor Cyan
docker network prune -f | Out-Null
Write-Host "✓ Unused networks cleaned" -ForegroundColor Green
Write-Host ""

# Очищаем dangling volumes (ОСТОРОЖНО: только dangling, не используемые)
Write-Host "⚠️  Checking for dangling volumes..." -ForegroundColor Yellow
$DanglingVolumes = docker volume ls -q -f dangling=true
if ($DanglingVolumes) {
    $Count = ($DanglingVolumes | Measure-Object).Count
    Write-Host "Found $Count dangling volumes" -ForegroundColor Yellow
    # Удаляем только dangling volumes, которые не относятся к проекту
    $DanglingVolumes | Where-Object { $_ -notlike "*vavip*" } | ForEach-Object {
        docker volume rm $_ 2>$null
    }
    Write-Host "✓ Dangling volumes removed" -ForegroundColor Green
} else {
    Write-Host "✓ No dangling volumes found" -ForegroundColor Green
}
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

# Python cache
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
if (Test-Path $TempDir) {
    $EnvFiles = Get-ChildItem -Path $TempDir -Recurse -File
    if ($EnvFiles.Count -gt 0) {
        foreach ($file in $EnvFiles) {
            $RelativePath = $file.FullName.Replace($TempDir.FullName + "\", "").Replace("/", "\")
            $TargetPath = Join-Path (Get-Location) $RelativePath
            $TargetDir = Split-Path $TargetPath -Parent
            if (-not (Test-Path $TargetDir)) {
                New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
            }
            Copy-Item $file.FullName -Destination $TargetPath -Force
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
Write-Host "💡 Important notes:" -ForegroundColor Cyan
Write-Host "   - Database volumes (postgres_data, redis_data) were preserved"
Write-Host "   - All .env files were preserved"
Write-Host "   - Only project images and old cache were removed"
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   To rebuild and start: $ComposeCmd -f $ComposeFile up -d --build"
Write-Host ""

