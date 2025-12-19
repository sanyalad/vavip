# Development Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (cache this layer)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with cache mount (faster rebuilds)
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# Copy source (this layer invalidates only when code changes)
COPY . .

# Expose Flask port
EXPOSE 5000

# Start with eventlet for WebSocket support
CMD ["python", "run.py"]









