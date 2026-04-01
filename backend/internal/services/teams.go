package services

import (
	"fmt"

	"kanban-backend/internal/db"
	"kanban-backend/internal/models"

	"github.com/google/uuid"
)

func CreateTeam(name, description, ownerID string) (*models.Team, error) {
	teamID := uuid.New().String()
	team := &models.Team{}

	tx, err := db.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	err = tx.QueryRow(`
		INSERT INTO teams (id, name, description, owner_id)
		VALUES ($1,$2,$3,$4)
		RETURNING id, name, description, owner_id, created_at, updated_at`,
		teamID, name, description, ownerID,
	).Scan(&team.ID, &team.Name, &team.Description, &team.OwnerID, &team.CreatedAt, &team.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create team: %w", err)
	}

	memberID := uuid.New().String()
	_, err = tx.Exec(`INSERT INTO team_members (id, team_id, user_id, role) VALUES ($1,$2,$3,'admin')`,
		memberID, teamID, ownerID)
	if err != nil {
		return nil, fmt.Errorf("add owner as member: %w", err)
	}

	cols := []struct{ name, color string }{
		{"Todo", "#A78BFA"},
		{"In Progress", "#60A5FA"},
		{"Done", "#34D399"},
	}
	for i, col := range cols {
		colID := uuid.New().String()
		_, err = tx.Exec(`INSERT INTO columns (id, team_id, name, color, position) VALUES ($1,$2,$3,$4,$5)`,
			colID, teamID, col.name, col.color, i+1)
		if err != nil {
			return nil, fmt.Errorf("create column: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return team, nil
}

func GetTeamsByUser(userID string) ([]*models.Team, error) {
	rows, err := db.DB.Query(`
		SELECT t.id, t.name, t.description, t.owner_id, t.created_at, t.updated_at
		FROM teams t
		JOIN team_members tm ON t.id = tm.team_id
		WHERE tm.user_id = $1
		ORDER BY t.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []*models.Team
	for rows.Next() {
		t := &models.Team{}
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.OwnerID, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		teams = append(teams, t)
	}
	return teams, nil
}

func GetTeamByID(id string) (*models.Team, error) {
	t := &models.Team{}
	err := db.DB.QueryRow(`
		SELECT id, name, description, owner_id, created_at, updated_at
		FROM teams WHERE id=$1`, id,
	).Scan(&t.ID, &t.Name, &t.Description, &t.OwnerID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func GetTeamMembers(teamID string) ([]*models.TeamMember, error) {
	rows, err := db.DB.Query(`
		SELECT id, team_id, user_id, role, joined_at
		FROM team_members WHERE team_id=$1`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []*models.TeamMember
	for rows.Next() {
		m := &models.TeamMember{}
		if err := rows.Scan(&m.ID, &m.TeamID, &m.UserID, &m.Role, &m.JoinedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func AddTeamMember(teamID, userID, role string) (*models.TeamMember, error) {
	id := uuid.New().String()
	m := &models.TeamMember{}
	err := db.DB.QueryRow(`
		INSERT INTO team_members (id, team_id, user_id, role)
		VALUES ($1,$2,$3,$4)
		ON CONFLICT (team_id, user_id) DO UPDATE SET role=$4
		RETURNING id, team_id, user_id, role, joined_at`,
		id, teamID, userID, role,
	).Scan(&m.ID, &m.TeamID, &m.UserID, &m.Role, &m.JoinedAt)
	if err != nil {
		return nil, fmt.Errorf("add member: %w", err)
	}
	return m, nil
}

func RemoveTeamMember(teamID, userID string) (bool, error) {
	res, err := db.DB.Exec(`DELETE FROM team_members WHERE team_id=$1 AND user_id=$2`, teamID, userID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func GetColumnsByTeam(teamID string) ([]*models.Column, error) {
	rows, err := db.DB.Query(`
		SELECT id, team_id, name, color, position, created_at, updated_at
		FROM columns WHERE team_id=$1 ORDER BY position ASC`, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cols []*models.Column
	for rows.Next() {
		c := &models.Column{}
		if err := rows.Scan(&c.ID, &c.TeamID, &c.Name, &c.Color, &c.Position, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		cols = append(cols, c)
	}
	return cols, nil
}

func GetUserRole(teamID, userID string) (string, error) {
	var role string
	err := db.DB.QueryRow(`SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2`, teamID, userID).Scan(&role)
	if err != nil {
		return "", err
	}
	return role, nil
}
