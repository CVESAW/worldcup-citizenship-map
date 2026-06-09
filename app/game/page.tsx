import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";
import { QuizGame } from "@/components/quiz-game";

export const metadata: Metadata = {
  title: "Citizenship Quiz · World Cup Citizenship Map",
  description:
    "Guess which country each World Cup player is a citizen of — a quick multiple-choice game about football's dual nationals.",
};

export default function GamePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-2 flex items-center justify-center gap-2 text-center">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Citizenship Quiz</h1>
      </div>
      <p className="mx-auto mb-2 max-w-md text-center text-sm text-muted">
        Three players appear — pick the one country they&apos;re all citizens of.
        You have 5 seconds each. How long a streak can you build?
      </p>
      <QuizGame />
    </div>
  );
}
