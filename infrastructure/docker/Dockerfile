# Stage: build (optional - for wheels)
FROM python:3.11-slim as builder

WORKDIR /app

COPY requirements.txt .

# Build wheels for faster install in final stage
RUN pip wheel --no-cache-dir -r requirements.txt -w /wheels

# Stage: runtime
FROM python:3.11-slim

WORKDIR /app

# Copy wheels from builder and install
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copy application code
COPY . /app

# Create data directories
RUN mkdir -p /app/data/raw /app/data/precomputed /app/data/demo_slices /app/data/models

# Make start script executable
RUN chmod +x /app/start.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

EXPOSE 8000

CMD ["/app/start.sh"]


