# 🔑 How to Get Your Mocha API Key

## Quick Steps:

### Option 1: If you already have a Mocha account
1. Go to: **https://getmocha.com/dashboard**
2. Sign in
3. Navigate to **Settings** or **API Keys** section
4. Copy your API key

### Option 2: If you need to create an account
1. Go to: **https://getmocha.com**
2. Click **Sign Up** or **Get Started**
3. Create your account
4. Go to **Dashboard** → **Settings** → **API Keys**
5. Generate or copy your API key

### Option 3: If this app was created via Mocha
- The API key might be in your Mocha project settings
- Check the project dashboard for this app ID: `019be4f8-599d-7e44-bc53-21277779b119`

## After Getting Your API Key:

1. **Edit `.dev.vars` file:**
   ```bash
   nano .dev.vars
   # or
   open -e .dev.vars
   ```

2. **Replace the placeholder:**
   ```env
   MOCHA_USERS_SERVICE_API_KEY=your_actual_api_key_here
   ```
   Replace `your_actual_api_key_here` with the key you copied

3. **Save the file**

4. **Restart the dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Verify It Works:

Run the diagnostic:
```bash
./CHECK_LOGIN_STATUS.sh
```

You should see:
- ✅ `.dev.vars` file exists
- ✅ API key appears to be configured
- ✅ API is working! Should redirect to Google OAuth

## Still Can't Find It?

- Check your email for Mocha account creation emails
- Contact Mocha support: https://getmocha.com/support
- Join their Discord: https://discord.gg/shDEGBSe2d
