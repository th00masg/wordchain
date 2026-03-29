"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Game } from "@/lib/types";

function getPlayerId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wordchain-player-id") ?? "";
}

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

const PLAYER_EMOJIS = ["🦊", "🐸", "🐼", "🦁", "🐯", "🐨", "🐙", "🦄"];

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const playerId = getPlayerId();
    if (!playerId) {
      router.push("/");
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/game/${code}/state`);
        if (!res.ok) {
          setError("Spillet finnes ikke 😢");
          return;
        }
        const data: Game = await res.json();
        setGame(data);

        if (data.state === "playing") {
          router.push(`/game/${code}`);
        }
      } catch {
        setError("Kunne ikke koble til serveren 📡");
      }
    }

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [code, router]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/lobby/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: getPlayerId() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
    } catch {
      setError("Noe gikk galt 😅");
    } finally {
      setStarting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(
      typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : ""
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-xl font-bold text-red-300">{error}</p>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center animate-float">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-xl font-bold text-purple-200">Laster...</p>
        </div>
      </main>
    );
  }

  const isHost = game.hostId === getPlayerId();
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Game code */}
        <div className="animate-bounce-in text-center">
          <p className="text-sm font-bold text-purple-300">Spillkode</p>
          <button
            onClick={handleCopy}
            className="relative mt-1 rounded-2xl bg-white/10 px-8 py-3 backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            <span className="font-mono text-5xl font-black tracking-[0.3em] text-yellow-300">
              {code}
            </span>
            <span className="absolute -top-2 -right-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
              {copied ? "Kopiert! ✅" : "Kopier 📋"}
            </span>
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center animate-pop" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-2xl bg-white p-3 shadow-lg shadow-purple-500/20">
            <QRCodeSVG value={joinUrl} size={140} />
          </div>
        </div>

        {/* Start word */}
        <div className="animate-pop text-center" style={{ animationDelay: "0.3s" }}>
          <div className="inline-block rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-5 py-2">
            <span className="text-sm text-amber-300">Startord: </span>
            <span className="text-lg font-black text-amber-200">{game.chain[0]?.word} ✨</span>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <p className="text-center text-sm font-bold text-purple-300">
            Spillere ({game.players.length}/8) 👥
          </p>
          <div className="space-y-2">
            {game.players.map((player, i) => (
              <div
                key={player.id}
                className="animate-slide-up flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <span className="text-2xl">{PLAYER_EMOJIS[i % PLAYER_EMOJIS.length]}</span>
                <span className={`flex-1 text-lg font-black bg-gradient-to-r ${PLAYER_COLORS[i % PLAYER_COLORS.length]} bg-clip-text text-transparent`}>
                  {player.name}
                </span>
                {player.isHost && (
                  <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-bold text-yellow-300">
                    👑 Vert
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {game.players.length < 2 && (
              <div className="animate-pulse rounded-2xl border-2 border-dashed border-white/20 px-4 py-3 text-center text-white/30">
                <span className="text-lg">Venter på flere spillere...</span>
              </div>
            )}
          </div>
        </div>

        {/* Start button / waiting */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || game.players.length < 2}
            className={`w-full rounded-2xl px-6 py-4 text-xl font-black shadow-lg transition-all active:scale-95 ${
              game.players.length < 2
                ? "bg-gray-600/50 text-gray-400 shadow-none"
                : "animate-pulse-ring bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-yellow-500/30 hover:scale-105 hover:shadow-xl"
            }`}
          >
            {game.players.length < 2 ? "⏳ Venter på spillere..." : "🚀 Start spillet!"}
          </button>
        ) : (
          <div className="animate-float rounded-2xl bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
            <span className="text-lg font-bold text-purple-200">
              Venter på at verten starter... ⏳
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
