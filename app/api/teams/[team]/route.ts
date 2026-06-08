import { NextResponse } from "next/server";
import { getTeamDetail } from "@/lib/data/repository";

/** GET /api/teams/[team] — squad + every citizenship country represented. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ team: string }> }
) {
  try {
    const { team } = await params;
    const detail = await getTeamDetail(decodeURIComponent(team));
    if (!detail) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[/api/teams/[team]]", err);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}
