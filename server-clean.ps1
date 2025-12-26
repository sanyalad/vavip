# Скрипт для очистки сервера с сохранением .env файлов
# Использование: .\server-clean.ps1

Write-Host "Server cleanup script (preserving .env files)" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Создаем временную директорию для бэкапа
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

Write-Host "Backing up .env files..." -ForegroundColor Cyan

# Находим и сохраняем все .env файлы
Get-ChildItem -Path . -Filter ".env*" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $targetPath = Join-Path $tempDir $relativePath
    $targetDir = Split-Path $targetPath -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item $_.FullName -Destination $targetPath -Force
}

Write-Host "✓ .env files backed up" -ForegroundColor Green
Write-Host ""

# Останавливаем контейнеры
Write-Host "Stopping containers..." -ForegroundColor Cyan
docker-compose down 2>$null
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Удаляем образы проекта
Write-Host "Removing project images..." -ForegroundColor Cyan
docker-compose down --rmi all 2>$null
Write-Host "✓ Project images removed" -ForegroundColor Green
Write-Host ""

# Очищаем build cache
Write-Host "Cleaning build cache..." -ForegroundColor Cyan
docker builder prune -a -f
Write-Host "✓ Build cache cleaned" -ForegroundColor Green
Write-Host ""

# Удаляем node_modules
if (Test-Path "frontend/node_modules") {
    Write-Host "Removing frontend/node_modules..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "frontend/node_modules"
    Write-Host "✓ frontend/node_modules removed" -ForegroundColor Green
}

# Удаляем dist
if (Test-Path "frontend/dist") {
    Write-Host "Removing frontend/dist..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "frontend/dist"
    Write-Host "✓ frontend/dist removed" -ForegroundColor Green
}

# Удаляем __pycache__
Write-Host "Removing Python cache files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "__pycache__" -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Filter "*.pyc" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path . -Filter "*.pyo" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✓ Python cache removed" -ForegroundColor Green
Write-Host ""

# Удаляем .pytest_cache
if (Test-Path "backend/.pytest_cache") {
    Write-Host "Removing backend/.pytest_cache..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "backend/.pytest_cache"
    Write-Host "✓ .pytest_cache removed" -ForegroundColor Green
}

# Очищаем instance/ (кроме .env)
if (Test-Path "backend/instance") {
    Write-Host "Cleaning backend/instance (preserving .env)..." -ForegroundColor Cyan
    Get-ChildItem -Path "backend/instance" -File | Where-Object { $_.Name -notlike ".env*" } | Remove-Item -Force
    Write-Host "✓ instance/ cleaned" -ForegroundColor Green
}

# Восстанавливаем .env файлы
Write-Host ""
Write-Host "Restoring .env files..." -ForegroundColor Cyan
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
        Write-Host "⚠ No .env files to restore" -ForegroundColor Yellow
    }
}

# Удаляем временную директорию
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "✓ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Disk usage:" -ForegroundColor Yellow
docker system df




