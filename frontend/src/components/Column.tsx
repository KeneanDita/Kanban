"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Column as ColumnType, Task } from "@/store/useStore";
import { TaskCard } from "./TaskCard";
import { cn, COLUMN_GRADIENTS } from "@/lib/utils";

interface Props {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const gradient = COLUMN_GRADIENTS[column.name] ?? "from-gray-50 to-white";

  return (
    <motion.div
      className={cn(
        "kanban-column bg-gradient-to-b",
        gradient,
        "dark:from-slate-800 dark:to-slate-900",
        isOver && "ring-2 ring-offset-2",
      )}
      style={{ "--tw-ring-color": column.color } as React.CSSProperties}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm tracking-wide uppercase">
            {column.name}
          </h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: column.color }}
          >
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(column.id)}
          className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-700 transition-all group"
          title="Add task"
        >
          <Plus className="w-4 h-4 text-gray-500 group-hover:text-violet-500 transition-colors" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-3 min-h-[200px] rounded-2xl transition-all duration-200",
          isOver && "bg-white/50 dark:bg-slate-700/50 p-2"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-10 text-center"
          >
            <div className="text-4xl mb-2">
              {column.name === "Done" ? "✅" : column.name === "In Progress" ? "⚡" : "📝"}
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              {column.name === "Done" ? "No completed tasks" : "Drop tasks here"}
            </p>
          </motion.div>
        )}

        {/* Add task button at bottom */}
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full mt-1 py-2.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700
                     text-sm text-gray-400 dark:text-gray-500 font-medium
                     hover:border-violet-300 hover:text-violet-500 hover:bg-white/50
                     dark:hover:border-violet-500 dark:hover:text-violet-400
                     transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add task
        </button>
      </div>
    </motion.div>
  );
}
