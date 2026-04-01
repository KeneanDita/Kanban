import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
}

export interface Task {
  id: string;
  teamId: string;
  columnId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assigneeId?: string | null;
  assignee?: { id: string; username: string; avatarUrl: string } | null;
  creator?: { id: string; username: string; avatarUrl: string } | null;
  creatorId: string;
  deadline?: string | null;
  position: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  teamId: string;
  name: string;
  color: string;
  position: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: TeamMember[];
  columns: Column[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  taskId?: string | null;
  read: boolean;
  createdAt: string;
}

interface KanbanStore {
  // Auth
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;

  // Active Team
  activeTeamId: string | null;
  setActiveTeamId: (id: string) => void;

  // Teams
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  upsertTeam: (team: Team) => void;

  // Columns
  columns: Column[];
  setColumns: (cols: Column[]) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: string) => void;
  moveTaskLocally: (taskId: string, columnId: string, position: number) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;

  // UI
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterPriority: string | null;
  setFilterPriority: (p: string | null) => void;
}

export const useStore = create<KanbanStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () =>
        set({
          token: null,
          user: null,
          activeTeamId: null,
          teams: [],
          tasks: [],
          columns: [],
          notifications: [],
        }),

      activeTeamId: null,
      setActiveTeamId: (id) => set({ activeTeamId: id }),

      teams: [],
      setTeams: (teams) => set({ teams }),
      upsertTeam: (team) =>
        set((s) => ({
          teams: s.teams.some((t) => t.id === team.id)
            ? s.teams.map((t) => (t.id === team.id ? team : t))
            : [team, ...s.teams],
        })),

      columns: [],
      setColumns: (columns) => set({ columns }),

      tasks: [],
      setTasks: (tasks) => set({ tasks }),
      upsertTask: (task) =>
        set((s) => ({
          tasks: s.tasks.some((t) => t.id === task.id)
            ? s.tasks.map((t) => (t.id === task.id ? task : t))
            : [task, ...s.tasks],
        })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTaskLocally: (taskId, columnId, position) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, columnId, position } : t
          ),
        })),

      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, 50) })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),
      filterPriority: null,
      setFilterPriority: (p) => set({ filterPriority: p }),
    }),
    {
      name: "kanban-store",
      partialize: (s) => ({ token: s.token, user: s.user, activeTeamId: s.activeTeamId }),
    }
  )
);
