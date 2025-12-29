# Как скопировать репозиторий на сервер

## Способ 1: Клонирование через Git (Рекомендуется)

### На сервере выполните:

```bash
# Перейдите в директорию где хотите разместить проект
cd /opt

# Клонируйте репозиторий
git clone https://github.com/sanyalad/vavip.git

# Перейдите в директорию проекта
cd vavip

# Проверьте что всё скопировалось
ls -la
```

### Если нужна конкретная ветка:

```bash
git clone -b main https://github.com/sanyalad/vavip.git
# или
git clone -b develop https://github.com/sanyalad/vavip.git
```

### Если нужна конкретная директория:

```bash
git clone https://github.com/sanyalad/vavip.git /opt/vavip
cd /opt/vavip
```

## Способ 2: Использование скрипта deploy.sh (Автоматическое)

Скрипт `deploy.sh` может автоматически клонировать репозиторий:

```bash
# Скрипт сам клонирует и настроит всё
./deploy.sh https://github.com/sanyalad/vavip.git main /opt/vavip
```

## Способ 3: Клонирование через SSH (если настроен SSH ключ)

Если у вас настроен SSH доступ к GitHub:

```bash
git clone git@github.com:sanyalad/vavip.git
```

## Способ 4: Загрузка через HTTPS с токеном

Если требуется аутентификация:

```bash
# Создайте Personal Access Token на GitHub
# Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
# Затем используйте:
git clone https://YOUR_TOKEN@github.com/sanyalad/vavip.git
```

## После клонирования

### 1. Настройте права доступа:

```bash
cd /opt/vavip
chmod +x *.sh
```

### 2. Проверьте наличие файлов:

```bash
ls -la
# Должны быть видны:
# - docker-compose.prod.yml
# - deploy.sh
# - deploy-update.sh
# и другие файлы проекта
```

### 3. Настройте переменные окружения:

```bash
# Создайте .env файлы
cp .env.example .env
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# Отредактируйте их
nano backend/.env
nano frontend/.env
```

### 4. Запустите деплой:

```bash
./deploy.sh
```

## Обновление существующего репозитория

Если репозиторий уже клонирован, обновите его:

```bash
cd /opt/vavip

# Проверьте текущую ветку
git branch

# Получите последние изменения
git pull origin main

# Или если используете другой remote
git pull new-origin main
```

## Проверка подключения к репозиторию

```bash
# Проверьте remote репозитории
git remote -v

# Должно показать что-то вроде:
# origin    https://github.com/sanyalad/vavip.git (fetch)
# origin    https://github.com/sanyalad/vavip.git (push)
```

## Решение проблем

### Ошибка: "Permission denied" при клонировании в /opt

**Проблема:** Директория `/opt` требует root прав.

**Решение 1: Клонировать в домашнюю директорию (Рекомендуется)**

```bash
# Клонируйте в домашнюю директорию
cd ~
git clone https://github.com/sanyalad/vavip.git
cd vavip
```

**Решение 2: Создать директорию с правами через sudo**

```bash
# Создайте директорию с правильными правами
sudo mkdir -p /opt/vavip
sudo chown $USER:$USER /opt/vavip
cd /opt
git clone https://github.com/sanyalad/vavip.git
cd vavip
```

**Решение 3: Использовать скрипт fix-permissions.sh**

```bash
# Скрипт автоматически создаст директорию с правильными правами
./fix-permissions.sh /opt/vavip
cd /opt
git clone https://github.com/sanyalad/vavip.git
```

**Решение 4: Клонировать напрямую в целевую директорию**

```bash
# Создайте директорию и клонируйте туда
sudo mkdir -p /opt/vavip
sudo chown $USER:$USER /opt/vavip
git clone https://github.com/sanyalad/vavip.git /opt/vavip
cd /opt/vavip
```

### Ошибка: "fatal: repository not found"

- Проверьте правильность URL репозитория
- Убедитесь что репозиторий публичный или у вас есть доступ
- Проверьте интернет соединение

### Ошибка: "git: command not found"

Установите Git:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

## Быстрая команда для копирования на сервер

```bash
# Одной командой
cd /opt && git clone https://github.com/sanyalad/vavip.git && cd vavip && chmod +x *.sh && ls -la
```

