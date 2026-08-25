# 🔄 Login Flow Explanation

## How Login Works

### Step-by-Step Flow:

1. **User clicks "Sign in with Google"**
   - Frontend calls `redirectToLogin()` from `@getmocha/users-service`
   - This calls `/api/oauth/google/redirect_url` endpoint

2. **Backend gets OAuth redirect URL**
   - Backend calls Mocha Users Service API
   - Returns Google OAuth URL
   - **⚠️ Requires: `MOCHA_USERS_SERVICE_API_KEY` in `.dev.vars`**

3. **User redirected to Google**
   - Browser redirects to Google OAuth page
   - User signs in with Google account
   - Google redirects back to `/auth/callback?code=...`

4. **Callback page exchanges code**
   - `/auth/callback` page receives the code
   - Calls `exchangeCodeForSessionToken()`
   - This calls `/api/sessions` endpoint
   - Backend exchanges code for session token
   - Sets session cookie

5. **Redirect to dashboard**
   - On success: Navigate to `/` (Citizen Dashboard)
   - On failure: Show error and redirect to `/login`

## Current Problem

**The login is stuck at Step 2** because:
- ❌ `.dev.vars` file doesn't exist
- ❌ `MOCHA_USERS_SERVICE_API_KEY` is not configured
- ❌ Backend can't get OAuth redirect URL
- ❌ User never gets redirected to Google

## Solution

### Quick Fix:

```bash
# 1. Create .dev.vars file
cd /Users/vinod.gattu/Downloads/GramSeva
./setup-auth.sh

# 2. Edit .dev.vars and add your API key
nano .dev.vars
# Replace 'your_api_key_here' with actual key from https://getmocha.com/dashboard

# 3. Restart server
npm run dev
```

### After Setup:

1. Click "Sign in with Google" → Should redirect to Google
2. Sign in with Google → Google redirects back
3. Callback page processes → Creates session
4. Redirects to Dashboard → ✅ Success!

## Debugging

### Check if API key is configured:
```bash
curl http://localhost:5173/api/oauth/google/redirect_url
```

**Expected (with API key):**
```json
{"redirectUrl": "https://accounts.google.com/oauth/..."}
```

**Current (without API key):**
```json
{"error": "MOCHA_USERS_SERVICE_API_KEY is not configured..."}
```

### Check browser console:
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Go to **Console** tab
3. Look for errors when clicking "Sign in with Google"

### Check Network tab:
1. Press `F12` → **Network** tab
2. Click "Sign in with Google"
3. Look for `/api/oauth/google/redirect_url` request
4. Check the response - should have `redirectUrl` or `error`

## Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| No API key | Button does nothing or shows error | Create `.dev.vars` with API key |
| Invalid API key | Error: "Failed to get OAuth redirect URL" | Get correct key from Mocha dashboard |
| Server not restarted | Changes not taking effect | Restart `npm run dev` |
| Stuck on callback | "Signing you in..." forever | Check `/api/sessions` endpoint works |
| Redirect loop | Keeps going back to login | Check session cookie is being set |
