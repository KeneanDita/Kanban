"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Calendar,
  Tag,
  Flag,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Task } from "@/store/useStore";
import { UserAvatar } from "./ui/UserAvatar";
import { PRIORITY_CONFIG, formatDate, isOverdue, cn } from "@/lib/utils";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const overdue = isOverdue(task.deadline);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "task-card group",
        isDragging && "task-card-dragging"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={priorityCfg.className}>
          <Flag className="w-3 h-3" />
          {priorityCfg.label}
        </span>
        <div className="relative">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-7 z-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden w-36"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-pastel-purple text-gray-700 dark:text-gray-200 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-pastel-pink text-brand-red transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-snug mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-pastel-purple text-violet-700 rounded-full text-[11px] font-medium"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-full text-[11px]">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        {task.deadline ? (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium rounded-lg px-2 py-0.5",
              overdue
                ? "bg-pastel-pink text-pink-700"
                : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
            )}
          >
            <Calendar className="w-3 h-3" />
            {formatDate(task.deadline)}
            {overdue && " ⚠️"}
          </span>
        ) : (
          <span />
        )}
        {task.assignee && (
          <UserAvatar user={task.assignee} size="sm" />
        )}
      </div>
    </motion.div>
  );
}

export function TaskCardOverlay({ task }: { task: Task }) {
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  return (
    <div className="task-card task-card-dragging w-[280px]">
      <span className={priorityCfg.className}>
        <Flag className="w-3 h-3" />
        {priorityCfg.label}
      </span>
      <h3 className="font-semibold text-gray-800 text-sm mt-2 line-clamp-2">
        {task.title}
      </h3>
    </div>
  );
}
