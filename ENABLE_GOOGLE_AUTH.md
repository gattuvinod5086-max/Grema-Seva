# 🔐 Enable Google Authentication - Step by Step

## Current Status:
❌ API key is still a placeholder (`your_api_key_here`)
⚠️  Google authentication **cannot work** without a real API key

## ✅ To Enable Google Authentication:

### Step 1: Get Your Mocha API Key (REQUIRED)

**You MUST do this - there's no way around it:**

1. **Open your browser** and go to:
   ```
   https://getmocha.com/dashboard
   ```

2. **Sign in** (or create account if needed):
   - If you don't have an account, click "Sign Up"
   - Use your email to create an account
   - Verify your email if needed

3. **Find your API Key**:
   - Look for "Settings" or "API Keys" in the dashboard
   - Click on it
   - You'll see your API key (looks like: `mo_xxxxxxxxxxxxx` or similar)
   - **Copy the entire key**

### Step 2: Add API Key to Your Project

**Option A: Use the helper script (Easiest)**
```bash
./edit-api-key.sh
```
Then paste your API key when the editor opens.

**Option B: Edit manually**
```bash
nano .dev.vars
```
Find this line:
```
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
```
Replace `your_api_key_here` with your actual key:
```
MOCHA_USERS_SERVICE_API_KEY=mo_abc123xyz789...
```
Save: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Restart the Server

**IMPORTANT:** You MUST restart the server after adding the key!

```bash
# Stop the current server (press Ctrl+C in the terminal where it's running)
# Then start it again:
npm run dev
```

### Step 4: Test Google Authentication

1. Open: http://localhost:5173
2. Click: **"Sign in with Google"**
3. You should be redirected to Google's login page ✅
4. Sign in with your Google account
5. You'll be redirected back to the app
6. You should see the dashboard! 🎉

## Verify It's Working:

Run this command:
```bash
./CHECK_LOGIN_STATUS.sh
```

You should see:
- ✅ `.dev.vars` file exists
- ✅ API key appears to be configured (not the placeholder)
- ✅ API is working! Should redirect to Google OAuth

## Why This Is Required:

The app uses **Mocha Users Service** for authentication. This service:
- Handles Google OAuth securely
- Manages user sessions
- Requires an API key to work

**Without the API key, the backend cannot:**
- Get the Google OAuth redirect URL
- Exchange authorization codes for session tokens
- Authenticate users

## Troubleshooting:

### "API key is still set to placeholder"
- Make sure you edited `.dev.vars` and replaced `your_api_key_here`
- Check that you saved the file
- Verify the key doesn't have extra spaces

### "Still getting error after adding key"
- **Did you restart the server?** This is critical!
- Check that the API key is correct (no typos)
- Verify the key is on one line (no line breaks)

### "Can't find API key in Mocha dashboard"
- Make sure you're signed in
- Check different sections: Settings, API, Configuration
- Contact Mocha support: https://getmocha.com/support
- Join Discord: https://discord.gg/shDEGBSe2d

## Quick Checklist:

- [ ] Got API key from https://getmocha.com/dashboard
- [ ] Edited `.dev.vars` file
- [ ] Replaced `your_api_key_here` with actual key
- [ ] Saved the file
- [ ] Restarted the dev server (`npm run dev`)
- [ ] Verified with `./CHECK_LOGIN_STATUS.sh`
- [ ] Tested clicking "Sign in with Google"

Once all checked, Google authentication will work! 🚀
