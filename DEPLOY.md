# Чеклист деплоя VAVIP

## 🚀 Быстрый старт

1. **Скопируйте env для backend:**
   ```bash
   cp backend/env.example backend/.env
   ```

2. **Отредактируйте `backend/.env`** (особенно секретные ключи!)

3. **Примените миграции:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d db
   docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
   ```

4. **Запустите всё:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## ✅ Подготовка к деплою

### 1. Переменные окружения (Backend)

Создайте `.env` в `backend/` со следующими переменными:

```bash
# Flask
FLASK_APP=vavip
FLASK_ENV=production
SECRET_KEY=<сгенерируйте-уникальный-секрет>
JWT_SECRET_KEY=<сгенерируйте-уникальный-jwt-секрет>

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/vavip

# Redis
REDIS_URL=redis://host:6379/0
CELERY_BROKER_URL=redis://host:6379/1
CELERY_RESULT_BACKEND=redis://host:6379/1

# CORS (укажите ваш домен)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT токены (в секундах)
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
```

### 2. Переменные окружения (Frontend)

По умолчанию фронт уже ходит в API по относительному пути **`/api`** (см. `frontend/src/services/api/client.ts`), поэтому отдельный `.env.production` не обязателен.

Если нужно ходить на отдельный домен/поддомен API — задайте `VITE_API_URL` **на этапе сборки** (или положите `.env.production` в `frontend/`):

```bash
VITE_API_URL=https://yourdomain.com/api
# Опционально:
# VITE_WS_URL=wss://yourdomain.com
# VITE_GA_ID=...
# VITE_YM_ID=...
```

### 3. Миграции базы данных

**ВАЖНО**: Перед первым запуском выполните миграции:

```bash
cd backend
flask db upgrade
```

Или через Docker:
```bash
docker-compose exec backend flask db upgrade
```

### 4. Docker Compose для Production

Файл `docker-compose.prod.yml` уже создан в корне проекта. Убедитесь что пароль PostgreSQL указан в переменных окружения или в самом файле.

### 5. Сборка и запуск

```bash
# Сборка production образов
docker-compose -f docker-compose.prod.yml build

# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Проверка логов
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Проверка работоспособности

- [ ] Frontend доступен на `http://yourdomain.com`
- [ ] API отвечает на `http://yourdomain.com/api/health`
- [ ] Миграции применены (проверьте через `flask db current`)
- [ ] Redis работает
- [ ] PostgreSQL доступен
- [ ] WebSocket работает (если используется)

### 7. Безопасность

- [ ] Смените все `SECRET_KEY` и `JWT_SECRET_KEY` на уникальные
- [ ] Используйте сильные пароли для PostgreSQL
- [ ] Настройте HTTPS (через nginx reverse proxy или cloudflare)
- [ ] Проверьте CORS настройки (только ваши домены)
- [ ] Убедитесь что `.env` файлы не попали в git

### 8. Мониторинг (опционально)

- Настройте логирование (ELK, Loki, или просто файлы)
- Добавьте health checks для Docker
- Настройте алерты на ошибки

### 9. Резервное копирование

- Настройте автоматический бэкап PostgreSQL
- Сохраняйте `.env` файлы в безопасном месте (не в git!)

## 🔧 Troubleshooting

### Миграции не применяются
```bash
docker-compose exec backend flask db upgrade
docker-compose exec backend flask db current
```

### Frontend не подключается к API
- Проверьте `VITE_API_URL` в `.env.production`
- Проверьте nginx конфиг (proxy_pass на backend)
- Проверьте CORS настройки в backend

### Backend не запускается
- Проверьте логи: `docker-compose logs backend`
- Убедитесь что PostgreSQL доступен
- Проверьте что все env переменные установлены

## 📝 Дополнительные настройки

### Nginx для HTTPS (рекомендуется)

Создайте конфиг для nginx на хосте:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Health checks

Health checks уже настроены в `docker-compose.prod.yml` для всех сервисов.

---

**Готово к деплою!** 🚀

