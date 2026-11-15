# CoalSafe — Setup & Deployment Guide

This guide walks you through setting up CoalSafe (Coal Mine Productivity & Safety Management System) with Supabase Auth and PostgreSQL.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20 LTS recommended)
- **npm**: v9.0.0 or later
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)

---

## 2. Supabase Project Setup

1. Log in to [Supabase](https://app.supabase.com) and click **New project**.
2. Set a **Project Name** (e.g., `coalsafe-colliery`).
3. Set a strong database password and select a region close to your location.
4. Once the project finishes provisioning, navigate to **Project Settings** -> **API**:
   - Copy **Project URL** (`https://<project-ref>.supabase.co`)
   - Copy **anon public key** (`eyJhbGciOi...`)
   - Copy **service_role secret key** (`eyJhbGciOi...`) *(Keep this private; never share or put it into frontend)*

---

## 3. Database Schema Setup

1. Open your Supabase Dashboard and go to the **SQL Editor** tab (left sidebar).
2. Click **New query**.
3. Open `backend/src/db/schema.sql` in your project workspace.
4. Copy its complete contents, paste them into the Supabase SQL editor, and click **Run**.
5. Verify in the **Table Editor** that the following tables exist:
   - `public.user_profiles`
   - `public.shift_handovers`

---

## 4. Environment Variables Configuration

### Backend Configuration
In the `backend` folder, create a `.env` file based on `.env.example`:

```bash
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
SUPABASE_ANON_KEY=<your-anon-public-key>
CLIENT_URL=http://localhost:5173
ERP_API_KEY=coalsafe-erp-secret-2024
```

### Frontend Configuration
In the `frontend` folder, create a `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
VITE_API_URL=/api
```

---

## 5. Initial Admin & User Roles Setup

CoalSafe uses four roles:
- `Admin`: Full system access and user management
- `Mine Manager`: Mine-wide oversight, SMP approvals, and audit access
- `Shift In-charge`: Shift operations, logging, and cross-shift sign-offs
- `Supervisor`: On-site logging, inspections, and hazard reporting

### Creating the First Admin:
1. In Supabase Dashboard, go to **Authentication** -> **Users** -> **Add user** -> **Create user**.
2. Enter an email (e.g., `admin@colliery.in`) and password.
3. Open the **SQL Editor** and run:
   ```sql
   UPDATE public.user_profiles
   SET role = 'Admin',
       full_name = 'Chief Mine Administrator',
       designation = 'Mine Agent / Admin',
       mine_section = 'Central Operations'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@colliery.in');
   ```

### Creating Test Shift In-charges:
Repeat the same to create two Shift In-charges for testing shift handovers:
1. User 1: `incharge1@colliery.in` -> Role: `Shift In-charge` (Outgoing)
2. User 2: `incharge2@colliery.in` -> Role: `Shift In-charge` (Incoming)

---

## 6. Running the Application Locally

### Start Backend Server:
```bash
cd backend
npm install
npm run dev
# Server runs at http://localhost:5000
```

### Start Frontend Server:
```bash
cd frontend
npm install
npm run dev
# Vite runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser and log in with your credentials.
