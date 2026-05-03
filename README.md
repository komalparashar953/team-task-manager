# Team Task Manager

A production-ready full-stack task management application.

## 🚀 Tech Stack

**Frontend:**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios, React Query (Tanstack Query)
- React Hook Form + Zod
- lucide-react (icons), react-hot-toast

**Backend:**
- Node.js + Express.js
- PostgreSQL with Prisma ORM
- JWT Authentication (Access + HttpOnly Refresh Tokens)
- bcryptjs, zod, cors, helmet, morgan

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 1. Database Setup
Ensure PostgreSQL is running. Create a database called `team_task_manager`.

### 2. Backend Setup

```bash
cd backend
npm install

# Build the .env file from .env.example
cp .env.example .env
# Edit .env and put your exact postgres URL.

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed the database
npm run seed

# Start the dev server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Setup env
cp .env.example .env

# Start frontend
npm run dev
```

## 🔐 Role Permissions

| Action | Admin (Project) | Member (Project) |
| :--- | :--- | :--- |
| View Project & Members | ✅ | ✅ |
| Update/Delete Project | ✅ | ❌ |
| Invite/Remove Members | ✅ | ❌ |
| Change Member Roles | ✅ | ❌ |
| Create Task | ✅ | ✅ |
| Update/Delete ANY Task | ✅ | ❌ |
| Update/Delete OWN Task | ✅ | ✅ |
| Change Status of Assigned Task | ✅ | ✅ |

## 📚 API Reference

**Auth**
* `POST /api/auth/signup` - Register
* `POST /api/auth/login` - Login
* `POST /api/auth/refresh` - Refresh token
* `POST /api/auth/logout` - Logout
* `GET /api/auth/me` - Get profile

**Projects**
* `GET /api/projects` - List user projects
* `POST /api/projects` - Create project
* `GET /api/projects/:id` - Get project
* `PATCH /api/projects/:id` - Update project
* `DELETE /api/projects/:id` - Delete project

**Members**
* `GET /api/projects/:id/members` - List members
* `POST /api/projects/:id/members` - Invite member
* `PATCH /api/projects/:id/members/:userId` - Update role
* `DELETE /api/projects/:id/members/:userId` - Remove member

**Tasks**
* `GET /api/projects/:id/tasks` - List tasks
* `POST /api/projects/:id/tasks` - Create task
* `GET /api/projects/:id/tasks/:taskId` - Get task
* `PATCH /api/projects/:id/tasks/:taskId` - Update task
* `DELETE /api/projects/:id/tasks/:taskId` - Delete task

**Dashboard**
* `GET /api/dashboard` - Get dashboard statistics

## 📸 Screenshots
*(Placeholder for UI screenshots)*
- Dashboard View
- Kanban Board View
- Members Management
