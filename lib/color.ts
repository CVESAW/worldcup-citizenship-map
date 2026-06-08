/** Colour-scale helpers shared by the map choropleth and the stats charts. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Linearly interpolate between two hex colours. `t` in [0, 1]. */
export function lerpColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]);
}

/**
 * Map a count to a colour on a [low → high] ramp. Uses a square-root transform
 * so heavily-skewed data (e.g. France 109 vs most countries < 15) still shows
 * useful mid-range variation. Returns `empty` when count is 0.
 */
export function scaleColor(
  count: number,
  max: number,
  ramp: readonly [string, string],
  empty: string
): string {
  if (count <= 0 || max <= 0) return empty;
  const t = Math.sqrt(count) / Math.sqrt(max);
  return lerpColor(ramp[0], ramp[1], Math.max(0, Math.min(1, t)));
}

/** Colour ramps per map view mode. */
export const RAMPS = {
  linked: ["#10263a", "#22d3ee"] as const, // deep slate → cyan
  national: ["#0f2e25", "#34d399"] as const, // deep green → emerald
  exports: ["#3a2410", "#fb923c"] as const, // deep brown → orange
} as const;

export const MAP_EMPTY = "#121a2b";
/** Colour used to emphasise countries with NO linked players. */
export const MAP_NONE_HIGHLIGHT = "#f59e0b";
