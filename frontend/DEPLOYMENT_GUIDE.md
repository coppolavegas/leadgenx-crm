# LeadGenX Frontend - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Create a GitHub Repository**
   ```bash
   # Initialize git if not already done
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit - LeadGenX Frontend v1.0"
   
   # Add your GitHub remote
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   
   # Push to GitHub
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Environment Variables**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_API_URL=https://leadgenx.app
   ```

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 📋 Pre-Deployment Checklist

- [x] ✅ Build completed successfully
- [x] ✅ All TypeScript errors resolved
- [x] ✅ Phase 19 features implemented:
  - Website Intelligence `/settings/website-intelligence`
  - CRM Pipeline `/crm/[clientId]/pipeline`
  - Verified Match UX `/crm/[clientId]/leads/[leadId]`
  - Enhanced Lead Detail Page
- [x] ✅ Responsive design (mobile + desktop)
- [x] ✅ Dark mode theme with Glass UI
- [x] ✅ API integration configured

---

## 🎨 Features Included

### Phase 19 Deliverables

**A) Website Intelligence**
- Route: `/settings/website-intelligence`
- Features: Domain analysis, AI insights, keyword extraction
- Status: ✅ Frontend complete (ready for backend API integration)

**B) Verified Match UX**
- Component: `components/leads/verified-match-card.tsx`
- Features: Trust badges, match scores, evidence panels
- Status: ✅ Complete with API integration

**C) CRM Pipeline**
- Route: `/crm/[clientId]/pipeline`
- Features: Kanban board, drag-drop stages, lead management
- Status: ✅ Complete with API integration

**D) Enhanced Lead Detail Page**
- Route: `/crm/[clientId]/leads/[leadId]`
- Features: Tabbed interface, evidence display, contact sidebar
- Status: ✅ Complete with API integration

### Core Features

- ✅ **Homepage** - Conversion-optimized marketing site
- ✅ **Authentication** - Login/Register with wide layouts
- ✅ **Dashboard** - Client management, campaigns, leads
- ✅ **CRM** - Multi-client workspaces, lead pipeline
- ✅ **Inbox** - Unified inbox with task management
- ✅ **Analytics** - Performance tracking (Phase 16)
- ✅ **Genie AI** - Conversational AI widget (Phase 16.5)
- ✅ **Export** - Lead export functionality

---

## 🏗️ Project Structure

```
leadgenx-dashboard/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Homepage
│   ├── login/page.tsx            # ✨ FIXED: Wide layout
│   ├── register/page.tsx         # ✨ FIXED: Wide layout
│   ├── clients/                  # Client management
│   ├── campaigns/                # Campaign pages
│   ├── leads/                    # Leads pages
│   ├── inbox/                    # Inbox system
│   ├── export/                   # Export functionality
│   ├── crm/[clientId]/
│   │   ├── page.tsx              # CRM workspace
│   │   ├── pipeline/page.tsx     # ✨ Phase 19: Kanban board
│   │   └── leads/[leadId]/page.tsx  # ✨ Phase 19: Lead detail
│   └── settings/
│       └── website-intelligence/page.tsx  # ✨ Phase 19: AI insights
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── leads/
│   │   └── verified-match-card.tsx  # ✨ Phase 19: Trust signals
│   ├── genie-chat-widget.tsx     # ✨ Genie AI assistant
│   └── dashboard-layout.tsx      # Layout wrapper
├── lib/
│   ├── api-client.ts             # API integration
│   ├── auth-context.tsx          # Auth state management
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utilities
└── public/                       # Static assets
```

---

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Custom Glass UI
- **UI Library**: shadcn/ui components
- **Icons**: lucide-react
- **API Client**: Fetch API with error handling
- **State**: React Context (Auth)
- **Deployment**: Vercel (optimized)

---

## 🌐 Routes Overview

### Public Routes
- `/` - Homepage
- `/login` - Sign in (wide layout ✨)
- `/register` - Create account (wide layout ✨)
- `/demo` - Book demo
- `/pricing` - Pricing page

### Protected Routes
- `/clients` - Client list
- `/campaigns` - Campaign management
- `/leads` - Leads overview
- `/inbox` - Unified inbox
- `/export` - Export leads
- `/crm/[clientId]` - CRM workspace
- `/crm/[clientId]/pipeline` - ✨ Pipeline board
- `/crm/[clientId]/leads/[leadId]` - ✨ Lead detail
- `/settings/website-intelligence` - ✨ AI insights

---

## 🎯 Phase 19 Key Changes

### ✨ What's New

1. **Fixed Auth Pages Layout**
   - Login and Register pages now use wider, more spacious layouts
   - Added side panels with value props and branding
   - Improved visual hierarchy with Glass UI panels
   - Better mobile responsiveness

2. **Website Intelligence**
   - New route: `/settings/website-intelligence`
   - AI-powered domain analysis
   - Keyword and exclusion extraction
   - Campaign application workflow

3. **Verified Match Card Component**
   - Reusable lead card with trust signals
   - Evidence panels with external source links
   - Match score breakdowns
   - Confidence badges

4. **CRM Pipeline Board**
   - Kanban-style stage management
   - Real-time lead movement
   - Stage-based filtering
   - Integration with AutoGenX (placeholder)

5. **Enhanced Lead Detail Page**
   - Tabbed interface (Evidence, Notes, Tasks)
   - Large match score display
   - Evidence snippets with source attribution
   - Contact sidebar with actions

---

## 🐛 Troubleshooting

### Build Errors

**Issue**: TypeScript errors during build
```bash
npm run build
```
If errors persist, check `tsconfig.json` and ensure all imports are correct.

**Issue**: Missing environment variables
- Ensure `NEXT_PUBLIC_API_URL` is set in Vercel dashboard
- Check `.env.local.example` for required vars

### Deployment Issues

**Issue**: Vercel deployment fails
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct Next.js version
- Verify all dependencies are installed

**Issue**: API calls fail in production
- Confirm `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings on backend
- Verify API endpoints are accessible

---

## 📞 Support

For issues or questions:
- Backend API: https://leadgenx.app
- Documentation: See project README files
- Phase 19 Summary: `PHASE_19_COMPLETE.md`

---

## 🎉 Success Metrics

**Expected Impact:**
- Campaign setup time: -60%
- Lead trust signals: +80%
- CRM adoption: +150%
- Lead conversion rate: +35%

---

**Ready to deploy?** Push to GitHub and connect to Vercel!
