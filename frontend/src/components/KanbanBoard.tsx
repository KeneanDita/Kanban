"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useStore, Task, Column } from "@/store/useStore";
import { useGraphQL } from "@/hooks/useGraphQL";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MOVE_TASK, DELETE_TASK, GET_NOTIFICATIONS } from "@/lib/graphql";
import { KanbanColumn } from "./Column";
import { TaskCardOverlay } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { KanbanSkeleton } from "./ui/LoadingSkeleton";
import toast from "react-hot-toast";

interface Props {
  teamId: string;
  loading?: boolean;
}

export function KanbanBoard({ teamId, loading }: Props) {
  const {
    tasks,
    columns,
    setTasks,
    upsertTask,
    removeTask,
    moveTaskLocally,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    setNotifications,
  } = useStore();
  const { mutate } = useGraphQL();
  useWebSocket(teamId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.teamId !== teamId) return false;
      const q = searchQuery.toLowerCase();
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, teamId, searchQuery, filterPriority]);

  function getColumnTasks(columnId: string) {
    return filteredTasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overColumn = columns.find((c) => c.id === over.id);
    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumnId = overColumn?.id ?? overTask?.columnId;

    if (targetColumnId && activeTask.columnId !== targetColumnId) {
      moveTaskLocally(activeTask.id, targetColumnId, activeTask.position);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overColumn = columns.find((c) => c.id === over.id);
    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumnId = overColumn?.id ?? overTask?.columnId ?? activeTask.columnId;

    const columnTasks = tasks
      .filter((t) => t.columnId === targetColumnId && t.id !== activeTask.id)
      .sort((a, b) => a.position - b.position);

    let newPosition = columnTasks.length + 1;
    if (overTask && overTask.id !== activeTask.id) {
      const overIdx = columnTasks.findIndex((t) => t.id === overTask.id);
      newPosition = overIdx + 1;
    }

    try {
      await mutate(MOVE_TASK, {
        taskId: activeTask.id,
        columnId: targetColumnId,
        position: newPosition,
      });
    } catch (err) {
      console.error("Move task failed:", err);
      toast.error("Failed to move task", { style: { borderRadius: "16px" } });
    }
  }

  function handleAddTask(columnId: string) {
    setEditTask(null);
    setDefaultColumnId(columnId);
    setTaskModalOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditTask(task);
    setTaskModalOpen(true);
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await mutate(DELETE_TASK, { id: taskId });
      removeTask(taskId);
      toast.success("Task deleted", { icon: "🗑️", style: { borderRadius: "16px" } });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task", { style: { borderRadius: "16px" } });
    }
  }

  if (loading) return <KanbanSkeleton />;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9 py-2.5"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary !py-2.5 ${showFilters ? "!border-brand-purple !text-brand-purple" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-2"
          >
            {[null, "low", "medium", "high"].map((p) => (
              <button
                key={p ?? "all"}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  filterPriority === p
                    ? "border-brand-purple bg-pastel-purple text-violet-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {p === null ? "All" : p === "low" ? "🟢 Low" : p === "medium" ? "🟡 Medium" : "🔴 High"}
              </button>
            ))}
          </motion.div>
        )}

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400 font-medium">
          <span className="px-3 py-1.5 bg-pastel-purple text-violet-700 rounded-xl font-semibold">
            {filteredTasks.length} tasks
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 px-6 min-w-max">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getColumnTasks(col.id)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}

            {columns.length === 0 && (
              <div className="flex items-center justify-center w-full py-20 text-center">
                <div>
                  <div className="text-6xl mb-4">🏗️</div>
                  <p className="text-gray-500 font-medium">No columns yet</p>
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTask && <TaskCardOverlay task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        editTask={editTask}
        defaultColumnId={defaultColumnId}
        columns={columns}
        teamId={teamId}
      />
    </div>
  );
}
