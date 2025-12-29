# Инструкция по настройке на сервере

## Первоначальная настройка на сервере

### 1. Клонирование репозитория

```bash
# Перейдите в нужную директорию (например, /opt)
cd /opt

# Клонируйте репозиторий
git clone https://github.com/sanyalad/vavip.git

# Перейдите в директорию проекта
cd vavip
```

### 2. Обновление репозитория (если уже клонирован)

```bash
# Перейдите в директорию проекта
cd /opt/vavip  # или путь где клонирован репозиторий

# Проверьте текущую ветку и remote
git branch
git remote -v

# Обновите код из репозитория
git pull origin main
```

### 3. Настройка прав доступа на скрипты

```bash
# Сделайте скрипты исполняемыми
chmod +x *.sh

# Проверьте что скрипты доступны
ls -la *.sh
```

### 4. Настройка переменных окружения

```bash
# Создайте .env файлы из примеров
cp .env.example .env  # если есть
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# Отредактируйте файлы с вашими production значениями
nano .env
nano backend/.env
nano frontend/.env
```

### 5. Запуск деплоя

```bash
# Первоначальный деплой
./deploy.sh

# Или если нужно клонировать/обновить из другого места
./deploy.sh https://github.com/sanyalad/vavip.git main /opt/vavip
```

## Обновление существующего деплоя

```bash
# Перейдите в директорию проекта
cd /opt/vavip

# Обновите код из репозитория
git pull origin main

# Запустите скрипт обновления
./deploy-update.sh main
```

## Полезные команды для диагностики

```bash
# Проверка текущей директории
pwd

# Проверка что мы в git репозитории
git status

# Проверка remote репозиториев
git remote -v

# Проверка доступных скриптов
ls -la *.sh

# Проверка статуса Docker контейнеров
docker-compose -f docker-compose.prod.yml ps
```

## Решение проблем

### Ошибка: "fatal: not a git repository"
**Решение:** Вы не в директории git репозитория. Перейдите в директорию проекта:
```bash
cd /opt/vavip  # или путь где клонирован репозиторий
```

### Ошибка: "No such file or directory" для скрипта
**Решение:** 
1. Убедитесь что вы в правильной директории: `ls -la *.sh`
2. Проверьте правильность написания имени скрипта (например, `server-clean-prod.sh`, а не `r-clean-prod.sh`)
3. Сделайте скрипты исполняемыми: `chmod +x *.sh`

### Ошибка: "Permission denied"
**Решение:** Сделайте скрипты исполняемыми:
```bash
chmod +x *.sh
```

### Ошибка при git pull
**Решение:** Убедитесь что:
1. Вы в директории git репозитория
2. Правильно указан remote: `git remote -v`
3. Используете правильную команду: `git pull origin main` или `git pull new-origin main`

