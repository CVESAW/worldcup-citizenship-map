import { Suspense } from "react";
import {
  getCountrySummaries,
  getGeoCounts,
  getGeoRepCounts,
  getRepCountsByCountry,
  getCountryDetail,
  getTeamDetail,
} from "@/lib/data/repository";
import { countryToGeoName } from "@/lib/countries";
import { getGeoCentroids } from "@/lib/geo/centroids";
import { MapExplorer } from "@/components/map-explorer";

export const dynamic = "force-dynamic";

/**
 * Build a geoName -> canonical country resolver, choosing the country with the
 * most linked players when several map to the same shape (e.g. United Kingdom).
 */
function buildGeoToCountry(
  summaries: { country: string; playerCount: number }[]
): Record<string, string> {
  const best: Record<string, { country: string; count: number }> = {};
  for (const s of summaries) {
    const geo = countryToGeoName(s.country);
    if (!best[geo] || s.playerCount > best[geo].count) {
      best[geo] = { country: s.country, count: s.playerCount };
    }
  }
  return Object.fromEntries(
    Object.entries(best).map(([geo, v]) => [geo, v.country])
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; team?: string }>;
}) {
  const { country, team } = await searchParams;

  const [summaries, geoCounts, geoRepCounts, repByCountry] = await Promise.all([
    getCountrySummaries(),
    getGeoCounts(),
    getGeoRepCounts(),
    getRepCountsByCountry(),
  ]);

  // Server-render the active selection so the panel has no initial flash.
  const [initialCountry, initialTeam] = await Promise.all([
    country ? getCountryDetail(country) : Promise.resolve(null),
    team ? getTeamDetail(team) : Promise.resolve(null),
  ]);

  return (
    <Suspense>
      <MapExplorer
        geoCounts={geoCounts}
        geoRepCounts={geoRepCounts}
        repByCountry={repByCountry}
        geoCentroids={getGeoCentroids()}
        geoToCountry={buildGeoToCountry(summaries)}
        topCountries={summaries.map((s) => ({
          country: s.country,
          playerCount: s.playerCount,
        }))}
        initialCountry={initialCountry}
        initialTeam={initialTeam}
      />
    </Suspense>
  );
}
