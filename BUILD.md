# Инструкции по сборке Docker

## Быстрая сборка с BuildKit (рекомендуется)

BuildKit значительно ускоряет сборку благодаря кэшированию зависимостей.

### Linux/Mac:

```bash
# Включить BuildKit и собрать
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build --parallel

# Или добавить в ~/.bashrc для постоянного использования:
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Windows (PowerShell):

```powershell
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build --parallel
```

### Windows (CMD):

```cmd
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build --parallel
```

## Установка docker buildx (альтернатива)

Если BuildKit всё ещё не работает, установите buildx:

```bash
# Linux
docker buildx install

# Затем можно использовать:
docker-compose build --parallel
```

## Сборка без BuildKit (медленнее, но работает всегда)

Если BuildKit недоступен, Dockerfile'ы автоматически используют обычное кэширование слоёв Docker.

```bash
docker-compose build --parallel
```

## Продакшн сборка

```bash
# Linux/Mac
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose -f docker-compose.prod.yml build --parallel

# Windows PowerShell
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker-compose -f docker-compose.prod.yml build --parallel
```

