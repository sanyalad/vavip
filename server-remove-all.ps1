# Скрипт для ПОЛНОГО удаления проекта с сервера
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные проекта включая базу данных!
# Использование: .\server-remove-all.ps1 [PROJECT_DIR]

param(
    [string]$ProjectDir = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$ComposeFile = "docker-compose.prod.yml"

Write-Host "==============================================" -ForegroundColor Red
Write-Host "⚠️  ПОЛНОЕ УДАЛЕНИЕ ПРОЕКТА С СЕРВЕРА" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Этот скрипт удалит:" -ForegroundColor Yellow
Write-Host "  - Все Docker контейнеры проекта"
Write-Host "  - Все Docker образы проекта"
Write-Host "  - Все Docker volumes (включая БАЗУ ДАННЫХ!)"
Write-Host "  - Директорию проекта: $ProjectDir"
Write-Host ""
Write-Host "⚠️  ВНИМАНИЕ: Все данные будут потеряны безвозвратно!" -ForegroundColor Red
Write-Host ""

# Проверяем что директория существует
if (-not (Test-Path $ProjectDir)) {
    Write-Host "❌ Директория $ProjectDir не существует!" -ForegroundColor Red
    exit 1
}

Set-Location $ProjectDir

# Проверяем наличие docker-compose файла
if (-not (Test-Path $ComposeFile)) {
    Write-Host "⚠️  $ComposeFile не найден в $ProjectDir" -ForegroundColor Yellow
    $Confirm = Read-Host "Продолжить удаление директории? (y/N)"
    if ($Confirm -ne "y" -and $Confirm -ne "Y") {
        Write-Host "Отменено" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "📦 Создание backup базы данных..." -ForegroundColor Cyan
    $BackupDir = "/tmp/vavip-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup .env файлов
    if (Test-Path "backend\.env") {
        Copy-Item "backend\.env" "$BackupDir\backend.env.backup" -Force
        Write-Host "✓ backend\.env сохранен в $BackupDir" -ForegroundColor Green
    }
    if (Test-Path "frontend\.env") {
        Copy-Item "frontend\.env" "$BackupDir\frontend.env.backup" -Force
        Write-Host "✓ frontend\.env сохранен в $BackupDir" -ForegroundColor Green
    }
    if (Test-Path ".env") {
        Copy-Item ".env" "$BackupDir\root.env.backup" -Force
        Write-Host "✓ .env сохранен в $BackupDir" -ForegroundColor Green
    }
    
    # Backup базы данных
    Write-Host "💾 Создание backup базы данных..." -ForegroundColor Cyan
    try {
        $DbStatus = docker-compose -f $ComposeFile ps db 2>$null | Select-String "Up"
        if ($DbStatus) {
            docker-compose -f $ComposeFile exec -T db pg_dump -U vavip vavip > "$BackupDir\database_backup.sql" 2>$null
            if (Test-Path "$BackupDir\database_backup.sql") {
                $FileSize = (Get-Item "$BackupDir\database_backup.sql").Length
                if ($FileSize -gt 0) {
                    Write-Host "✓ База данных сохранена в $BackupDir\database_backup.sql" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "⚠️  База данных не запущена, backup пропущен" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Не удалось создать backup базы данных" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✓ Backup сохранен в: $BackupDir" -ForegroundColor Green
    Write-Host ""
}

# Финальное подтверждение
Write-Host "==============================================" -ForegroundColor Red
Write-Host "⚠️  ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Вы уверены что хотите УДАЛИТЬ ВСЕ данные проекта?" -ForegroundColor Red
Write-Host "Это действие НЕОБРАТИМО!" -ForegroundColor Yellow
Write-Host ""
$FinalConfirm = Read-Host "Введите 'DELETE' (заглавными буквами) для подтверждения"

if ($FinalConfirm -ne "DELETE") {
    Write-Host "✓ Удаление отменено" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "🗑️  Начинаем удаление..." -ForegroundColor Cyan
Write-Host ""

# Определяем команду docker compose
try {
    docker-compose --version | Out-Null
    $ComposeCmd = "docker-compose"
} catch {
    try {
        docker compose version | Out-Null
        $ComposeCmd = "docker compose"
    } catch {
        $ComposeCmd = $null
    }
}

# Останавливаем и удаляем контейнеры
if (Test-Path $ComposeFile) {
    if ($ComposeCmd) {
        Write-Host "🛑 Останавливаем контейнеры..." -ForegroundColor Cyan
        & $ComposeCmd -f $ComposeFile down --remove-orphans 2>$null
        Write-Host "✓ Контейнеры остановлены" -ForegroundColor Green
        Write-Host ""
        
        # Удаляем контейнеры, образы и volumes
        Write-Host "🗑️  Удаляем контейнеры, образы и volumes..." -ForegroundColor Cyan
        & $ComposeCmd -f $ComposeFile down -v --rmi all --remove-orphans 2>$null
        Write-Host "✓ Docker ресурсы удалены" -ForegroundColor Green
        Write-Host ""
    }
}

# Удаляем образы проекта по имени
Write-Host "🗑️  Удаляем образы проекта..." -ForegroundColor Cyan
$ProjectName = (Get-Item $ProjectDir).Name.ToLower()
docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "(vavip|$ProjectName)" | ForEach-Object {
    docker rmi -f $_.ToString() 2>$null
}
Write-Host "✓ Образы удалены" -ForegroundColor Green
Write-Host ""

# Переходим в родительскую директорию
$ParentDir = Split-Path $ProjectDir -Parent
$ProjectDirName = Split-Path $ProjectDir -Leaf
Set-Location $ParentDir

# Удаляем директорию проекта
Write-Host "🗑️  Удаляем директорию проекта..." -ForegroundColor Cyan
if (Test-Path $ProjectDirName) {
    Remove-Item -Recurse -Force $ProjectDirName
    Write-Host "✓ Директория $ProjectDirName удалена" -ForegroundColor Green
} else {
    Write-Host "⚠️  Директория уже не существует" -ForegroundColor Yellow
}
Write-Host ""

# Очищаем неиспользуемые Docker ресурсы
Write-Host "🧹 Очищаем неиспользуемые Docker ресурсы..." -ForegroundColor Cyan
docker system prune -f --volumes 2>$null | Out-Null
Write-Host "✓ Docker очищен" -ForegroundColor Green
Write-Host ""

Write-Host "==============================================" -ForegroundColor Green
Write-Host "✅ Удаление завершено!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
if (Test-Path $BackupDir) {
    Write-Host "📦 Backup сохранен в: $BackupDir" -ForegroundColor Cyan
    Write-Host "💡 Сохраните backup перед его автоматическим удалением!" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "📊 Использование диска Docker:" -ForegroundColor Cyan
docker system df
Write-Host ""

