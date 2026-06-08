"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
} from "react-simple-maps";
import { countryToGeoName } from "@/lib/countries";

const GEO_URL = "/world-110m.json";

interface GeoShape {
  rsmKey: string;
  properties: { name: string };
}

/** Compact, non-interactive map that highlights a set of countries. */
export function MiniMap({ countries }: { countries: string[] }) {
  const highlight = useMemo(
    () => new Set(countries.map(countryToGeoName)),
    [countries]
  );

  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 155 }}
      style={{ width: "100%", height: "auto" }}
    >
      <Sphere id="mini-sphere" stroke="#0a0f1a" strokeWidth={0.5} fill="#0a1018" />
      <Geographies geography={GEO_URL}>
        {({ geographies }: { geographies: GeoShape[] }) =>
          geographies.map((geo) => {
            const on = highlight.has(geo.properties.name);
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: on ? "#34d399" : "#141d2e",
                    stroke: "#0a0f1a",
                    strokeWidth: 0.4,
                    outline: "none",
                  },
                  hover: {
                    fill: on ? "#34d399" : "#141d2e",
                    stroke: "#0a0f1a",
                    strokeWidth: 0.4,
                    outline: "none",
                  },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
