#!/bin/bash

echo "🔍 Checking dependencies..."

# Check if node_modules exists and has content
if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules)" ]; then
    echo "📦 node_modules not found or empty. Installing dependencies..."
    npm install
    echo "✅ Dependencies installed successfully!"
else
    echo "✅ Dependencies already installed. Checking for updates..."

    # Check if package-lock.json is newer than node_modules
    if [ "package-lock.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
        echo "📦 package-lock.json is newer. Reinstalling dependencies..."
        rm -rf node_modules package-lock.json
        npm install
        echo "✅ Dependencies reinstalled successfully!"
    else
        echo "✅ Dependencies are up to date."
    fi
fi

echo "🚀 Starting development server..."
npm run dev
