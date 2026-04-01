#!/bin/bash
set -e

echo "=== Installing client dependencies ==="
cd client
npm ci
echo "=== Building client ==="
npm run build
cd ..

echo "=== Installing server dependencies ==="
cd server
npm ci --omit=dev
echo "=== Build complete ==="
