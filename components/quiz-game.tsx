"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Loader2, Flame, Trophy } from "lucide-react";
import type { QuizQuestion } from "@/lib/types";
import { PlayerAvatar } from "@/components/player-avatar";
import { countryFlag } from "@/lib/countries";
import { CitizenshipFlags } from "@/components/flag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BATCH = 12;
const SECONDS = 10;
/** How long the result flashes before the next round starts automatically. */
const AUTO_ADVANCE_MS = 1400;

async function fetchQuestions(): Promise<QuizQuestion[]> {
  const res = await fetch(`/api/game?count=${BATCH}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load the quiz");
  return (await res.json()).questions ?? [];
}

export function QuizGame() {
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const { data: questions = [], isError, refetch } = useQuery({
    queryKey: ["game", round],
    queryFn: fetchQuestions,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const q = questions[index];
  const answered = selected !== null || timedOut;

  function pick(option: string) {
    if (answered || !q) return;
    setSelected(option);
    if (option === q.answer) {
      const n = streak + 1;
      setStreak(n);
      if (n > best) setBest(n);
    } else {
      setStreak(0);
    }
  }

  function handleTimeout() {
    if (answered) return;
    setTimedOut(true);
    setStreak(0);
  }

  function next() {
    const last = index + 1 >= questions.length;
    setSelected(null);
    setTimedOut(false);
    if (last) {
      setIndex(0);
      setRound((r) => r + 1); // fetch a fresh batch
    } else {
      setIndex((i) => i + 1);
    }
  }

  // After answering (or timing out), flash the result then auto-advance.
  useEffect(() => {
    if (!answered) return;
    const t = setTimeout(() => next(), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, index, round]);

  if (isError) {
    return (
      <Centered>
        <p className="text-sm text-muted">Couldn&apos;t load the quiz.</p>
        <Button onClick={() => refetch()} className="mt-3">
          Try again
        </Button>
      </Centered>
    );
  }

  if (!q) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted">Loading players…</p>
      </Centered>
    );
  }

  const correct = selected !== null && selected === q.answer;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-4">
      {/* Streak + timer */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 rounded-full border border-highlight/30 bg-highlight/10 px-2.5 py-1 font-semibold text-highlight">
            <Flame className="h-4 w-4" />
            {streak} streak
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Trophy className="h-3.5 w-3.5" />
            Best {best}
          </span>
        </div>
        <Timer
          key={q.id}
          duration={SECONDS}
          paused={answered}
          onExpire={handleTimeout}
        />
      </div>

      <p className="mb-3 text-center text-sm text-foreground/80">
        Which country are{" "}
        <span className="font-medium">all {q.players.length} players</span> citizens
        of?
      </p>

      {/* Faces */}
      <div className="mb-4 flex flex-wrap items-start justify-center gap-4">
        {q.players.map((p) => (
          <div key={p.id} className="flex w-24 flex-col items-center text-center">
            <PlayerAvatar name={p.name} imageUrl={p.image_url} size={84} />
            <span className="mt-1.5 text-xs font-medium leading-tight">{p.name}</span>
            <span className="text-[10px] text-muted">{p.club}</span>
            {answered && (
              <div className="mt-1 flex justify-center">
                <CitizenshipFlags
                  citizenships={p.citizenships.map((c, i) => ({
                    country: c,
                    is_primary: i === 0,
                  }))}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === selected;
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={answered}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                !answered &&
                  "border-border bg-surface hover:border-primary/40 hover:bg-surface-2",
                answered && isAnswer && "border-accent/50 bg-accent/15 text-accent",
                answered &&
                  isPicked &&
                  !isAnswer &&
                  "border-red-500/50 bg-red-500/15 text-red-400",
                answered && !isAnswer && !isPicked && "border-border bg-surface opacity-60"
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-base">
                  {countryFlag(opt)}
                </span>
                {opt}
              </span>
              {answered && isAnswer && <Check className="h-4 w-4 shrink-0" />}
              {answered && isPicked && !isAnswer && <X className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Reveal + next */}
      {answered && (
        <div className="mt-3 animate-fade-in rounded-lg border border-border bg-surface-2 p-3 text-center">
          <p className="text-sm font-medium">
            {correct ? (
              <span className="text-accent">Correct! 🔥 {streak} in a row</span>
            ) : (
              <span className="text-red-400">
                {timedOut ? "Time's up!" : "Not quite."} They all hold{" "}
                {countryFlag(q.answer)} {q.answer}.
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">Next round…</p>
        </div>
      )}
    </div>
  );
}

/** 5-second countdown bar; remounts (resets) per question via its `key`. */
function Timer({
  duration,
  paused,
  onExpire,
}: {
  duration: number;
  paused: boolean;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(duration);

  useEffect(() => {
    if (paused) return;
    const end = Date.now() + left * 1000;
    let fired = false;
    const iv = setInterval(() => {
      const rem = Math.max(0, (end - Date.now()) / 1000);
      setLeft(rem);
      if (rem <= 0 && !fired) {
        fired = true;
        onExpire();
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const pct = Math.max(0, Math.min(100, (left / duration) * 100));
  const low = left <= 2;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            low ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "w-6 text-right text-sm font-semibold tabular-nums",
          low ? "text-red-400" : "text-foreground"
        )}
      >
        {Math.ceil(left)}
      </span>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}
