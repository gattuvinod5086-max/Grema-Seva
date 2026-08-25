# Authentication Setup Guide

## Problem: Sign-in Page Not Working

The sign-in page requires a **Mocha Users Service API Key** to be configured. Without it, the OAuth flow cannot be initiated.

## Solution: Configure API Key

### Step 1: Get Your Mocha API Key

Since this app was created using [getmocha.com](https://getmocha.com), you need to:

1. **Visit your Mocha Dashboard**: https://getmocha.com/dashboard
2. **Sign in** (or create an account if needed)
3. **Find your API Key** in Settings → API Keys section
4. **Copy the API key**

> **💡 Quick Links:**
> - Dashboard: https://getmocha.com/dashboard
> - Sign Up: https://getmocha.com (if you don't have an account)
> - Support: https://getmocha.com/support
> - Discord: https://discord.gg/shDEGBSe2d
> 
> **Note**: If you don't have a Mocha account, sign up first, then get your API key from the dashboard.

### Step 2: Create `.dev.vars` File

Create a file named `.dev.vars` in the project root:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` and add your API key:

```env
MOCHA_USERS_SERVICE_API_URL=https://getmocha.com/u
MOCHA_USERS_SERVICE_API_KEY=your_actual_api_key_here
```

### Step 3: Restart Development Server

After creating `.dev.vars`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification

After setting up the API key, test the sign-in:

1. Open http://localhost:5173
2. Click "Sign in with Google"
3. You should be redirected to Google OAuth
4. After authentication, you'll be redirected back to the app

## Troubleshooting

### Error: "MOCHA_USERS_SERVICE_API_KEY is not configured"

- Make sure `.dev.vars` file exists in the project root
- Verify the file contains `MOCHA_USERS_SERVICE_API_KEY=your_key`
- Restart the development server after creating/editing `.dev.vars`

### Error: "Failed to get OAuth redirect URL"

- Check that your API key is valid
- Verify you have internet connection (needs to reach getmocha.com)
- Check the browser console for detailed error messages

### Still Not Working?

1. Check browser console (F12 → Console tab) for errors
2. Check Network tab to see API request/response
3. Verify `.dev.vars` file is in the correct location (project root)
4. Make sure the development server was restarted after creating `.dev.vars`

## Production Deployment

For production (Cloudflare Workers), set these as environment variables/secrets in your Cloudflare dashboard, not in `.dev.vars`.
