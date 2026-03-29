"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@/lib/types";

function getPlayerId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wordchain-player-id") ?? "";
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [game, setGameState] = useState<Game | null>(null);
  const [word, setWord] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chainEndRef = useRef<HTMLDivElement>(null);

  const playerId = getPlayerId();

  useEffect(() => {
    if (!playerId) {
      router.push("/");
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/game/${code}/state`);
        if (!res.ok) return;
        const data: Game = await res.json();
        setGameState(data);
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [code, playerId, router]);

  // Countdown timer
  useEffect(() => {
    if (!game?.turnDeadline || game.state !== "playing") {
      setTimeLeft(null);
      return;
    }

    function tick() {
      const remaining = Math.max(0, Math.ceil((game!.turnDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [game?.turnDeadline, game?.state]);

  // Auto-scroll chain
  useEffect(() => {
    chainEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game?.chain.length]);

  // Auto-focus input on player's turn
  useEffect(() => {
    if (game?.currentTurnPlayerId === playerId) {
      inputRef.current?.focus();
    }
  }, [game?.currentTurnPlayerId, playerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/game/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, word: word.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setWord("");
        setError("");
      }
    } catch {
      setError("Noe gikk galt");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    await fetch(`/api/lobby/${code}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    router.push(`/lobby/${code}`);
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Laster...</p>
      </main>
    );
  }

  const isMyTurn = game.currentTurnPlayerId === playerId;
  const currentPlayer = game.players.find((p) => p.id === game.currentTurnPlayerId);
  const meAlive = game.players.find((p) => p.id === playerId)?.alive ?? false;
  const lastWord = game.chain[game.chain.length - 1]?.word ?? "";
  const requiredLetter = lastWord[lastWord.length - 1];
  const isHost = game.hostId === playerId;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="text-sm text-gray-400">
          Kode: <span className="font-mono font-bold text-gray-200">{code}</span>
        </div>
        {game.state === "playing" && timeLeft !== null && (
          <div
            className={`font-mono text-2xl font-black ${
              timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"
            }`}
          >
            {timeLeft}
          </div>
        )}
        <div className="text-sm text-gray-400">
          {game.players.filter((p) => p.alive).length}/{game.players.length} igjen
        </div>
      </header>

      {/* Elimination banner */}
      {game.eliminationReason && (
        <div className="bg-red-900/40 px-4 py-2 text-center text-sm text-red-300">
          {game.eliminationReason}
        </div>
      )}

      {/* Game finished */}
      {game.state === "finished" && (
        <div className="flex flex-col items-center gap-4 px-4 py-8">
          <p className="text-2xl font-black">Spillet er over!</p>
          {game.winnerName && (
            <p className="text-xl text-indigo-400">
              {game.winnerName} vant!
            </p>
          )}
          <div className="w-full max-w-xs space-y-1">
            {[...game.players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between rounded-lg bg-gray-800 px-4 py-2"
                >
                  <span className={!p.alive ? "text-gray-500 line-through" : ""}>
                    {p.name}
                  </span>
                  <span className="font-mono">{p.score}</span>
                </div>
              ))}
          </div>
          {isHost && (
            <button
              onClick={handleReset}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-500"
            >
              Spill igjen
            </button>
          )}
        </div>
      )}

      {/* Word chain */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-2">
          {game.chain.map((entry, i) => (
            <div
              key={i}
              className={`flex items-baseline gap-2 ${
                entry.playerId === "system" ? "justify-center" : ""
              }`}
            >
              {entry.playerId === "system" ? (
                <span className="rounded-full bg-gray-800 px-4 py-1 text-sm text-gray-400">
                  {entry.word}
                </span>
              ) : (
                <>
                  <span className="text-xs text-gray-500">{entry.playerName}</span>
                  <span
                    className={`rounded-lg px-3 py-1 font-medium ${
                      entry.playerId === playerId
                        ? "bg-indigo-600/30 text-indigo-300"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <span className="text-indigo-400">{entry.word[0]}</span>
                    {entry.word.slice(1, -1)}
                    <span className="text-emerald-400">{entry.word[entry.word.length - 1]}</span>
                  </span>
                </>
              )}
            </div>
          ))}
          <div ref={chainEndRef} />
        </div>
      </div>

      {/* Players bar */}
      <div className="flex gap-2 overflow-x-auto border-t border-gray-800 px-4 py-2">
        {game.players.map((p) => (
          <div
            key={p.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
              p.id === game.currentTurnPlayerId
                ? "bg-indigo-600 text-white"
                : p.alive
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-900 text-gray-600 line-through"
            }`}
          >
            <span>{p.name}</span>
            <span className="text-xs opacity-70">{p.score}</span>
          </div>
        ))}
      </div>

      {/* Input area */}
      {game.state === "playing" && (
        <div className="border-t border-gray-800 p-4">
          {isMyTurn && meAlive ? (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder={`Ord som starter med "${requiredLetter}"...`}
                    autoComplete="off"
                    className="w-full rounded-lg bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !word.trim()}
                  className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </form>
          ) : meAlive ? (
            <p className="text-center text-gray-400">
              Venter på <span className="font-semibold text-white">{currentPlayer?.name}</span>...
            </p>
          ) : (
            <p className="text-center text-gray-500">Du er eliminert. Ser på...</p>
          )}
        </div>
      )}
    </main>
  );
}
