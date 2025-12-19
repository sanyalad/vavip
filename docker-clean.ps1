# Скрипт для очистки Docker перед сборкой
# Использование: .\docker-clean.ps1 [light|medium|full]

param(
    [Parameter(Position=0)]
    [ValidateSet("light", "medium", "full")]
    [string]$Mode = "light"
)

Write-Host "Docker cleanup script" -ForegroundColor Green
Write-Host "Mode: $Mode" -ForegroundColor Yellow
Write-Host ""

switch ($Mode) {
    "light" {
        Write-Host "Light cleanup: Build cache only..." -ForegroundColor Cyan
        docker builder prune -a -f
        Write-Host "✓ Build cache cleaned" -ForegroundColor Green
    }
    "medium" {
        Write-Host "Medium cleanup: Unused images + build cache..." -ForegroundColor Cyan
        docker image prune -a -f
        docker builder prune -a -f
        Write-Host "✓ Unused images and build cache cleaned" -ForegroundColor Green
    }
    "full" {
        Write-Host "Full cleanup: Stopping containers, removing images, cleaning cache..." -ForegroundColor Cyan
        docker-compose down 2>$null
        docker-compose down --rmi all 2>$null
        docker builder prune -a -f
        docker image prune -a -f
        Write-Host "✓ Full cleanup completed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Disk usage:" -ForegroundColor Yellow
docker system df

