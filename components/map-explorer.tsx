"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MousePointerClick, Sparkles } from "lucide-react";
import type { CountryDetail, TeamDetail } from "@/lib/types";
import { countryToGeoName } from "@/lib/countries";
import { RAMPS, MAP_NONE_HIGHLIGHT } from "@/lib/color";
import type { ColorMode, Arc } from "@/components/world-map";
import type { Centroids } from "@/lib/geo/centroids";
import { SidePanel } from "@/components/side-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, normalize } from "@/lib/utils";

// react-simple-maps touches the DOM; render it client-only.
const WorldMap = dynamic(
  () => import("@/components/world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  }
);

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
  return res.json();
}

export interface MapExplorerProps {
  /** geoName -> citizens (linked players) count. */
  geoCounts: Record<string, number>;
  /** geoName -> squad size (players who represent that nation). */
  geoRepCounts: Record<string, number>;
  /** canonical country -> squad size (for home-nation tooltip breakdowns). */
  repByCountry: Record<string, number>;
  /** geoName -> [lon, lat] centroid, for connection arcs. */
  geoCentroids: Centroids;
  /** geoName -> canonical country with the most linked players. */
  geoToCountry: Record<string, string>;
  topCountries: { country: string; playerCount: number }[];
  initialCountry?: CountryDetail | null;
  initialTeam?: TeamDetail | null;
}

const VIEWS: { id: ColorMode; label: string; desc: string }[] = [
  {
    id: "national",
    label: "National team",
    desc: "Colours each nation by how many players it brings to its own World Cup squad.",
  },
  {
    id: "linked",
    label: "Citizens",
    desc: "Colours every country by how many players hold its citizenship — its own squad plus citizens representing other nations.",
  },
  {
    id: "exports",
    label: "Citizen exports",
    desc: "Colours each country by how many of its citizens are at the World Cup playing for a different national team.",
  },
  {
    id: "none",
    label: "No players",
    desc: "Highlights the countries with no World Cup players at all (squad or citizenship).",
  },
];

export function MapExplorer({
  geoCounts,
  geoRepCounts,
  repByCountry,
  geoCentroids,
  geoToCountry,
  topCountries,
  initialCountry,
  initialTeam,
}: MapExplorerProps) {
  const router = useRouter();
  const params = useSearchParams();
  const country = params.get("country");
  const team = params.get("team");
  const [colorMode, setColorMode] = useState<ColorMode>("linked");

  // Active counts + colour scale for the chosen view.
  const { counts, maxCount, unit } = useMemo(() => {
    let src: Record<string, number>;
    let unit: string;
    if (colorMode === "national") {
      src = geoRepCounts;
      unit = "squad players";
    } else if (colorMode === "exports") {
      // Citizens of a country representing a different nation = citizens − squad.
      src = {};
      for (const [geo, citizens] of Object.entries(geoCounts)) {
        const exported = citizens - (geoRepCounts[geo] ?? 0);
        if (exported > 0) src[geo] = exported;
      }
      unit = "exported citizens";
    } else {
      // "linked" (citizens) and "none" both key off citizen counts.
      src = geoCounts;
      unit = "linked players";
    }
    return { counts: src, maxCount: Math.max(1, ...Object.values(src)), unit };
  }, [colorMode, geoCounts, geoRepCounts]);

  // Per-geo breakdown for shapes that aggregate several of our countries
  // (e.g. the "United Kingdom" shape = England + Scotland). Used in the tooltip
  // so the combined count is never mistaken for a single team.
  const breakdown = useMemo(() => {
    if (colorMode === "none" || colorMode === "exports")
      return {} as Record<string, { country: string; value: number }[]>;
    const perCountry: Record<string, number> =
      colorMode === "national"
        ? repByCountry
        : Object.fromEntries(topCountries.map((c) => [c.country, c.playerCount]));
    const byGeo: Record<string, { country: string; value: number }[]> = {};
    for (const [country, value] of Object.entries(perCountry)) {
      if (!value) continue;
      const geo = countryToGeoName(country);
      (byGeo[geo] ??= []).push({ country, value });
    }
    const out: Record<string, { country: string; value: number }[]> = {};
    for (const [geo, list] of Object.entries(byGeo)) {
      if (list.length > 1) out[geo] = list.sort((a, b) => b.value - a.value);
    }
    return out;
  }, [colorMode, repByCountry, topCountries]);

  const countryQuery = useQuery({
    queryKey: ["country", country],
    queryFn: () =>
      fetchJson<CountryDetail>(`/api/countries/${encodeURIComponent(country!)}`),
    enabled: !!country,
    initialData:
      initialCountry && initialCountry.country === country
        ? initialCountry
        : undefined,
  });

  const teamQuery = useQuery({
    queryKey: ["team", team],
    queryFn: () => fetchJson<TeamDetail>(`/api/teams/${encodeURIComponent(team!)}`),
    enabled: !!team,
    initialData: initialTeam && initialTeam.team === team ? initialTeam : undefined,
  });

  const mode = team ? "team" : country ? "country" : "idle";
  const open = mode !== "idle";

  const selectedGeo = country ? countryToGeoName(country) : null;
  const highlightGeos = useMemo(
    () =>
      mode === "team" && teamQuery.data
        ? teamQuery.data.countries.map(countryToGeoName)
        : [],
    [mode, teamQuery.data]
  );

  // Connection arcs: from the selected country to every country it shares
  // dual-citizens with, weighted by the number of shared players.
  const arcs: Arc[] = useMemo(() => {
    if (mode !== "country" || !countryQuery.data) return [];
    const selected = countryQuery.data.country;
    const counts = new Map<string, number>();
    for (const p of countryQuery.data.players) {
      if (p.citizenships.length < 2) continue;
      for (const c of p.citizenships) {
        if (normalize(c.country) === normalize(selected)) continue;
        counts.set(c.country, (counts.get(c.country) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([country, count]) => ({ geo: countryToGeoName(country), count }))
      .filter((a) => geoCentroids[a.geo])
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [mode, countryQuery.data, geoCentroids]);

  const handleSelectGeo = useCallback(
    (geoName: string) => {
      const resolved = geoToCountry[geoName];
      if (!resolved) return; // no linked players for this shape
      router.push(`/?country=${encodeURIComponent(resolved)}`, { scroll: false });
    },
    [geoToCountry, router]
  );

  const close = useCallback(
    () => router.push("/", { scroll: false }),
    [router]
  );

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="hero-glow absolute inset-0" />

      <WorldMap
        counts={counts}
        maxCount={maxCount}
        colorMode={colorMode}
        unit={unit}
        breakdown={breakdown}
        selectedGeo={selectedGeo}
        highlightGeos={highlightGeos}
        arcs={arcs}
        centroids={geoCentroids}
        onSelectGeo={handleSelectGeo}
      />

      {/* Colour-mode control + legend (top-left) */}
      <div className="absolute left-4 top-4 z-10 flex w-[min(86vw,260px)] flex-col gap-2">
        <div className="rounded-lg border border-border bg-surface/85 p-1.5 backdrop-blur">
          <div className="px-1.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Colour the map by
          </div>
          <div className="flex flex-col gap-0.5" role="radiogroup" aria-label="Map colour mode">
            {VIEWS.map((v) => {
              const active = colorMode === v.id;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setColorMode(v.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:bg-surface-2"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {v.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted">
                    {v.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <Legend colorMode={colorMode} maxCount={maxCount} />
        {mode === "team" && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1.5 text-xs text-[#a78bfa] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {highlightGeos.length} countries highlighted for this squad
          </div>
        )}
      </div>

      {/* Idle helper + quick-pick chips */}
      {!open && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-10 w-[min(92vw,640px)] -translate-x-1/2 text-center">
          <div className="pointer-events-auto inline-flex flex-col items-center gap-3 rounded-xl border border-border bg-surface/70 px-5 py-4 backdrop-blur">
            <p className="flex items-center gap-2 text-sm text-muted">
              <MousePointerClick className="h-4 w-4 text-primary" />
              Click any country to see its World Cup citizens, or search a club.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {topCountries.slice(0, 8).map((c) => (
                <button
                  key={c.country}
                  onClick={() =>
                    router.push(`/?country=${encodeURIComponent(c.country)}`, {
                      scroll: false,
                    })
                  }
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground/90 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {c.country}
                  <span className="ml-1 text-muted">{c.playerCount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side panel: floating column on desktop, bottom sheet on mobile */}
      {open && (
        <>
          <button
            aria-label="Close panel"
            onClick={close}
            className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] md:hidden"
          />
          <div className="absolute inset-x-0 bottom-0 z-30 h-[72%] animate-fade-in md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[400px] md:border-l md:border-border">
            <div className="h-full overflow-hidden rounded-t-2xl border border-border bg-surface md:rounded-none md:border-0">
              {mode === "country" ? (
                <SidePanel
                  kind="country"
                  detail={countryQuery.data ?? null}
                  loading={countryQuery.isLoading}
                  error={
                    countryQuery.isError ? "Could not load this country." : null
                  }
                  onClose={close}
                />
              ) : (
                <SidePanel
                  kind="team"
                  detail={teamQuery.data ?? null}
                  loading={teamQuery.isLoading}
                  error={teamQuery.isError ? "Could not load this team." : null}
                  onClose={close}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Colour legend that adapts to the active view mode. */
function Legend({
  colorMode,
  maxCount,
}: {
  colorMode: ColorMode;
  maxCount: number;
}) {
  if (colorMode === "none") {
    return (
      <div className="inline-flex w-fit items-center gap-3 rounded-lg border border-border bg-surface/80 px-3 py-1.5 text-xs backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ background: MAP_NONE_HIGHLIGHT }}
          />
          No linked players
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <span className="h-3 w-3 rounded-sm" style={{ background: "#161f33" }} />
          Has players
        </span>
      </div>
    );
  }
  const ramp = RAMPS[colorMode];
  const label =
    colorMode === "national"
      ? "Squad players"
      : colorMode === "exports"
        ? "Exported citizens"
        : "Citizens";
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface/80 px-3 py-1.5 text-xs backdrop-blur">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums text-muted">1</span>
      <span
        className="h-2.5 w-20 rounded-full"
        style={{ background: `linear-gradient(90deg, ${ramp[0]}, ${ramp[1]})` }}
      />
      <span className="tabular-nums text-muted">{maxCount}</span>
    </div>
  );
}
