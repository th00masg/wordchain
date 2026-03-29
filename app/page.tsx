"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getPlayerId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("wordchain-player-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wordchain-player-id", id);
  }
  return id;
}

const ANIMAL_EMOJIS = ["🦊", "🐸", "🐼", "🦁", "🐯", "🐨", "🐙", "🦄"];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"home" | "join">("home");

  async function handleCreate() {
    if (!name.trim()) return setError("Skriv inn navnet ditt først! ✏️");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim(), playerId: getPlayerId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("wordchain-player-name", name.trim());
      router.push(`/lobby/${data.code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Oops! Noe gikk galt 😅");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Skriv inn navnet ditt først! ✏️");
    if (!joinCode.trim()) return setError("Skriv inn spillkoden! 🔑");
    setLoading(true);
    setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`/api/lobby/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim(), playerId: getPlayerId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("wordchain-player-name", name.trim());
      router.push(`/lobby/${code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Oops! Noe gikk galt 😅");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* Floating emojis */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {ANIMAL_EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="animate-float absolute text-3xl opacity-20"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Title */}
        <div className="animate-bounce-in text-center">
          <div className="mb-2 text-6xl">🔗</div>
          <h1 className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            Ordkjede!
          </h1>
          <p className="mt-2 text-lg text-purple-200">
            Bygg ordkjeder med venner! 🎉
          </p>
        </div>

        {/* Name input - always visible */}
        <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.2s" }}>
          <label className="block text-center text-sm font-bold text-yellow-300">
            Hva heter du? 👋
          </label>
          <input
            type="text"
            placeholder="Skriv navnet ditt..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full rounded-2xl border-3 border-yellow-400/50 bg-white/10 px-5 py-4 text-center text-xl font-bold text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-yellow-400 focus:bg-white/20 focus:scale-105"
          />
        </div>

        {mode === "home" ? (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-4 text-xl font-black shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 disabled:opacity-50"
            >
              🎮 Start nytt spill!
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 px-6 py-4 text-xl font-black shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
            >
              🎟️ Bli med i spill
            </button>
          </div>
        ) : (
          <div className="animate-pop space-y-3">
            <button
              onClick={() => setMode("home")}
              className="text-sm text-purple-300 hover:text-white"
            >
              ← Tilbake
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                autoFocus
                className="flex-1 rounded-2xl border-3 border-cyan-400/50 bg-white/10 px-4 py-4 text-center font-mono text-2xl font-black uppercase tracking-[0.3em] text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:border-cyan-400 focus:bg-white/20 focus:scale-105"
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 px-6 py-4 text-xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                Gå! 🚀
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-pop rounded-2xl bg-red-500/20 border border-red-400/50 px-4 py-3 text-center font-bold text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
