#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WTF Fitness - ngrok Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}ngrok is not installed!${NC}"
    echo ""
    echo "Install ngrok:"
    echo "  Mac:     brew install ngrok/ngrok/ngrok"
    echo "  Or:      npm install -g ngrok"
    echo "  Or:      Download from https://ngrok.com/download"
    exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo -e "${YELLOW}ngrok is not authenticated!${NC}"
    echo ""
    echo "Steps to authenticate:"
    echo "1. Sign up at https://dashboard.ngrok.com/signup"
    echo "2. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} ngrok is installed and authenticated"
echo ""

# Start Next.js dev server in background
echo -e "${BLUE}Starting Next.js dev server...${NC}"
npm run dev &
DEV_PID=$!

# Wait for dev server to start
echo "Waiting for dev server to start..."
sleep 5

# Start ngrok
echo ""
echo -e "${BLUE}Starting ngrok tunnel...${NC}"
echo ""
ngrok http 3000 &
NGROK_PID=$!

# Wait a moment for ngrok to start
sleep 3

# Get ngrok URL
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ngrok is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Try to get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo -e "${GREEN}Your public URL:${NC} $NGROK_URL"
    echo ""
    echo -e "${YELLOW}IMPORTANT:${NC} Update your .env.local file:"
    echo ""
    echo "  NEXT_PUBLIC_APP_URL=$NGROK_URL"
    echo ""
    echo "Then restart this script (Ctrl+C and run again)"
else
    echo "Open ngrok dashboard: http://localhost:4040"
    echo "Copy the HTTPS URL and update .env.local"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo "Press Ctrl+C to stop both servers"
echo -e "${BLUE}========================================${NC}"

# Wait for user to stop
wait $DEV_PID $NGROK_PID
