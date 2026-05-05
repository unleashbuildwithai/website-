# 🤖 Ardy W - Genius Unleashed

A futuristic, interactive portfolio website featuring an animated robot, scroll-driven animations, and a full-stack contact/build request system.

**Live Site:** https://geniusunleashed.pages.dev  
**GitHub:** https://github.com/unleashbuildwithai/website-

---

## 🌟 Features

### Frontend
- **Animated Robot Character** - IK-powered robotic arms with 5-finger hands
- **Scroll-Driven Animations** - GSAP-powered choreography
- **3D Card Flip Effect** - Interactive business card
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Admin Panel** - Secure message management system

### Backend
- **Express.js API** - RESTful API for message handling
- **SQLite Database** - Persistent storage for build requests
- **JWT Authentication** - Secure admin access
- **Rate Limiting** - Protection against spam and abuse
- **Failed Login Tracking** - Security monitoring

---

## 🏗️ Architecture

```
Frontend (Cloudflare Pages)     Backend (Render)
├── index.html                   ├── server.js
├── GSAP animations              ├── database.js
└── Admin UI                     ├── .env (secrets)
                                 └── SQLite DB
         │                              │
         └──── API Calls (fetch) ───────┘
              http://localhost:3000/api (local)
              https://website-5nvl.onrender.com/api (production)
```

---

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/unleashbuildwithai/website-.git
   cd website-
   ```

2. **Start the backend server**
   
   **Windows:**
   ```bash
   # Double-click start-backend.bat
   # OR run manually:
   cd backend
   npm install
   node server.js
   ```

   **Mac/Linux:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

3. **Open the website**
   - Option A: Open `index.html` directly in browser
   - Option B: Use Live Server in VS Code

4. **Access admin panel**
   - Click the 🔐 button (top left)
   - Credentials are in `backend/.env`

---

## 🔐 Admin Login - Works Everywhere!

**Yes, the Cloudflare site WILL let you log in!**

The admin panel works on:
- ✅ **Local development** (localhost)
- ✅ **GitHub Pages** (if deployed there)
- ✅ **Cloudflare Pages** (https://geniusunleashed.pages.dev)
- ✅ **Any hosted version**

**Why?** The backend API is hosted separately on Render and accessible from anywhere. The HTML automatically detects whether you're on localhost or production and uses the correct API endpoint.

### How to Access Admin Panel

1. **On ANY site** (local or live), click the 🔐 button in the top-left
2. **Enter credentials** from `backend/.env`:
   ```
   Username: Admin (or your custom username)
   Password: Your password (set via hash-password.js)
   ```
3. **Manage messages** - View, accept, archive, or delete build requests

**Security:** Your password is hashed and never stored in plain text. JWT tokens expire after 24 hours.

---

## 📁 Project Structure

```
html/
├── index.html              # Main website (single page)
├── wrangler.toml          # Cloudflare Pages config
├── .cfignore              # Cloudflare deployment exclusions
├── .gitignore             # Git exclusions
├── start-backend.bat      # Windows backend launcher
├── BACKEND_SETUP.md       # Backend troubleshooting guide
├── CLOUDFLARE_DEPLOY.md   # Deployment instructions
│
├── archive/               # Previous versions
│   ├── index-v1-rail.html
│   ├── index-v2-ik-arms.html
│   └── index3.html
│
└── backend/               # Node.js API server
    ├── server.js          # Express API endpoints
    ├── database.js        # SQLite database wrapper
    ├── hash-password.js   # Password hashing utility
    ├── package.json       # Dependencies
    ├── .env.example       # Environment template
    ├── .env               # Secrets (git-ignored)
    └── .gitignore         # Backend exclusions
```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` with:

```env
# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Credentials
ADMIN_USERNAME=Admin
ADMIN_PASSWORD_HASH=<generate using hash-password.js>

# CORS (optional - defaults to *)
ALLOWED_ORIGINS=http://localhost:5500,https://geniusunleashed.pages.dev

# Server Port (optional - defaults to 3000)
PORT=3000

# Node Environment
NODE_ENV=development
```

### Generate Password Hash

```bash
cd backend
node hash-password.js YourSecurePassword123
```

Copy the hash output to `ADMIN_PASSWORD_HASH` in `.env`

---

## 📡 API Endpoints

### Public Endpoints

**POST** `/api/messages`
- Submit a build request
- Body: `{ name, email, vision, features, timeline, discord, referral }`

**GET** `/api/health`
- Health check
- Returns: `{ status: 'OK', message: '🤖 Ardy W API is running' }`

### Admin Endpoints (Requires JWT)

**POST** `/api/auth/login`
- Admin login
- Body: `{ username, password }`
- Returns: `{ success: true, token: 'jwt-token' }`

**GET** `/api/admin/messages?status=new`
- Get filtered messages
- Query: `status` (optional) - new, accepted, archived, completed, trash

**PUT** `/api/admin/messages/:id`
- Update message status
- Body: `{ status: 'accepted' }`

**DELETE** `/api/admin/messages/:id`
- Permanently delete message

**GET** `/api/admin/failed-attempts`
- View failed login attempts

**DELETE** `/api/admin/failed-attempts`
- Clear intrusion log

---

## 🎨 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom animations, responsive design
- **JavaScript (ES6+)** - Modern vanilla JS
- **GSAP 3.12** - Animation library
- **ScrollTrigger** - Scroll-based animations

### Backend
- **Node.js 18+** - Runtime
- **Express 4.x** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin requests
- **express-rate-limit** - Rate limiting

### Deployment
- **Cloudflare Pages** - Frontend hosting
- **Render** - Backend hosting
- **GitHub** - Version control & CI/CD

---

## 🚢 Deployment

### Frontend (Cloudflare Pages)

**Automatic deployment via GitHub:**

1. Push to `main` branch
2. Cloudflare auto-deploys within 1-2 minutes
3. Live at: https://geniusunleashed.pages.dev

**Manual deployment:**
```bash
npx wrangler login
npx wrangler pages deploy . --project-name=geniusunleashed
```

### Backend (Render)

Already deployed at: https://website-5nvl.onrender.com/api

**To update:**
1. Push backend changes to GitHub
2. Render auto-deploys from `backend/` folder

See `CLOUDFLARE_DEPLOY.md` for detailed instructions.

---

## 🐛 Troubleshooting

### "Connection error - is backend running?"

**Problem:** Frontend can't reach the backend API

**Solution:**
- **Local:** Start backend with `start-backend.bat` or `node server.js`
- **Production:** Check Render dashboard - ensure backend is running

See `BACKEND_SETUP.md` for complete troubleshooting guide.

### "Port 3000 already in use"

**Problem:** Another process is using port 3000

**Solution:**
- Stop the other process, OR
- Change port in `backend/server.js` and `index.html` (line ~1595)

### Admin Login Not Working

**Problem:** Invalid credentials or token expired

**Solution:**
1. Check credentials in `backend/.env`
2. Regenerate password hash with `hash-password.js`
3. Ensure backend is running
4. Clear browser cache and try again

---

## 📝 Features in Detail

### Hand Animator Tool

Press **H** on desktop to open the hand animator:
- Drag elbow/wrist control points
- Click wrist to toggle hand open/closed
- Save keyframes at specific scroll positions
- Export GSAP animation code

### Admin Panel Features

- **Message Management** - Accept, archive, complete, or trash requests
- **Threading** - Automatically groups messages by email
- **Status Filtering** - View messages by status
- **Pagination** - Handles large message lists
- **Email Reply** - Quick reply links to build requests
- **Intrusion Monitoring** - Track failed login attempts
- **Live Updates** - Real-time message count

### Security Features

- Password hashing (bcrypt, 10 rounds)
- JWT token authentication (24hr expiration)
- Rate limiting (100 req/15min general, 5 login/15min)
- Failed login tracking with IP logging
- XSS protection (HTML entity escaping)
- CORS configuration
- Helmet security headers
- Input validation

---

## 🤝 Contributing

This is a personal portfolio project, but suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

© 2026 Ardy W - All Rights Reserved

---

## � Contact

**Email:** unleashbuildwithai@gmail.com  
**Website:** https://geniusunleashed.pages.dev  
**GitHub:** https://github.com/unleashbuildwithai

---

## 🎯 Quick Commands

```bash
# Start backend (Windows)
start-backend.bat

# Start backend (Manual)
cd backend && node server.js

# Generate password hash
cd backend && node hash-password.js YourPassword

# Deploy to Cloudflare
npx wrangler pages deploy . --project-name=geniusunleashed

# Push to GitHub (auto-deploys to Cloudflare)
git add -A && git commit -m "Your message" && git push
```

---

**Built with ❤️ and 🤖 by Ardy W**
