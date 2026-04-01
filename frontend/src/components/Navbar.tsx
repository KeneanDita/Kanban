"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Moon, Sun, ChevronDown, Users, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { useStore } from "@/store/useStore";
import { UserAvatar } from "./ui/UserAvatar";
import { NotificationPanel } from "./NotificationPanel";

export function Navbar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout, teams, activeTeamId, setActiveTeamId } = useStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2.5 font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500 hover:scale-105 transition-transform"
          >
            <span className="text-2xl">🎯</span>
            KanFlow
          </button>

          {/* Team Switcher */}
          {teams.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setTeamMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-pastel-purple hover:bg-violet-100 transition-all"
              >
                <Users className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-700 max-w-[120px] truncate">
                  {activeTeam?.name ?? "Select Team"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
              </button>

              <AnimatePresence>
                {teamMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute top-11 left-0 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                  >
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTeamId(t.id);
                          setTeamMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-pastel-purple ${
                          t.id === activeTeamId
                            ? "bg-pastel-purple text-violet-700"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setTeamMenuOpen(false);
                          router.push("/teams/new");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-violet-600 hover:bg-pastel-purple transition-colors"
                      >
                        + Create new team
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Nav links */}
          <button
            onClick={() => router.push("/dashboard")}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => router.push("/teams")}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Users className="w-4 h-4" /> Team
          </button>

          {/* Dark mode */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          <NotificationPanel />

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <UserAvatar user={user} size="sm" />
                <span className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                  {user.username}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                        {user.username}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-red hover:bg-pastel-pink transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
