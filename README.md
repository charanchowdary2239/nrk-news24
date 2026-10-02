# NRK News24 — Production Digital News Publishing Platform

**NRK News24** is a modern, high-performance, full-stack digital news platform engineered for serious editorial journalism. Built with **Next.js 14 (App Router)**, **SQLite (via better-sqlite3)**, **Tailwind CSS**, and an **AI-assisted Wire Ingestion Pipeline**, it provides complete separation between public news readers and authorized newsroom editorial staff.

---

## 🌟 Key Platform Features

### 1. Public News Website
- **Editorial Brand Appearance**: Modern news-media typography (Merriweather editorial serif + Inter sans-serif), deep brand blue (`#0b2545`), dark text, and red urgency accents for breaking news.
- **Top Navigation Bar**: Live formatted date, editions indicator, quick search modal, and navigation links:
  - `HOME`
  - `LATEST NEWS`
  - `INDIA`
  - `ANDHRA PRADESH`
  - `TELANGANA`
  - `WORLD`
  - `POLITICS`
  - `SPORTS`
  - `BUSINESS`
  - `TECHNOLOGY`
  - `ENTERTAINMENT`
  - `EDUCATION`
  - `SEARCH`
- **Breaking News Ticker**: Animated pulsating red ticker broadcasting urgent news alerts, controlled directly from the private admin dashboard.
- **Hero & Top Stories**: Prominent lead featured article accompanied by side top stories.
- **Latest News Stream**: Reverse chronological feed of verified news.
- **Trending News Ranking**: Real-time popularity ranking based on verified reader view and share counts (#1 through #5).
- **Telugu States Spotlight**: Dedicated multi-column blocks for Andhra Pradesh and Telangana state governance.
- **Tech & Business Intelligence**: Focused regional and global economic coverage.
- **Advertisement Ready**: Non-intrusive standard IAB placeholders (`728×90 Leaderboard`, `300×250 Sidebar`, `In-Article`, `Footer`) toggleable via admin settings.

### 2. Article Page & Social Sharing
- **Unique SEO URLs**: Clean individual URLs for every story (e.g., `/news/amaravati-high-speed-rail-and-port-expressway-corridor-approved`).
- **Dynamic Social Cards**: Dynamic server-rendered Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter Card (`summary_large_image`) metadata ensuring rich preview cards on WhatsApp, X, and Facebook.
- **Multi-Channel Share Suite**:
  - Direct WhatsApp sharing with encoded preview
  - X (Twitter) posting
  - Facebook sharing
  - Telegram broadcast
  - Direct Email dispatch
  - Copy Canonical Link with instant tooltip feedback
  - Native Web Share API trigger on mobile browsers
- **Audience Telemetry**: Automatic view count increments and platform-level share event logging.

### 3. AI News Ingestion & Editorial Safeguard Pipeline
- **Monitored Wire Sources**: Ingestion from legitimate RSS/Atom feeds (Google News India, The Hindu, PTI).
- **AI Processing Pipeline**:
  - Official Google Gemini API integration (using `AI_API_KEY`).
  - Built-in intelligent journalistic transformer fallback (extracts key facts, structures paragraphs, suggests category, and generates tags).
- **Pending Review Quarantine**: **AI-generated articles NEVER become public automatically**. They enter `/admin/ai-news` as `pending_review`.
- **Review & Approval Desk**: Editors can inspect source wire URLs, refine headlines, edit formatted content, assign categories, and approve & publish to the live site.

### 4. Private Admin CMS Dashboard
- **Protected Newsroom Portal**: Strict Next.js middleware guards `/admin/*` and `/api/admin/*`, redirecting unauthenticated users to `/admin/login`.
- **Secure Authentication**: Bcrypt-hashed passwords, signed JWT tokens, and secure HTTP-only cookies. No plain-text passwords or client-side hardcoding.
- **Dashboard Metrics**: Real-time stats for Total Articles, Published, Drafts, Pending AI Reviews, Breaking News, Featured Articles, Views, and Shares.
- **Manual Article Authoring**:
  - Headline with automatic SEO slug generation and manual override
  - Short summary / lead paragraph
  - Distraction-free formatted Rich Editor (headings, bold, italic, quotes, lists, links, images)
  - Image file uploader (saved to `/uploads/` with UUID collision avoidance) or external image URLs
  - Category selector, author byline, attribution fields, and tags
  - "Save Draft" vs "Publish Article" controls
- **Breaking News Manager**: Toggle breaking tickers or broadcast custom urgency text.
- **Featured News Curator**: Manage top stories featured on the homepage hero.
- **Categories Manager**: Add, edit, reorder, or delete news verticals.
- **News Sources Manager**: Configure approved RSS feeds with an on-demand "Fetch Feeds Now" trigger.
- **Audience Analytics**: Performance breakdown by views, shares, top 10 articles, and category engagement.
- **Platform Settings**: Change site branding, adjust AI model, toggle ad slots, update cron frequency, and reset admin password.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js 18+ (tested on Node.js v24)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
JWT_SECRET=super_secret_production_key_minimum_32_characters
ADMIN_NAME=NRK Editor
ADMIN_EMAIL=admin@nrknews24.com
ADMIN_PASSWORD=Admin@NRK2026!

# Optional: Google Gemini API Key (https://aistudio.google.com/)
# If empty, the platform seamlessly uses its built-in journalistic transformer.
AI_API_KEY=
AI_MODEL=gemini-1.5-flash

CRON_ENABLED=true
CRON_SCHEDULE_MINUTES=30
```

### 3. Initialize & Seed Database
```bash
npm run seed
```
This initializes `data/nrk_news24.db`, seeds the 10 core news verticals, creates the default administrator (`admin@nrknews24.com`), and configures the initial RSS news feeds.

### 4. Build & Start the Platform
```bash
# Build production bundle
npm run build

# Start production server on port 3000
npm start
```

Access the platform:
- **Public News Portal**: [http://localhost:3000](http://localhost:3000)
- **Private Admin Dashboard**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔑 Default Administrator Credentials

| Field | Value |
|---|---|
| **Portal URL** | `http://localhost:3000/admin/login` |
| **Email** | `admin@nrknews24.com` |
| **Password** | `Admin@NRK2026!` |

> *Note: You can change the admin password at any time in **Admin Dashboard → Settings**.*

---

## 🤖 AI Ingestion & Automated Cron Service

### Ingestion Workflow
1. The scheduler fetches approved RSS feeds from `news_sources`.
2. New stories are passed to the AI engine (`src/lib/ai.js`).
3. If `AI_API_KEY` is set in `.env`, Google Gemini generates an original headline, structured summary, article body (`<h2>`, `<p>`, `<blockquote>`), and tags.
4. If `AI_API_KEY` is blank, the built-in intelligent transformer crafts an original journalistic synthesis with full wire disclosure.
5. The story is stored with status `pending_review`.
6. An editor reviews the draft at `/admin/ai-news` and clicks **"Approve & Publish"**.

### Running the Background Daemon
You can run the scheduled news collector as a continuous daemon:
```bash
npm run cron
```
Alternatively, editors can click **"Fetch Feeds Now"** at any time from the top header of the admin panel.

---

## 📁 Project Architecture

```
nrk news24/
├── data/
│   └── nrk_news24.db            # Persistent SQLite database
├── public/
│   └── uploads/                 # Uploaded cover images and assets
├── scripts/
│   ├── seed.js                  # Database initialization and sample seed
│   ├── cron-runner.js           # Background RSS ingestion daemon
│   └── test-platform.js         # Comprehensive 37-point test suite
├── src/
│   ├── components/
│   │   ├── Header.jsx           # Public top bar, logo & navigation
│   │   ├── Footer.jsx           # Editorial footer & legal disclaimers
│   │   ├── BreakingNewsTicker.jsx # Pulsing red breaking ticker
│   │   ├── ArticleCard.jsx      # Multi-layout news card component
│   │   ├── ShareButtons.jsx     # WhatsApp, X, FB, TG, Email, Copy Link
│   │   ├── AdBanner.jsx         # Non-intrusive ad slot containers
│   │   ├── AdminHeader.jsx      # Admin top navigation & instant fetch
│   │   ├── AdminSidebar.jsx     # CMS dark sidebar with badge counters
│   │   └── RichEditor.jsx       # Formatted news content editor
│   ├── lib/
│   │   ├── db.js                # SQLite connection & schema migrations
│   │   ├── auth.js              # Bcrypt hashing & JWT verification
│   │   ├── api-auth.js          # API route middleware verification
│   │   ├── slugify.js           # Clean unique SEO slug generator
│   │   ├── rss.js               # RSS feed parser & image extractor
│   │   ├── ai.js                # Gemini API integration & transformer
│   │   └── scheduler.js         # Node-cron automated fetch runner
│   ├── middleware.js            # Route protection guard for /admin/*
│   └── app/
│       ├── layout.jsx           # Root layout & global metadata
│       ├── page.jsx             # Homepage (Hero, Latest, Trending, AP/TG)
│       ├── latest/page.jsx      # Latest news chronological archive
│       ├── category/[slug]/     # Dynamic category pages
│       ├── news/[slug]/         # Individual article pages & SEO OG tags
│       ├── search/page.jsx      # Search interface with filters
│       ├── sitemap.xml/route.js # Dynamic XML sitemap
│       ├── robots.txt/route.js  # Dynamic robots.txt
│       └── admin/
│           ├── login/page.jsx   # Admin authentication portal
│           ├── dashboard/       # Metrics & recent stories table
│           ├── articles/        # Directory, create & edit pages
│           ├── ai-news/         # Editorial approval queue
│           ├── breaking-news/   # Ticker manager
│           ├── featured-news/   # Hero curator
│           ├── categories/      # Category editor
│           ├── news-sources/    # RSS wire feed manager
│           ├── analytics/       # Views & shares telemetry
│           └── settings/        # System configuration
├── tailwind.config.js           # Editorial theme styling
├── next.config.js               # Next.js server configuration
└── package.json                 # Scripts and dependencies
```

---

## 🧪 Verification & Testing

To execute the automated 37-point test suite:
```bash
node scripts/test-platform.js
```
Verified checkpoints:
- Homepage HTTP 200, logo, wordmark, top stories, breaking ticker
- All category pages (Andhra Pradesh, Telangana, India, etc.)
- Individual SEO article pages with Open Graph & Twitter Cards
- View and share telemetry counters
- Search API with keyword relevance
- XML Sitemap & Robots.txt
- Unauthorized admin route protection (HTTP 307 redirect to `/admin/login`)
- Bcrypt authentication & HTTP-only JWT cookies
- Authenticated CMS stats, categories, and AI review queues
- Live RSS ingestion and AI draft generation

---

## 🌐 Production Deployment

### Docker / VPS Deployment
1. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://nrknews24.com`).
2. Run `npm run build`.
3. Use PM2 or systemd to manage the server process:
```bash
# Using PM2
pm2 start npm --name "nrk-news24" -- start
pm2 start scripts/cron-runner.js --name "nrk-cron"
pm2 save
```

### Social Sharing Domain Verification
When deploying to a public domain, ensure your server's canonical domain matches `NEXT_PUBLIC_SITE_URL`. This guarantees that WhatsApp, X, and Facebook render Open Graph preview cards accurately when articles are shared.
