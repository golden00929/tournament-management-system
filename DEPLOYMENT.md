# 🚀 Deployment Guide

## Current Status
- ✅ Frontend: Deployed on Netlify - https://magnificent-entremet-27d825.netlify.app
- ⏳ Backend: Ready for deployment on Render

## Backend Deployment on Render

### Option 1: Create New Web Service (Recommended)

1. **Go to Render Dashboard** → Create New → Web Service
2. **Connect Repository**: Select `tournament-management-system`
3. **Configure Service**:
   - **Environment**: `Node`
   - **Region**: Choose closest to your location
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx ts-node --transpile-only src/server.ts`

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[PostgreSQL connection string from Render database]
   JWT_SECRET=[Auto-generate or set secure value]
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=https://magnificent-entremet-27d825.netlify.app
   ```

5. **Database Setup**:
   - Create PostgreSQL database on Render
   - Use the connection string as DATABASE_URL

### Option 2: Manual Deployment Commands

If using the .render.yaml configuration doesn't work, try these manual settings:

```bash
# Build Command
npm install && npx prisma generate

# Start Command  
npx ts-node --transpile-only src/server.ts

# Environment
Node.js

# Root Directory
backend
```

## Environment Variables Needed

| Variable | Value | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Server port |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | `[secure-random-string]` | JWT signing secret |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |
| `CORS_ORIGIN` | `https://magnificent-entremet-27d825.netlify.app` | Frontend URL for CORS |

## Troubleshooting

### If Render tries to use Docker:
- Delete the existing service and create a new one
- Ensure "Environment" is set to "Node" not "Docker"
- Make sure no Dockerfile exists in the repository

### If build fails:
- Check that Node.js version is 20 or higher
- Verify all environment variables are set
- Check build logs for specific errors

## Post-Deployment

1. **Test Backend**: Visit `https://[your-render-url]/api/health`
2. **Update Frontend**: Update API base URL in frontend if needed
3. **Test Full System**: Try login, tournament creation, player registration

## Architecture

```
Frontend (Netlify) → Backend (Render) → PostgreSQL (Render)
```

The system uses:
- **Frontend**: React with TypeScript on Netlify
- **Backend**: Node.js with Express and Prisma on Render
- **Database**: PostgreSQL on Render
- **Authentication**: JWT tokens
- **Real-time**: WebSocket connections for live updates