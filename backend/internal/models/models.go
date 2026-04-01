package models

import (
	"time"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	AvatarURL    string    `json:"avatarUrl" db:"avatar_url"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

type Team struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	OwnerID     string    `json:"ownerId" db:"owner_id"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

type TeamMember struct {
	ID       string    `json:"id" db:"id"`
	TeamID   string    `json:"teamId" db:"team_id"`
	UserID   string    `json:"userId" db:"user_id"`
	Role     string    `json:"role" db:"role"` // admin | member
	JoinedAt time.Time `json:"joinedAt" db:"joined_at"`
}

type Column struct {
	ID        string    `json:"id" db:"id"`
	TeamID    string    `json:"teamId" db:"team_id"`
	Name      string    `json:"name" db:"name"`
	Color     string    `json:"color" db:"color"`
	Position  int       `json:"position" db:"position"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type Task struct {
	ID          string     `json:"id" db:"id"`
	TeamID      string     `json:"teamId" db:"team_id"`
	ColumnID    string     `json:"columnId" db:"column_id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description" db:"description"`
	Priority    string     `json:"priority" db:"priority"` // low | medium | high
	AssigneeID  *string    `json:"assigneeId" db:"assignee_id"`
	CreatorID   string     `json:"creatorId" db:"creator_id"`
	Deadline    *time.Time `json:"deadline" db:"deadline"`
	Position    int        `json:"position" db:"position"`
	Tags        []string   `json:"tags" db:"tags"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
}

type TaskActivity struct {
	ID        string    `json:"id" db:"id"`
	TaskID    string    `json:"taskId" db:"task_id"`
	UserID    string    `json:"userId" db:"user_id"`
	Action    string    `json:"action" db:"action"`
	Details   string    `json:"details" db:"details"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type Notification struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"userId" db:"user_id"`
	Type      string    `json:"type" db:"type"` // task_assigned | task_updated | task_moved
	Title     string    `json:"title" db:"title"`
	Message   string    `json:"message" db:"message"`
	TaskID    *string   `json:"taskId" db:"task_id"`
	Read      bool      `json:"read" db:"read"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type AuthPayload struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
	TeamID  string      `json:"teamId"`
}
