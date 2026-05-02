# 🤖 Ardy W | Portfolio Website - Full-Stack System

**Advanced portfolio with 3D robot animations, hand-grab scroll mechanics, and complete backend messaging system**

---

## 🚀 Quick Start

### **1. Set Up Backend**

```bash
cd backend
npm install
node hash-password.js
```

Copy the output and create a `.env` file:

```bash
# backend/.env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
JWT_SECRET=<paste JWT secret from hash-password.js>
ADMIN_USERNAME=Admin
ADMIN_PASSWORD_HASH=<paste password hash from hash-password.js>
```

Start the backend server:

```bash
npm start
```

The API will be running at `http://localhost:3000`

### **2. Update Frontend API URL**

Open `index.html` and find line ~1479:

```javascript
const API_URL = 'http://localhost:3000/api'; // Change to your deployed backend URL
```

For production, change this to your deployed backend URL (e.g., `https://your-backend.railway.app/api`)

### **3. Open the Website**

Open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 5500

# Using Node
npx http-server -p 5500

# Using Live Server in VS Code
Right-click index.html → Open with Live Server
```

---

## 📂 Project Structure

```
/
├── index.html                  # Main website (frontend)
├── backend/
│   ├── server.js              # Express API server
│   ├── database.js            # SQLite database operations
│   ├── package.json           # Node dependencies
│   ├── hash-password.js       # Password hash generator
│   ├── .env.example           # Environment variables template
│   ├── .gitignore            # Git ignore rules
│   └── messages.db           # SQLite database (created automatically)
├── archive/                   # Previous versions
└── README.md                  # This file
```

---

## 🔐 Security Features

### **Password Protection**
- ✅ **Admin password changed to `420admin`** (as requested)
- ✅ **Bcrypt hashing** - Password is never stored in plain text
- ✅ **JWT authentication** - Secure session management
- ✅ **Fake credentials in source code** - Trolls snoopers who view-source

### **What Snoopers See (Fake)**
```javascript
const ADMIN_USER_FAKE='SuperAdmin';
const ADMIN_PASS_FAKE='admin123'; // This doesn't work!
```

### **Real Authentication**
- Server-side validation with bcrypt
- JWT tokens with 24-hour expiration
- Rate limiting (5 login attempts per 15 minutes)

---

## 📱 Mobile Optimizations

### **Issues Fixed**
1. ✅ Better viewport handling for iOS/Android
2. ✅ Tap-to-flip card on mobile
3. ✅ Scrollable modals
4. ✅ Responsive layout for all screen sizes
5. ✅ Touch-friendly UI elements

### **Still TODO (See Implementation Plan)**
- Adjust viewport scroll height for mobile (currently 5x viewport height)
- Add platform-specific CSS for iOS Safari 3D transform bugs
- Add dev console trolling messages

---

## 💬 Messaging System

### **Current Setup (LocalStorage)**
Messages are still saved to browser localStorage for development. This means:
- ❌ Messages only visible on the device they were sent from
- ❌ Admin can't see messages from other devices

### **Backend Ready - Needs Frontend Integration**
The backend API is **fully functional** and ready to use. To complete the integration:

**API Endpoints Available:**
- `POST /api/messages` - Submit new message (public)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/messages` - Get all messages (protected)
- `PUT /api/admin/messages/:id` - Update message status (protected)
- `DELETE /api/admin/messages/:id` - Delete message (protected)
- `DELETE /api/admin/trash` - Empty trash (protected)

**What Still Needs to Be Done:**
Replace the localStorage functions in `index.html` with API fetch() calls. See "Implementation Plan" below.

---

## 🎨 Features

### **Scroll-Driven Animations**
- Hero card spins with scroll velocity, flips on hover
- Robot arms grab and pull sections into view
- Stop-motion hand choreography (22 keyframes)
- Gear rotations sync with scroll
- 3D transforms with perspective

### **Admin Panel**
- Secure JWT authentication
- Message inbox with status management (New/Accepted/Archived/Completed/Trash)
- Filter messages by status
- Reply via email (mailto links)
- Trash system with confirmation

### **Hand Animator Tool (Press 'H')**
- Live position editing
- Keyframe recording
- GSAP code export
- Hidden on mobile

---

## 🌐 Deployment

### **Option 1: Railway (Recommended)**

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Deploy backend:**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Push to Railway:**
   - Create new project in Railway
   - Connect GitHub repo or use Railway CLI
   - Railway will auto-detect Node.js
   - Add environment variables in Railway dashboard:
     - `ADMIN_USERNAME=Admin`
     - `ADMIN_PASSWORD_HASH=<your hash>`
     - `JWT_SECRET=<your secret>`
     - `ALLOWED_ORIGINS=https://yourdomain.com`

4. **Get your Railway URL** (e.g., `https://your-app.railway.app`)

5. **Update frontend:** Change `API_URL` in `index.html` to your Railway URL

6. **Deploy frontend:**
   - Use **Vercel**, **Netlify**, or **GitHub Pages** for the HTML file
   - Or commit to your GitHub repo and enable GitHub Pages

### **Option 2: Render**
Same process as Railway, free tier available at [render.com](https://render.com)

### **Option 3: Local Network Only**
Keep backend running on `localhost:3000` and access from your phone via local IP:
```javascript
const API_URL = 'http://192.168.1.XXX:3000/api'; // Your computer's local IP
```

---

## 🛠️ Implementation Plan (Remaining Work)

### **To complete the full-stack integration, you need to:**

### 1. **Replace LocalStorage with API Calls**

**Current functions to replace:**
- `saveLocalMsg()` → Call `POST /api/messages`
- `getLocalMsgs()` → Call `GET /api/admin/messages`
- `updateMsgStatus()` → Call `PUT /api/admin/messages/:id`
- `deletePermanently()` → Call `DELETE /api/admin/messages/:id`
- Admin login → Call `POST /api/auth/login`

**Example API integration:**
```javascript
// Instead of localStorage
async function saveMsg(msg) {
  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(msg)
  });
  return await res.json();
}

// Admin login
async function adminLogin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await res.json();
  if(data.token) {
    authToken = data.token;
    localStorage.setItem('admin_token', data.token);
  }
  return data;
}
```

### 2. **Add Dev Console Trolling**

Add this after the `<script>` tag opens:

```javascript
// ═══ DEV CONSOLE TROLL ═══
console.log('%c🤖 Nice Try, Hacker!', 'color:#00ffcc;font-size:24px;font-weight:bold;');
console.log('%cLooking for secrets? Good luck with that...', 'color:#ff8c42;font-size:14px;');
console.log('%c⚠️ WARNING: Accessing this console may trigger SKYNET protocols', 'color:#ff6060;font-size:12px;');
console.log({
  fake_api_key: 'sk_live_51NotRealHahaGotYou123456789',
  admin_secret: 'You really thought it would be here?',
  database_password: 'hunter2',
  crypto_wallet: '0xFAKE1234567890ABCDEF',
  nuclear_codes: 'Nice try, NSA'
});
```

### 3. **Fix Mobile Scroll Height**

Change line ~886 to detect mobile:

```javascript
const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const VIEWPORT_MULTIPLIER = isMobileDevice ? 3.5 : 5;
const VH = window.innerHeight;
const TOTAL_H = VH * VIEWPORT_MULTIPLIER;
```

### 4. **Add iOS 3D Transform Fix**

In the CSS `<style>` section, add:

```css
/* iOS Safari 3D transform fix */
.flip-card-inner {
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
}

.flip-card-front, .flip-card-back {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
```

---

## 📝 Admin Credentials

**Username:** `Admin`  
**Password:** `420admin`

(These are validated server-side with bcrypt hashing)

---

## 🐛 Troubleshooting

### **Messages not appearing in admin panel**
- Make sure backend is running (`npm start` in `/backend`)
- Check browser console for API errors
- Verify `API_URL` in index.html matches your backend URL
- Check CORS settings in backend `.env` → `ALLOWED_ORIGINS`

### **Admin login fails**
- Run `node hash-password.js` again
- Copy the exact hash to `.env` → `ADMIN_PASSWORD_HASH`
- Restart backend server
- Clear browser localStorage and try again

### **Mobile card not loading**
- Check browser console for 3D transform errors
- Try adding `-webkit-` prefixes to transform properties
- Test on actual device (not just Chrome dev tools)

### **CORS errors**
- Add your frontend domain to `ALLOWED_ORIGINS` in `.env`
- Restart backend after changing `.env`

---

## 📧 Contact

**Ardy W**  
Email: unleashbuildwithai@gmail.com

---

## 🎯 Next Steps

1. ✅ Install backend dependencies: `cd backend && npm install`
2. ✅ Generate password hash: `node hash-password.js`
3. ✅ Create `.env` file with your credentials
4. ✅ Start backend: `npm start`
5. ⏳ Toggle to **ACT MODE** and ask me to complete the API integration
6. ⏳ Deploy to Railway/Render
7. ⏳ Update `API_URL` to production backend
8. ✅ Launch! 🚀

---

**Built with:** HTML5, CSS3, JavaScript, GSAP, Node.js, Express, SQLite, JWT, Bcrypt
