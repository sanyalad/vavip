# Development Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (cache this layer)
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Layer is cached unless requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy source (this layer invalidates only when code changes)
COPY . .

# Expose Flask port
EXPOSE 5000

# Start with eventlet for WebSocket support
CMD ["python", "run.py"]









