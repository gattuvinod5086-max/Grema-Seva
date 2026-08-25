#!/bin/bash

echo "🔍 Current Google Authentication Status"
echo "========================================"
echo ""

# Check .dev.vars
if [ -f ".dev.vars" ]; then
    echo "✅ .dev.vars file exists"
    
    # Check if API key is still placeholder
    if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "❌ API key is still a PLACEHOLDER"
        echo ""
        echo "⚠️  ACTION REQUIRED:"
        echo "   1. Get your API key from: https://getmocha.com/dashboard"
        echo "   2. Edit .dev.vars: nano .dev.vars"
        echo "   3. Replace 'your_api_key_here' with your actual key"
        echo "   4. Restart server: npm run dev"
    else
        API_KEY=$(grep "MOCHA_USERS_SERVICE_API_KEY=" .dev.vars | cut -d'=' -f2)
        if [ -z "$API_KEY" ] || [ "$API_KEY" = "" ]; then
            echo "❌ API key is empty"
        else
            echo "✅ API key appears to be configured"
            echo "   Key starts with: ${API_KEY:0:10}..."
        fi
    fi
else
    echo "❌ .dev.vars file does NOT exist"
    echo "   Run: ./setup-auth.sh"
fi

echo ""
echo "Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:5173/api/oauth/google/redirect_url 2>&1)

if echo "$API_RESPONSE" | grep -q '"redirectUrl"'; then
    echo "✅ API is WORKING! Google authentication should work"
    echo "   Response: $(echo "$API_RESPONSE" | grep -o '"redirectUrl":"[^"]*"' | head -1 | cut -d'"' -f4 | cut -c1-50)..."
elif echo "$API_RESPONSE" | grep -q '"error"'; then
    echo "❌ API ERROR:"
    echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE"
    echo ""
    echo "💡 This means Google authentication will NOT work until fixed"
else
    echo "⚠️  Unexpected response"
    echo "$API_RESPONSE" | head -3
fi

echo ""
echo "📋 Next Steps:"
if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
    echo "   1. ⚠️  Get API key from: https://getmocha.com/dashboard"
    echo "   2. Edit: nano .dev.vars"
    echo "   3. Replace placeholder with your key"
    echo "   4. Restart: npm run dev"
else
    echo "   ✅ Configuration looks good!"
    echo "   Try signing in at: http://localhost:5173"
fi
