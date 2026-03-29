"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Game, THEMES } from "@/lib/types";
import {
  unlockAudio,
  playWordSubmit,
  playLongWord,
  playYourTurn,
  playTick,
  playUrgentTick,
  playElimination,
  playVictory,
  playError,
  playClick,
} from "@/lib/sounds";

function getPlayerId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wordchain-player-id") ?? "";
}

const PLAYER_EMOJIS = ["🦊", "🐸", "🐼", "🦁", "🐯", "🐨", "🐙", "🦄"];
const PLAYER_COLORS = [
  "from-yellow-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-cyan-400 to-blue-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-violet-500",
  "from-red-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-amber-400 to-yellow-500",
];

const REACTIONS = ["🔥", "⚡", "💥", "🌟", "✨", "🎯", "💎", "🚀"];
const LONG_WORD_REACTIONS = ["🤯", "🏆", "👑", "💪", "🎉"];

function getTimerColor(timeLeft: number, turnTime: number) {
  const pct = timeLeft / turnTime;
  if (pct > 0.5) return "from-green-400 to-emerald-500";
  if (pct > 0.25) return "from-yellow-400 to-orange-500";
  return "from-red-400 to-pink-500";
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [game, setGameState] = useState<Game | null>(null);
  const [word, setWord] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [lastChainLen, setLastChainLen] = useState(0);
  const [prevTurnPlayer, setPrevTurnPlayer] = useState<string | null>(null);
  const [prevGameState, setPrevGameState] = useState<string | null>(null);
  const [prevElimination, setPrevElimination] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastTickRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const chainEndRef = useRef<HTMLDivElement>(null);

  const playerId = getPlayerId();

  const showReaction = useCallback((text: string) => {
    setReaction(text);
    setTimeout(() => setReaction(null), 1500);
  }, []);

  // Unlock audio on first interaction
  useEffect(() => {
    function handleInteraction() {
      unlockAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    }
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

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

  // Sound: new word submitted
  useEffect(() => {
    if (!game || !soundEnabled) return;
    if (game.chain.length > lastChainLen && lastChainLen > 0) {
      const newWord = game.chain[game.chain.length - 1];
      if (newWord.playerId !== "system") {
        if (newWord.word.length >= 8) {
          playLongWord();
          showReaction(LONG_WORD_REACTIONS[Math.floor(Math.random() * LONG_WORD_REACTIONS.length)]);
        } else {
          playWordSubmit();
          showReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
        }
      }
    }
    setLastChainLen(game.chain.length);
  }, [game?.chain.length, lastChainLen, showReaction, game, soundEnabled]);

  // Sound: your turn
  useEffect(() => {
    if (!game || !soundEnabled) return;
    const currentTurn = game.currentTurnPlayerId;
    if (currentTurn !== prevTurnPlayer && currentTurn === playerId) {
      playYourTurn();
    }
    setPrevTurnPlayer(currentTurn);
  }, [game?.currentTurnPlayerId, prevTurnPlayer, playerId, game, soundEnabled]);

  // Sound: game finished (victory)
  useEffect(() => {
    if (!game || !soundEnabled) return;
    if (game.state === "finished" && prevGameState === "playing") {
      playVictory();
    }
    setPrevGameState(game.state);
  }, [game?.state, prevGameState, game, soundEnabled]);

  // Sound: elimination
  useEffect(() => {
    if (!game || !soundEnabled) return;
    if (game.eliminationReason && game.eliminationReason !== prevElimination) {
      playElimination();
    }
    setPrevElimination(game.eliminationReason);
  }, [game?.eliminationReason, prevElimination, game, soundEnabled]);

  // Countdown timer + tick sounds
  useEffect(() => {
    if (!game?.turnDeadline || game.state !== "playing") {
      setTimeLeft(null);
      return;
    }

    function tick() {
      const remaining = Math.max(0, Math.ceil((game!.turnDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Play tick sounds for current player
      if (soundEnabled && game!.currentTurnPlayerId === playerId && remaining !== lastTickRef.current) {
        lastTickRef.current = remaining;
        if (remaining <= 3 && remaining > 0) {
          playUrgentTick();
        } else if (remaining <= 7 && remaining > 0) {
          playTick();
        }
      }
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [game?.turnDeadline, game?.state, game?.currentTurnPlayerId, playerId, soundEnabled]);

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
        if (soundEnabled) playError();
      } else {
        setWord("");
        setError("");
      }
    } catch {
      setError("Noe gikk galt 😅");
      if (soundEnabled) playError();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (soundEnabled) playClick();
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
        <div className="animate-float text-center">
          <div className="text-5xl mb-3">⏳</div>
          <p className="text-xl font-bold text-purple-200">Laster spillet...</p>
        </div>
      </main>
    );
  }

  const isMyTurn = game.currentTurnPlayerId === playerId;
  const currentPlayer = game.players.find((p) => p.id === game.currentTurnPlayerId);
  const currentPlayerIndex = game.players.findIndex((p) => p.id === game.currentTurnPlayerId);
  const meAlive = game.players.find((p) => p.id === playerId)?.alive ?? false;
  const lastWord = game.chain[game.chain.length - 1]?.word ?? "";
  const requiredLetter = lastWord[lastWord.length - 1];
  const isHost = game.hostId === playerId;
  const currentTheme = THEMES.find((t) => t.id === game.theme) ?? THEMES[0];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Floating reaction */}
      {reaction && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <span className="animate-bounce-in text-8xl">{reaction}</span>
        </div>
      )}

      {/* Header with timer */}
      <header className="relative overflow-hidden border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-purple-300">
              🔗 <span className="font-mono text-yellow-300">{code}</span>
            </span>
            {game.theme !== "free" && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
                {currentTheme.emoji} {currentTheme.label}
              </span>
            )}
          </div>

          {/* Timer */}
          {game.state === "playing" && timeLeft !== null && (
            <div className="flex flex-col items-center">
              <span
                className={`font-mono text-4xl font-black bg-gradient-to-r ${getTimerColor(timeLeft, game.turnTime)} bg-clip-text text-transparent ${
                  timeLeft <= 5 ? "animate-timer-shake" : ""
                } ${timeLeft <= 3 ? "animate-wiggle" : ""}`}
              >
                {timeLeft}
              </span>
              {/* Timer bar */}
              <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getTimerColor(timeLeft, game.turnTime)} transition-all duration-200`}
                  style={{ width: `${(timeLeft / game.turnTime) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-purple-300">
              {game.players.filter((p) => p.alive).length}/{game.players.length} 💪
            </div>
            {/* Sound toggle */}
            <button
              onClick={() => { setSoundEnabled(!soundEnabled); playClick(); }}
              className="rounded-full bg-white/10 p-1.5 text-sm transition-all hover:bg-white/20 active:scale-90"
              title={soundEnabled ? "Skru av lyd" : "Skru på lyd"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
          </div>
        </div>

        {/* Current turn indicator */}
        {game.state === "playing" && currentPlayer && (
          <div className={`mt-2 rounded-xl px-3 py-1.5 text-center ${
            isMyTurn
              ? "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
              : "bg-white/5"
          }`}>
            <span className="text-lg font-bold">
              {isMyTurn ? (
                <span className="text-yellow-300">🎯 Din tur! Ord med &quot;{requiredLetter.toUpperCase()}&quot;</span>
              ) : (
                <span className="text-purple-200">
                  {PLAYER_EMOJIS[currentPlayerIndex % PLAYER_EMOJIS.length]} {currentPlayer.name} tenker...
                </span>
              )}
            </span>
          </div>
        )}
      </header>

      {/* Elimination banner */}
      {game.eliminationReason && (
        <div className="animate-pop bg-red-500/20 border-b border-red-400/30 px-4 py-2 text-center text-lg font-bold text-red-300">
          💀 {game.eliminationReason}
        </div>
      )}

      {/* Game finished */}
      {game.state === "finished" && (
        <div className="flex flex-col items-center gap-5 px-4 py-8">
          <div className="animate-bounce-in text-center">
            <div className="text-6xl mb-2">🏆</div>
            <p className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 bg-clip-text text-3xl font-black text-transparent">
              Spillet er over!
            </p>
          </div>

          {game.winnerName && (
            <div className="animate-pop rounded-2xl bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/30 px-6 py-3">
              <span className="text-2xl font-black text-yellow-300">
                👑 {game.winnerName} vant!
              </span>
            </div>
          )}

          <div className="w-full max-w-xs space-y-2">
            {[...game.players]
              .sort((a, b) => b.score - a.score)
              .map((p, rank) => {
                const originalIndex = game.players.findIndex((op) => op.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={`animate-slide-up flex items-center gap-3 rounded-2xl px-4 py-3 ${
                      rank === 0
                        ? "bg-yellow-400/20 border border-yellow-400/30"
                        : "bg-white/10"
                    }`}
                    style={{ animationDelay: `${0.1 * rank}s` }}
                  >
                    <span className="text-2xl">
                      {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : PLAYER_EMOJIS[originalIndex % PLAYER_EMOJIS.length]}
                    </span>
                    <span className={`flex-1 text-lg font-black ${!p.alive ? "text-gray-500 line-through" : "text-white"}`}>
                      {p.name}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-lg font-bold text-yellow-300">
                      {p.score}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="text-center text-purple-300">
            <p>Kjeden ble <span className="font-bold text-white">{game.chain.length - 1}</span> ord lang! 🔗</p>
          </div>

          {isHost && (
            <button
              onClick={handleReset}
              className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-4 text-xl font-black shadow-lg shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
            >
              🔄 Spill igjen!
            </button>
          )}
        </div>
      )}

      {/* Word chain */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-2">
          {game.chain.map((entry, i) => {
            const playerIndex = game.players.findIndex((p) => p.id === entry.playerId);
            return (
              <div
                key={i}
                className={`animate-slide-up ${
                  entry.playerId === "system" ? "flex justify-center" : "flex items-center gap-2"
                }`}
                style={{ animationDelay: `${Math.min(i * 0.05, 1)}s` }}
              >
                {entry.playerId === "system" ? (
                  <span className="rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-purple-300 backdrop-blur-sm">
                    🌟 {entry.word}
                  </span>
                ) : (
                  <>
                    <span className="text-lg">
                      {PLAYER_EMOJIS[playerIndex % PLAYER_EMOJIS.length]}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-purple-400">{entry.playerName}</span>
                      <span
                        className={`inline-block rounded-xl px-3 py-1 text-lg font-black ${
                          entry.playerId === playerId
                            ? `bg-gradient-to-r ${PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]} text-white shadow-lg`
                            : "bg-white/10 text-white backdrop-blur-sm"
                        }`}
                      >
                        <span className="text-yellow-300 text-xl">{entry.word[0].toUpperCase()}</span>
                        {entry.word.slice(1, -1)}
                        <span className="text-emerald-300 text-xl">{entry.word[entry.word.length - 1]}</span>
                      </span>
                    </div>
                    {entry.word.length >= 8 && (
                      <span className="text-sm" title="Langt ord!">💎</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div ref={chainEndRef} />
        </div>
      </div>

      {/* Players bar */}
      <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 scrollbar-hide">
        {game.players.map((p, i) => (
          <div
            key={p.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
              p.id === game.currentTurnPlayerId
                ? `bg-gradient-to-r ${PLAYER_COLORS[i % PLAYER_COLORS.length]} text-white shadow-lg animate-pulse-ring`
                : p.alive
                ? "bg-white/10 text-white/80"
                : "bg-white/5 text-white/30 line-through"
            }`}
          >
            <span>{PLAYER_EMOJIS[i % PLAYER_EMOJIS.length]}</span>
            <span>{p.name}</span>
            <span className="rounded-full bg-black/20 px-1.5 text-xs text-yellow-300">{p.score}</span>
          </div>
        ))}
      </div>

      {/* Input area */}
      {game.state === "playing" && (
        <div className="border-t border-white/10 p-4">
          {isMyTurn && meAlive ? (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder={`Begynn med "${requiredLetter.toUpperCase()}"...`}
                    autoComplete="off"
                    autoCapitalize="off"
                    className="w-full rounded-2xl border-3 border-yellow-400 bg-white/10 px-5 py-4 text-xl font-bold text-white placeholder-white/30 outline-none backdrop-blur-sm transition-all focus:bg-white/20 focus:scale-[1.02]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">✏️</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !word.trim()}
                  className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-4 text-xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  🚀
                </button>
              </div>
              {error && (
                <div className="animate-pop rounded-xl bg-red-500/20 border border-red-400/30 px-3 py-2 text-center text-sm font-bold text-red-300">
                  {error}
                </div>
              )}
            </form>
          ) : meAlive ? (
            <div className="text-center">
              <span className="text-lg font-bold text-purple-200">
                {PLAYER_EMOJIS[currentPlayerIndex % PLAYER_EMOJIS.length]}{" "}
                <span className="text-white">{currentPlayer?.name}</span> tenker... 🤔
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-lg font-bold text-purple-400">
                👀 Du ser på! Heier du?
              </span>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
