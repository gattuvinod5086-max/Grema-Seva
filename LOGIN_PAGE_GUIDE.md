# 🔐 GramSeva Login Page Guide

## 📍 How to Access the Login Page

### URL:
```
http://localhost:5173/login
```

### Or:
- If you try to access any protected page without being logged in, you'll be automatically redirected to `/login`

---

## 🎨 Login Page Features

### **Visual Design:**
- **Beautiful gradient background** (pink → blue → purple)
- **Two-column layout** (responsive - stacks on mobile)
- **Telangana branding** with Telugu text
- **Modern, colorful UI** with rounded corners and shadows

### **Left Side (Information Panel):**

1. **Telangana State Banner**
   - Telangana map image
   - Telugu text: "తెలంగాణ రాష్ట్రం"
   - Statistics: 33 Districts • 589 Mandals

2. **Government Schemes Display**
   - 🏠 **Palle Pragathi** - Village Development Program
   - 💧 **Mission Bhagiratha** - Safe Drinking Water
   - 🌾 **Rythu Bandhu** - Farmer Support
   - ⚡ **Grama Jyothi** - 24x7 Power Supply

### **Right Side (Login Form):**

1. **GramSeva Branding**
   - Large "GramSeva" logo with gradient text
   - Telugu subtitle: "గ్రామ సేవ | Village Service"
   - Tagline: "Digital Governance Portal"

2. **Welcome Message**
   - "Welcome to Digital Village Development!"
   - Description of the platform

3. **Feature Highlights:**
   - ✅ Citizens Report Issues (Water, Roads, Electricity, etc.)
   - 👥 Ward Members & Sarpanch manage issues
   - 📊 Track Progress with real-time updates

4. **Sign-in Button**
   - Large, colorful "Sign in with Google" button
   - Shows loading state when clicked
   - Displays error messages if authentication fails

5. **Footer**
   - "Secure authentication powered by Google"
   - Telugu/English badges: "జై తెలంగాణ | Jai Telangana"

---

## 🔧 How It Works

### **Authentication Flow:**

1. **User clicks "Sign in with Google"**
   - Button calls `handleSignIn()` function
   - Shows loading spinner
   - Calls `redirectToLogin()` from Mocha Users Service

2. **Backend gets OAuth URL**
   - Frontend requests `/api/oauth/google/redirect_url`
   - Backend calls Mocha Users Service API
   - Returns Google OAuth redirect URL

3. **Redirect to Google**
   - Browser redirects to Google's OAuth page
   - User signs in with Google account
   - Google redirects back to `/auth/callback?code=...`

4. **Callback Processing**
   - `/auth/callback` page receives the code
   - Exchanges code for session token
   - Creates user session
   - Redirects to dashboard

---

## ⚠️ Current Status

### **To See the Login Page:**

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:5173/login
   ```

### **For Login to Work:**

You need to configure the API key:

1. **Get API key from:** https://getmocha.com/dashboard
2. **Edit `.dev.vars` file:**
   ```bash
   nano .dev.vars
   ```
3. **Replace placeholder:**
   ```
   MOCHA_USERS_SERVICE_API_KEY=your_actual_api_key_here
   ```
4. **Restart server:**
   ```bash
   npm run dev
   ```

---

## 🎯 Login Page Routes

The login page is accessible at:
- **Direct URL:** `/login`
- **Auto-redirect:** When accessing protected routes without authentication

### **After Login:**
- **First time users:** → `/registration` (to set location)
- **Returning users:** → `/` (Citizen Dashboard)

---

## 🐛 Error Handling

The login page shows errors if:
- ❌ API key is not configured
- ❌ Network connection fails
- ❌ Mocha service is unavailable

**Error Display:**
- Red error box appears above the sign-in button
- Shows clear error message
- Provides fix instructions

---

## 📱 Responsive Design

- **Desktop:** Two-column layout (info + login form)
- **Tablet:** Stacks vertically, maintains readability
- **Mobile:** Single column, optimized for small screens

---

## 🎨 Color Scheme

- **Primary:** Pink (#EC4899) → Purple → Blue gradient
- **Background:** Light gradient (pink-100 → blue-100 → purple-100)
- **Cards:** White with colored borders
- **Buttons:** Gradient backgrounds with hover effects

---

## 🔍 Quick Check

To see if login page is accessible:

```bash
# Check if server is running
./start-and-check.sh

# Or manually:
curl http://localhost:5173/login
```

---

## 📝 Code Location

The login page code is in:
```
src/react-app/pages/Login.tsx
```

---

## ✅ Summary

**Login Page Features:**
- ✅ Beautiful, modern design
- ✅ Telangana branding
- ✅ Government schemes display
- ✅ Google OAuth integration
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive layout

**To Use:**
1. Start server: `npm run dev`
2. Open: http://localhost:5173/login
3. Configure API key for authentication to work

**Current Status:**
- ✅ Page is ready and looks great
- ⚠️  Needs API key to actually authenticate
