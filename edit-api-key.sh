#!/bin/bash

# Helper script to edit the API key

echo "🔑 Opening .dev.vars for editing..."
echo ""

if [ ! -f ".dev.vars" ]; then
    echo "❌ .dev.vars file not found!"
    echo "   Run: ./setup-auth.sh first"
    exit 1
fi

# Try to open with default editor
if command -v nano &> /dev/null; then
    echo "📝 Opening with nano editor..."
    echo "   Instructions:"
    echo "   - Find the line: MOCHA_USERS_SERVICE_API_KEY=your_api_key_here"
    echo "   - Replace 'your_api_key_here' with your actual API key"
    echo "   - Press Ctrl+X to exit"
    echo "   - Press Y to save"
    echo "   - Press Enter to confirm"
    echo ""
    read -p "Press Enter to open the file..."
    nano .dev.vars
elif command -v open &> /dev/null; then
    echo "📝 Opening with default text editor..."
    open -e .dev.vars
else
    echo "📝 Please edit .dev.vars manually:"
    echo ""
    cat .dev.vars
    echo ""
    echo "Copy the content above, edit it, and save to .dev.vars"
fi

echo ""
echo "✅ After editing, restart your dev server:"
echo "   npm run dev"
