# CoalSafe — Coal Mine Productivity & Safety Management System

**Semester 3 Major Project**  
*Problem Statement: Web and App-based Software for Productivity and Safety Management of Coal Mines (Ministry of Coal / CMPDI, 2024).*

---

## 1. Project Overview

**CoalSafe** is an enterprise-grade digital logging and statutory safety management system engineered for underground and opencast coal mines. It directly replaces vulnerable paper logbooks with an immutable, cryptographically verifiable digital platform conforming to the **Coal Mines Regulations (CMR)** and **Directorate General of Mines Safety (DGMS)** guidelines.

### Primary Modules
1. **Digital Shift Handover Logbook**: Operational logging of coal production tonnage, machinery status, atmospheric gas readings, and pending tasks with mandatory incoming cross-shift 4-eyes verification and permanent database record locking.
2. **Safety Management Plan (SMP) & Hazard Register**: Workplace hazard identification, mathematical 5×5 risk assessment scoring ($Likelihood \times Severity$), corrective action assignment under the Hierarchy of Controls, target date tracking, and Mine Manager closeout verification.
3. **Statutory PDF Reports**: Instant generation of official PDF logbooks and registers compliant with DGMS audit standards using `pdfmake`.
4. **Enterprise ERP Integration**: Secured, read-only JSON data feeds (`/api/erp/handovers`, `/api/erp/hazards`) protected by dedicated API keys for enterprise systems (SAP / Coal India ERP).

---

## 2. Technology Stack

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18.3, Vite 5.4, Tailwind CSS 3.4, React Router v6, Lucide Icons | Responsive PWA interface, 5×5 interactive matrix, instant PDF exports |
| **Backend** | Node.js (v20 LTS), Express.js (CommonJS) | Business logic, authentication, RBAC authorization, statutory locking |
| **Database & Auth** | Supabase (PostgreSQL 15 + Supabase Auth) | Row Level Security (RLS), ACID triggers, immutable statutory logs |
| **Document Engine** | `pdfmake` | Server-side statutory PDF generation with standard Helvetica typography |
| **Security** | `helmet`, `express-rate-limit`, JWT Bearer tokens | Defense-in-depth header protection and API throttling |
| **Testing** | Node.js native test runner (`node:test`), Supertest, Vitest | 36 unit and end-to-end integration tests |

---

## 3. Demo Viva Credentials (DEMO ONLY)

The system includes pre-provisioned demo accounts in Supabase Auth representing all 4 statutory roles. A **Quick Demo Fill** component is integrated on the login screen for one-click authentication during examinations.

> [!IMPORTANT]
> These credentials are strictly for local testing and viva demonstration. Never deploy default demo credentials to production.

| Role | Email | Password | Full Name & Designation | Section / District |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@colliery.in` | `CoalSafe@2026` | Chief Administrator (System Admin) | Central Operations |
| **Mine Manager** | `manager@colliery.in` | `CoalSafe@2026` | Er. Rajesh Sharma (First Class Manager) | Colliery Sec-1 |
| **Shift In-charge** | `incharge@colliery.in` | `CoalSafe@2026` | Amit Kumar Verma (Overman In-charge) | Panel A - Longwall |
| **Supervisor** | `supervisor@colliery.in`| `CoalSafe@2026` | Suresh Singh (Mining Sirdar) | Panel A - Longwall |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Admin | Mine Manager | Shift In-charge | Supervisor |
| :--- | :---: | :---: | :---: | :---: |
| **Operations Dashboard** | Full | Full | Full | Full |
| **Create Handover (Draft)** | Yes | Yes | Yes | Yes |
| **Submit Outgoing Handover** | Yes | Yes | Yes | Yes |
| **Acknowledge Handover (4-Eyes)** | Yes | Yes | Yes (Non-creator only) | No |
| **Report Workplace Hazard** | Yes | Yes | Yes | Yes |
| **Re-assess Risk (5×5 Matrix)** | Yes | Yes | Yes | Yes |
| **Assign Corrective Safety Action** | Yes | Yes | Yes | No |
| **Manager Verification & Hazard Closure** | Yes | Yes | No | No |
| **Download Statutory PDF Reports** | Yes | Yes | Yes | No |
| **User & Personnel Administration** | Yes | No | No | No |

---

## 5. Core Architectural Workflows

### Shift Handover Statutory Lifecycle
```text
[Outgoing Shift In-charge]
       │
       ▼
1. Create Handover (Draft)
   ├── Production Tonnage & Mining Progress
   ├── Equipment Status & Machine Availability
   ├── Strata & Atmospheric Gas Observations (CH4, CO, Airflow)
   └── Pending Work for Incoming Shift
       │
       ▼
2. Submit Handover (Submitted)
   ├── Record locked against creator edits
   └── Shift enters "Pending Acknowledgement" queue
       │
       ▼
[Incoming In-charge / Mine Manager]
       │
       ▼
3. Digital Acknowledgement & Verification (Acknowledged)
   ├── 4-Eyes Check: Outgoing creator strictly prohibited from self-acknowledgement
   ├── Relieving in-charge accepts physical underground shift conditions
   └── Immutability Lock: Database trigger permanently locks record against modification
```

### DGMS 5×5 Risk Assessment Matrix
The Safety Management Plan computes risk using the formula:
$$\text{Risk Score} = \text{Likelihood } (1-5) \times \text{Severity } (1-5)$$

- **Low Risk (1–4)**: Routine supervision and continuous monitoring.
- **Medium Risk (5–9)**: Planned corrective actions with assigned target dates.
- **High Risk (10–16)**: Urgent remediation and direct management oversight.
- **Extreme Risk (17–25)**: Immediate operational stoppage in affected zone until mitigated.

---

## 6. Local Setup & Running Instructions

### Prerequisites
- Node.js v18+ (Node v20 LTS recommended)
- npm v9+
- Active Supabase project (Free tier)

### Step 1: Clone and Configure Environment Files
```bash
git clone https://github.com/arpitbanna/Major-Project.git
cd Major-Project

# Configure Backend
cp backend/.env.example backend/.env

# Configure Frontend
cp frontend/.env.example frontend/.env
```

Ensure `backend/.env` and `frontend/.env` contain your Supabase credentials:
```ini
# Backend (.env) - Port 5001 avoids macOS AirPlay Receiver port 5000 collision
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
ERP_API_KEY=coalsafe-erp-secret-2024

# Frontend (.env)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=/api
```

### Step 2: Database Schema & Seed Data Setup
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run `backend/src/db/schema.sql` to create all tables (including the `coal_mines` catalog), indexes, RLS policies, and immutability triggers.
3. Run `backend/src/db/seed_mines.sql` to populate all 1,685 authentic real-world coal mining facilities from the official MSHA/USGS Mines and Mineral Resources dataset.
4. Run `backend/src/db/seed.sql` (or run `npm run seed` in `backend`) to provision the 4 demo accounts and realistic mining data.

> **Tip:** You can also seed via terminal:
> ```bash
> npm run seed        # Provisions demo accounts and shift handovers
> npm run seed:mines  # Populates real-world coal mines dataset
> ```

### Step 3: Google OAuth Setup (Optional / Production Auth)

CoalSafe supports both Email/Password authentication and **Google OAuth 2.0**:

#### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Select **Application type**: `Web application`.
4. Name: `CoalSafe Mine Management`.
5. Under **Authorized redirect URIs**, add your Supabase project callback URL:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
   *(For this project: `https://rtvgylbzffqopokrqgee.supabase.co/auth/v1/callback`)*
6. Click **Create** and copy your **Client ID** and **Client Secret**.

#### 2. Supabase Provider Configuration
1. Open your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**.
2. Toggle **Enable Google provider** to `ON`.
3. Paste your **Client ID** and **Client Secret**.
4. Click **Save**.

#### 3. Supabase Redirect URL Configuration
In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
- **Site URL**: `http://localhost:5173` (or your production frontend URL).
- **Redirect URLs** (add the following):
  ```
  http://localhost:5173/
  http://localhost:5173/login
  http://localhost:5173/auth/callback
  https://your-production-domain.com/
  https://your-production-domain.com/auth/callback
  ```

#### 4. Security & Role Policy for Google Signups
- As enforced by the PostgreSQL trigger `handle_new_user()` in `schema.sql`, new Google signups are **strictly assigned the baseline `Supervisor` role**.
- Administrative and managerial privileges (`Admin`, `Mine Manager`) **cannot** be acquired through OAuth self-registration; they must be explicitly granted by an authorized Administrator in the Admin portal.

---

### Step 4: Install Dependencies & Run
```bash
# Install dependencies in both folders
cd backend && npm install
cd ../frontend && npm install
cd ..

# Run both services simultaneously:
npm run dev

# Or run in separate terminal windows:
# Terminal 1: npm run dev:backend  (Backend API on http://localhost:5001)
# Terminal 2: npm run dev:frontend (React UI on http://localhost:5173)
```

---

## 7. Automated Testing Suite

The repository contains **36 comprehensive automated tests** verifying all business rules, role guards, and calculation matrices:

```bash
# Run all tests across backend and frontend:
npm test
```

- **Backend (`node:test`) — 25 Tests**:
  - API authentication guards and 401 rejection on unprotected requests.
  - End-to-end live Supabase authentication for all 4 roles.
  - Role-based authorization tests (Admin access vs Supervisor 403 denial).
  - Shift Handover 4-eyes cross-shift acknowledgement and tamper lock enforcement.
  - Safety Management Plan hazard lifecycle and manager verification.
  - 5×5 risk matrix calculation boundary testing.
  - Coal mines catalog stats and search API verification.
  - Read-only ERP API key authentication.
- **Frontend (`vitest`) — 11 Tests**:
  - Client-side 5×5 risk score and color badge calculation mappings.
  - Safe API request handler, status code validation, and error parsing.
  - Google OAuth client redirect and error handling flows.

---

## 8. Production Deployment Guide

### Recommended Production Architecture
- **Frontend**: [Vercel](https://vercel.com) (Serverless CDN + SPA Rewrites)
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app) (Docker / Node.js Web Service)
- **Database & Auth**: [Supabase](https://supabase.com) (Managed PostgreSQL)

### Frontend Deployment (Vercel)
1. Import repository into Vercel and select root directory as `frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your production Supabase URL.
   - `VITE_SUPABASE_ANON_KEY`: Your production Supabase Anon Key.
6. [frontend/vercel.json](file:///Users/arpit/Desktop/Major%20Project/frontend/vercel.json) handles SPA client routing and rewrites `/api/*` to your production backend.

### Backend Deployment (Render / Railway)
1. Create a new **Web Service** pointing to the repository, root directory `backend`.
2. Build Command: `npm install`.
3. Start Command: `npm start` (runs `node server.js`).
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `SUPABASE_URL`: Your production Supabase URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your production Supabase Service Role Key.
   - `ERP_API_KEY`: A strong shared secret for external ERP data access.
