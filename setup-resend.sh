#!/bin/bash

# Resend Setup Script for WTF Fitness
# This script helps you quickly set up Resend for email verification

echo "🚀 WTF Fitness - Resend Email Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install Resend package
echo "📦 Step 1: Installing Resend package..."
npm install resend

if [ $? -eq 0 ]; then
    echo "✅ Resend package installed successfully!"
else
    echo "❌ Failed to install Resend package"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 2: Check if .env.local exists
echo "📝 Step 2: Checking environment configuration..."

if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Instructions for API key
echo "🔑 Step 3: Resend API Key Setup"
echo ""
echo "To complete setup:"
echo ""
echo "1. Go to: https://resend.com"
echo "2. Sign up or log in"
echo "3. Navigate to 'API Keys'"
echo "4. Create a new API key"
echo "5. Copy the key (starts with 're_')"
echo ""
echo "6. Add to .env.local:"
echo "   RESEND_API_KEY=re_your_key_here"
echo ""
echo "7. Update .env.local with your app URL:"
echo "   NEXT_PUBLIC_APP_URL=http://localhost:3000"
echo ""

# Check if RESEND_API_KEY is already set
if grep -q "RESEND_API_KEY=" .env.local 2>/dev/null; then
    if grep -q "RESEND_API_KEY=re_" .env.local; then
        echo "✅ RESEND_API_KEY appears to be configured!"
    else
        echo "⚠️  RESEND_API_KEY found but may not be set correctly"
    fi
else
    echo "⚠️  RESEND_API_KEY not found in .env.local"
    echo ""
    echo "Would you like to add it now? (You'll need your API key ready)"
    read -p "Add RESEND_API_KEY? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Resend API key: " api_key
        echo "" >> .env.local
        echo "# Resend Email Configuration" >> .env.local
        echo "RESEND_API_KEY=$api_key" >> .env.local
        echo "✅ Added RESEND_API_KEY to .env.local"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Final instructions
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. ✅ Resend package installed"
echo "2. ✅ .env.local configured"
echo "3. 🔄 Restart your dev server:"
echo "      npm run dev"
echo ""
echo "4. 🧪 Test the email flow:"
echo "   - Go to Start Session page"
echo "   - Click START on a client"
echo "   - Check console or inbox for email"
echo ""
echo "📚 Need help? Check RESEND_SETUP_GUIDE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
