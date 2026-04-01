"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

export function useWebSocket(teamId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token, upsertTask, removeTask, addNotification, user } = useStore();

  const connect = useCallback(() => {
    if (!teamId || !token) return;

    const url = `${WS_URL}?teamId=${teamId}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    ws.current.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, token]);

  const handleMessage = useCallback(
    (msg: { type: string; payload: unknown }) => {
      switch (msg.type) {
        case "task_created": {
          const task = msg.payload as Parameters<typeof upsertTask>[0];
          upsertTask(task);
          if (task.creatorId !== user?.id) {
            toast.success(`New task: "${task.title}"`, {
              icon: "✨",
              style: { borderRadius: "16px", fontFamily: "Sora, sans-serif" },
            });
          }
          break;
        }
        case "task_updated":
        case "task_moved": {
          const task = msg.payload as Parameters<typeof upsertTask>[0];
          upsertTask(task);
          break;
        }
        case "task_deleted": {
          const { id } = msg.payload as { id: string };
          removeTask(id);
          break;
        }
        case "notification": {
          const n = msg.payload as { userId: string; message: string };
          if (n.userId === user?.id) {
            addNotification({
              id: Date.now().toString(),
              type: "info",
              title: "Notification",
              message: n.message,
              read: false,
              createdAt: new Date().toISOString(),
            });
            toast(n.message, {
              icon: "🔔",
              style: { borderRadius: "16px", fontFamily: "Sora, sans-serif" },
            });
          }
          break;
        }
      }
    },
    [upsertTask, removeTask, addNotification, user?.id]
  );

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return ws;
}
