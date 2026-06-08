import { NextResponse } from "next/server";
import { getCountrySummaries, getGeoCounts } from "@/lib/data/repository";

/** GET /api/countries — per-country aggregates + map view-model. */
export async function GET() {
  try {
    const [countries, geoCounts] = await Promise.all([
      getCountrySummaries(),
      getGeoCounts(),
    ]);
    return NextResponse.json({ countries, geoCounts });
  } catch (err) {
    console.error("[/api/countries]", err);
    return NextResponse.json(
      { error: "Failed to load countries" },
      { status: 500 }
    );
  }
}
