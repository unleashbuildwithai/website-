# 🔧 Backend Connection Issue - Quick Fix Guide

## The Problem

You're seeing "Connection error - is backend running?" because the backend server needs to be running separately from the HTML file.

## ✅ Solution (Step-by-Step)

### 1. **Start the Backend Server**

Open a **new terminal/command prompt** and run:

```bash
cd backend
npm install
node server.js
```

You should see:
```
╔════════════════════════════════════════╗
║  🤖 ARDY W API SERVER RUNNING          ║
║  Port: 3000                            ║
║  Environment: development              ║
╚════════════════════════════════════════╝
```

### 2. **Open the HTML File**

**Option A: Using Live Server (Recommended)**
- Right-click `index.html` in VS Code
- Select "Open with Live Server"
- It will open at `http://localhost:5500` or similar

**Option B: Direct File Open**
- Simply double-click `index.html`
- Opens as `file:///...`
- Still works! The code detects this and uses localhost:3000

### 3. **Verify It's Working**

- Open browser console (F12)
- You should see: `✅ Backend connected: 🤖 Ardy W API is running`
- If not, you'll see instructions on how to start the backend

## 🔍 Why This Happens

The website has two parts:
1. **Frontend** (HTML/JavaScript) - The visual website
2. **Backend** (Node.js server) - Handles data storage and security

The backend must run separately on port 3000. When you try to submit a form or access admin features without the backend running, you get the connection error.

## 📝 Common Issues & Fixes

### Issue: "Cannot find module 'express'"
**Fix:** 
```bash
cd backend
npm install
```

### Issue: "Port 3000 is already in use"
**Fix:** Either:
1. Stop the other process using port 3000, OR
2. Change the port in `backend/server.js` line 11:
   ```javascript
   const PORT = process.env.PORT || 3001; // Changed to 3001
   ```
   Then update `index.html` line 1595 to match:
   ```javascript
   ? 'http://localhost:3001/api'
   ```

### Issue: Backend stops when I close terminal
**Fix:** This is normal. Keep the terminal running, or use:
```bash
# Windows (PowerShell)
Start-Process node -ArgumentList "backend/server.js" -WindowStyle Hidden

# Or use PM2 (install first: npm install -g pm2)
pm2 start backend/server.js --name ardy-backend
```

## 🎯 Quick Test

1. Backend running? → Check terminal shows the ASCII art box
2. Frontend open? → Browser shows the robot website
3. Try clicking "⚡ INITIATE BUILD SEQUENCE"
4. Fill the form and click "🚀 Launch My Build"
5. Success! → You should see "✅ Build Request Sent!"

## 🔐 Admin Panel

To access admin features:
1. Backend MUST be running
2. Click the 🔐 button (top left)
3. Enter credentials from `backend/.env`
4. View/manage submitted build requests

## 📚 Environment Variables

Make sure `backend/.env` exists with:
```env
JWT_SECRET=your-secret-key-here
ADMIN_USERNAME=Admin
ADMIN_PASSWORD_HASH=<hash from hash-password.js>
```

Generate password hash:
```bash
cd backend
node hash-password.js YourPassword123
```

## 🚀 Production Deployment

For deploying to a live server, the HTML automatically switches to:
```
https://website-5nvl.onrender.com/api
```

This only happens when NOT running on localhost.

---

## 💡 TL;DR

**Every time you want to use the site locally:**

1. Open terminal → `cd backend && node server.js`
2. Open `index.html` in browser
3. Done! Everything should work

The "little bug" you mentioned is simply forgetting to start the backend server. It's not actually running automatically - you need to start it manually each time!
