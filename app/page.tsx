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

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Skriv inn navnet ditt");
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
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Skriv inn navnet ditt");
    if (!joinCode.trim()) return setError("Skriv inn spillkoden");
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
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">Ordkjede</h1>
          <p className="mt-2 text-gray-400">Bygg ordkjeder med venner</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Ditt navn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full rounded-lg bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Opprett nytt spill
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-700" />
            <span className="text-sm text-gray-500">eller</span>
            <div className="h-px flex-1 bg-gray-700" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Spillkode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-3 text-center font-mono text-lg uppercase tracking-widest text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-lg bg-gray-700 px-6 py-3 font-semibold transition hover:bg-gray-600 disabled:opacity-50"
            >
              Bli med
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}
