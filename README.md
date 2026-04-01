# KanFlow — Real-time Collaborative Kanban

A **fun, playful, production-ready** Kanban app with real-time collaboration, built with Go, GraphQL, Next.js, and PostgreSQL.

---

## Features

- **Kanban Board** — Drag-and-drop tasks across columns (Todo, In Progress, Done)
- **Real-time Sync** — WebSockets broadcast changes to all connected team members instantly
- **Teams & Roles** — Admin and Member roles with team management UI
- **JWT Auth** — Secure login/register with bcrypt password hashing
- **Notifications** — Real-time task assignment and update notifications
- **Dark Mode** — Cartoonish dark theme with the same playful style
- **Activity Log** — Per-task activity history
- **Search & Filter** — Filter by priority, search by title/description
- **Responsive UI** — Works beautifully on all screen sizes

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Backend      | Go (Golang)                         |
| API          | GraphQL (`graph-gophers/graphql-go`)|
| Real-time    | Gorilla WebSocket                   |
| Database     | PostgreSQL 16                       |
| Auth         | JWT (`golang-jwt/jwt`)              |
| Frontend     | Next.js 15 (App Router)             |
| Styling      | Tailwind CSS + Sora font            |
| Drag & Drop  | `@dnd-kit`                          |
| Animations   | Framer Motion                       |
| State        | Zustand (persisted)                 |
| HTTP Client  | `graphql-request`                   |

---

## Quick Start

### Prerequisites

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16+](https://www.postgresql.org/) (or Docker)

### 1. Clone & Setup

```bash
git clone https://github.com/KeneanDita/Kanban.git
cd Kanban
```

### 2. Database Setup

#### Option A — Docker (recommended)

```bash
docker compose up postgres -d
```

The migration runs automatically on first boot.

#### Option B — Manual

```bash
createdb kanban
psql -U postgres -d kanban -f backend/migrations/001_init.sql
```

---

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
go run ./cmd/server
```

Backend runs on **http://localhost:8080**

GraphQL playground: **http://localhost:8080/graphql**

---

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

---

### 5. Docker (Full Stack)

```bash
docker compose up --build
```

All services start together:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=kanban
DB_SSLMODE=disable
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

---

## Project Structure

```
Kanban/
├── backend/
│   ├── cmd/server/          # Entry point
│   ├── internal/
│   │   ├── handlers/        # GraphQL resolvers, schema, WebSocket
│   │   ├── services/        # Business logic (auth, tasks, teams, notifications)
│   │   ├── db/              # Database connection
│   │   ├── models/          # Data models
│   │   └── middleware/      # JWT auth, logging
│   ├── migrations/          # SQL migrations
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── dashboard/   # Kanban board page
│   │   │   ├── login/       # Auth pages
│   │   │   ├── register/
│   │   │   └── teams/       # Team management
│   │   ├── components/      # React components
│   │   │   ├── KanbanBoard  # Main board with DnD
│   │   │   ├── Column       # Kanban column
│   │   │   ├── TaskCard     # Draggable task card
│   │   │   ├── TaskModal    # Create/edit task
│   │   │   ├── Navbar       # Top navigation
│   │   │   ├── NotificationPanel
│   │   │   └── ui/          # Reusable UI primitives
│   │   ├── hooks/           # useWebSocket, useGraphQL
│   │   ├── lib/             # GraphQL queries, utilities
│   │   └── store/           # Zustand store
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## GraphQL API Examples

### Register
```graphql
mutation {
  register(email: "you@example.com", username: "coolperson", password: "securepass123") {
    token
    user { id username avatarUrl }
  }
}
```

### Create Task
```graphql
mutation {
  createTask(input: {
    teamId: "...",
    columnId: "...",
    title: "Build awesome feature",
    priority: "high",
    tags: ["frontend", "urgent"]
  }) {
    id title priority columnId
  }
}
```

### Move Task (Drag-and-drop)
```graphql
mutation {
  moveTask(taskId: "...", columnId: "...", position: 2) {
    id columnId position
  }
}
```

---

## Real-time WebSocket Events

Connect to `ws://localhost:8080/ws?teamId=<your-team-id>` with a Bearer token header.

| Event type      | Triggered when                    |
|-----------------|-----------------------------------|
| `task_created`  | New task is created               |
| `task_updated`  | Task fields updated               |
| `task_moved`    | Task dragged to new column        |
| `task_deleted`  | Task deleted                      |
| `notification`  | Task assigned to a specific user  |

---

## Design System

- **Font**: Sora (Google Fonts)
- **Palette**: Soft pastels + vibrant accents
- **Components**: Rounded cards, bubble buttons, soft shadows
- **Animations**: Framer Motion — bounce, slide, fade, drag
- **Dark mode**: Full dark theme with cartoonish charm

---

## License

MIT
