# OmniMind AI (OmniDoc AI)
### Production-Grade Enterprise Multimodal AI Knowledge & Operational Workspace

![Architecture](https://img.shields.io/badge/Architecture-Multimodal%20AI-0c8fe9?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20%7C%202.5%20Pro-4285F4?style=for-the-badge&logo=google)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Vector%20Ready-336791?style=for-the-badge&logo=postgresql)
![React](https://img.shields.io/badge/React%2018-Vite%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react)
![Node](https://img.shields.io/badge/Node.js-Express%20%7C%20JWT-339933?style=for-the-badge&logo=node.js)

---

## 1. Executive System Overview

**OmniMind AI** is an enterprise-ready multimodal workspace designed to ingest, process, correlate, search, and reason across heterogeneous data streams. By unifying text documents (PDF, DOCX, TXT), high-resolution visuals (scanned invoices, blueprints, PNG, JPEG), audio recordings (interviews, memos, MP3, WAV), and video streams (webinars, product demos, MP4, AVI), OmniMind eliminates enterprise data silos.

Powered by the **Google Gemini Multimodal API** (`gemini-2.5-flash` for high-throughput ingestion and conversational reasoning; `gemini-2.5-pro` for deep synthesis reports) and secured with **PostgreSQL Row Level Security (RLS)** patterns, OmniMind provides an auditable, cited, and grounded intelligence environment.

---

## 2. Architecture & Tech Stack

```mermaid
graph TD
    Client["React 18 + Vite + Tailwind Client (OmniDoc UI)"]
    API["Express.js REST API + Multer File Pipeline"]
    Auth["JWT + Bcrypt (12 Rounds) Auth Middleware"]
    DB[("PostgreSQL Database (Neon / Supabase / Local)")]
    Gemini["Google Gemini 2.5 Flash & 2.5 Pro Multimodal Engine"]
    Storage["Secure Server-Side Storage (/uploads)"]

    Client -->|Bearer JWT / REST| API
    API --> Auth
    API -->|Parameterized SQL| DB
    API -->|Multipart Uploads| Storage
    API -->|Base64 Media + Prompts| Gemini
    Gemini -->|OCR, Transcripts, JSON Schema| API
    DB -->|Grounded Context & Citations| API
```

* **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, Lucide React, Axios, React Markdown.
* **Backend:** Node.js (ES Modules), Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `zod` input validation, `multer` multipart ingestion.
* **Database:** PostgreSQL with `uuid-ossp`, indexes, and strict user-scoped parameterized SQL queries.
* **AI Engine:** `@google/genai` official SDK.

---

## 3. Directory Structure

```text
MultiModal--AI/
├── .env.example              # Root environment template
├── package.json              # Monorepo management scripts
├── backend/
│   ├── .env                  # Backend environment file (JWT, DB, Gemini API key)
│   ├── .env.example          # Backend environment template
│   ├── package.json
│   ├── uploads/              # Ingested multimodal storage
│   └── src/
│       ├── config/
│       │   ├── db.js         # PostgreSQL connection pool with persistent fallback
│       │   └── setup-db.js   # Direct SQL table migration runner
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── asset.controller.js
│       │   ├── chat.controller.js
│       │   └── report.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── upload.middleware.js
│       │   └── validate.middleware.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── asset.routes.js
│       │   ├── chat.routes.js
│       │   └── report.routes.js
│       ├── services/
│       │   └── gemini.service.js  # Google Gemini 2.5 Flash & Pro integrations
│       └── server.js
└── frontend/
    ├── .env                  # Frontend environment file
    ├── .env.example          # Frontend environment template
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── FileUploadZone.jsx
        │   ├── AssetCard.jsx
        │   ├── ChatInterface.jsx
        │   ├── ReportBuilder.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── UploadPage.jsx
        │   ├── WorkspacePage.jsx
        │   ├── ChatPage.jsx
        │   └── ReportsPage.jsx
        ├── services/
        │   └── api.js
        ├── App.jsx
        └── main.jsx
```

---

## 4. Environment Variables (`.env`)

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/omnidoc_ai
JWT_SECRET=super_secret_jwt_key_omnimind_production_grade_change_in_prod_2026
GEMINI_API_KEY=your_google_gemini_api_key_here
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

> **Google Gemini API Key:**  
> Get your API key from Google AI Studio at: [https://aistudio.google.com/](https://aistudio.google.com/) and paste it into `backend/.env`.

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 5. Quickstart & Installation

### Step 1: Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment Files
Both `backend/.env` and `frontend/.env` have been generated. Add your `GEMINI_API_KEY` to `backend/.env` for live Google Gemini API inference.

### Step 3: Run the Application
In separate terminal sessions:

```bash
# Start Backend (port 5000)
cd backend
npm run dev

# Start Frontend (port 5173)
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 6. API Route Specification

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user with email, name, password | No |
| `POST` | `/api/auth/login` | Authenticate user & issue signed JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer JWT) |
| `POST` | `/api/assets/upload` | Multipart upload (PDF, DOCX, PNG, MP3, MP4) | Yes (Bearer JWT) |
| `GET` | `/api/assets` | Query & filter assets by modality or search | Yes (Bearer JWT) |
| `GET` | `/api/assets/:id` | Detailed asset metadata & OCR transcript | Yes (Bearer JWT) |
| `GET` | `/api/assets/:id/file` | Stream or download raw file | Yes (Bearer JWT) |
| `DELETE`| `/api/assets/:id` | Remove asset and delete from disk | Yes (Bearer JWT) |
| `GET` | `/api/assets/stats/summary`| Aggregated modality counts & storage stats | Yes (Bearer JWT) |
| `POST` | `/api/chat/sessions` | Create new multi-document chat session | Yes (Bearer JWT) |
| `GET` | `/api/chat/sessions` | List user conversation threads | Yes (Bearer JWT) |
| `POST` | `/api/chat/message` | Send prompt with selected multimodal assets | Yes (Bearer JWT) |
| `POST` | `/api/reports/generate` | Generate executive report with Gemini 2.5 Pro | Yes (Bearer JWT) |
| `GET` | `/api/reports` | Archive of generated reports | Yes (Bearer JWT) |

---

## 7. Production Deployment Targets

* **Frontend:** Deploy to **Vercel** or **Netlify** with `npm run build` and output directory `dist`. Set `VITE_API_BASE_URL` in project settings.
* **Backend:** Deploy to **Render** or **Railway** as a Node.js web service running `node src/server.js`.
* **Database:** Connect any managed PostgreSQL database (such as **Neon.tech** or **Supabase**) by setting `DATABASE_URL` in your production environment variables.

