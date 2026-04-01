"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getClient } from "@/lib/graphql";
import { REGISTER } from "@/lib/graphql";
import toast from "react-hot-toast";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters", { style: { borderRadius: "16px" } });
      return;
    }
    setLoading(true);
    try {
      const client = getClient();
      const data = await client.request<{
        register: { token: string; user: { id: string; email: string; username: string; avatarUrl: string } };
      }>(REGISTER, { email, username, password });
      setAuth(data.register.token, data.register.user);
      toast.success(`Welcome to KanFlow, ${data.register.user.username}! 🎉`, {
        style: { borderRadius: "16px" },
      });
      router.push("/dashboard");
    } catch (err) {
      toast.error("Registration failed. Email may already be in use.", {
        style: { borderRadius: "16px" },
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-12 relative overflow-hidden">
        <div className="blob w-80 h-80 bg-white top-[-80px] right-[-60px]" />
        <div className="blob w-60 h-60 bg-yellow-300 bottom-[-40px] left-[-40px]" />
        <div className="blob w-40 h-40 bg-violet-300 top-1/3 left-20" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center"
        >
          <div className="text-8xl mb-6">🌟</div>
          <h1 className="text-5xl font-extrabold text-white mb-4">Join KanFlow!</h1>
          <p className="text-xl text-white/80 max-w-sm leading-relaxed">
            Create your account and start collaborating with your team in real-time ⚡
          </p>

          <div className="mt-12 space-y-4">
            {[
              { emoji: "📋", text: "Organize tasks effortlessly" },
              { emoji: "🔔", text: "Get notified instantly" },
              { emoji: "🤝", text: "Collaborate with your team" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/20 rounded-2xl px-5 py-3">
                <span className="text-2xl">{emoji}</span>
                <span className="text-white font-semibold">{text}</span>
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
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-3">🌟</div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
              KanFlow
            </h1>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                Create account
              </h2>
              <Sparkles className="w-7 h-7 text-yellow-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Join thousands of teams already using KanFlow
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="coolperson123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            </div>

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
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              style={{ background: "linear-gradient(135deg, #f472b6, #fb923c)" }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
