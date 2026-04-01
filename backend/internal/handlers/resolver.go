package handlers

import (
	"context"
	"errors"
	"fmt"
	"time"

	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"
	"kanban-backend/internal/services"
)

type Resolver struct{}

// ── Query Resolvers ──────────────────────────────────────────────────────────

func (r *Resolver) Me(ctx context.Context) (*UserResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	user, err := services.GetUserByID(u.ID)
	if err != nil {
		return nil, err
	}
	return &UserResolver{user}, nil
}

func (r *Resolver) GetUsers(ctx context.Context, args struct{ TeamID string }) ([]*UserResolver, error) {
	members, err := services.GetTeamMembers(args.TeamID)
	if err != nil {
		return nil, err
	}
	var users []*UserResolver
	for _, m := range members {
		u, err := services.GetUserByID(m.UserID)
		if err != nil {
			continue
		}
		users = append(users, &UserResolver{u})
	}
	return users, nil
}

func (r *Resolver) GetTeams(ctx context.Context) ([]*TeamResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	teams, err := services.GetTeamsByUser(u.ID)
	if err != nil {
		return nil, err
	}
	var res []*TeamResolver
	for _, t := range teams {
		res = append(res, &TeamResolver{t})
	}
	return res, nil
}

func (r *Resolver) GetTeam(ctx context.Context, args struct{ ID string }) (*TeamResolver, error) {
	team, err := services.GetTeamByID(args.ID)
	if err != nil {
		return nil, err
	}
	return &TeamResolver{team}, nil
}

func (r *Resolver) GetColumns(ctx context.Context, args struct{ TeamID string }) ([]*ColumnResolver, error) {
	cols, err := services.GetColumnsByTeam(args.TeamID)
	if err != nil {
		return nil, err
	}
	var res []*ColumnResolver
	for _, c := range cols {
		res = append(res, &ColumnResolver{c})
	}
	return res, nil
}

func (r *Resolver) GetTasks(ctx context.Context, args struct{ TeamID string }) ([]*TaskResolver, error) {
	tasks, err := services.GetTasksByTeam(args.TeamID)
	if err != nil {
		return nil, err
	}
	var res []*TaskResolver
	for _, t := range tasks {
		res = append(res, &TaskResolver{t})
	}
	return res, nil
}

func (r *Resolver) GetTask(ctx context.Context, args struct{ ID string }) (*TaskResolver, error) {
	task, err := services.GetTaskByID(args.ID)
	if err != nil {
		return nil, err
	}
	return &TaskResolver{task}, nil
}

func (r *Resolver) GetNotifications(ctx context.Context) ([]*NotificationResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	notifs, err := services.GetNotifications(u.ID)
	if err != nil {
		return nil, err
	}
	var res []*NotificationResolver
	for _, n := range notifs {
		res = append(res, &NotificationResolver{n})
	}
	return res, nil
}

func (r *Resolver) GetTaskActivities(ctx context.Context, args struct{ TaskID string }) ([]*TaskActivityResolver, error) {
	activities, err := services.GetTaskActivities(args.TaskID)
	if err != nil {
		return nil, err
	}
	var res []*TaskActivityResolver
	for _, a := range activities {
		res = append(res, &TaskActivityResolver{a})
	}
	return res, nil
}

// ── Mutation Resolvers ───────────────────────────────────────────────────────

func (r *Resolver) Register(ctx context.Context, args struct {
	Email    string
	Username string
	Password string
}) (*AuthPayloadResolver, error) {
	payload, err := services.Register(args.Email, args.Username, args.Password)
	if err != nil {
		return nil, err
	}
	return &AuthPayloadResolver{payload}, nil
}

func (r *Resolver) Login(ctx context.Context, args struct {
	Email    string
	Password string
}) (*AuthPayloadResolver, error) {
	payload, err := services.Login(args.Email, args.Password)
	if err != nil {
		return nil, err
	}
	return &AuthPayloadResolver{payload}, nil
}

func (r *Resolver) CreateTeam(ctx context.Context, args struct {
	Name        string
	Description *string
}) (*TeamResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	desc := ""
	if args.Description != nil {
		desc = *args.Description
	}
	team, err := services.CreateTeam(args.Name, desc, u.ID)
	if err != nil {
		return nil, err
	}
	return &TeamResolver{team}, nil
}

func (r *Resolver) AddTeamMember(ctx context.Context, args struct {
	TeamID string
	UserID string
	Role   *string
}) (*TeamMemberResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	role := "member"
	if args.Role != nil {
		role = *args.Role
	}
	m, err := services.AddTeamMember(args.TeamID, args.UserID, role)
	if err != nil {
		return nil, err
	}
	return &TeamMemberResolver{m}, nil
}

func (r *Resolver) RemoveTeamMember(ctx context.Context, args struct {
	TeamID string
	UserID string
}) (bool, error) {
	return services.RemoveTeamMember(args.TeamID, args.UserID)
}

type CreateTaskArgs struct {
	Input struct {
		TeamID      string
		ColumnID    string
		Title       string
		Description *string
		Priority    *string
		AssigneeID  *string
		Deadline    *string
		Tags        *[]string
	}
}

func (r *Resolver) CreateTask(ctx context.Context, args CreateTaskArgs) (*TaskResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}

	input := services.CreateTaskInput{
		TeamID:    args.Input.TeamID,
		ColumnID:  args.Input.ColumnID,
		Title:     args.Input.Title,
		CreatorID: u.ID,
	}
	if args.Input.Description != nil {
		input.Description = *args.Input.Description
	}
	if args.Input.Priority != nil {
		input.Priority = *args.Input.Priority
	}
	if args.Input.AssigneeID != nil {
		input.AssigneeID = args.Input.AssigneeID
	}
	if args.Input.Deadline != nil {
		t, err := time.Parse(time.RFC3339, *args.Input.Deadline)
		if err == nil {
			input.Deadline = &t
		}
	}
	if args.Input.Tags != nil {
		input.Tags = *args.Input.Tags
	}

	task, err := services.CreateTask(input)
	if err != nil {
		return nil, err
	}

	services.LogActivity(task.ID, u.ID, "created", fmt.Sprintf("Task '%s' created", task.Title))
	GlobalHub.Broadcast(task.TeamID, "task_created", task)

	if task.AssigneeID != nil && *task.AssigneeID != u.ID {
		services.CreateNotification(*task.AssigneeID, "task_assigned",
			"Task Assigned", fmt.Sprintf("You were assigned '%s'", task.Title), &task.ID)
		GlobalHub.Broadcast(task.TeamID, "notification", map[string]string{
			"userId": *task.AssigneeID, "message": fmt.Sprintf("Task '%s' assigned to you", task.Title),
		})
	}

	return &TaskResolver{task}, nil
}

type UpdateTaskArgs struct {
	Input struct {
		ID          string
		Title       *string
		Description *string
		Priority    *string
		AssigneeID  *string
		Deadline    *string
		Tags        *[]string
	}
}

func (r *Resolver) UpdateTask(ctx context.Context, args UpdateTaskArgs) (*TaskResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}

	input := services.UpdateTaskInput{ID: args.Input.ID}
	if args.Input.Title != nil {
		input.Title = args.Input.Title
	}
	if args.Input.Description != nil {
		input.Description = args.Input.Description
	}
	if args.Input.Priority != nil {
		input.Priority = args.Input.Priority
	}
	if args.Input.AssigneeID != nil {
		input.AssigneeID = args.Input.AssigneeID
	}
	if args.Input.Deadline != nil {
		t, err := time.Parse(time.RFC3339, *args.Input.Deadline)
		if err == nil {
			input.Deadline = &t
		}
	}
	if args.Input.Tags != nil {
		input.Tags = *args.Input.Tags
	}

	task, err := services.UpdateTask(input)
	if err != nil {
		return nil, err
	}

	services.LogActivity(task.ID, u.ID, "updated", "Task updated")
	GlobalHub.Broadcast(task.TeamID, "task_updated", task)

	return &TaskResolver{task}, nil
}

func (r *Resolver) DeleteTask(ctx context.Context, args struct{ ID string }) (bool, error) {
	task, err := services.GetTaskByID(args.ID)
	if err != nil {
		return false, err
	}
	ok, err := services.DeleteTask(args.ID)
	if ok {
		GlobalHub.Broadcast(task.TeamID, "task_deleted", map[string]string{"id": args.ID})
	}
	return ok, err
}

func (r *Resolver) MoveTask(ctx context.Context, args struct {
	TaskID   string
	ColumnID string
	Position int32
}) (*TaskResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	task, err := services.MoveTask(args.TaskID, args.ColumnID, int(args.Position))
	if err != nil {
		return nil, err
	}
	services.LogActivity(task.ID, u.ID, "moved", fmt.Sprintf("Task moved to column %s", args.ColumnID))
	GlobalHub.Broadcast(task.TeamID, "task_moved", task)
	return &TaskResolver{task}, nil
}

func (r *Resolver) AssignTask(ctx context.Context, args struct {
	TaskID     string
	AssigneeID string
}) (*TaskResolver, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return nil, errors.New("not authenticated")
	}
	task, err := services.AssignTask(args.TaskID, args.AssigneeID)
	if err != nil {
		return nil, err
	}
	services.LogActivity(task.ID, u.ID, "assigned", fmt.Sprintf("Task assigned to user %s", args.AssigneeID))
	GlobalHub.Broadcast(task.TeamID, "task_updated", task)
	services.CreateNotification(args.AssigneeID, "task_assigned",
		"Task Assigned", fmt.Sprintf("You were assigned '%s'", task.Title), &task.ID)
	return &TaskResolver{task}, nil
}

func (r *Resolver) MarkNotificationRead(ctx context.Context, args struct{ ID string }) (bool, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return false, errors.New("not authenticated")
	}
	return services.MarkNotificationRead(args.ID, u.ID)
}

func (r *Resolver) MarkAllNotificationsRead(ctx context.Context) (bool, error) {
	u := middleware.GetUserFromContext(ctx)
	if u == nil {
		return false, errors.New("not authenticated")
	}
	return services.MarkAllNotificationsRead(u.ID)
}

// ── Type Resolvers ────────────────────────────────────────────────────────────

type UserResolver struct{ u *models.User }

func (r *UserResolver) ID() string        { return r.u.ID }
func (r *UserResolver) Email() string     { return r.u.Email }
func (r *UserResolver) Username() string  { return r.u.Username }
func (r *UserResolver) AvatarUrl() string { return r.u.AvatarURL }
func (r *UserResolver) CreatedAt() string { return r.u.CreatedAt.Format(time.RFC3339) }

type TeamResolver struct{ t *models.Team }

func (r *TeamResolver) ID() string          { return r.t.ID }
func (r *TeamResolver) Name() string        { return r.t.Name }
func (r *TeamResolver) Description() string { return r.t.Description }
func (r *TeamResolver) OwnerID() string     { return r.t.OwnerID }
func (r *TeamResolver) CreatedAt() string   { return r.t.CreatedAt.Format(time.RFC3339) }
func (r *TeamResolver) Members() ([]*TeamMemberResolver, error) {
	members, err := services.GetTeamMembers(r.t.ID)
	if err != nil {
		return nil, err
	}
	var res []*TeamMemberResolver
	for _, m := range members {
		res = append(res, &TeamMemberResolver{m})
	}
	return res, nil
}
func (r *TeamResolver) Columns() ([]*ColumnResolver, error) {
	cols, err := services.GetColumnsByTeam(r.t.ID)
	if err != nil {
		return nil, err
	}
	var res []*ColumnResolver
	for _, c := range cols {
		res = append(res, &ColumnResolver{c})
	}
	return res, nil
}

type TeamMemberResolver struct{ m *models.TeamMember }

func (r *TeamMemberResolver) ID() string       { return r.m.ID }
func (r *TeamMemberResolver) TeamID() string   { return r.m.TeamID }
func (r *TeamMemberResolver) UserID() string   { return r.m.UserID }
func (r *TeamMemberResolver) Role() string     { return r.m.Role }
func (r *TeamMemberResolver) JoinedAt() string { return r.m.JoinedAt.Format(time.RFC3339) }
func (r *TeamMemberResolver) User() (*UserResolver, error) {
	u, err := services.GetUserByID(r.m.UserID)
	if err != nil {
		return nil, err
	}
	return &UserResolver{u}, nil
}

type ColumnResolver struct{ c *models.Column }

func (r *ColumnResolver) ID() string       { return r.c.ID }
func (r *ColumnResolver) TeamID() string   { return r.c.TeamID }
func (r *ColumnResolver) Name() string     { return r.c.Name }
func (r *ColumnResolver) Color() string    { return r.c.Color }
func (r *ColumnResolver) Position() int32  { return int32(r.c.Position) }
func (r *ColumnResolver) Tasks() ([]*TaskResolver, error) {
	tasks, err := services.GetTasksByTeam(r.c.TeamID)
	if err != nil {
		return nil, err
	}
	var res []*TaskResolver
	for _, t := range tasks {
		if t.ColumnID == r.c.ID {
			res = append(res, &TaskResolver{t})
		}
	}
	return res, nil
}

type TaskResolver struct{ t *models.Task }

func (r *TaskResolver) ID() string          { return r.t.ID }
func (r *TaskResolver) TeamID() string      { return r.t.TeamID }
func (r *TaskResolver) ColumnID() string    { return r.t.ColumnID }
func (r *TaskResolver) Title() string       { return r.t.Title }
func (r *TaskResolver) Description() string { return r.t.Description }
func (r *TaskResolver) Priority() string    { return r.t.Priority }
func (r *TaskResolver) CreatorID() string   { return r.t.CreatorID }
func (r *TaskResolver) Position() int32     { return int32(r.t.Position) }
func (r *TaskResolver) Tags() []string {
	if r.t.Tags == nil {
		return []string{}
	}
	return r.t.Tags
}
func (r *TaskResolver) CreatedAt() string { return r.t.CreatedAt.Format(time.RFC3339) }
func (r *TaskResolver) UpdatedAt() string { return r.t.UpdatedAt.Format(time.RFC3339) }
func (r *TaskResolver) AssigneeID() *string { return r.t.AssigneeID }
func (r *TaskResolver) Deadline() *string {
	if r.t.Deadline == nil {
		return nil
	}
	s := r.t.Deadline.Format(time.RFC3339)
	return &s
}
func (r *TaskResolver) Assignee() (*UserResolver, error) {
	if r.t.AssigneeID == nil {
		return nil, nil
	}
	u, err := services.GetUserByID(*r.t.AssigneeID)
	if err != nil {
		return nil, nil
	}
	return &UserResolver{u}, nil
}
func (r *TaskResolver) Creator() (*UserResolver, error) {
	u, err := services.GetUserByID(r.t.CreatorID)
	if err != nil {
		return nil, nil
	}
	return &UserResolver{u}, nil
}

type NotificationResolver struct{ n *models.Notification }

func (r *NotificationResolver) ID() string      { return r.n.ID }
func (r *NotificationResolver) UserID() string  { return r.n.UserID }
func (r *NotificationResolver) Type() string    { return r.n.Type }
func (r *NotificationResolver) Title() string   { return r.n.Title }
func (r *NotificationResolver) Message() string { return r.n.Message }
func (r *NotificationResolver) Read() bool      { return r.n.Read }
func (r *NotificationResolver) CreatedAt() string { return r.n.CreatedAt.Format(time.RFC3339) }
func (r *NotificationResolver) TaskID() *string { return r.n.TaskID }

type TaskActivityResolver struct{ a *models.TaskActivity }

func (r *TaskActivityResolver) ID() string      { return r.a.ID }
func (r *TaskActivityResolver) TaskID() string  { return r.a.TaskID }
func (r *TaskActivityResolver) UserID() string  { return r.a.UserID }
func (r *TaskActivityResolver) Action() string  { return r.a.Action }
func (r *TaskActivityResolver) Details() string { return r.a.Details }
func (r *TaskActivityResolver) CreatedAt() string { return r.a.CreatedAt.Format(time.RFC3339) }
func (r *TaskActivityResolver) User() (*UserResolver, error) {
	u, err := services.GetUserByID(r.a.UserID)
	if err != nil {
		return nil, nil
	}
	return &UserResolver{u}, nil
}

type AuthPayloadResolver struct{ p *models.AuthPayload }

func (r *AuthPayloadResolver) Token() string        { return r.p.Token }
func (r *AuthPayloadResolver) User() *UserResolver  { return &UserResolver{r.p.User} }
