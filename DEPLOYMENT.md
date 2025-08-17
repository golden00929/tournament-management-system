# Deployment Guide - Tournament Management System

## 🚀 Netlify Frontend Deployment

### Prerequisites
1. GitHub account
2. Netlify account 
3. Backend API deployed (Heroku/Railway/Vercel)

### Step 1: GitHub Repository Setup
```bash
# Already done locally - just need to push to GitHub
git add .
git commit -m "feat: add Netlify deployment configuration"
git remote add origin https://github.com/yourusername/tournament-management-system.git
git push -u origin master
```

### Step 2: Netlify Configuration

#### Manual Deployment via GitHub
1. Log in to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

#### Environment Variables (Netlify Dashboard)
```
REACT_APP_API_URL=https://your-backend-api.herokuapp.com/api
REACT_APP_WS_URL=wss://your-backend-api.herokuapp.com
REACT_APP_ENV=production
```

### Step 3: Custom Domain (Optional)
1. In Netlify Dashboard → Domain Settings
2. Add custom domain
3. Configure DNS settings

## 🛠️ Backend Deployment Options

### Option 1: Heroku (Recommended)
```bash
# Install Heroku CLI
cd backend
heroku create your-tournament-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set DATABASE_URL=your-production-database-url
git subtree push --prefix backend heroku master
```

### Option 2: Railway
1. Connect GitHub repository
2. Select backend folder
3. Add environment variables
4. Deploy automatically

### Option 3: Vercel
```bash
cd backend
npm install -g vercel
vercel --prod
```

## 🗄️ Database Options

### Option 1: PostgreSQL (Production Recommended)
1. **Heroku Postgres**: Free tier available
2. **Supabase**: Free tier with real-time features
3. **PlanetScale**: Serverless MySQL

### Option 2: Keep SQLite (Development Only)
```bash
# Upload database file with your deployment
# Not recommended for production
```

## 📋 Environment Variables

### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-backend-api.herokuapp.com/api
REACT_APP_WS_URL=wss://your-backend-api.herokuapp.com
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
```

### Backend (Production)
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
DATABASE_URL=postgresql://user:password@host:port/database
CORS_ORIGIN=https://your-netlify-app.netlify.app
EMAIL_SERVICE_API_KEY=your-email-service-key
PORT=5000
```

## 🔧 Pre-deployment Checklist

### Code Preparation
- [ ] Remove console.log statements
- [ ] Update API URLs to use environment variables
- [ ] Configure CORS for production domain
- [ ] Test build process locally
- [ ] Verify all environment variables

### Security
- [ ] Generate secure JWT secret (32+ characters)
- [ ] Set up proper CORS origins
- [ ] Remove development dependencies
- [ ] Enable HTTPS redirect
- [ ] Set up rate limiting

### Database
- [ ] Run database migrations
- [ ] Seed initial admin user
- [ ] Backup development data if needed
- [ ] Configure connection pooling

## 🚦 Testing Deployment

### Local Production Build Test
```bash
# Frontend
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000

# Backend  
cd backend
NODE_ENV=production npm start
```

### Deployment Verification
1. **Frontend**: Visit your Netlify URL
2. **Backend**: Test API endpoints
3. **Database**: Verify data persistence
4. **Authentication**: Test login/logout
5. **Features**: Test core functionality

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### API Connection Issues
- Check environment variables
- Verify CORS configuration
- Test API endpoints directly
- Check network/firewall settings

#### Database Connection
- Verify DATABASE_URL format
- Check database server status
- Test connection locally first
- Review database logs

### Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Set up uptime monitoring
- Review application logs regularly

## 📈 Post-Deployment

### Performance Optimization
- Enable CDN for static assets
- Configure caching headers
- Compress images and assets
- Monitor bundle size

### Backup Strategy
- Database daily backups
- Code repository maintenance
- Environment variables backup
- Documentation updates

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './frontend/build'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

This deployment guide provides comprehensive instructions for getting your tournament management system live and accessible for beta testing.