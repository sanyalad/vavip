# Скрипт для первоначального деплоя проекта на сервер
# Использование: .\deploy.ps1 [REPO_URL] [BRANCH] [DEPLOY_DIR]
# Пример: .\deploy.ps1 https://github.com/user/vavip2.git main C:\vavip

param(
    [string]$RepoUrl = "",
    [string]$Branch = "main",
    [string]$DeployDir = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "🚀 Vavip Production Deployment Script" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Проверка наличия Docker
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not installed!" -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    $ComposeCmd = "docker-compose"
    Write-Host "✓ Docker Compose is installed" -ForegroundColor Green
} catch {
    try {
        docker compose version | Out-Null
        $ComposeCmd = "docker compose"
        Write-Host "✓ Docker Compose (v2) is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: Docker Compose is not installed!" -ForegroundColor Red
        exit 1
    }
}

# Проверка прав на выполнение Docker
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Error: No permission to run Docker commands!" -ForegroundColor Red
    Write-Host "💡 Hint: Make sure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}

# Если указан репозиторий, клонируем его
if ($RepoUrl) {
    Write-Host "📦 Cloning repository..." -ForegroundColor Cyan
    Write-Host "   Repository: $RepoUrl"
    Write-Host "   Branch: $Branch"
    Write-Host "   Directory: $DeployDir"
    Write-Host ""
    
    # Создаем директорию если не существует
    $ParentDir = Split-Path $DeployDir -Parent
    if (-not (Test-Path $ParentDir)) {
        New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
    }
    
    # Если директория уже существует
    if (Test-Path $DeployDir) {
        if (Test-Path (Join-Path $DeployDir ".git")) {
            Write-Host "⚠️  Directory already exists and contains git repository" -ForegroundColor Yellow
            Write-Host "📥 Updating existing repository..." -ForegroundColor Cyan
            Set-Location $DeployDir
            git fetch origin
            git checkout $Branch
            git pull origin $Branch
        } else {
            Write-Host "⚠️  Directory exists but is not a git repository" -ForegroundColor Yellow
            $BackupDir = "${DeployDir}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Write-Host "📦 Creating backup to: $BackupDir" -ForegroundColor Cyan
            Move-Item $DeployDir $BackupDir
            git clone -b $Branch $RepoUrl $DeployDir
        }
    } else {
        git clone -b $Branch $RepoUrl $DeployDir
    }
    
    Set-Location $DeployDir
} else {
    # Если репозиторий не указан, работаем в текущей директории
    Write-Host "📂 Using current directory: $(Get-Location)" -ForegroundColor Cyan
    if (-not (Test-Path "docker-compose.prod.yml")) {
        Write-Host "❌ Error: docker-compose.prod.yml not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✓ Repository ready" -ForegroundColor Green
Write-Host ""

# Проверяем наличие необходимых файлов
Write-Host "🔍 Checking required files..." -ForegroundColor Cyan
$RequiredFiles = @("docker-compose.prod.yml", "backend\env.example", "frontend\env.example")
$MissingFiles = @()

foreach ($file in $RequiredFiles) {
    if (-not (Test-Path $file)) {
        $MissingFiles += $file
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $MissingFiles) {
        Write-Host "   - $file"
    }
    exit 1
}

Write-Host "✓ All required files present" -ForegroundColor Green
Write-Host ""

# Создаем .env файлы если их нет
Write-Host "⚙️  Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "⚠️  .env not found, creating from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️  IMPORTANT: Please edit .env and set POSTGRES_PASSWORD!" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ .env exists" -ForegroundColor Green
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found, creating from env.example..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" "backend\.env"
    Write-Host "⚠️  IMPORTANT: Please edit backend\.env with your production values!" -ForegroundColor Yellow
    Write-Host "⚠️  Make sure DATABASE_URL password matches POSTGRES_PASSWORD in root .env!" -ForegroundColor Yellow
} else {
    Write-Host "✓ backend\.env exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env not found, creating from env.example..." -ForegroundColor Yellow
    Copy-Item "frontend\env.example" "frontend\.env"
    Write-Host "⚠️  IMPORTANT: Please edit frontend\.env with your production values!" -ForegroundColor Yellow
} else {
    Write-Host "✓ frontend\.env exists" -ForegroundColor Green
}

Write-Host ""

# Запрашиваем подтверждение перед продолжением
Write-Host "⚠️  IMPORTANT: Make sure you have configured:" -ForegroundColor Yellow
Write-Host "   1. .env (root) - POSTGRES_PASSWORD"
Write-Host "   2. backend\.env - database, secrets, API keys (DATABASE_URL password must match POSTGRES_PASSWORD)"
Write-Host "   3. frontend\.env - API URLs, analytics keys"
Write-Host ""
$Response = Read-Host "Continue with deployment? (y/N)"
if ($Response -ne "y" -and $Response -ne "Y") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Запускаем скрипт очистки
if (Test-Path "deploy-clean.ps1") {
    Write-Host "🧹 Running cleanup script..." -ForegroundColor Cyan
    & .\deploy-clean.ps1
} else {
    Write-Host "⚠️  deploy-clean.ps1 not found, skipping cleanup" -ForegroundColor Yellow
}

Write-Host ""

# Собираем и запускаем контейнеры
Write-Host "🏗️  Building and starting containers..." -ForegroundColor Cyan

& $ComposeCmd -f docker-compose.prod.yml build --no-cache
& $ComposeCmd -f docker-compose.prod.yml up -d

Write-Host ""

# Ждем пока сервисы запустятся
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Проверяем статус контейнеров
Write-Host "📊 Container status:" -ForegroundColor Cyan
& $ComposeCmd -f docker-compose.prod.yml ps

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
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Service URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost (port 80)"
    Write-Host "   Backend API: http://localhost:5000/api"
    Write-Host ""
    Write-Host "💡 Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs: $ComposeCmd -f docker-compose.prod.yml logs -f"
    Write-Host "   Stop services: $ComposeCmd -f docker-compose.prod.yml down"
    Write-Host "   Restart services: $ComposeCmd -f docker-compose.prod.yml restart"
    Write-Host "   Update deployment: .\deploy-update.ps1"
} else {
    Write-Host "⚠️  Deployment completed with warnings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some services may not be healthy yet. Check logs:" -ForegroundColor Yellow
    Write-Host "   $ComposeCmd -f docker-compose.prod.yml logs"
}
Write-Host "==============================================" -ForegroundColor Green

