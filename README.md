# Easy Dubbing 🎙️

Easy Dubbing is a complete, production-ready AI-powered video dubbing and translation SaaS application matching the high-end premium Google Stitch dark design layout. It integrates the **HeyGen V3 Video Translation API** with a Node.js/Express backend server, Supabase Auth, PostgreSQL RLS, and a React/TypeScript/Tailwind CSS frontend application.

---

## 🛠️ Architecture

- **`/frontend`**: Vite + React + TypeScript + Tailwind CSS client console featuring custom HSL colors, obsidian mesh grids, backdrop blurs, timelines, and credit cost widgets.
- **`/backend`**: Express + TypeScript secure server. All HeyGen API keys are kept strictly server-side. Handles multi-language project orchestration, automated webhook deduplication/signature checking, and credit refunding.
- **`/supabase`**: Schema definition including `profiles`, `projects`, `project_translations`, `webhook_events`, `plans`, performance indexes, and granular Row Level Security (RLS) policies.

---

## 🚀 Quick Start Guide

### 1. Database Setup
1. Create a project in [Supabase](https://supabase.com).
2. Go to the SQL Editor and paste the contents of `supabase/schema.sql`. Run the query to set up tables, triggers, indexes, and RLS policies.

### 2. Backend Server Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` in `/backend` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `HEYGEN_API_KEY`
4. Run in development mode:
   ```bash
   npm run dev
   ```

### 3. Frontend Client Setup
1. Navigate to `/frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `/frontend` and populate:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run local server:
   ```bash
   npm run dev
   ```
5. Open browser at `http://localhost:3000`.

---

## 🔒 Security Policy
- The **`HEYGEN_API_KEY`** is stored entirely server-side in the `/backend` environmental block and never exposed to client calls.
- Frontend files submit projects through `/api/projects`, which authorizes and verifies client user accounts via Supabase JWT checking.
- RLS Policies ensure users can only query, list, and details projects that they own.
