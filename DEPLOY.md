# Инструкция по деплою проекта Vavip

Этот документ содержит подробные инструкции по развертыванию проекта на production сервере.

## Предварительные требования

### На сервере должны быть установлены:
- **Docker** (версия 20.10 или выше)
- **Docker Compose** (версия 1.29 или выше, или Docker Compose V2)
- **Git** (для клонирования репозитория)
- **curl** (для проверки health checks)

### Проверка установки:
```bash
docker --version
docker-compose --version  # или: docker compose version
git --version
curl --version
```

## Первоначальный деплой

### 1. Подготовка сервера

На сервере выполните следующие шаги:

#### Linux/macOS:
```bash
# Клонируем репозиторий
git clone <YOUR_REPO_URL> /opt/vavip
cd /opt/vavip

# Делаем скрипты исполняемыми
chmod +x deploy.sh deploy-update.sh server-clean-prod.sh deploy-clean.sh
```

#### Windows:
```powershell
# Клонируем репозиторий
git clone <YOUR_REPO_URL> C:\vavip
cd C:\vavip
```

### 2. Настройка переменных окружения

**ВАЖНО:** Перед запуском деплоя необходимо настроить переменные окружения!

#### Root .env файл (для Docker Compose)
Скопируйте `.env.example` в `.env` в корне проекта и установите пароль PostgreSQL:

```bash
cp .env.example .env
nano .env  # или vi/vim
```

Установите `POSTGRES_PASSWORD` - этот пароль будет использоваться для PostgreSQL в docker-compose.

#### Backend (.env файл)
Скопируйте `backend/env.example` в `backend/.env` и заполните:

```bash
cp backend/env.example backend/.env
nano backend/.env  # или vi/vim
```

Основные параметры, которые нужно изменить:
- `SECRET_KEY` - секретный ключ Flask (сгенерируйте уникальный)
- `JWT_SECRET_KEY` - секретный ключ для JWT токенов (сгенерируйте уникальный)
- `DATABASE_URL` - URL базы данных (для production используйте PostgreSQL)
  - **ВАЖНО:** Пароль в `DATABASE_URL` должен совпадать с `POSTGRES_PASSWORD` из корневого `.env`
  - Пример для Docker: `postgresql://vavip:YOUR_PASSWORD@db:5432/vavip`
- `REDIS_URL` - URL Redis (`redis://redis:6379/0` для Docker)
- API ключи для платежных систем (если используются)
- Настройки email (если используются)

**Генерация секретных ключей:**
```bash
# Linux/macOS
python3 -c "import secrets; print(secrets.token_hex(32))"

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

#### Frontend (.env файл)
Скопируйте `frontend/env.example` в `frontend/.env` и заполните:

```bash
cp frontend/env.example frontend/.env
nano frontend/.env
```

Основные параметры:
- `VITE_API_URL` - URL API бэкенда (обычно `/api` для production)
- `VITE_WS_URL` - URL WebSocket (если используется)
- Ключи аналитики (Google Analytics, Yandex Metrika) - опционально
- Ключи карт (Google Maps, Yandex Maps) - опционально

### 3. Запуск деплоя

#### Linux/macOS:
```bash
# Вариант 1: Автоматический деплой (клонирует репозиторий)
./deploy.sh <REPO_URL> <BRANCH> <DEPLOY_DIR>

# Пример:
./deploy.sh https://github.com/user/vavip2.git main /opt/vavip

# Вариант 2: Деплой из текущей директории
cd /opt/vavip  # после клонирования вручную
./deploy.sh
```

#### Windows:
```powershell
# Вариант 1: Автоматический деплой
.\deploy.ps1 <REPO_URL> <BRANCH> <DEPLOY_DIR>

# Пример:
.\deploy.ps1 https://github.com/user/vavip2.git main C:\vavip

# Вариант 2: Деплой из текущей директории
cd C:\vavip
.\deploy.ps1
```

Скрипт выполнит:
1. Проверку наличия Docker и Docker Compose
2. Клонирование/обновление репозитория (если указан REPO_URL)
3. Создание .env файлов из примеров (если их нет)
4. Очистку старых образов и контейнеров
5. Сборку новых Docker образов
6. Запуск контейнеров
7. Проверку здоровья сервисов

### 4. Проверка работоспособности

После успешного деплоя проверьте:

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Health checks
curl http://localhost/api/health  # Backend
curl http://localhost            # Frontend
```

## Обновление деплоя

Для обновления существующего деплоя используйте скрипты обновления:

#### Linux/macOS:
```bash
cd /opt/vavip
./deploy-update.sh main
```

#### Windows:
```powershell
cd C:\vavip
.\deploy-update.ps1 main
```

Скрипт обновления:
1. Сохраняет .env файлы
2. Получает последние изменения из репозитория
3. Останавливает контейнеры
4. Собирает новые образы
5. Запускает обновленные контейнеры
6. Проверяет здоровье сервисов

**Примечание:** Если нет изменений в репозитории, скрипт сообщит об этом и не будет пересобирать контейнеры.

## Очистка сервера

### Полная очистка перед деплоем

Используется для полной очистки перед новым деплоем (удаляет все образы, кеш):

#### Linux/macOS:
```bash
./deploy-clean.sh
```

#### Windows:
```powershell
.\deploy-clean.ps1
```

### Безопасная очистка production сервера

Более безопасный вариант, который сохраняет volumes с данными:

#### Linux/macOS:
```bash
./server-clean-prod.sh
```

#### Windows:
```powershell
.\server-clean-prod.ps1
```

**ВАЖНО:** Этот скрипт:
- ✅ Сохраняет все .env файлы
- ✅ Сохраняет volumes с данными (postgres_data, redis_data)
- ✅ Удаляет только образы проекта
- ✅ Очищает старый build cache

## Управление контейнерами

### Полезные команды

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml restart backend

# Остановка сервисов
docker-compose -f docker-compose.prod.yml stop

# Запуск сервисов
docker-compose -f docker-compose.prod.yml start

# Полная остановка и удаление контейнеров (БЕЗ удаления volumes)
docker-compose -f docker-compose.prod.yml down

# Остановка с удалением volumes (ОСТОРОЖНО! Удалит все данные!)
docker-compose -f docker-compose.prod.yml down -v

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml up -d --build

# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование диска Docker
docker system df
```

## Структура проекта

```
vavip/
├── docker-compose.prod.yml    # Production конфигурация Docker Compose
├── deploy.sh                   # Скрипт первоначального деплоя (Linux/macOS)
├── deploy.ps1                  # Скрипт первоначального деплоя (Windows)
├── deploy-update.sh            # Скрипт обновления деплоя (Linux/macOS)
├── deploy-update.ps1           # Скрипт обновления деплоя (Windows)
├── deploy-clean.sh             # Скрипт полной очистки (Linux/macOS)
├── deploy-clean.ps1            # Скрипт полной очистки (Windows)
├── server-clean-prod.sh        # Скрипт безопасной очистки (Linux/macOS)
├── server-clean-prod.ps1       # Скрипт безопасной очистки (Windows)
├── backend/
│   ├── .env                    # Переменные окружения backend (НЕ в git!)
│   ├── env.example             # Пример конфигурации backend
│   └── ...
├── frontend/
│   ├── .env                    # Переменные окружения frontend (НЕ в git!)
│   ├── env.example             # Пример конфигурации frontend
│   └── ...
└── ...
```

## Миграции базы данных

Если в проекте используются миграции базы данных (Alembic), их нужно выполнить после деплоя:

```bash
# Выполнение миграций
docker-compose -f docker-compose.prod.yml exec backend flask db upgrade

# Или, если используется скрипт миграций
docker-compose -f docker-compose.prod.yml exec backend python migrations/script.py upgrade head
```

## Backup базы данных

**ВАЖНО:** Регулярно делайте резервные копии базы данных!

```bash
# Создание backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U vavip vavip > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U vavip vavip < backup_YYYYMMDD_HHMMSS.sql
```

## Решение проблем

### Контейнеры не запускаются

1. Проверьте логи:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. Проверьте .env файлы:
   ```bash
   cat backend/.env
   cat frontend/.env
   ```

3. Проверьте статус контейнеров:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

### Проблемы с базой данных

1. Проверьте подключение:
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U vavip -d vavip
   ```

2. Проверьте логи базы данных:
   ```bash
   docker-compose -f docker-compose.prod.yml logs db
   ```

### Проблемы с портами

Если порты 80 или 5000 заняты:

1. Измените порты в `docker-compose.prod.yml`:
   ```yaml
   frontend:
     ports:
       - "8080:80"  # Изменить 80 на 8080
   
   backend:
     ports:
       - "5001:5000"  # Изменить 5000 на 5001
   ```

### Проблемы с правами доступа

Если возникают проблемы с правами доступа:

```bash
# Linux: Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Проверьте права на директорию проекта
sudo chown -R $USER:$USER /opt/vavip
```

## Безопасность

### Рекомендации для production:

1. **Используйте сильные секретные ключи** - генерируйте уникальные ключи для SECRET_KEY и JWT_SECRET_KEY
2. **Ограничьте доступ к .env файлам** - установите права доступа:
   ```bash
   chmod 600 backend/.env frontend/.env
   ```
3. **Используйте HTTPS** - настройте reverse proxy (nginx) с SSL сертификатами
4. **Регулярно обновляйте** - следите за обновлениями Docker образов и зависимостей
5. **Делайте backup** - регулярно создавайте резервные копии базы данных
6. **Мониторинг** - настройте мониторинг и логирование
7. **Firewall** - настройте firewall для ограничения доступа к портам

## Дополнительные ресурсы

- [Docker документация](https://docs.docker.com/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [Flask документация](https://flask.palletsprojects.com/)
- [React/Vite документация](https://vitejs.dev/)

## Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Проверьте документацию выше
3. Проверьте issues в репозитории проекта

