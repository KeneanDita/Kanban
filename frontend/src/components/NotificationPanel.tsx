"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGraphQL } from "@/hooks/useGraphQL";
import { MARK_ALL_READ, MARK_NOTIFICATION_READ } from "@/lib/graphql";
import { formatRelativeTime } from "@/lib/utils";

const TYPE_ICON: Record<string, string> = {
  task_assigned: "👋",
  task_updated: "✏️",
  task_moved: "↕️",
  info: "💬",
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, markRead, markAllRead } = useStore();
  const { mutate } = useGraphQL();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleMarkAll() {
    markAllRead();
    try {
      await mutate(MARK_ALL_READ);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleMarkOne(id: string) {
    markRead(id);
    try {
      await mutate(MARK_NOTIFICATION_READ, { id });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="notification-dot"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-pastel-purple to-pastel-blue">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-600" />
                <span className="font-bold text-gray-800 text-sm">Notifications</span>
                {unread > 0 && (
                  <span className="px-2 py-0.5 bg-brand-purple text-white rounded-full text-[11px] font-bold">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> All read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto kanban-scroll">
              <AnimatePresence>
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-gray-400"
                  >
                    <span className="text-4xl mb-2">🔕</span>
                    <p className="text-sm font-medium">All quiet here!</p>
                  </motion.div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors ${
                        n.read
                          ? "opacity-60"
                          : "bg-pastel-purple/30 dark:bg-slate-700/30"
                      }`}
                    >
                      <div className="text-xl flex-shrink-0 mt-0.5">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkOne(n.id)}
                          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-violet-400" />
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
