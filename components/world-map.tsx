"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup,
  Line,
  Marker,
} from "react-simple-maps";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { RAMPS, MAP_EMPTY, MAP_NONE_HIGHLIGHT, scaleColor, lerpColor } from "@/lib/color";

const GEO_URL = "/world-110m.json";
const UK_URL = "/uk-nations.json";

export type MapMode = "idle" | "country" | "team";
export type ColorMode = "linked" | "national" | "exports" | "none";

/** A connection from the selected country to a country it shares dual-citizens with. */
export interface Arc {
  /** Target shape name. */
  geo: string;
  /** Number of shared dual-citizen players (drives thickness + label). */
  count: number;
}

interface GeoShape {
  rsmKey: string;
  properties: { name: string };
}

export interface WorldMapProps {
  /** geoName -> count to colour by (citizens or squad size, per view mode). */
  counts: Record<string, number>;
  maxCount: number;
  colorMode: ColorMode;
  /** Word used in the hover tooltip, e.g. "citizens" / "squad players". */
  unit: string;
  /** Per-geo breakdown for shapes aggregating several countries (e.g. UK). */
  breakdown?: Record<string, { country: string; value: number }[]>;
  /** Single selected shape (Country interaction mode). */
  selectedGeo?: string | null;
  /** Multiple highlighted shapes (Team interaction mode). */
  highlightGeos?: string[];
  /** Dual-citizen connections drawn from the selected country. */
  arcs?: Arc[];
  /** geoName -> [lon, lat] centroid, for arc endpoints. */
  centroids?: Record<string, [number, number]>;
  onSelectGeo?: (geoName: string) => void;
}

const ARC_COLOR = "#fbbf24"; // amber

const SELECTED = "#f59e0b"; // amber — single country
const TEAM_HIGHLIGHT = "#a78bfa"; // violet — team mode (distinct from ramps)
const STROKE = "#0a0f1a";

export function WorldMap({
  counts,
  maxCount,
  colorMode,
  unit,
  breakdown,
  selectedGeo,
  highlightGeos,
  arcs,
  centroids,
  onSelectGeo,
}: WorldMapProps) {
  const [hovered, setHovered] = useState<{ name: string; count: number } | null>(
    null
  );
  const [tooltip, setTooltip] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([10, 15]);

  const highlightSet = useMemo(() => new Set(highlightGeos ?? []), [highlightGeos]);

  const fromCentroid =
    selectedGeo && centroids ? centroids[selectedGeo] ?? null : null;
  const maxArc = arcs && arcs.length ? Math.max(...arcs.map((a) => a.count)) : 1;

  function baseFill(name: string): string {
    if (selectedGeo && name === selectedGeo) return SELECTED;
    if (highlightSet.has(name)) return TEAM_HIGHLIGHT;
    const c = counts[name] ?? 0;
    if (colorMode === "none") return c > 0 ? "#161f33" : MAP_NONE_HIGHLIGHT;
    return scaleColor(c, maxCount, RAMPS[colorMode], MAP_EMPTY);
  }

  function fillFor(name: string): string {
    const f = baseFill(name);
    return hovered?.name === name ? lerpColor(f, "#ffffff", 0.2) : f;
  }

  function reset() {
    setZoom(1);
    setCenter([10, 15]);
  }

  // Shared renderer for both the base map and the UK home-nations overlay.
  function renderGeo(geo: GeoShape) {
    const name = geo.properties.name;
    const count = counts[name] ?? 0;
    const style = {
      fill: fillFor(name),
      stroke: STROKE,
      strokeWidth: 0.4,
      outline: "none",
      cursor: onSelectGeo ? "pointer" : "default",
    };
    return (
      <Geography
        key={geo.rsmKey}
        geography={geo}
        onMouseEnter={() => setHovered({ name, count })}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onSelectGeo?.(name)}
        style={{
          default: { ...style, transition: "fill 0.15s ease" },
          hover: style,
          pressed: { ...style, outline: "none" },
        }}
      />
    );
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 170 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
          minZoom={1}
          maxZoom={8}
        >
          <Sphere id="sphere" stroke={STROKE} strokeWidth={0.5} fill="#0a1018" />
          <Graticule stroke="#16203200" strokeWidth={0.5} />
          {/* Base world map — skip the combined "United Kingdom" shape; the UK's
              home nations are drawn separately from the overlay below. */}
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeoShape[] }) =>
              geographies
                .filter((geo) => geo.properties.name !== "United Kingdom")
                .map(renderGeo)
            }
          </Geographies>
          {/* England / Scotland / Wales / Northern Ireland as individual shapes. */}
          <Geographies geography={UK_URL}>
            {({ geographies }: { geographies: GeoShape[] }) =>
              geographies.map(renderGeo)
            }
          </Geographies>

          {/* Dual-citizen connection arcs from the selected country. */}
          {fromCentroid && arcs && arcs.length > 0 && centroids && (
            <g style={{ pointerEvents: "none" }}>
              <defs>
                <marker
                  id="arc-head"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={ARC_COLOR} />
                </marker>
              </defs>
              {arcs.map((a) => {
                const to = centroids[a.geo];
                if (!to) return null;
                const width = 1.2 + (a.count / maxArc) * 5;
                const mid: [number, number] = [
                  (fromCentroid[0] + to[0]) / 2,
                  (fromCentroid[1] + to[1]) / 2,
                ];
                const halfW = 7 + String(a.count).length * 3.5;
                return (
                  <g key={a.geo}>
                    <Line
                      from={fromCentroid}
                      to={to}
                      stroke={ARC_COLOR}
                      strokeWidth={width}
                      strokeLinecap="round"
                      strokeOpacity={0.7}
                      fill="none"
                      markerEnd="url(#arc-head)"
                    />
                    <Marker coordinates={mid}>
                      <rect
                        x={-halfW}
                        y={-8}
                        width={halfW * 2}
                        height={16}
                        rx={8}
                        fill="#0d1320"
                        stroke={ARC_COLOR}
                        strokeWidth={0.6}
                      />
                      <text
                        textAnchor="middle"
                        y={4}
                        fontSize={11}
                        fontWeight={600}
                        fill={ARC_COLOR}
                      >
                        {a.count}
                      </text>
                    </Marker>
                  </g>
                );
              })}
            </g>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <div className="font-medium">{hovered.name}</div>
          <div className="text-muted">
            {hovered.count > 0
              ? `${hovered.count} ${unit}`
              : colorMode === "none"
                ? "No linked players"
                : `No ${unit}`}
          </div>
          {breakdown?.[hovered.name] && (
            <div className="mt-1 border-t border-border pt-1 text-[11px] text-muted">
              {breakdown[hovered.name].map((b) => (
                <div key={b.country} className="flex justify-between gap-3">
                  <span>{b.country}</span>
                  <span className="tabular-nums">{b.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(8, z * 1.5))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface/90 text-foreground backdrop-blur transition-colors hover:bg-surface-2"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface/90 text-foreground backdrop-blur transition-colors hover:bg-surface-2"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          aria-label="Reset view"
          onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface/90 text-foreground backdrop-blur transition-colors hover:bg-surface-2"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
