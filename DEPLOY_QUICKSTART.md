# Быстрый старт деплоя

## Первоначальный деплой на сервер

### 1. Подключитесь к серверу и выполните:

```bash
# Клонируем репозиторий
git clone <YOUR_REPO_URL> /opt/vavip
cd /opt/vavip

# Делаем скрипты исполняемыми
chmod +x *.sh

# Настраиваем .env файлы
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# ВАЖНО: Отредактируйте .env файлы с вашими production значениями!
nano backend/.env
nano frontend/.env

# Запускаем деплой
./deploy.sh
```

### 2. Или используйте автоматический деплой:

```bash
# Автоматически клонирует и настроит всё
./deploy.sh <REPO_URL> main /opt/vavip
```

## Обновление существующего деплоя

```bash
cd /opt/vavip
./deploy-update.sh main
```

## Очистка сервера

### Безопасная очистка (рекомендуется):
```bash
./server-clean-prod.sh
```

### Полная очистка:
```bash
./deploy-clean.sh
```

## Полезные команды

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Остановка
docker-compose -f docker-compose.prod.yml down

# Запуск
docker-compose -f docker-compose.prod.yml up -d
```

## Важно перед деплоем!

1. ✅ Настройте `backend/.env` - секретные ключи, пароли, API ключи
2. ✅ Настройте `frontend/.env` - URL API, ключи аналитики
3. ✅ Убедитесь что порты 80 и 5000 свободны
4. ✅ Сделайте backup существующих данных (если обновляете)

Подробная документация: см. [DEPLOY.md](DEPLOY.md)

