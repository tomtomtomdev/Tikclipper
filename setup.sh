#!/bin/bash
set -e

echo "=== TikClipper Setup ==="

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Install it from https://nodejs.org"
  exit 1
fi

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "ERROR: ffmpeg is not installed."
  echo "  macOS: brew install ffmpeg"
  echo "  Ubuntu: sudo apt install ffmpeg"
  exit 1
fi

# Check Redis
if ! command -v redis-server &>/dev/null; then
  echo "ERROR: Redis is not installed."
  echo "  macOS: brew install redis"
  echo "  Ubuntu: sudo apt install redis-server"
  exit 1
fi

# Create .env.local if missing
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local 2>/dev/null || cat > .env.local <<EOF
ANTHROPIC_API_KEY=your-api-key-here
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
EOF
  echo "Created .env.local - edit it to add your ANTHROPIC_API_KEY"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup database
echo "Setting up database..."
npx drizzle-kit push

# Start Redis if not running
if ! redis-cli ping &>/dev/null 2>&1; then
  echo "Starting Redis..."
  redis-server --daemonize yes
fi

# Run everything
echo ""
echo "=== Starting TikClipper ==="
echo "App: http://localhost:3000"
echo ""

# Start workers in background, Next.js in foreground
npx tsx src/workers/start.ts &
WORKER_PID=$!
trap "kill $WORKER_PID 2>/dev/null" EXIT

npm run dev
