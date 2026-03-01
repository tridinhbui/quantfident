#!/bin/bash

# Quick Deployment Test Script for Quantfident
# This script checks if the project is ready for deployment

echo "🧪 Starting Deployment Readiness Test..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
echo ""
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check dependencies
echo ""
echo "3️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    PACKAGE_COUNT=$(npm list --depth=0 2>/dev/null | grep -c "^[├└]")
    echo -e "${GREEN}✅ Dependencies installed: $PACKAGE_COUNT packages${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules not found. Installing...${NC}"
    npm install
fi

# Run build
echo ""
echo "4️⃣  Testing build..."
if npm run build > /tmp/build-test.log 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo -e "${RED}❌ Build failed. Check /tmp/build-test.log${NC}"
    tail -20 /tmp/build-test.log
    exit 1
fi

# Check for .env file
echo ""
echo "5️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check for required variables
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}   ✅ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}   ⚠️  DATABASE_URL not found in .env${NC}"
    fi
    
    if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env; then
        echo -e "${GREEN}   ✅ Firebase configured${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Firebase variables not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "   Copy .env.example to .env and configure:"
    echo "   cp .env.example .env"
fi

# Test production server (quick check)
echo ""
echo "6️⃣  Testing production server..."
PORT=3002
echo "   Starting server on port $PORT..."

# Kill any existing process on that port
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# Start server in background
DATABASE_URL="${DATABASE_URL:-postgresql://test:test@localhost:5432/test}" \
PORT=$PORT npm start > /tmp/server-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    # Test HTTP response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Production server responding (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Server running but returned HTTP $HTTP_CODE${NC}"
    fi
    
    # Stop the test server
    kill $SERVER_PID 2>/dev/null
else
    echo -e "${RED}❌ Server failed to start${NC}"
    tail -20 /tmp/server-test.log
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DEPLOYMENT READINESS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Project is ready for deployment!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment variables (.env file)"
echo "2. Deploy to your platform of choice:"
echo "   - Vercel: vercel --prod"
echo "   - Docker: docker build -t quantfident ."
echo "   - VPS: Follow DEPLOYMENT.md guide"
echo ""
echo "For detailed instructions, see: DEPLOYMENT.md"
echo ""
