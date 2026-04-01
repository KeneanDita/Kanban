"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getClient } from "@/lib/graphql";
import { LOGIN } from "@/lib/graphql";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const client = getClient();
      const data = await client.request<{
        login: { token: string; user: { id: string; email: string; username: string; avatarUrl: string } };
      }>(LOGIN, { email, password });
      setAuth(data.login.token, data.login.user);
      toast.success(`Welcome back, ${data.login.user.username}! 🎉`, {
        style: { borderRadius: "16px" },
      });
      router.push("/dashboard");
    } catch (err) {
      toast.error("Invalid email or password", { style: { borderRadius: "16px" } });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="blob w-80 h-80 bg-white top-[-60px] left-[-60px]" />
        <div className="blob w-60 h-60 bg-pink-300 bottom-[-40px] right-[-40px]" />
        <div className="blob w-40 h-40 bg-yellow-300 top-1/2 right-20" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center"
        >
          <div className="text-8xl mb-6 animate-bounce">🎯</div>
          <h1 className="text-5xl font-extrabold text-white mb-4">KanFlow</h1>
          <p className="text-xl text-white/80 max-w-sm leading-relaxed">
            Your fun, real-time Kanban board for teams that love getting things done ✨
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-white/70 text-sm">
            {[
              { emoji: "🚀", text: "Real-time sync" },
              { emoji: "🤝", text: "Team collaboration" },
              { emoji: "🎨", text: "Beautiful UI" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex flex-col items-center gap-2">
                <div className="text-3xl">{emoji}</div>
                <span className="font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
              KanFlow
            </h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Sign in to continue to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 justify-center"
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-violet-600 font-semibold hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
