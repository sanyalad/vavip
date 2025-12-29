# Скрипт для обновления существующего деплоя на сервере
# Использование: .\deploy-update.ps1 [BRANCH]
# Пример: .\deploy-update.ps1 main

param(
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$ComposeFile = "docker-compose.prod.yml"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "🔄 Vavip Deployment Update Script" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Проверка наличия Docker
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Error: Docker is not installed!" -ForegroundColor Red
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

# Проверяем что мы в git репозитории
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository!" -ForegroundColor Red
    Write-Host "💡 Use deploy.ps1 for initial deployment" -ForegroundColor Yellow
    exit 1
}

# Проверяем наличие docker-compose.prod.yml
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ Error: $ComposeFile not found!" -ForegroundColor Red
    exit 1
}

# Сохраняем текущую ветку
try {
    $CurrentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "📋 Current branch: $CurrentBranch" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Could not determine current branch" -ForegroundColor Yellow
}

Write-Host "📋 Target branch: $Branch" -ForegroundColor Cyan
Write-Host ""

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

# Получаем последние изменения
Write-Host "📥 Fetching latest changes from repository..." -ForegroundColor Cyan
git fetch origin

# Проверяем есть ли изменения
try {
    $Local = git rev-parse @
    $Remote = git rev-parse "origin/$Branch" 2>$null
    if ($LASTEXITCODE -ne 0) {
        $Remote = git rev-parse "@{u}" 2>$null
    }
    
    if ($Local -eq $Remote) {
        Write-Host "⚠️  No new changes to pull (already up to date)" -ForegroundColor Yellow
        Write-Host "💡 To force rebuild, run: $ComposeCmd -f $ComposeFile up -d --build --force-recreate" -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "⚠️  Could not compare commits, proceeding with update..." -ForegroundColor Yellow
}

Write-Host "📥 Pulling changes from origin/$Branch..." -ForegroundColor Cyan
git checkout $Branch
git pull origin $Branch

Write-Host "✓ Code updated" -ForegroundColor Green
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
    }
}

Write-Host ""

# Останавливаем контейнеры
Write-Host "🛑 Stopping containers..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile down --remove-orphans
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Очистка старых образов
Write-Host "🧹 Cleaning old images (keeping recent builds)..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile down --rmi local --remove-orphans 2>$null
docker image prune -f --filter "until=24h" 2>$null
Write-Host "✓ Cleanup completed" -ForegroundColor Green
Write-Host ""

# Собираем новые образы
Write-Host "🏗️  Building new images..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile build --pull

Write-Host "✓ Images built" -ForegroundColor Green
Write-Host ""

# Запускаем контейнеры
Write-Host "🚀 Starting containers..." -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile up -d

Write-Host ""

# Ждем запуска сервисов
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Проверяем статус
Write-Host "📊 Container status:" -ForegroundColor Cyan
& $ComposeCmd -f $ComposeFile ps

Write-Host ""

# Проверяем health checks
Write-Host "🏥 Checking service health..." -ForegroundColor Cyan
$MaxAttempts = 30
$Attempt = 0
$BackendHealthy = $false
$FrontendHealthy = $false

while ($Attempt -lt $MaxAttempts) {
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            $BackendHealthy = $true
            Write-Host "✓ Backend is healthy" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    $Attempt++
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

Write-Host ""
$Attempt = 0

while ($Attempt -lt $MaxAttempts) {
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            $FrontendHealthy = $true
            Write-Host "✓ Frontend is healthy" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    $Attempt++
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

Write-Host ""

# Финальный статус
Write-Host "==============================================" -ForegroundColor Green
if ($BackendHealthy -and $FrontendHealthy) {
    Write-Host "✅ Update completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Service URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost (port 80)"
    Write-Host "   Backend API: http://localhost:5000/api"
    Write-Host ""
    Write-Host "💡 Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs: $ComposeCmd -f $ComposeFile logs -f"
    Write-Host "   View backend logs: $ComposeCmd -f $ComposeFile logs -f backend"
    Write-Host "   View frontend logs: $ComposeCmd -f $ComposeFile logs -f frontend"
} else {
    Write-Host "⚠️  Update completed with warnings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some services may not be healthy yet. Check logs:" -ForegroundColor Yellow
    Write-Host "   $ComposeCmd -f $ComposeFile logs --tail=100"
}
Write-Host "==============================================" -ForegroundColor Green

