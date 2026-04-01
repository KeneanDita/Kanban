import { GraphQLClient } from "graphql-request";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/graphql";

export function getClient(token?: string) {
  return new GraphQLClient(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── Queries ──────────────────────────────────────────────────────────────────

export const GET_ME = `
  query Me {
    me {
      id email username avatarUrl createdAt
    }
  }
`;

export const GET_TEAMS = `
  query GetTeams {
    getTeams {
      id name description ownerId createdAt
    }
  }
`;

export const GET_TEAM = `
  query GetTeam($id: ID!) {
    getTeam(id: $id) {
      id name description ownerId createdAt
      members {
        id userId role joinedAt
        user { id username email avatarUrl }
      }
      columns {
        id name color position
      }
    }
  }
`;

export const GET_TASKS = `
  query GetTasks($teamId: ID!) {
    getTasks(teamId: $teamId) {
      id teamId columnId title description priority
      assigneeId deadline position tags createdAt updatedAt
      assignee { id username avatarUrl }
      creator { id username avatarUrl }
    }
  }
`;

export const GET_NOTIFICATIONS = `
  query GetNotifications {
    getNotifications {
      id type title message taskId read createdAt
    }
  }
`;

export const GET_TASK_ACTIVITIES = `
  query GetTaskActivities($taskId: ID!) {
    getTaskActivities(taskId: $taskId) {
      id action details createdAt
      user { id username avatarUrl }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

export const REGISTER = `
  mutation Register($email: String!, $username: String!, $password: String!) {
    register(email: $email, username: $username, password: $password) {
      token
      user { id email username avatarUrl }
    }
  }
`;

export const LOGIN = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email username avatarUrl }
    }
  }
`;

export const CREATE_TEAM = `
  mutation CreateTeam($name: String!, $description: String) {
    createTeam(name: $name, description: $description) {
      id name description ownerId createdAt
    }
  }
`;

export const CREATE_TASK = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id teamId columnId title description priority
      assigneeId deadline position tags createdAt updatedAt
      assignee { id username avatarUrl }
      creator { id username avatarUrl }
    }
  }
`;

export const UPDATE_TASK = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id teamId columnId title description priority
      assigneeId deadline position tags createdAt updatedAt
      assignee { id username avatarUrl }
    }
  }
`;

export const DELETE_TASK = `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const MOVE_TASK = `
  mutation MoveTask($taskId: ID!, $columnId: ID!, $position: Int!) {
    moveTask(taskId: $taskId, columnId: $columnId, position: $position) {
      id columnId position
    }
  }
`;

export const ASSIGN_TASK = `
  mutation AssignTask($taskId: ID!, $assigneeId: ID!) {
    assignTask(taskId: $taskId, assigneeId: $assigneeId) {
      id assigneeId
      assignee { id username avatarUrl }
    }
  }
`;

export const MARK_NOTIFICATION_READ = `
  mutation MarkRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_READ = `
  mutation MarkAllRead {
    markAllNotificationsRead
  }
`;

export const ADD_TEAM_MEMBER = `
  mutation AddTeamMember($teamId: ID!, $userId: ID!, $role: String) {
    addTeamMember(teamId: $teamId, userId: $userId, role: $role) {
      id userId role
      user { id username email avatarUrl }
    }
  }
`;

export const REMOVE_TEAM_MEMBER = `
  mutation RemoveTeamMember($teamId: ID!, $userId: ID!) {
    removeTeamMember(teamId: $teamId, userId: $userId)
  }
`;
