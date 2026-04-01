package services

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"

	"kanban-backend/internal/db"
	"kanban-backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func Register(email, username, password string) (*models.AuthPayload, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	id := uuid.New().String()
	user := &models.User{}

	err = db.DB.QueryRow(`
		INSERT INTO users (id, email, username, password_hash, avatar_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, username, avatar_url, created_at, updated_at`,
		id, email, username, string(hash),
		fmt.Sprintf("https://api.dicebear.com/7.x/adventurer/svg?seed=%s", username),
	).Scan(&user.ID, &user.Email, &user.Username, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthPayload{Token: token, User: user}, nil
}

func Login(email, password string) (*models.AuthPayload, error) {
	user := &models.User{}
	err := db.DB.QueryRow(`
		SELECT id, email, username, password_hash, avatar_url, created_at, updated_at
		FROM users WHERE email = $1`, email,
	).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid credentials")
	}
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthPayload{Token: token, User: user}, nil
}

func ValidateToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(jwtSecret()), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	err := db.DB.QueryRow(`
		SELECT id, email, username, avatar_url, created_at, updated_at
		FROM users WHERE id = $1`, id,
	).Scan(&user.ID, &user.Email, &user.Username, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func generateToken(user *models.User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Email:    user.Email,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret()))
}

func jwtSecret() string {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return s
	}
	return "super-secret-dev-key-change-in-production"
}
