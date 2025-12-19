# Инструкции по сборке Docker

## Стандартная сборка (работает всегда)

Dockerfile'ы оптимизированы для использования кэширования слоёв Docker:

```bash
docker-compose build --parallel
```

Зависимости кэшируются как отдельные слои, поэтому повторные сборки будут быстрыми, если `requirements.txt` или `package.json` не изменились.

## Сборка с BuildKit (опционально, дополнительная оптимизация)

BuildKit может дополнительно ускорить сборку, но не обязателен.

### Linux/Mac:

```bash
# Включить BuildKit и собрать (опционально)
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build --parallel
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

