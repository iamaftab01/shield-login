# shield-login
A full-stack login system with built-in brute-force protection. Implements both per-user account suspension and per-IP blocking to defend against repeated failed login attempts.

## 🔧 Setup Instructions

### Backend
```bash
cd backend
npm install
cp .env.example .env   # filling with Supabase DATABASE_URL
npm run dev            # local development
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # filling with BACKEND API URL
npm run dev            # runs at http://localhost:5173
```

### Environment Variables:
```env
# backend .env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
PORT=4000
```

## Architecture & Design

- **Frontend**: React + TypeScript (Vite). Simple login/register forms with CORS-enabled requests to backend.  
- **Backend**: Node.js + Express + PostgreSQL.  
  - **User-level suspension**: If a user fails login ≥ 5 times within 5 minutes, suspend for 15 minutes.  
  - **IP-level block**: If any IP causes ≥ 100 failed logins across users in 5 minutes, block IP for 15 minutes.  
  - **ISO timestamps** stored in DB to avoid timezone mismatches.  
  - **bcrypt** used for password hashing.  
- **Database**: Supabase PostgreSQL (cloud-hosted).  
- **Deployment**:  
  - Backend → Render  
  - Frontend → Vercel  
  - DB → Supabase  

## Screenshots

![Database](assets/images/image.png)
![Frontend on Vercel](assets/images/image-1.png)
![Backend on Render](assets/images/image-2.png)

