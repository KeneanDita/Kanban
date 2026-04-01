package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	ID     string
	TeamID string
	UserID string
	conn   *websocket.Conn
	send   chan []byte
	hub    *Hub
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool // teamID -> clients
	broadcast chan *BroadcastMessage
}

type BroadcastMessage struct {
	TeamID  string
	Message []byte
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	h := &Hub{
		clients:   make(map[string]map[*Client]bool),
		broadcast: make(chan *BroadcastMessage, 256),
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for msg := range h.broadcast {
		h.mu.RLock()
		clients := h.clients[msg.TeamID]
		h.mu.RUnlock()

		for client := range clients {
			select {
			case client.send <- msg.Message:
			default:
				h.removeClient(client)
			}
		}
	}
}

func (h *Hub) register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[client.TeamID] == nil {
		h.clients[client.TeamID] = make(map[*Client]bool)
	}
	h.clients[client.TeamID][client] = true
	log.Printf("WS client connected: user=%s team=%s", client.UserID, client.TeamID)
}

func (h *Hub) removeClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clients, ok := h.clients[client.TeamID]; ok {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			close(client.send)
			log.Printf("WS client disconnected: user=%s team=%s", client.UserID, client.TeamID)
		}
	}
}

func (h *Hub) Broadcast(teamID string, msgType string, payload interface{}) {
	data, err := json.Marshal(models.WSMessage{
		Type:    msgType,
		Payload: payload,
		TeamID:  teamID,
	})
	if err != nil {
		log.Printf("broadcast marshal error: %v", err)
		return
	}
	h.broadcast <- &BroadcastMessage{TeamID: teamID, Message: data}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.removeClient(c)
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func ServeWS(w http.ResponseWriter, r *http.Request) {
	teamID := r.URL.Query().Get("teamId")
	if teamID == "" {
		http.Error(w, "teamId required", http.StatusBadRequest)
		return
	}

	authUser := middleware.GetUserFromContext(r.Context())
	userID := "anonymous"
	if authUser != nil {
		userID = authUser.ID
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}

	client := &Client{
		TeamID: teamID,
		UserID: userID,
		conn:   conn,
		send:   make(chan []byte, 256),
		hub:    GlobalHub,
	}

	GlobalHub.register(client)
	go client.writePump()
	go client.readPump()
}
