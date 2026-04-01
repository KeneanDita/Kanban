"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  User,
  Mail,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGraphQL } from "@/hooks/useGraphQL";
import { ADD_TEAM_MEMBER, REMOVE_TEAM_MEMBER } from "@/lib/graphql";
import { Navbar } from "@/components/Navbar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function TeamsPage() {
  const router = useRouter();
  const { teams, user, upsertTeam, activeTeamId } = useStore();
  const { mutate } = useGraphQL();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];
  const isAdmin = activeTeam?.members?.some(
    (m) => m.userId === user?.id && m.role === "admin"
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeam) return;
    setInviting(true);
    try {
      // In a real app you'd search by email first; here we show the UI flow
      toast.error("User search by email coming soon! For now, use user ID.", {
        style: { borderRadius: "16px" },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!activeTeam || userId === user?.id) return;
    if (!confirm("Remove this member from the team?")) return;
    setRemovingId(userId);
    try {
      await mutate(REMOVE_TEAM_MEMBER, {
        teamId: activeTeam.id,
        userId,
      });
      const updatedTeam = {
        ...activeTeam,
        members: activeTeam.members.filter((m) => m.userId !== userId),
      };
      upsertTeam(updatedTeam);
      toast.success("Member removed", { style: { borderRadius: "16px" } });
    } catch (err) {
      toast.error("Failed to remove member", { style: { borderRadius: "16px" } });
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  if (!activeTeam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-4">
            No team selected
          </h2>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-violet-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Team Header */}
        <div className="section-header bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white mb-8">
          <div className="blob w-40 h-40 bg-white/20 -top-8 right-10" />
          <div className="blob w-24 h-24 bg-cyan-300/30 bottom-0 left-32" />

          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-cyan-200" />
                <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Team Management
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{activeTeam.name}</h1>
              {activeTeam.description && (
                <p className="text-white/70 text-sm mt-1">{activeTeam.description}</p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Members", value: activeTeam.members?.length ?? 0, icon: "👥", color: "from-violet-400 to-purple-500" },
            { label: "Admins", value: activeTeam.members?.filter((m) => m.role === "admin").length ?? 0, icon: "👑", color: "from-yellow-400 to-orange-400" },
            { label: "Created", value: formatDate(activeTeam.createdAt), icon: "📅", color: "from-cyan-400 to-blue-500" },
          ].map(({ label, value, icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card text-center"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                {icon}
              </div>
              <div className="text-2xl font-extrabold text-gray-800 dark:text-white">{value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Members List */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Team Members
          </h2>

          <div className="space-y-3">
            <AnimatePresence>
              {activeTeam.members?.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/50 hover:bg-pastel-blue/30 dark:hover:bg-slate-700 transition-colors"
                >
                  <UserAvatar user={member.user} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 dark:text-white text-sm">
                        {member.user.username}
                      </p>
                      {member.userId === activeTeam.ownerId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pastel-yellow text-amber-700 rounded-full text-[11px] font-bold">
                          <Crown className="w-3 h-3" /> Owner
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        member.role === "admin"
                          ? "bg-pastel-purple text-violet-700"
                          : "bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                      }`}>
                        {member.role === "admin" ? (
                          <><Shield className="w-3 h-3" /> Admin</>
                        ) : (
                          <><User className="w-3 h-3" /> Member</>
                        )}
                      </span>
                      {member.userId === user?.id && (
                        <span className="text-[11px] text-violet-500 font-semibold">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Joined {formatDate(member.joinedAt)}</span>
                    {isAdmin && member.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removingId === member.userId}
                        className="p-1.5 rounded-xl hover:bg-pastel-pink text-gray-400 hover:text-brand-red transition-colors ml-2"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!activeTeam.members || activeTeam.members.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-sm">No members yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member 🤝"
        size="sm"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input-field"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="btn-primary flex-1"
            >
              {inviting ? "Inviting..." : "Send Invite 📨"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
