#!/bin/bash

echo "🔐 GramSeva Login Page"
echo "======================"
echo ""

# Check if server is running
if curl -s http://localhost:5173/login > /dev/null 2>&1; then
    echo "✅ Server is running!"
    echo ""
    echo "🌐 Login page is available at:"
    echo "   http://localhost:5173/login"
    echo ""
    echo "📋 Login Page Features:"
    echo "   • Beautiful gradient design"
    echo "   • Telangana state branding"
    echo "   • Government schemes display"
    echo "   • Google OAuth sign-in"
    echo "   • Error handling"
    echo ""
    echo "💡 To open:"
    echo "   Open your browser and go to: http://localhost:5173/login"
    echo ""
    
    # Check authentication status
    if grep -q "your_api_key_here" .dev.vars 2>/dev/null; then
        echo "⚠️  Note: Login button won't work until you add your API key"
        echo "   See: AUTH_SETUP.md for instructions"
    else
        echo "✅ API key appears configured - login should work!"
    fi
else
    echo "❌ Server is NOT running"
    echo ""
    echo "🔧 To start the server:"
    echo "   npm run dev"
    echo ""
    echo "Then open: http://localhost:5173/login"
fi

echo ""
echo "📖 For more info, see: LOGIN_PAGE_GUIDE.md"
