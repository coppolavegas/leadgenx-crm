====================================================================
   LEADGENX - READY TO DEPLOY PACKAGE
====================================================================

You just downloaded everything you need!

INSIDE THIS FOLDER:
  backend/   - Your NestJS API (will run on Railway)
  frontend/  - Your Next.js Dashboard (will run on Vercel)

====================================================================
QUICK START - 3 STEPS TO DEPLOY
====================================================================

STEP 1: UPLOAD TO GITHUB (10 minutes)
--------------------------------------
1. Create free account at https://github.com
2. Create new repository called "leadgenx-crm"
3. Open Terminal/Command Prompt in THIS folder
4. Run these commands:

   git init
   git add .
   git commit -m "Initial commit: LeadGenX CRM"
   git remote add origin https://github.com/YOUR_USERNAME/leadgenx-crm.git
   git branch -M main
   git push -u origin main

   (Replace YOUR_USERNAME with your GitHub username)

STEP 2: DEPLOY BACKEND TO RAILWAY (20 minutes)
--------------------------------------
1. Sign up at https://railway.app (free)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select "leadgenx-crm" repository
4. Configure:
   - Root Directory: backend
   - Add PostgreSQL database (click + New → Database → PostgreSQL)
   - Add Redis database (click + New → Database → Redis)
5. Add environment variables in Railway dashboard:
   - NODE_ENV=production
   - PORT=3000
   - JWT_SECRET=your-secret-key-change-this
   - JWT_EXPIRES_IN=7d
6. Railway gives you a URL like: https://yourapp.up.railway.app

STEP 3: DEPLOY FRONTEND TO VERCEL (10 minutes)
--------------------------------------
1. Sign up at https://vercel.com (free)
2. Click "Add New Project" → "Import Git Repository"
3. Select "leadgenx-crm" repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: frontend
5. Add environment variable:
   - NEXT_PUBLIC_API_URL=https://yourapp.up.railway.app
   (Use your Railway URL from Step 2)
6. Click "Deploy"
7. Vercel gives you a URL like: https://yourapp.vercel.app

STEP 4: FINAL CONNECTION
--------------------------------------
1. Go back to Railway
2. Add environment variable:
   - FRONTEND_URL=https://yourapp.vercel.app
   (Use your Vercel URL from Step 3)
3. Wait 2 minutes for Railway to redeploy

====================================================================
TEST YOUR APP
====================================================================

1. Open: https://yourapp.vercel.app
2. Click "Register" and create an account
3. Login and create your first lead
4. You're live!

====================================================================
IMPORTANT FILES IN THIS PACKAGE
====================================================================

backend/
  ├── src/             - All backend code
  ├── prisma/          - Database schema & migrations
  └── package.json     - Dependencies

frontend/
  ├── app/             - All pages (homepage, login, CRM, etc.)
  ├── components/      - UI components
  └── package.json     - Dependencies

====================================================================
COST
====================================================================

Testing:     FREE (Railway $5 credit lasts ~1 week)
Production:  $5-10/month (Railway) + $0 (Vercel is free)
Total:       ~$5-10/month for full CRM!

====================================================================
NEED HELP?
====================================================================

1. Can't find Terminal?
   - Windows: Press Win+R, type "cmd", press Enter
   - Mac: Press Cmd+Space, type "terminal", press Enter

2. Don't have Git installed?
   - Windows: Download from https://git-scm.com/download/win
   - Mac: It will auto-install when you run git command

3. Deployment failed?
   - Check Railway logs (Deployments → Click deployment → Logs)
   - Verify all environment variables are set
   - Make sure Root Directory is set correctly

4. Frontend can't connect to backend?
   - Verify NEXT_PUBLIC_API_URL includes https://
   - Test backend health: https://your-backend-url/health

====================================================================
DETAILED GUIDES
====================================================================

For complete step-by-step instructions, see these files in the 
parent folder (where you downloaded this from):

- STEP_BY_STEP_DEPLOYMENT.md - Full walkthrough
- QUICK_REFERENCE.md         - Command cheat sheet
- ARCHITECTURE_DIAGRAM.md    - System architecture

====================================================================

You're ready to deploy! Follow the 3 steps above.

Your LeadGenX CRM will be live in about 45 minutes!

====================================================================
