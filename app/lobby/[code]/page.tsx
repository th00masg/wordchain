"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Game } from "@/lib/types";

function getPlayerId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wordchain-player-id") ?? "";
}

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

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
          setError("Spillet finnes ikke");
          return;
        }
        const data: Game = await res.json();
        setGame(data);

        if (data.state === "playing") {
          router.push(`/game/${code}`);
        }
      } catch {
        setError("Kunne ikke koble til serveren");
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
      setError("Noe gikk galt");
    } finally {
      setStarting(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-gray-400">Laster...</p>
      </main>
    );
  }

  const isHost = game.hostId === getPlayerId();
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">Spillkode</p>
          <p className="text-4xl font-black tracking-widest">{code}</p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={joinUrl} size={160} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">
            Spillere ({game.players.length}/8)
          </p>
          <div className="space-y-1">
            {game.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-2"
              >
                <span>{player.name}</span>
                {player.isHost && (
                  <span className="text-xs text-indigo-400">Vert</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-sm text-gray-500">
            Startord: <span className="font-semibold text-gray-300">{game.chain[0]?.word}</span>
          </p>
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || game.players.length < 2}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {game.players.length < 2 ? "Venter på spillere..." : "Start spillet"}
          </button>
        ) : (
          <p className="text-center text-sm text-gray-400">
            Venter på at verten starter spillet...
          </p>
        )}
      </div>
    </main>
  );
}
