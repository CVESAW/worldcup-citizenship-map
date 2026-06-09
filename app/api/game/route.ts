import { NextRequest, NextResponse } from "next/server";
import { getQuizQuestions } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

/** GET /api/game?count=10 — a fresh batch of citizenship-quiz questions. */
export async function GET(req: NextRequest) {
  try {
    const raw = Number(req.nextUrl.searchParams.get("count") ?? 10);
    const count = Math.min(20, Math.max(1, Number.isFinite(raw) ? raw : 10));
    const questions = await getQuizQuestions(count);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[/api/game]", err);
    return NextResponse.json({ error: "Failed to build quiz" }, { status: 500 });
  }
}
