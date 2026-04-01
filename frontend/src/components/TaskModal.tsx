"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flag, Calendar, Tag, X, User } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Task, Column, useStore } from "@/store/useStore";
import { useGraphQL } from "@/hooks/useGraphQL";
import { CREATE_TASK, UPDATE_TASK } from "@/lib/graphql";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  editTask?: Task | null;
  defaultColumnId?: string;
  columns: Column[];
  teamId: string;
}

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-pastel-green text-emerald-700", emoji: "🟢" },
  { value: "medium", label: "Medium", color: "bg-pastel-yellow text-amber-700", emoji: "🟡" },
  { value: "high", label: "High", color: "bg-pastel-pink text-pink-700", emoji: "🔴" },
];

export function TaskModal({
  open,
  onClose,
  editTask,
  defaultColumnId,
  columns,
  teamId,
}: Props) {
  const { mutate } = useGraphQL();
  const { upsertTask, teams, activeTeamId } = useStore();
  const team = teams.find((t) => t.id === activeTeamId);
  const members = team?.members ?? [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setPriority(editTask.priority);
      setColumnId(editTask.columnId);
      setAssigneeId(editTask.assigneeId ?? "");
      setDeadline(editTask.deadline ? editTask.deadline.slice(0, 10) : "");
      setTags(editTask.tags ?? []);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setColumnId(defaultColumnId ?? columns[0]?.id ?? "");
      setAssigneeId("");
      setDeadline("");
      setTags([]);
    }
    setTagInput("");
  }, [editTask, open, defaultColumnId, columns]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editTask) {
        const data = await mutate<{ updateTask: Task }>(UPDATE_TASK, {
          input: {
            id: editTask.id,
            title: title.trim(),
            description,
            priority,
            assigneeId: assigneeId || null,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            tags,
          },
        });
        upsertTask(data.updateTask);
        toast.success("Task updated!", { icon: "✏️", style: { borderRadius: "16px" } });
      } else {
        const data = await mutate<{ createTask: Task }>(CREATE_TASK, {
          input: {
            teamId,
            columnId,
            title: title.trim(),
            description,
            priority,
            assigneeId: assigneeId || null,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            tags,
          },
        });
        upsertTask(data.createTask);
        toast.success("Task created!", { icon: "✨", style: { borderRadius: "16px" } });
      }
      onClose();
    } catch (err) {
      toast.error("Something went wrong", { style: { borderRadius: "16px" } });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTask ? "Edit Task ✏️" : "New Task ✨"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="label">Task Title *</label>
          <input
            className="input-field"
            placeholder="What needs to be done? 🎯"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input-field resize-none"
            placeholder="Add some details... 📝"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Priority + Column row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                    priority === p.value
                      ? `${p.color} border-current`
                      : "bg-gray-50 dark:bg-slate-700 text-gray-500 border-transparent hover:border-gray-300"
                  )}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Column</label>
            <select
              className="input-field"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignee + Deadline row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Assignee
            </label>
            <select
              className="input-field"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Deadline
            </label>
            <input
              type="date"
              className="input-field"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="label flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Tags
          </label>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button type="button" onClick={addTag} className="btn-secondary !px-3">
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-pastel-purple text-violet-700 rounded-full text-xs font-semibold"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="hover:text-violet-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="animate-pulse">Saving...</span>
            ) : editTask ? (
              "Save Changes ✅"
            ) : (
              "Create Task 🚀"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
