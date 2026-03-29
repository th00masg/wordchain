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
    if (!name.trim()) return setError("Skriv inn navnet ditt");
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
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">Bli med i spill</h1>
          <p className="mt-1 font-mono text-2xl tracking-widest text-indigo-400">{code}</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Ditt navn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            className="w-full rounded-lg bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Bli med
          </button>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}
