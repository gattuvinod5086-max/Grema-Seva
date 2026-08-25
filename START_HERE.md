# 🚀 START HERE - Enable Google Authentication

## ⚠️ IMPORTANT: Google Authentication Won't Work Until You Do This

Your app is **almost ready**, but Google authentication requires one more step.

## The Problem:
The `.dev.vars` file has a **placeholder** API key. You need to replace it with your **real** API key from Mocha.

## The Solution (3 Minutes):

### 1️⃣ Get Your API Key (2 minutes)

**Open this link in your browser:**
👉 **https://getmocha.com/dashboard**

- Sign in (or create account)
- Find "API Keys" or "Settings"
- Copy your API key

### 2️⃣ Add It to Your Project (30 seconds)

**Run this command:**
```bash
./edit-api-key.sh
```

When the editor opens:
- Find: `MOCHA_USERS_SERVICE_API_KEY=your_api_key_here`
- Replace `your_api_key_here` with your actual key
- Save: `Ctrl+X`, then `Y`, then `Enter`

### 3️⃣ Restart Server (10 seconds)

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4️⃣ Test It!

1. Go to: http://localhost:5173
2. Click: **"Sign in with Google"**
3. Should redirect to Google! ✅

## Quick Status Check:

```bash
./show-current-status.sh
```

This will tell you exactly what's missing.

## Need Help?

- **Can't find API key?** → See `GET_API_KEY.md`
- **Detailed instructions?** → See `ENABLE_GOOGLE_AUTH.md`
- **Still stuck?** → Check `AUTH_SETUP.md`

## Current Status:

```
✅ All code is ready
✅ Configuration file exists
⚠️  Waiting for your API key
```

**Once you add the API key, Google authentication will work immediately!** 🎉
