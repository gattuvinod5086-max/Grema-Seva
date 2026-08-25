#!/bin/bash

echo "🔧 GramSeva Login Fix"
echo "====================="
echo ""

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
    echo "📝 Creating .dev.vars file..."
    cat > .dev.vars << 'INNEREOF'
# Mocha Users Service Configuration
# Get your API key from: https://getmocha.com/dashboard

MOCHA_USERS_SERVICE_API_URL=https://getmocha.com/u
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
INNEREOF
    echo "✅ Created .dev.vars file!"
else
    echo "✅ .dev.vars file already exists"
fi

echo ""
echo "⚠️  IMPORTANT: You need to add your API key!"
echo ""
echo "📋 Next Steps:"
echo "   1. Get your API key from: https://getmocha.com/dashboard"
echo "   2. Edit .dev.vars file:"
echo "      nano .dev.vars"
echo "   3. Replace 'your_api_key_here' with your actual API key"
echo "   4. Save the file (Ctrl+X, then Y, then Enter for nano)"
echo "   5. Restart the dev server: npm run dev"
echo ""
echo "💡 Quick edit command:"
echo "   nano .dev.vars"
echo ""
echo "🔍 After adding your key, verify with:"
echo "   ./CHECK_LOGIN_STATUS.sh"
