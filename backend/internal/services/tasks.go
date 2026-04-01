package services

import (
	"fmt"
	"strings"
	"time"

	"kanban-backend/internal/db"
	"kanban-backend/internal/models"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

func GetTasksByTeam(teamID string) ([]*models.Task, error) {
	rows, err := db.DB.Query(`
		SELECT id, team_id, column_id, title, description, priority,
		       assignee_id, creator_id, deadline, position, tags, created_at, updated_at
		FROM tasks WHERE team_id = $1 ORDER BY position ASC`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		t := &models.Task{}
		if err := rows.Scan(
			&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
			&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func GetTaskByID(id string) (*models.Task, error) {
	t := &models.Task{}
	err := db.DB.QueryRow(`
		SELECT id, team_id, column_id, title, description, priority,
		       assignee_id, creator_id, deadline, position, tags, created_at, updated_at
		FROM tasks WHERE id = $1`, id,
	).Scan(&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
		&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

type CreateTaskInput struct {
	TeamID      string
	ColumnID    string
	Title       string
	Description string
	Priority    string
	AssigneeID  *string
	CreatorID   string
	Deadline    *time.Time
	Tags        []string
}

func CreateTask(input CreateTaskInput) (*models.Task, error) {
	if input.Tags == nil {
		input.Tags = []string{}
	}
	if input.Priority == "" {
		input.Priority = "medium"
	}

	var maxPos int
	db.DB.QueryRow(`SELECT COALESCE(MAX(position), 0) FROM tasks WHERE column_id = $1`, input.ColumnID).Scan(&maxPos)

	id := uuid.New().String()
	t := &models.Task{}
	err := db.DB.QueryRow(`
		INSERT INTO tasks (id, team_id, column_id, title, description, priority, assignee_id, creator_id, deadline, position, tags)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, team_id, column_id, title, description, priority,
		          assignee_id, creator_id, deadline, position, tags, created_at, updated_at`,
		id, input.TeamID, input.ColumnID, input.Title, input.Description, input.Priority,
		input.AssigneeID, input.CreatorID, input.Deadline, maxPos+1, pq.Array(input.Tags),
	).Scan(&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
		&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return t, nil
}

type UpdateTaskInput struct {
	ID          string
	Title       *string
	Description *string
	Priority    *string
	AssigneeID  *string
	Deadline    *time.Time
	Tags        []string
}

func UpdateTask(input UpdateTaskInput) (*models.Task, error) {
	sets := []string{}
	args := []interface{}{}
	i := 1

	if input.Title != nil {
		sets = append(sets, fmt.Sprintf("title=$%d", i)); args = append(args, *input.Title); i++
	}
	if input.Description != nil {
		sets = append(sets, fmt.Sprintf("description=$%d", i)); args = append(args, *input.Description); i++
	}
	if input.Priority != nil {
		sets = append(sets, fmt.Sprintf("priority=$%d", i)); args = append(args, *input.Priority); i++
	}
	if input.AssigneeID != nil {
		sets = append(sets, fmt.Sprintf("assignee_id=$%d", i)); args = append(args, *input.AssigneeID); i++
	}
	if input.Deadline != nil {
		sets = append(sets, fmt.Sprintf("deadline=$%d", i)); args = append(args, *input.Deadline); i++
	}
	if input.Tags != nil {
		sets = append(sets, fmt.Sprintf("tags=$%d", i)); args = append(args, pq.Array(input.Tags)); i++
	}

	if len(sets) == 0 {
		return GetTaskByID(input.ID)
	}

	sets = append(sets, "updated_at=NOW()")
	args = append(args, input.ID)

	query := fmt.Sprintf(`
		UPDATE tasks SET %s WHERE id=$%d
		RETURNING id, team_id, column_id, title, description, priority,
		          assignee_id, creator_id, deadline, position, tags, created_at, updated_at`,
		strings.Join(sets, ", "), i)

	t := &models.Task{}
	err := db.DB.QueryRow(query, args...).Scan(
		&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
		&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return t, nil
}

func MoveTask(taskID, columnID string, position int) (*models.Task, error) {
	t := &models.Task{}
	err := db.DB.QueryRow(`
		UPDATE tasks SET column_id=$1, position=$2, updated_at=NOW()
		WHERE id=$3
		RETURNING id, team_id, column_id, title, description, priority,
		          assignee_id, creator_id, deadline, position, tags, created_at, updated_at`,
		columnID, position, taskID,
	).Scan(&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
		&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("move task: %w", err)
	}
	return t, nil
}

func AssignTask(taskID, assigneeID string) (*models.Task, error) {
	t := &models.Task{}
	err := db.DB.QueryRow(`
		UPDATE tasks SET assignee_id=$1, updated_at=NOW()
		WHERE id=$2
		RETURNING id, team_id, column_id, title, description, priority,
		          assignee_id, creator_id, deadline, position, tags, created_at, updated_at`,
		assigneeID, taskID,
	).Scan(&t.ID, &t.TeamID, &t.ColumnID, &t.Title, &t.Description, &t.Priority,
		&t.AssigneeID, &t.CreatorID, &t.Deadline, &t.Position, pq.Array(&t.Tags),
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("assign task: %w", err)
	}
	return t, nil
}

func DeleteTask(id string) (bool, error) {
	res, err := db.DB.Exec(`DELETE FROM tasks WHERE id=$1`, id)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func LogActivity(taskID, userID, action, details string) {
	id := uuid.New().String()
	db.DB.Exec(`INSERT INTO task_activities (id, task_id, user_id, action, details) VALUES ($1,$2,$3,$4,$5)`,
		id, taskID, userID, action, details)
}

func GetTaskActivities(taskID string) ([]*models.TaskActivity, error) {
	rows, err := db.DB.Query(`
		SELECT id, task_id, user_id, action, details, created_at
		FROM task_activities WHERE task_id=$1 ORDER BY created_at DESC LIMIT 50`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []*models.TaskActivity
	for rows.Next() {
		a := &models.TaskActivity{}
		if err := rows.Scan(&a.ID, &a.TaskID, &a.UserID, &a.Action, &a.Details, &a.CreatedAt); err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}
	return activities, nil
}
