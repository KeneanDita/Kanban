package middleware

import (
	"context"
	"net/http"
	"strings"

	"kanban-backend/internal/services"
)

type contextKey string

const UserContextKey contextKey = "user"

type AuthUser struct {
	ID       string
	Email    string
	Username string
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			next.ServeHTTP(w, r)
			return
		}

		claims, err := services.ValidateToken(parts[1])
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		user := &AuthUser{
			ID:       claims.UserID,
			Email:    claims.Email,
			Username: claims.Username,
		}

		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserFromContext(ctx context.Context) *AuthUser {
	user, _ := ctx.Value(UserContextKey).(*AuthUser)
	return user
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
