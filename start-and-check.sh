#!/bin/bash

echo "🚀 GramSeva - Start & Check Script"
echo "===================================="
echo ""

# Check if server is running
echo "📡 Checking if dev server is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Dev server is RUNNING"
    echo "   App available at: http://localhost:5173"
else
    echo "❌ Dev server is NOT running"
    echo ""
    echo "🔧 To start the server, run in a terminal:"
    echo "   cd /Users/vinod.gattu/Downloads/GramSeva"
    echo "   npm run dev"
    echo ""
    echo "   Then open: http://localhost:5173"
fi

echo ""
echo "🔑 Checking authentication configuration..."

# Check .dev.vars
if [ -f ".dev.vars" ]; then
    echo "✅ .dev.vars file exists"
    
    if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "❌ API key is still a PLACEHOLDER"
        echo ""
        echo "⚠️  AUTHENTICATION WILL NOT WORK"
        echo ""
        echo "📋 To fix:"
        echo "   1. Get API key from: https://getmocha.com/dashboard"
        echo "   2. Edit: nano .dev.vars"
        echo "   3. Replace 'your_api_key_here' with your actual key"
        echo "   4. Restart server: npm run dev"
    else
        API_KEY=$(grep "MOCHA_USERS_SERVICE_API_KEY=" .dev.vars | cut -d'=' -f2 | tr -d ' ')
        if [ -z "$API_KEY" ] || [ "$API_KEY" = "" ]; then
            echo "❌ API key is empty"
        else
            echo "✅ API key appears to be configured"
        fi
    fi
else
    echo "❌ .dev.vars file does NOT exist"
    echo "   Run: ./setup-auth.sh"
fi

echo ""
echo "📊 Summary:"
echo "==========="

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    if ! grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "✅ Server: Running"
        echo "✅ Auth: Configured"
        echo ""
        echo "🎉 Everything looks good! Try signing in at:"
        echo "   http://localhost:5173"
    else
        echo "✅ Server: Running"
        echo "❌ Auth: Needs API key"
        echo ""
        echo "⚠️  App will load but login won't work"
    fi
else
    if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "❌ Server: Not running"
        echo "❌ Auth: Needs API key"
        echo ""
        echo "⚠️  Both issues need to be fixed"
    else
        echo "❌ Server: Not running"
        echo "✅ Auth: Configured"
        echo ""
        echo "⚠️  Just need to start the server"
    fi
fi

echo ""
echo "💡 Quick fixes:"
echo "   Start server: npm run dev"
echo "   Edit API key: nano .dev.vars"
echo "   Check status: ./show-current-status.sh"
