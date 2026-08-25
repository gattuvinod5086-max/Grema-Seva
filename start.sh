#!/bin/bash

# GramSeva Start Script
echo "🚀 Starting GramSeva Development Server..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please run: ./setup.sh first"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Installing..."
    npm install
fi

# Start the development server
echo "✅ Starting Vite development server..."
echo ""
echo "   Open: http://localhost:5173/app"
echo "   OTP for mobile login: 1234"
echo ""
npm run dev
