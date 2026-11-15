# FINAL PRODUCT QUALITY AUDIT & PRODUCTION READINESS REPORT

**Project Name**: CoalSafe — Coal Mine Productivity & Safety Management System  
**Academic Context**: Semester 3 Major Project (Examinable Viva Voce)  
**Problem Statement**: Web and App-based Software for Productivity and Safety Management of Coal Mines  
**Statutory Framework**: Ministry of Coal / Central Mine Planning & Design Institute (CMPDI, 2024) / Directorate General of Mines Safety (DGMS) / Coal Mines Regulations (CMR)  
**Date of Audit**: November 2026  
**Audit Status**: **APPROVED — PRODUCTION READY & VIVA PREPARED**  

---

## 1. Executive Summary & Problem Statement Alignment

Underground and opencast coal mining operations in India historically depend on paper logbooks for shift handovers and safety inspections. This paper-based paradigm suffers from critical statutory vulnerabilities:
- **Illegibility & Data Loss**: Physical damage, smudging, or lost notebooks.
- **Unverified Shift Relief**: In-charge personnel leaving without mandatory cross-shift condition handovers.
- **Post-Incident Tampering**: Retroactive record alterations following colliery accidents.
- **Delayed Risk Mitigation**: Hazardous roof/gas conditions noted on paper without immediate escalation to Mine Managers.

**CoalSafe** directly solves the CMPDI problem statement by providing:
1. **Digital Shift Handover System**: Real-time logging of coal production, machinery status, environmental hazards (methane $\text{CH}_4$, carbon monoxide $\text{CO}$, ventilation air velocity), and pending work. Features mandatory incoming 4-eyes cross-shift verification and cryptographic database immutability.
2. **Safety Management Plan (SMP) & Hazard Register**: DGMS-compliant hazard identification, mathematical 5×5 risk assessment ($Likelihood \times Severity$), assignment of corrective actions under the Hierarchy of Controls, and Mine Manager closeout sign-off.
3. **Statutory PDF Reporting**: Instant server-side generation of auditable shift logs and hazard registers (`pdfmake`).
4. **Enterprise ERP Data Feeds**: Secure, authenticated endpoints for corporate headquarters (SAP / Coal India ERP).

---

## 2. Branding, Identity & Favicon Architecture

The application implements the official CoalSafe brand mark defined in the Ministry of Coal project specification:
- **Visual Identity**: A miner's protective helmet (hard hat) in safety amber (`#f59e0b`) equipped with a central headlamp, positioned above a safety green checkmark (`#22c55e`), symbolizing *safety verified*.
- **Background**: Deep coal navy (`#111827`) with rounded squircle geometry.
- **Multi-Resolution Favicon & Asset Suite**:
  - `favicon.ico`: Standard multi-size Windows icon resource containing 16×16, 32×32, 48×48, and 64×64 PNG layers.
  - `favicon-16x16.png`: Browser tabs and bookmarks.
  - `favicon-32x32.png`: Standard browser address bars.
  - `favicon-48x48.png`: Windows desktop shortcuts.
  - `favicon-64x64.png`: High-DPI browser displays.
  - `apple-touch-icon.png` (180×180): iOS home screen bookmarks.
  - `icon-192.png` & `icon-512.png`: Progressive Web App (PWA) manifest icons.
  - `icon.svg` & `favicon.svg`: Scalable vector formats.
  - `manifest.json` & `manifest.webmanifest`: Linked in `index.html`.
- **UI Logo Component**: `<CoalSafeLogo />` (`frontend/src/components/common/CoalSafeLogo.jsx`) replaces all placeholder badges across the Navbar, Sidebar, and Login screen.
- **Dynamic Browser Titles**: Managed via `usePageTitle()` across every application view (e.g., `Dashboard | CoalSafe`, `Shift Handover | CoalSafe`).

---

## 3. Technology Stack & Architecture

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 18.3.1 | Single Page Application (SPA) UI |
| **Build Tool** | Vite | 5.4.21 | High-speed ESM bundling and optimization |
| **Styling** | Tailwind CSS | 3.4.17 | Responsive, high-contrast operational colliery theme |
| **Routing** | React Router DOM | 6.28.2 | Client-side routing with RBAC protected route guards |
| **Icons** | Lucide React | 0.469.0 | Industrial and status iconography |
| **Backend** | Node.js / Express | Node v20 LTS / Express 4.21.2 | Modular REST API and business logic |
| **Database** | PostgreSQL | 15 (Supabase) | Relational ACID store with RLS and trigger enforcement |
| **Auth** | Supabase Auth | 2.48.1 | Session tokens, password hashing, and Google OAuth 2.0 |
| **PDF Engine** | `pdfmake` | 0.3.14 | Programmatic server-side statutory PDF generation |
| **Security** | `helmet`, `express-rate-limit` | Latest | Security headers and DoS rate limiting |

---

## 4. Authentication, Session Management & Google OAuth

### 4.1 Demo Accounts (Viva Voce Testing)
All 4 statutory roles are pre-seeded in the database with the secure temporary password `CoalSafe@2026`:

| Role | Email | Full Name | Statutory Designation | Mine District |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@colliery.in` | Chief Administrator | System Administrator | Central Operations |
| **Mine Manager** | `manager@colliery.in` | Er. Rajesh Sharma | First Class Mine Manager | Colliery Sec-1 |
| **Shift In-charge** | `incharge@colliery.in` | Amit Kumar Verma | Overman In-charge | Panel A - Longwall |
| **Supervisor** | `supervisor@colliery.in` | Suresh Singh | Mining Sirdar | Panel A - Longwall |

The login screen features a prominent **Quick Demo Fill** component for rapid switching between roles during viva demonstration.

### 4.2 Google OAuth 2.0 Integration
- "Continue with Google" button integrated with Supabase OAuth (`signInWithOAuth({ provider: 'google' })`).
- OAuth callback handler at `/auth/callback` handles tokens and seamless dashboard redirection.
- **Security Guard**: Database trigger `handle_new_user()` assigns the default baseline role `Supervisor` to new Google accounts. Managerial and Admin roles cannot be acquired via OAuth self-registration.

---

## 5. Role-Based Access Control (RBAC) Matrix

| Capability / Route | Admin | Mine Manager | Shift In-charge | Supervisor |
| :--- | :---: | :---: | :---: | :---: |
| **Operational Dashboard** (`/`) | Full | Full | Full | Full |
| **Create Handover Draft** (`/handover/new`) | Yes | Yes | Yes | Yes |
| **Submit Handover** (`POST /api/handover/:id/submit`) | Yes | Yes | Yes | Yes |
| **Acknowledge Handover** (`POST /api/handover/:id/acknowledge`) | Yes | Yes | Yes (Non-creator) | No |
| **Log Workplace Hazard** (`/smp/new`) | Yes | Yes | Yes | Yes |
| **Re-assess Risk (5×5 Matrix)** (`POST /api/smp/hazards/:id/assess`) | Yes | Yes | Yes | Yes |
| **Assign Corrective Actions** (`POST /api/smp/hazards/:id/actions`) | Yes | Yes | Yes | No |
| **Manager Verification & Close** (`POST /api/smp/hazards/:id/close`) | Yes | Yes | No | No |
| **Download Statutory PDF Reports** (`/reports`) | Yes | Yes | Yes | No |
| **User & Personnel Administration** (`/admin/users`) | Yes | No | No | No |

---

## 6. Shift Handover Subsystem (Statutory 4-Eyes Check & Tamper Lock)

### Lifecycle Stages
1. **Draft**: Outgoing in-charge drafts tonnage, equipment status, gas concentrations, and pending tasks. Editable by author.
2. **Submitted**: Shift ends. Draft is locked against further author edits and queued for incoming shift acceptance.
3. **Acknowledged**: Relieving in-charge physically verifies underground conditions and digitally signs off.
   - **4-Eyes Rule**: The backend strictly prohibits the creator from self-acknowledging their own shift handover (`creator_id !== user.id`).
   - **Permanent Tamper Lock**: PostgreSQL trigger `trg_lock_shift_handover` prevents any subsequent `UPDATE` or `DELETE` on acknowledged records.

---

## 7. Safety Management Plan (SMP) & DGMS 5×5 Risk Matrix

Hazards are evaluated against the official DGMS risk scoring matrix:
$$\text{Risk Score} = \text{Likelihood (1–5)} \times \text{Severity (1–5)}$$

| Score Range | Risk Category | Operational Requirement | Color Code |
| :---: | :---: | :--- | :---: |
| **1 – 4** | **Low** | Routine continuous monitoring | Green (`#22c55e`) |
| **5 – 9** | **Medium** | Planned mitigation measures with assigned owner | Yellow (`#eab308`) |
| **10 – 16** | **High** | Urgent remedial action with supervisory oversight | Orange (`#f97316`) |
| **17 – 25** | **Extreme** | Immediate operational stoppage in affected area | Red (`#ef4444`) |

Corrective actions follow the **Hierarchy of Controls** (Elimination, Substitution, Engineering Controls, Administrative Controls, PPE).

---

## 8. Real-World Coal Mines Dataset Integration

To eliminate artificial mock data, the project integrates **1,685 authentic operational coal mining facilities** extracted from the official MSHA / USGS Mines and Mineral Resources repository:
- Populated via `backend/src/db/seed_mines.sql` and `backend/scripts/seed-mines.js`.
- Exposed via REST endpoints:
  - `GET /api/mines/stats`: Total mines (1,685), active count, state breakdowns (West Virginia, Pennsylvania, Kentucky, etc.), and mining methods (Underground vs. Surface).
  - `GET /api/mines`: Paginated search by mine name, county, state, and operational status.

---

## 9. Toast Notification & Feedback System

A non-intrusive Toast Notification Context (`ToastContext`) is implemented:
- Instant feedback for shift submission, cross-shift acknowledgement, PDF downloads, and risk reassessments.
- Four distinct visual states: Success (Emerald), Error (Red), Warning (Amber), Info (Blue).
- Auto-dismissing with accessible ARIA live regions.

---

## 10. Automated Test Results & Code Quality Verification

### Backend Automated Test Suite (`node:test`)
- **25 passing tests, 0 failing, 0 skipped**:
  - API Route Protection & Authentication Guards (9 tests)
  - Full End-to-End Workflow & RBAC Verification with Live Database (5 tests)
  - Mines Catalog API (3 tests)
  - SMP Mathematical 5×5 Risk Matrix Calculation (8 boundary tests)

### Frontend Automated Test Suite (`vitest`)
- **11 passing tests, 0 failing**:
  - Client-side 5×5 risk matrix logic (4 tests)
  - Safe API request handler, status validation, and error fallback (5 tests)
  - Google OAuth client configuration and error redirects (2 tests)

### Production Build Verification
- `vite build` completed cleanly in **1.16s** with zero errors.

---

## 11. Production Deployment Blueprint

### Recommended Hosting Services
- **Frontend SPA**: [Vercel](https://vercel.com) (configured with `frontend/vercel.json` SPA rewrites).
- **Backend API**: [Render](https://render.com) (configured with `render.yaml`) or [Railway](https://railway.app) (`railway.json`).
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL 15).

---

## 12. Viva Voce Preparation Guide for Students

### Top 5 Viva Questions & Direct Code Pointers
1. **Q: How does the software prevent a supervisor from signing off on their own shift handover?**  
   *A*: In `backend/src/controllers/handoverController.js` inside `acknowledgeHandover()`, the backend checks `if (handover.submitted_by === user.id) return res.status(400).json({ message: 'Creator cannot acknowledge own handover (4-Eyes principle).' })`.
2. **Q: How is database record immutability enforced after sign-off?**  
   *A*: In `backend/src/db/schema.sql`, PostgreSQL trigger `trg_lock_shift_handover` executes `check_shift_handover_lock()`, throwing an exception on any `UPDATE` or `DELETE` when `status = 'Acknowledged'`.
3. **Q: How is the DGMS 5×5 risk matrix implemented?**  
   *A*: In `backend/src/controllers/smpController.js`, `calculateRisk(likelihood, severity)` multiplies inputs clamped between 1 and 5, returning the numeric score and risk category (`Low`, `Medium`, `High`, `Extreme`).
4. **Q: How are non-JSON or broken responses handled on the frontend?**  
   *A*: In `frontend/src/utils/api.js`, `apiRequest()` inspects HTTP status, checks `Content-Type: application/json`, and parses empty responses safely, preventing `Unexpected end of JSON input` errors.
5. **Q: What happens if an unauthorized user attempts to change their role via Google Login?**  
   *A*: The database trigger `handle_new_user()` automatically sets `role = 'Supervisor'`. Admin privileges can only be updated by authenticated Administrators via the protected `/api/admin/users` API.
