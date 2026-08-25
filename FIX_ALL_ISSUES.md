# 🔧 Fix All Issues - Complete Guide

## Current Problems:

1. ❌ **Dev server is NOT running** - App won't load
2. ❌ **API key is placeholder** - Authentication won't work

## ✅ Solution - Fix Both Issues:

### Issue 1: Start the Dev Server

**The app is not running because the dev server is stopped.**

**Fix:**
```bash
cd /Users/vinod.gattu/Downloads/GramSeva
npm run dev
```

**You should see:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Then open:** http://localhost:5173

---

### Issue 2: Fix Authentication (API Key)

**Authentication won't work because the API key is still a placeholder.**

**Current status:**
```
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here  ❌ (placeholder)
```

**Fix (3 steps):**

#### Step 1: Get Your API Key
1. Go to: **https://getmocha.com/dashboard**
2. Sign in (or create account)
3. Find **API Keys** in Settings
4. Copy your API key

#### Step 2: Add API Key
```bash
nano .dev.vars
```

Find this line:
```
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
```

Replace with your actual key:
```
MOCHA_USERS_SERVICE_API_KEY=mo_your_actual_key_here
```

Save: `Ctrl+X`, then `Y`, then `Enter`

#### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Complete Fix Checklist:

- [ ] **Start dev server:** `npm run dev`
- [ ] **Verify app loads:** Open http://localhost:5173
- [ ] **Get API key:** From https://getmocha.com/dashboard
- [ ] **Edit .dev.vars:** Replace placeholder with real key
- [ ] **Restart server:** After editing .dev.vars
- [ ] **Test login:** Click "Sign in with Google"

---

## Quick Commands:

```bash
# 1. Start the server
npm run dev

# 2. Check status (in another terminal)
./show-current-status.sh

# 3. Edit API key
nano .dev.vars
```

---

## Why Authentication Fails:

**Without a real API key:**
- ❌ Backend cannot get Google OAuth URL
- ❌ Cannot authenticate users
- ❌ Cannot create sessions
- ❌ Login button does nothing or shows error

**With a real API key:**
- ✅ Backend gets Google OAuth URL
- ✅ Redirects to Google login
- ✅ Creates user session
- ✅ Logs you in successfully

---

## Troubleshooting:

### "App not loading / Server not responding"
→ **Start the server:** `npm run dev`

### "Authentication not working"
→ **Add real API key** to `.dev.vars` and restart server

### "Still not working after adding key"
→ Make sure you:
1. Saved the `.dev.vars` file
2. Restarted the server
3. Used the correct API key (no typos)

---

## Summary:

**To get everything working:**

1. **Start server:** `npm run dev`
2. **Get API key:** https://getmocha.com/dashboard
3. **Add to .dev.vars:** Replace `your_api_key_here`
4. **Restart server:** `npm run dev` again
5. **Test:** Open http://localhost:5173 and click "Sign in with Google"

**That's it!** 🚀
