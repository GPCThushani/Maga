# CareerTrack — මඟ

> **An Intelligent Career & Internship Management Platform for Students**

CareerTrack (මඟ) is a career operating system designed to help university students discover opportunities, analyze skill requirements, manage applications, and understand their recruitment progress.

It combines **local and international job aggregation, deterministic skill analysis, Kanban application tracking, and conversion-based recruitment analytics** into one focused platform.

---

## Why CareerTrack?

Students often face several challenges when searching and applying for internships:

* **Fragmented job discovery** across multiple platforms and company websites.
* **Local vs. remote opportunity gaps**, especially for students in emerging tech markets.
* **Resume skill mismatches** that can lead to ATS rejection.
* **Disorganized application tracking** across spreadsheets and bookmarks.
* **Misleading application statistics** that mix saved opportunities with real applications.

CareerTrack brings these workflows together into a single platform.

---

## Core Features

### 1. Live Opportunity Market

A unified opportunity feed combining local vacancies with remote job sources.

* Local + international opportunities
* Internship and entry-level prioritization
* Search and regional filtering
* Employment-type filtering
* Duplicate prevention
* 15-minute in-memory TTL caching
* Fallback handling for external API failures

**Supported sources include:** Jobicy, Remotive, and Arbeitnow.

---

### 2. Resume Gap Intelligence

Compare a student's skills against real market requirements.

* Canonical skill normalization
* Detects equivalent technologies such as `React`, `React.js`, and `ReactJS`
* Identifies missing skills
* Measures technology demand across valid job requirements
* Highlights high-value learning opportunities

This avoids unreliable exact-string matching and reduces false skill-gap results.

---

### 3. Kanban Application Pipeline

Track applications throughout the recruitment process.

```text
Saved → Applied → Assessment → Interview → Decision
```

Application outcomes are separated into:

* Active
* Offer
* Rejected
* No Response

This keeps saved opportunities separate from actual submitted applications.

---

### 4. Recruitment Analytics

CareerTrack uses real funnel calculations instead of simple application counts.

Key metrics include:

* **Interview Rate**
* **Assessment Progression**
* **Offer Rate**
* Application outcomes
* Technology demand
* Profile skill verification
* Pipeline health

Saved opportunities are excluded from application conversion denominators, while offers are calculated strictly from applications with an `Offer` outcome.

---

### 5. Pipeline Stagnation Detection

CareerTrack identifies active applications with more than **14 days of inactivity** and provides subtle follow-up reminders.

This helps students avoid losing track of applications, assessments, and recruiter responses.

---

### 6. Authentication & Profile Management

* JWT-based authentication
* bcrypt password hashing
* 6-digit password recovery OTP
* Password strength validation
* Academic profile management
* Career target management
* Dynamic profile completeness

---

## Engineering Highlights

### Deterministic Skill Taxonomy

Job requirements and user skills are mapped to canonical technology names before analysis.

For example:

```text
React      → React
React.js   → React
ReactJS    → React

Node       → Node.js
Node.js    → Node.js
NodeJS     → Node.js

K8s        → Kubernetes
```

This produces more reliable skill-gap and technology-demand statistics.

### Accurate Recruitment Funnel

CareerTrack separates **saved opportunities** from genuine applications:

```text
Saved
  ↓
Excluded from conversion calculations

Applied
Assessment
Interview
Decision
  ↓
Submitted Applications
  ↓
Conversion Metrics
```

Offers are determined by the actual application outcome rather than simply reaching the Decision stage.

---

## Design Philosophy

CareerTrack intentionally avoids the typical "AI dashboard" aesthetic.

### Visual Direction

* Editorial
* Professional
* Calm
* Structured
* Human
* Productivity-focused

### Color System

| Purpose           | Color                      |
| ----------------- | -------------------------- |
| Primary           | `#0E2A20` - Deep Veridian  |
| Accent            | `#C5A880` - Warm Champagne |
| Background        | `#FFFFFF`                  |
| Secondary Surface | `#F7F7F5`                  |

The **මඟ** brand is inspired by the Sinhala concept of *path / trajectory*, representing a student's journey toward a career.

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios
* Custom SVG graphics

### Backend

* Node.js
* Express
* TypeScript
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Aggregation Pipelines
* In-memory TTL Cache

---

## Project Structure

```text
CareerTrack/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── analyticsController.ts
│   │   │   ├── authController.ts
│   │   │   └── applicationController.ts
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── pages/
    │   │   ├── Analytics.tsx
    │   │   ├── Auth.tsx
    │   │   ├── Pipeline.tsx
    │   │   ├── Settings.tsx
    │   │   └── CareerAnalysis.tsx
    │   ├── services/
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites

* Node.js `18+`
* MongoDB or MongoDB Atlas
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/careertrack.git
cd careertrack
```

### 2. Configure Backend

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/careertrack
JWT_SECRET=your_super_secret_jwt_key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

Install dependencies and start the backend:

```bash
cd backend
npm install
npm run dev
```

### 3. Configure Frontend

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then:

```bash
cd ../frontend
npm install
npm run dev
```

---

## API Overview

| Method | Endpoint                     | Purpose                  | Auth |
| ------ | ---------------------------- | ------------------------ | ---- |
| `POST` | `/api/auth/register`         | Register account         | No   |
| `POST` | `/api/auth/login`            | Authenticate user        | No   |
| `POST` | `/api/auth/forgot-password`  | Send recovery OTP        | No   |
| `POST` | `/api/auth/verify-otp`       | Verify OTP               | No   |
| `POST` | `/api/auth/reset-password`   | Reset password           | No   |
| `GET`  | `/api/analytics/overview`    | Recruitment analytics    | Yes  |
| `GET`  | `/api/analytics/live-jobs`   | Aggregated opportunities | Yes  |
| `PUT`  | `/api/users/profile`         | Update profile           | Yes  |
| `PUT`  | `/api/users/change-password` | Change password          | Yes  |

---

## Core User Journey

```text
Discover
   ↓
Save
   ↓
Analyze
   ↓
Apply
   ↓
Track
   ↓
Improve
```

CareerTrack turns a fragmented internship search into a structured, measurable career journey.

---

## Project Status

CareerTrack is an actively developed academic/software engineering project focused on improving the internship and early-career recruitment experience for university students.
