## GramSeva

**Village & Rural Development Issue Reporting System for Telangana State**

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation & Setup

#### Option 1: Using Setup Script (Recommended)
```bash
# Make scripts executable (first time only)
chmod +x setup.sh start.sh

# Run setup
./setup.sh

# Start development server
./start.sh
```

#### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application

After running `npm run dev`, open your browser and navigate to:
- **Local:** http://localhost:5173
- The terminal will show the exact URL

---

## 📱 Application Features

### For Citizens:
- 🔐 **Google OAuth Login** - Secure authentication
- 📝 **Report Issues** - Water, Roads, Sanitation, Electricity, Welfare
- 📸 **Photo Upload** - Attach photos to issues
- 📍 **GPS Location** - Capture issue location
- 👥 **Ward Members Directory** - Contact village representatives
- 📊 **Track Issues** - View status of reported issues

### For Administrators:
- 🗺️ **Telangana Map View** - Browse all districts, mandals, and villages
- 📋 **Issue Management** - Assign and update issue status
- 👤 **User Management** - Manage roles and permissions

---

## 🏗️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Hono (Cloudflare Workers)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (for photos)
- **Styling:** Tailwind CSS
- **Authentication:** Google OAuth via @getmocha/users-service

---

## 📂 Project Structure

```
GramSeva/
├── src/
│   ├── react-app/          # React frontend
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── hooks/         # Custom React hooks
│   ├── worker/            # Cloudflare Worker (backend)
│   ├── shared/            # Shared types
│   └── data/              # Telangana location data
├── migrations/            # Database migrations
└── public/               # Static assets
```

---

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run check` - Type check and build validation

---

## 🌐 Application Routes

- `/` - Citizen Dashboard (protected)
- `/login` - Login page
- `/registration` - User registration (protected)
- `/telangana` - Telangana admin view (protected)
- `/ward-members` - Ward members directory (protected)

---

## 📝 Notes

- First-time users will be prompted to complete registration
- Location selection: District → Mandal → Village
- Issues are filtered by user's village location
- Photo uploads are stored in Cloudflare R2

---

## 🔐 Authentication Setup

**⚠️ IMPORTANT**: The sign-in page requires a Mocha Users Service API Key to work.

### Quick Setup:

1. **Get your API key** from https://getmocha.com/dashboard
2. **Create `.dev.vars` file** in the project root:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
3. **Edit `.dev.vars`** and add your API key:
   ```env
   MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
   ```
4. **Restart the dev server**

See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed instructions.

---

## 🆘 Troubleshooting

**Sign-in page not working:**
- See [AUTH_SETUP.md](./AUTH_SETUP.md) for authentication setup
- Make sure `.dev.vars` file exists with your API key
- Restart the dev server after creating `.dev.vars`

**Node.js not found:**
- Install Node.js from https://nodejs.org/
- Or use Homebrew: `brew install node`

**Port already in use:**
- Vite will automatically try the next available port
- Or specify a port: `npm run dev -- --port 3000`

**Dependencies issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install --legacy-peer-deps` again
