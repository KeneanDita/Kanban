package services

import (
	"kanban-backend/internal/db"
	"kanban-backend/internal/models"

	"github.com/google/uuid"
)

func CreateNotification(userID, notifType, title, message string, taskID *string) (*models.Notification, error) {
	id := uuid.New().String()
	n := &models.Notification{}
	err := db.DB.QueryRow(`
		INSERT INTO notifications (id, user_id, type, title, message, task_id)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, user_id, type, title, message, task_id, read, created_at`,
		id, userID, notifType, title, message, taskID,
	).Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.TaskID, &n.Read, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	return n, nil
}

func GetNotifications(userID string) ([]*models.Notification, error) {
	rows, err := db.DB.Query(`
		SELECT id, user_id, type, title, message, task_id, read, created_at
		FROM notifications WHERE user_id=$1
		ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifs []*models.Notification
	for rows.Next() {
		n := &models.Notification{}
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.TaskID, &n.Read, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifs = append(notifs, n)
	}
	return notifs, nil
}

func MarkNotificationRead(id, userID string) (bool, error) {
	res, err := db.DB.Exec(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func MarkAllNotificationsRead(userID string) (bool, error) {
	_, err := db.DB.Exec(`UPDATE notifications SET read=true WHERE user_id=$1`, userID)
	return err == nil, err
}
