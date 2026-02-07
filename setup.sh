#!/bin/bash
set -e

echo "=== TikClipper Setup ==="

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Install it from https://nodejs.org"
  exit 1
fi

# Check and install ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "ffmpeg not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      brew install ffmpeg
    else
      echo "ERROR: Homebrew not found. Install it from https://brew.sh then re-run."
      exit 1
    fi
  elif command -v apt-get &>/dev/null; then
    sudo apt-get update && sudo apt-get install -y ffmpeg
  elif command -v yum &>/dev/null; then
    sudo yum install -y ffmpeg
  else
    echo "ERROR: Could not auto-install ffmpeg. Install it manually and re-run."
    exit 1
  fi
fi

# Check and install Redis
if ! command -v redis-server &>/dev/null; then
  echo "Redis not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      brew install redis
    else
      echo "ERROR: Homebrew not found. Install it from https://brew.sh then re-run."
      exit 1
    fi
  elif command -v apt-get &>/dev/null; then
    sudo apt-get update && sudo apt-get install -y redis-server
  elif command -v yum &>/dev/null; then
    sudo yum install -y redis
  else
    echo "ERROR: Could not auto-install Redis. Install it manually and re-run."
    exit 1
  fi
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
