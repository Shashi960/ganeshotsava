# Ganeshotsava Community Management Platform

A complete, production-quality, mobile-first web application for an annual Ganeshotsava / Ganesh Chaturthi community organization. It is designed to be multi-year reusable, supporting dual-languages (Kannada & English), secure Role-Based Access Control (RBAC), Satya Ganapati Kathe registration, Prasada delivery tracking, auction ledgers, and dynamic program schedule management.

---

## Technology Stack

* **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide icons
* **Backend**: Node.js, Express.js, TypeScript, JWT (JSON Web Tokens), bcryptjs, Zod
* **Database**: MongoDB (Mongoose ODM)
* **PWA**: Standalone Manifest, Service Worker caching

---

## Project Structure

```text
/ganeshotsava-platform
  ├── /client              # React + Vite Frontend (TypeScript)
  │     ├── /public        # PWA assets, manifest.json, sw.js
  │     └── /src
  │           ├── /components  # Reusable UI widgets
  │           ├── /context     # Translation & Authentication Contexts
  │           ├── /pages       # Public & Administrator panels
  │           ├── /services    # Axios API client wrapper
  │           └── main.tsx     # Router & mounting
  ├── /server              # Node.js + Express Backend (TypeScript)
  │     └── /src
  │           ├── /config      # Database setup
  │           ├── /controllers # Router controller handlers
  │           ├── /middleware  # Authentication & RBAC protection
  │           ├── /models      # Mongoose schemas
  │           ├── /routes      # Route endpoint mappings
  │           └── /seed        # Seeding utility (Kannada brochure data)
  ├── package.json         # Workspace launcher setup
  └── README.md            # Documentation
```

---

## Environment Variables

Create `.env` file in the `/server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ganeshotsava
JWT_SECRET=supersecretjwtkeychangeinproduction
JWT_EXPIRES_IN=7d
INITIAL_ADMIN_EMAIL=admin@ganeshotsava.com
INITIAL_ADMIN_PASSWORD=AdminPassword123!
CLIENT_URL=http://localhost:5173
```

---

## Local Development Setup

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
```

### 2. Database Seeding (Aug 2025 Brochure Data)
Make sure MongoDB is running locally. Then seed the database with the exact program schedule, financial income/expenditures, sponsors, and settings extracted from the Kannada brochure:
```bash
npm run seed --prefix server
```

### 3. Launch Development Server
Starts the backend API on `localhost:5000` and the client frontend on `localhost:5173`:
* Run backend: `npm run dev:server`
* Run frontend: `npm run dev:client`

---

## Administration Accounts
* **Default Super Admin Login**:
  * Email: `admin@ganeshotsava.com` (can be configured in `.env`)
  * Password: `AdminPassword123!` (can be configured in `.env`)
* **Role Permissions**:
  * **SUPER_ADMIN**: Full system control including system settings updates, settings visibility controls, audit logs reviews, and administrator additions/deactivations.
  * **ADMIN**: Full CRUD controls on events, members list, places, prasada updates, and media uploads.
  * **PUBLIC**: Read-only access to events timeline, public member list (contact details hidden securely), registration for Satya Ganapati Kathe, and prasada delivery tracking.

---

## Verification & Deployment
* **Client Build**: `npm run build:client`
* **Server Build**: `npm run build:server`
* **Deployment Options**:
  * Frontend: Vercel / Netlify
  * Backend: Render / Railway / Heroku
  * Database: MongoDB Atlas Cloud instance
