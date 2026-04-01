"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Users, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGraphQL } from "@/hooks/useGraphQL";
import {
  GET_TEAMS,
  GET_TASKS,
  GET_NOTIFICATIONS,
  CREATE_TEAM,
} from "@/lib/graphql";
import { Navbar } from "@/components/Navbar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Modal } from "@/components/ui/Modal";
import { Team, Notification } from "@/store/useStore";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const {
    token,
    user,
    teams,
    setTeams,
    upsertTeam,
    activeTeamId,
    setActiveTeamId,
    setColumns,
    setTasks,
    setNotifications,
    columns,
  } = useStore();

  const { query, mutate } = useGraphQL();
  const [loading, setLoading] = useState(true);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (activeTeamId) {
      loadTeamData(activeTeamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId]);

  async function loadData() {
    try {
      const [teamsData, notifsData] = await Promise.all([
        query<{ getTeams: Team[] }>(GET_TEAMS),
        query<{ getNotifications: Notification[] }>(GET_NOTIFICATIONS),
      ]);

      const loadedTeams = teamsData.getTeams ?? [];
      setTeams(loadedTeams);
      setNotifications(notifsData.getNotifications ?? []);

      if (loadedTeams.length > 0) {
        const firstId = activeTeamId ?? loadedTeams[0].id;
        setActiveTeamId(firstId);
        await loadTeamData(firstId);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamData(teamId: string) {
    try {
      const [teamDetail, tasksData] = await Promise.all([
        query<{ getTeam: Team }>("query GetTeam($id: ID!) { getTeam(id: $id) { id name description ownerId createdAt members { id userId role joinedAt user { id username email avatarUrl } } columns { id name color position } } }", { id: teamId }),
        query<{ getTasks: ReturnType<typeof useStore.getState>["tasks"] }>(GET_TASKS, { teamId }),
      ]);

      if (teamDetail.getTeam) {
        upsertTeam(teamDetail.getTeam);
        setColumns(teamDetail.getTeam.columns ?? []);
      }
      setTasks(tasksData.getTasks ?? []);
    } catch (err) {
      console.error("Failed to load team data:", err);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const data = await mutate<{ createTeam: Team }>(CREATE_TEAM, {
        name: teamName.trim(),
        description: teamDesc.trim(),
      });

      const newTeam = data.createTeam;
      upsertTeam(newTeam);
      setActiveTeamId(newTeam.id);
      await loadTeamData(newTeam.id);

      setCreateTeamOpen(false);
      setTeamName("");
      setTeamDesc("");
      toast.success(`Team "${newTeam.name}" created! 🎉`, {
        style: { borderRadius: "16px" },
      });
    } catch (err) {
      toast.error("Failed to create team", { style: { borderRadius: "16px" } });
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      {/* Section Header */}
      <div className="px-6 pt-6">
        <div className="section-header bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white">
          {/* Decorative blobs */}
          <div className="blob w-48 h-48 bg-white/20 -top-10 -right-10" />
          <div className="blob w-32 h-32 bg-pink-300/30 bottom-0 left-20" />
          <div className="blob w-20 h-20 bg-yellow-300/30 top-5 left-1/2" />

          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Kanban Board
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {activeTeam?.name ?? "Your Workspace"} 🚀
              </h1>
              {activeTeam?.description && (
                <p className="text-white/70 text-sm mt-1">{activeTeam.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeTeam && (
                <button
                  onClick={() => router.push("/teams")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-semibold transition-all"
                >
                  <Users className="w-4 h-4" />
                  {activeTeam.members?.length ?? 0} members
                </button>
              )}
              <button
                onClick={() => setCreateTeamOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 hover:bg-violet-50 rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" /> New Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {teams.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="text-8xl mb-6 animate-bounce">🌱</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-3">
            Start your first team!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Create a team to get started with your Kanban board and collaborate in real-time.
          </p>
          <button
            onClick={() => setCreateTeamOpen(true)}
            className="btn-primary text-base px-8 py-3"
          >
            <Plus className="w-5 h-5" /> Create Team
          </button>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard teamId={activeTeamId ?? ""} loading={loading} />
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        title="Create New Team 🏆"
        size="sm"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input
              className="input-field"
              placeholder="e.g. Dream Team 🚀"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field resize-none"
              placeholder="What does this team work on?"
              rows={2}
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCreateTeamOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex-1"
            >
              {creating ? "Creating..." : "Create Team 🎉"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
