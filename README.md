# Coal Mine Productivity & Safety Management System

**Semester 3 Major Project**  
Based on Ministry of Coal / CMPDI Problem Statement (2024).

---

## 1. Project Overview

The **Coal Mine Productivity & Safety Management System** is a web-based, mobile-responsive application designed to modernize shift communications and safety compliance in coal mining operations.

The system addresses two core challenges:
1. **Digital Shift Handover Log System:** Digital logging of shift activities, equipment availability, production metrics, safety observations, and pending tasks with mandatory incoming shift verification and record locking.
2. **Safety Management Plan (SMP) System:** Hazard identification, 5×5 risk assessment scoring, mitigation assignment, target date tracking, and management verification.

---

## 2. Technology Stack

- **Frontend:** React, Vite, JavaScript, Tailwind CSS, Lucide React icons, React Router
- **Backend:** Node.js, Express.js
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Architecture:** Client-Server REST API architecture

---

## 3. Project Directory Structure

```text
Major Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js       # Supabase client configuration
│   │   ├── routes/
│   │   │   └── health.js         # API health check route
│   │   └── app.js                # Express app setup and middleware
│   ├── .env.example              # Backend environment template
│   ├── .env                      # Local environment configuration
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx # Application layout wrapper
│   │   │       ├── Header.jsx    # Top navigation bar
│   │   │       └── Sidebar.jsx   # Responsive sidebar navigation
│   │   ├── App.jsx               # Application entry and route shell
│   │   ├── index.css             # Tailwind CSS styles
│   │   └── main.jsx              # React DOM mounting
│   ├── .env.example              # Frontend environment template
│   ├── .env                      # Local environment configuration
│   ├── index.html                # HTML entry
│   ├── package.json              # Frontend dependencies
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind industrial light theme
│   └── vite.config.js            # Vite configuration with /api proxy
├── .gitignore                    # Git ignore file
├── package.json                  # Root runner script package
└── README.md                     # Project documentation
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18.0 or later recommended)
- npm (v9.0 or later)

### Step 1: Environment Variables Setup
Copy example files into `.env` for both backend and frontend:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Configure your Supabase credentials in both `.env` files:
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`)
- `SUPABASE_ANON_KEY`: Supabase Anonymous public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role key (backend only)

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 3: Run the Development Servers

Open two terminal tabs:

**Tab 1: Backend Server**
```bash
cd backend
npm run dev
# Starts backend server at http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

**Tab 2: Frontend Server**
```bash
cd frontend
npm run dev
# Starts Vite frontend server at http://localhost:5173
```

---

## 5. Development Phases

- [x] **Phase 1:** Requirement Analysis & System Specification
- [x] **Phase 2:** Project Setup, Shell Layout & Health Endpoint *(Current)*
- [ ] **Phase 3:** Authentication & Role-Based Access Control (Admin, Mine Manager, Shift In-charge, Supervisor)
- [ ] **Phase 4:** Dashboard & Shift Overview Metrics
- [ ] **Phase 5:** Digital Shift Handover Module (Form, Records, Acknowledgment, PDF)
- [ ] **Phase 6:** Safety Management Plan (SMP) & Hazard Register
- [ ] **Phase 7:** Audit Trail, Final Polishing & Project Viva Documentation
