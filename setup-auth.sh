#!/bin/bash

# Quick Auth Setup Script for GramSeva

echo "🔐 GramSeva Authentication Setup"
echo "================================"
echo ""

# Check if .dev.vars already exists
if [ -f ".dev.vars" ]; then
    echo "⚠️  .dev.vars file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Keeping existing .dev.vars file."
        exit 0
    fi
fi

echo "📝 Setting up .dev.vars file..."
echo ""

# Create .dev.vars file
cat > .dev.vars << 'EOF'
# Mocha Users Service Configuration
# Get your API key from: https://getmocha.com/dashboard

MOCHA_USERS_SERVICE_API_URL=https://getmocha.com/u
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
EOF

echo "✅ Created .dev.vars file!"
echo ""
echo "📋 Next steps:"
echo "   1. Get your API key from: https://getmocha.com/dashboard"
echo "   2. Edit .dev.vars and replace 'your_api_key_here' with your actual API key"
echo "   3. Restart your dev server: npm run dev"
echo ""
echo "💡 Quick edit command:"
echo "   nano .dev.vars"
echo "   # or"
echo "   open -e .dev.vars"
echo ""
