#!/bin/bash
echo "🔍 Checking Login Status"
echo "========================"
echo ""

# Check if .dev.vars exists
if [ -f ".dev.vars" ]; then
    echo "✅ .dev.vars file exists"
    if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "⚠️  WARNING: API key is still set to placeholder!"
        echo "   Edit .dev.vars and replace 'your_api_key_here' with your actual key"
    else
        echo "✅ API key appears to be configured"
    fi
else
    echo "❌ .dev.vars file does NOT exist"
    echo "   Run: ./setup-auth.sh"
fi

echo ""
echo "Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:5173/api/oauth/google/redirect_url 2>&1)

if echo "$API_RESPONSE" | grep -q "redirectUrl"; then
    echo "✅ API is working! Should redirect to Google OAuth"
elif echo "$API_RESPONSE" | grep -q "error"; then
    echo "❌ API error:"
    echo "$API_RESPONSE" | grep -o '"error":"[^"]*"' | head -1
else
    echo "⚠️  Unexpected response:"
    echo "$API_RESPONSE" | head -3
fi

echo ""
echo "💡 Next steps:"
echo "   1. Make sure .dev.vars exists with valid API key"
echo "   2. Restart dev server: npm run dev"
echo "   3. Try signing in again"
