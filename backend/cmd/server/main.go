package main

import (
	"log"
	"net/http"
	"os"

	"kanban-backend/internal/db"
	"kanban-backend/internal/handlers"
	"kanban-backend/internal/middleware"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	db.Connect()

	schema := graphql.MustParseSchema(handlers.Schema, &handlers.Resolver{},
		graphql.UseFieldResolvers())

	r := mux.NewRouter()

	r.Use(middleware.LoggingMiddleware)
	r.Use(middleware.AuthMiddleware)

	r.Handle("/graphql", &relay.Handler{Schema: schema}).Methods("POST", "GET", "OPTIONS")
	r.HandleFunc("/ws", handlers.ServeWS)
	r.HandleFunc("/health", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler.Handler(r)))
}
