# LeadGenX Frontend

**AI-Powered Lead Generation Platform - Production-Ready Frontend**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📦 What's Included

This is the **complete, production-ready** frontend for LeadGenX, including all Phase 19 features:

### ✨ Phase 19 Features (NEW)

✅ **Website Intelligence** (`/settings/website-intelligence`)
- AI-powered domain analysis
- Keyword extraction & targeting
- Competitor insights
- Campaign application

✅ **Verified Match UX** (Component: `verified-match-card.tsx`)
- Trust signal badges
- Match score visualization
- Evidence panels with source attribution
- Confidence ratings

✅ **CRM Pipeline Board** (`/crm/[clientId]/pipeline`)
- Kanban-style stage management
- Drag-and-drop lead movement
- Stage-based filtering
- AutoGenX integration ready

✅ **Enhanced Lead Detail Page** (`/crm/[clientId]/leads/[leadId]`)
- Tabbed interface (Evidence/Notes/Tasks)
- Large match score display
- Evidence snippets with external links
- Contact sidebar with actions

### 🎨 Design System

- **Glass UI** - Modern glassmorphism design
- **Dark Mode** - Optimized for professional use
- **Responsive** - Mobile-first approach
- **Accessible** - WCAG 2.1 AA compliant
- **Animated** - Smooth transitions and micro-interactions

### 🏗️ Core Pages

- ✅ **Homepage** - Conversion-optimized landing page
- ✅ **Authentication** - Login/Register (wide layouts)
- ✅ **Dashboard** - Client & campaign management
- ✅ **CRM** - Multi-client workspace system
- ✅ **Leads** - Lead management & enrichment
- ✅ **Inbox** - Unified task management
- ✅ **Export** - Lead export functionality
- ✅ **Analytics** - Performance tracking

### 🤖 AI Features

- **Genie AI Widget** - Conversational AI assistant
- **Website Intelligence** - AI-powered domain insights
- **Match Scoring** - Verified & preference matching

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **Icons** | lucide-react |
| **State Management** | React Context |
| **API Client** | Fetch API |
| **Build Tool** | Turbopack |
| **Deployment** | Vercel |

---

## 📂 Project Structure

```
leadgenx-dashboard/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages group
│   ├── (dashboard)/        # Dashboard pages group
│   ├── campaigns/          # Campaign management
│   ├── crm/                # CRM workspace
│   ├── inbox/              # Inbox & tasks
│   ├── leads/              # Lead pages
│   ├── settings/           # Settings pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── campaigns/          # Campaign components
│   ├── clients/            # Client components
│   ├── crm/                # CRM components
│   ├── inbox/              # Inbox components
│   ├── leads/              # Lead components
│   ├── dashboard-layout.tsx
│   ├── genie-chat-widget.tsx
│   └── sidebar.tsx
├── lib/
│   ├── api-client.ts       # API integration
│   ├── auth-context.tsx    # Auth provider
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── public/                 # Static assets
└── README.md
```

---

## 🌐 Environment Variables

Create a `.env.local` file:

```bash
# Required
NEXT_PUBLIC_API_URL=https://leadgenx.app

# Optional
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

---

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run dev:turbo    # Dev with Turbopack

# Build
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🎯 Key Features by Route

### Authentication
- `/login` - Wide layout with side branding
- `/register` - Multi-step form with company info

### Dashboard
- `/clients` - Client workspace switcher
- `/campaigns` - Campaign list & creation
- `/campaigns/[id]` - Campaign detail & analytics

### CRM
- `/crm/[clientId]` - CRM workspace overview
- `/crm/[clientId]/pipeline` - **Phase 19: Kanban board**
- `/crm/[clientId]/leads/[leadId]` - **Phase 19: Lead detail**

### Lead Management
- `/leads` - Lead list with filtering
- Components: `verified-match-card.tsx` - **Phase 19: Trust signals**

### Settings
- `/settings/website-intelligence` - **Phase 19: AI insights**

---

## 🎨 Design Tokens

### Colors

```css
/* Primary */
--primary-royal: #6E4AFF      /* Royal Purple */
--accent-cyan: #4DE3FF         /* Cyan Glow */

/* Base */
--slate-black: #0B0E14         /* Background */
--graphite: #141824            /* Cards */
--soft-gray: #8B90A0           /* Text muted */
--off-white: #EDEEF2           /* Text primary */

/* Semantic */
--success: #10B981             /* Verified */
--warning: #F59E0B
--danger: #EF4444
```

### Glass Effects

```css
.glass-light    /* 8% opacity + blur */
.glass-medium   /* 12% opacity + blur */
.glass-strong   /* 16% opacity + blur */
```

---

## 📖 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[PHASE_19_COMPLETE.md](../PHASE_19_COMPLETE.md)** - Phase 19 technical docs
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Design system guide

---

## 🐛 Known Issues & Fixes

### Fixed in This Version

✅ **Auth Pages Layout** - No longer narrow, now use full-width Glass UI layouts  
✅ **TypeScript Errors** - All build errors resolved  
✅ **Responsive Design** - Mobile-first, tested on all devices  
✅ **API Integration** - Connected to production backend  

---

## 🤝 Contributing

This is a production application. For changes:

1. Create feature branch
2. Make changes
3. Test thoroughly (`npm run build`)
4. Submit for review

---

## 📄 License

MIT License - See LICENSE file

---

## 🎉 Success Metrics

**Phase 19 Expected Impact:**

- Campaign setup time: **-60%**
- Lead trust signals: **+80%**
- CRM adoption: **+150%**
- Conversion rate: **+35%**

---

## 📞 Support

- **Backend API**: https://leadgenx.app
- **API Docs**: https://leadgenx.app/api-docs
- **Issues**: GitHub Issues

---

**Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS**
