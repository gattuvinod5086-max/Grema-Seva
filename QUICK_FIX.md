# 🔧 Quick Fix: Sign-in Not Working

## The Problem
The sign-in button doesn't work because the **Mocha API Key is missing**.

## The Solution (3 Steps)

### Step 1: Get Your API Key
1. Go to: **https://getmocha.com/dashboard**
2. Sign in or create an account
3. Find your **API Key** in the settings

### Step 2: Create `.dev.vars` File
Run this command in your terminal:

```bash
cd /Users/vinod.gattu/Downloads/GramSeva
cat > .dev.vars << 'EOF'
MOCHA_USERS_SERVICE_API_URL=https://getmocha.com/u
MOCHA_USERS_SERVICE_API_KEY=PASTE_YOUR_API_KEY_HERE
EOF
```

Then edit `.dev.vars` and replace `PASTE_YOUR_API_KEY_HERE` with your actual API key.

### Step 3: Restart Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Verify It Works
1. Open http://localhost:5173
2. Click "Sign in with Google"
3. You should be redirected to Google OAuth ✅

## Still Not Working?

**Check the browser console:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Go to **Console** tab
3. Look for error messages
4. Share the error message if you need help

**Common Issues:**
- ❌ `.dev.vars` file doesn't exist → Create it (Step 2)
- ❌ API key is wrong → Get a new one from Mocha dashboard
- ❌ Server not restarted → Restart after creating `.dev.vars`
- ❌ File in wrong location → Must be in project root (`/Users/vinod.gattu/Downloads/GramSeva/.dev.vars`)
