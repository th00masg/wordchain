"use client";

import { useState, use } from "react";
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

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!name.trim()) return setError("Skriv inn navnet ditt! ✏️");
    setLoading(true);
    setError("");
    try {
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
      <div className="w-full max-w-sm space-y-6">
        <div className="animate-bounce-in text-center">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-3xl font-black text-transparent">
            Bli med i spill!
          </h1>
          <div className="mt-2 inline-block rounded-xl bg-white/10 px-4 py-1 backdrop-blur-sm">
            <span className="font-mono text-2xl font-black tracking-[0.3em] text-yellow-300">{code}</span>
          </div>
        </div>

        <div className="animate-slide-up space-y-4" style={{ animationDelay: "0.2s" }}>
          <div>
            <label className="mb-1 block text-center text-sm font-bold text-yellow-300">
              Hva heter du? 👋
            </label>
            <input
              type="text"
              placeholder="Skriv navnet ditt..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
              className="w-full rounded-2xl border-3 border-cyan-400/50 bg-white/10 px-5 py-4 text-center text-xl font-bold text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-cyan-400 focus:bg-white/20 focus:scale-105"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-4 text-xl font-black shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? "⏳ Venter..." : "🚀 Bli med!"}
          </button>

          {error && (
            <div className="animate-pop rounded-2xl bg-red-500/20 border border-red-400/50 px-4 py-3 text-center font-bold text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
