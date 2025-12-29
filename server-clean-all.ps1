# Скрипт для ПОЛНОЙ очистки сервера от ВСЕХ Docker проектов
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ Docker контейнеры, образы, volumes, сети!
# Использование: .\server-clean-all.ps1

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Red
Write-Host "⚠️  ПОЛНАЯ ОЧИСТКА СЕРВЕРА" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Этот скрипт удалит:" -ForegroundColor Red
Write-Host "  - ВСЕ Docker контейнеры (включая запущенные!)"
Write-Host "  - ВСЕ Docker образы"
Write-Host "  - ВСЕ Docker volumes (включая базы данных!)"
Write-Host "  - ВСЕ Docker сети"
Write-Host "  - ВСЕ Docker build cache"
Write-Host ""
Write-Host "⚠️  ВНИМАНИЕ: Все Docker данные будут потеряны безвозвратно!" -ForegroundColor Red
Write-Host ""

# Показываем что будет удалено
Write-Host "📊 Текущее состояние Docker:" -ForegroundColor Cyan
docker system df
Write-Host ""

try {
    $Containers = (docker ps -a -q | Measure-Object).Count
    $Images = (docker images -q | Measure-Object).Count
    $Volumes = (docker volume ls -q | Measure-Object).Count
    $Networks = (docker network ls --filter type=custom -q | Measure-Object).Count
    
    if ($Containers -gt 0 -or $Images -gt 0 -or $Volumes -gt 0) {
        Write-Host "Найдено:" -ForegroundColor Cyan
        Write-Host "  Контейнеров: $Containers"
        Write-Host "  Образов: $Images"
        Write-Host "  Volumes: $Volumes"
        Write-Host "  Сетей: $Networks"
        Write-Host ""
    }
    
    # Список запущенных контейнеров
    $Running = docker ps -q
    if ($Running) {
        Write-Host "⚠️  Запущенные контейнеры:" -ForegroundColor Yellow
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  Ошибка при получении информации о Docker" -ForegroundColor Yellow
}

# Первое подтверждение
$Confirm1 = Read-Host "Вы уверены что хотите удалить ВСЕ Docker ресурсы? (y/N)"
if ($Confirm1 -ne "y" -and $Confirm1 -ne "Y") {
    Write-Host "✓ Очистка отменена" -ForegroundColor Green
    exit 0
}

Write-Host ""

# Второе подтверждение
Write-Host "==============================================" -ForegroundColor Red
Write-Host "⚠️  ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Вы уверены что хотите УДАЛИТЬ ВСЕ Docker ресурсы?" -ForegroundColor Red
Write-Host "Это действие НЕОБРАТИМО!" -ForegroundColor Yellow
Write-Host ""
$FinalConfirm = Read-Host "Введите 'CLEAN ALL' (заглавными буквами) для подтверждения"

if ($FinalConfirm -ne "CLEAN ALL") {
    Write-Host "✓ Очистка отменена" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "🧹 Начинаем полную очистку..." -ForegroundColor Cyan
Write-Host ""

# Останавливаем все контейнеры
Write-Host "🛑 Останавливаем все контейнеры..." -ForegroundColor Cyan
docker stop $(docker ps -aq) 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Все контейнеры остановлены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Нет контейнеров для остановки или ошибка" -ForegroundColor Yellow
}
Write-Host ""

# Удаляем все контейнеры
Write-Host "🗑️  Удаляем все контейнеры..." -ForegroundColor Cyan
docker rm $(docker ps -aq) 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Все контейнеры удалены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Нет контейнеров для удаления или ошибка" -ForegroundColor Yellow
}
Write-Host ""

# Удаляем все образы
Write-Host "🗑️  Удаляем все образы..." -ForegroundColor Cyan
docker rmi $(docker images -q) -f 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Все образы удалены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Нет образов для удаления или ошибка" -ForegroundColor Yellow
}
Write-Host ""

# Удаляем все volumes
Write-Host "🗑️  Удаляем все volumes (включая базы данных!)..." -ForegroundColor Cyan
docker volume rm $(docker volume ls -q) 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Все volumes удалены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Нет volumes для удаления или ошибка" -ForegroundColor Yellow
}
Write-Host ""

# Удаляем все сети
Write-Host "🗑️  Удаляем все пользовательские сети..." -ForegroundColor Cyan
docker network prune -f 2>$null | Out-Null
Write-Host "✓ Все сети удалены" -ForegroundColor Green
Write-Host ""

# Очищаем build cache
Write-Host "🧹 Очищаем build cache..." -ForegroundColor Cyan
docker builder prune -a -f 2>$null | Out-Null
Write-Host "✓ Build cache очищен" -ForegroundColor Green
Write-Host ""

# Полная очистка системы
Write-Host "🧹 Выполняем полную очистку системы..." -ForegroundColor Cyan
docker system prune -a -f --volumes 2>$null | Out-Null
Write-Host "✓ Система очищена" -ForegroundColor Green
Write-Host ""

Write-Host "==============================================" -ForegroundColor Green
Write-Host "✅ Полная очистка завершена!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Использование диска Docker после очистки:" -ForegroundColor Cyan
docker system df
Write-Host ""

