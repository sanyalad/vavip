# Development Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Configure apt for faster, non-interactive installs
RUN echo 'APT::Install-Recommends "false";' > /etc/apt/apt.conf.d/99-no-recommends && \
    echo 'APT::Install-Suggests "false";' >> /etc/apt/apt.conf.d/99-no-recommends && \
    echo 'APT::Get::Assume-Yes "true";' >> /etc/apt/apt.conf.d/99-no-recommends && \
    echo 'APT::Get::AllowUnauthenticated "false";' >> /etc/apt/apt.conf.d/99-no-recommends

# Install system dependencies (cache this layer)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

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









