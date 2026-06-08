/**
 * Longitude/latitude centroids for every map shape, used to anchor the
 * connection arcs drawn from a selected country. Computed once from the same
 * map files the client renders (base world + UK home-nation overlay).
 */
import { feature } from "topojson-client";
import { geoCentroid } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldTopo from "../../public/world-110m.json";
import ukGeo from "../../public/uk-nations.json";

export type Centroids = Record<string, [number, number]>;

let cached: Centroids | null = null;

export function getGeoCentroids(): Centroids {
  if (cached) return cached;

  const out: Centroids = {};

  // Base world map (topojson) — exclude the combined UK shape (split below).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topo = worldTopo as any;
  const world = feature(topo, topo.objects.countries) as unknown as FeatureCollection<
    Geometry,
    { name: string }
  >;
  for (const f of world.features) {
    const name = f.properties?.name;
    if (!name || name === "United Kingdom") continue;
    out[name] = geoCentroid(f as Feature) as [number, number];
  }

  // UK home nations (geojson).
  const uk = ukGeo as unknown as FeatureCollection<Geometry, { name: string }>;
  for (const f of uk.features) {
    const name = f.properties?.name;
    if (!name) continue;
    out[name] = geoCentroid(f as Feature) as [number, number];
  }

  cached = out;
  return out;
}
