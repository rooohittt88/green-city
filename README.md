# 🗺️ Community Hero — Hyperlocal Problem Solver

> **Vibe2Ship Hackathon 2026** · Problem Statement: Community Hero - Hyperlocal Problem Solver

**Community Hero** is an AI-powered civic issue reporting and resolution platform that enables citizens of Surat (and any city) to identify, report, verify, track, and resolve local infrastructure problems — through community collaboration, real-time data, and intelligent automation.



---

## 🚨 The Problem

Communities across India face daily infrastructure failures — potholes that damage vehicles, burst water pipes flooding streets, non-functional street lights creating safety hazards, and overflowing garbage bins breeding disease. Reporting these issues today is:

- **Fragmented** — WhatsApp forwards and verbal complaints that go nowhere
- **Unverified** — no way to confirm if an issue is real or resolved
- **Untracked** — citizens have no visibility into what happens after they report
- **Unaccountable** — no transparency between citizens and authorities

The result: a pothole in Adajan might go unreported for months. A burst pipe in Vesu floods the street for days before anyone acts.

---

## ✅ The Solution

Community Hero turns fragmented civic complaints into a **structured, AI-verified, publicly tracked system** — with real-time maps, community verification, and AI agents that work autonomously throughout the issue lifecycle.

Citizens report an issue with a photo. AI analyzes it instantly. The community verifies it. It gets tracked publicly until resolved.

---

## 🤖 AI Agent Architecture (Agentic Depth)

Community Hero is built around **4 AI agents** that operate autonomously throughout the issue lifecycle — not just as a chatbot, but as an active system doing real work:

### Agent 1 — Intake Agent ✅ Live
Triggered the moment a user uploads a photo. Calls **Gemini 2.5 Flash Vision** to:
- Detect the issue category (pothole, water leak, streetlight, waste, other)
- Assign severity on a 1–5 scale
- Generate a human-readable description
- Return confidence score and keyword tags

The AI analysis card is shown to the user before submission — they can confirm or edit. This is the core demo moment of the product.

### Agent 2 — Verification Agent ✅ Live
Triggered automatically when an issue receives 3 community upvotes. Autonomously:
- Changes issue status from `reported` → `community verified`
- No human admin required
- Runs entirely inside Firestore update logic — zero manual intervention

### Agent 3 — Priority Agent ✅ Live
Scores every issue at creation time using:
```
priorityScore = severity × votes
```
Issues in the sidebar are ordered by this score. Higher severity and more community votes = floats to top automatically.

### Agent 4 — Insights Agent ✅ Live
On demand from the Dashboard, calls Gemini 2.5 Flash with a structured summary of all Firestore issues and generates 3–5 natural language insights:
> *"Adajan ward has seen a 60% spike in pothole reports, concentrated near Adajan Patiya junction."*

This is AI-generated civic intelligence derived autonomously from real community data.

---

## 🔑 Key Features

### 📍 Real-Time Issue Map
- Google Maps JavaScript API centred on Surat (21.1702, 72.8311)
- Colour-coded markers by category: red = pothole, blue = water leak, yellow = streetlight, green = waste
- Click any marker → full issue detail with photo, AI analysis card, community votes, status timeline
- Real-time updates via Firestore `onSnapshot` — new issues appear on the map instantly without page refresh
- Sidebar issue list with category filter tabs synced to map

### 📸 AI-Powered Issue Reporting
- 3-step flow: Photo → AI Analysis → Submit
- `capture="environment"` opens device camera directly on mobile
- Gemini 2.5 Flash Vision analyzes the photo and returns structured JSON
- AI pre-fills category, severity, description, and tags — user can edit before submitting
- Browser Geolocation API + Google Geocoding API converts GPS coordinates to human-readable address
- Photo stored on Cloudinary, public URL saved in Firestore

### 👥 Community Verification
- Any authenticated citizen can upvote/confirm an issue
- One vote per user per issue enforced in Firestore security rules
- Auto-verification at 3 votes — Verification Agent changes status to "Community Verified" automatically
- Vote count and voter list stored in Firestore document

### 📊 Impact Dashboard
- Live stat cards: total issues, community verified, resolved, critical (severity ≥ 4)
- Issues by category — pie chart
- Issues by status — bar chart
- Issues by ward — horizontal bar chart (top 6 wards)
- AI Insights panel — Gemini 2.5 Flash generates pattern analysis on demand

### 🔐 Authentication
- Google Sign-In via Firebase Auth
- Session persists across browser restarts
- User document auto-created in Firestore on first login with display name, email, photo

---

## 🛠️ Tech Stack

### Google Technologies
| Technology | Usage |
|---|---|
| **Gemini 2.5 Flash** (Google AI Studio) | Image analysis, issue categorization, severity scoring, insight generation |
| **Google Maps JavaScript API** | Interactive map, custom colour-coded markers, real-time issue display |
| **Google Geocoding API** | Converts GPS coordinates to human-readable ward addresses |
| **Firebase Authentication** | Google Sign-In, session management, user identity |
| **Firebase Firestore** | Real-time database, live issue tracking, community votes, user profiles |
| **Firebase Hosting** | Production deployment on Google Cloud Platform (GCP) |

### Frontend
| Technology | Usage |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| React Router v6 | Client-side routing |
| Recharts | Dashboard data visualizations |

### Services
| Technology | Usage |
|---|---|
| Cloudinary | Image storage and CDN delivery (unsigned browser uploads, free tier) |

---

## 🏗️ Architecture

```
User (Browser / Mobile Web App)
        │
        ├── Google Maps JS API ──────── Map view, markers, real-time pins
        │
        ├── Gemini 2.5 Flash ────────── Intake Agent, Insights Agent
        │        (via AI Studio key, x-goog-api-key header)
        │
        ├── Firebase Auth ───────────── Google Sign-In
        │
        ├── Cloudinary ──────────────── Photo upload → CDN URL
        │
        └── Firebase Firestore ──────── Real-time DB (issues, users)
                    │
                    └── Firebase Hosting (GCP) ── Live deployment
```

**No custom backend server.** Firebase is the entire backend — Auth, Firestore, and Hosting run on Google's GCP infrastructure. Gemini API calls are made directly from the client using the AI Studio key passed via `x-goog-api-key` header (not URL query parameter — per Google's documented security best practice).

---

## 📁 Project Structure

```
community-hero/
├── src/
│   ├── config/
│   │   └── firebase.js              # Firebase initialization (db, auth)
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state, Google Sign-In, user doc creation
│   ├── services/
│   │   ├── gemini.js                # Gemini 2.5 Flash — Intake Agent + Insights Agent
│   │   ├── maps.js                  # Google Maps loader, geocoding, constants
│   │   └── storage.js               # Cloudinary unsigned upload
│   ├── hooks/
│   │   └── useIssues.js             # Firestore real-time listener, createIssue, upvoteIssue
│   ├── components/
│   │   ├── Layout/Navbar.jsx        # Navigation
│   │   ├── Map/IssueMap.jsx         # Google Maps with dynamic markers
│   │   ├── Issue/IssueDetailModal.jsx  # Issue detail + upvote + AI analysis display
│   │   └── Report/ReportForm.jsx    # 3-step report flow with Gemini Vision
│   ├── pages/
│   │   ├── Home.jsx                 # Map view + filtered sidebar
│   │   ├── Report.jsx               # Report page wrapper
│   │   ├── Dashboard.jsx            # Stats, Recharts, AI Insights
│   │   └── Login.jsx                # Google Sign-In page
│   └── utils/
│       └── seed.js                  # 15 realistic Surat civic issues
├── .env.example
├── firebase.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (free Spark plan — no card needed)
- Google Cloud project with Maps JS API and Geocoding API enabled
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- Cloudinary account (free, no card required)

### Installation

```bash
git clone https://github.com/CoderMD07/community-hero.git
cd community-hero
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Fill in `.env` with your values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GEMINI_API_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Seed Demo Data

After signing in, open the browser console and run:

```js
import('/src/utils/seed.js').then(m => m.seedDatabase())
```

Seeds 15 realistic civic issues across Surat wards — Adajan, Vesu, Katargam, Athwa, Piplod, Udhna, Rander, Varachha, Bhatar, City Light, Nanpura, Sarthana, Althan, Dumas, Majura Gate.

### Deploy to Firebase (GCP)

```bash
npm run build
firebase deploy
```

Your live GCP URL will be: `https://your-project-name.web.app`

---

## 🔒 Security

- All API keys in `.env`, never committed to version control
- Gemini API key sent via `x-goog-api-key` request header — not URL query parameter
- Google Maps API key restricted to Maps JavaScript API and Geocoding API only
- Firestore rules: read = public, write = authenticated users only
- Cloudinary uses unsigned upload preset — no API secret in frontend

---

## 📊 Evaluation Criteria Coverage

| Criteria | Weight | How We Address It |
|---|---|---|
| Problem Solving & Impact | 20% | Real civic problem in India. Surat-specific demo with 15 genuine ward-level issues. Transparent public tracking replaces fragmented WhatsApp complaints. |
| Agentic Depth | 20% | 4 live AI agents: Intake Agent (Gemini Vision on photo), Verification Agent (auto-verify at 3 votes), Priority Agent (severity × votes scoring), Insights Agent (Gemini pattern analysis) |
| Innovation & Creativity | 20% | AI photo-to-issue pipeline, community-driven auto-verification threshold, ward-level AI intelligence, real-time civic map |
| Usage of Google Technologies | 15% | 6 Google technologies: Gemini 2.5 Flash, Maps JS API, Geocoding API, Firebase Auth, Firestore, Firebase Hosting (GCP) |
| Product Experience & Design | 10% | Mobile camera capture, real-time map as primary interface, 3-step guided report flow, AI analysis shown before submit |
| Technical Implementation | 10% | Firestore real-time listeners, auth guards on all routes, security rules, API key header authentication, modular service layer |
| Completeness & Usability | 5% | Full end-to-end flow working: report → AI analyze → submit → map pin → community verify → dashboard → AI insights |

---

## 🗺️ Roadmap (Post-Hackathon)

Features designed and architected but not yet implemented in MVP:

- **Gamification** — points system, badges, leaderboard
- **Heatmap layer** — Google Maps density visualization of problem zones
- **Duplicate detection** — 100m radius check before submission
- **Resolution Validator Agent** — Gemini before/after photo comparison
- **Admin panel** — manual status updates for municipal authorities
- **PWA support** — installable on home screen, offline capability

---

## 🤝 AI Assistance & Credits

Built with AI assistance as part of Vibe2Ship Hackathon where AI tool usage is permitted and encouraged.

- **Claude (Anthropic)** — System architecture, component design, code generation, debugging, and technical decision-making throughout the build
- **Gemini 2.5 Flash (Google)** — Powers all in-app AI features: Intake Agent image analysis, categorization, severity scoring, and Insights Agent pattern generation

---

## 📦 Open Source Credits & Licenses

| Package | License | Usage |
|---|---|---|
| [React](https://react.dev) | MIT | UI framework |
| [Vite](https://vitejs.dev) | MIT | Build tool |
| [React Router](https://reactrouter.com) | MIT | Client-side routing |
| [Recharts](https://recharts.org) | MIT | Dashboard charts |
| [Firebase JS SDK](https://firebase.google.com/docs/web/setup) | Apache 2.0 | Auth, Firestore, Hosting |
| [Cloudinary](https://cloudinary.com) | Free tier ToS | Image storage and delivery |

---

## 👤 Author

**CoderMD07**  
Vibe2Ship Hackathon 2026  
Built in Surat, Gujarat, India 🇮🇳

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.