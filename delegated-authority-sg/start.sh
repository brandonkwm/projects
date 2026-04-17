#!/usr/bin/env bash
# Quick start for the delegated-authority-sg demo
# Usage: ./start.sh

set -e

# Check Node version
NODE_MAJOR=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found v$(node -v))"
  exit 1
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Copy .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo ""
echo "Starting MockPass (port 5156) + App (port 3000)…"
echo ""
npm start
