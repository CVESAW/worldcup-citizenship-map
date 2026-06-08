import { NextResponse } from "next/server";
import { getCountryDetail } from "@/lib/data/repository";

/** GET /api/countries/[country] — all players holding that citizenship. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params;
    const detail = await getCountryDetail(decodeURIComponent(country));
    if (!detail) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[/api/countries/[country]]", err);
    return NextResponse.json(
      { error: "Failed to load country" },
      { status: 500 }
    );
  }
}
