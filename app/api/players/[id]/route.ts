import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/data/repository";

/** GET /api/players/[id] — single player with citizenships. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await getPlayer(decodeURIComponent(id));
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (err) {
    console.error("[/api/players/[id]]", err);
    return NextResponse.json(
      { error: "Failed to load player" },
      { status: 500 }
    );
  }
}
