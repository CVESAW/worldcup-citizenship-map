import { NextRequest, NextResponse } from "next/server";
import { getAllPlayers, search } from "@/lib/data/repository";

/**
 * GET /api/players          — full player list (with citizenships).
 * GET /api/players?q=saka   — unified search across players/countries/teams.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (q !== null) {
      const results = await search(q);
      return NextResponse.json({ results });
    }
    const players = await getAllPlayers();
    return NextResponse.json({ players });
  } catch (err) {
    console.error("[/api/players]", err);
    return NextResponse.json(
      { error: "Failed to load players" },
      { status: 500 }
    );
  }
}
