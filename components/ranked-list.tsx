"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { RankedItem } from "@/lib/types";
import { countryFlag } from "@/lib/countries";
import { cn, formatEuros } from "@/lib/utils";

type Kind = "country" | "club" | "combo";

/**
 * Colour-coded ranked bar list. Each row shows a proportional bar and expands
 * on click to reveal details (citizenship flags and/or the players involved).
 */
export function RankedList({
  items,
  kind,
  color = "#22d3ee",
  unit = "",
  showBar = true,
}: {
  items: RankedItem[];
  kind: Kind;
  color?: string;
  unit?: string;
  /** When false, render a plain ranked list (no proportional bar / value). */
  showBar?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No data.</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item, i) => {
        const expanded = open === item.id;
        const pct = Math.max(4, (item.value / max) * 100);
        const hasDetail =
          (item.countries?.length ?? 0) > 0 || (item.players?.length ?? 0) > 0;
        return (
          <li key={item.id} className="rounded-md">
            <button
              onClick={() => setOpen(expanded ? null : item.id)}
              disabled={!hasDetail}
              className={cn(
                "group relative flex w-full items-center gap-3 overflow-hidden rounded-md px-2.5 py-2 text-left transition-colors",
                hasDetail ? "hover:bg-surface-2" : "cursor-default"
              )}
            >
              {/* Bar fill */}
              {showBar && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-md opacity-20 transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              )}
              <span className="relative z-10 w-5 shrink-0 text-xs tabular-nums text-muted">
                {i + 1}
              </span>
              <span className="relative z-10 min-w-0 flex-1">
                <Label item={item} kind={kind} />
                {item.subtitle && (
                  <span className="block truncate text-[11px] text-muted">
                    {item.subtitle}
                  </span>
                )}
              </span>
              {showBar && (
                <span
                  className="relative z-10 shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color }}
                >
                  {item.display ?? item.value}
                  {unit && (
                    <span className="ml-1 text-[10px] font-normal text-muted">{unit}</span>
                  )}
                </span>
              )}
              {hasDetail && (
                <ChevronDown
                  className={cn(
                    "relative z-10 h-4 w-4 shrink-0 text-muted transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              )}
            </button>

            {expanded && hasDetail && (
              <div className="animate-fade-in border-l-2 border-border px-3 py-3 ml-2.5 mt-1 space-y-3">
                {kind !== "combo" && (item.countries?.length ?? 0) > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">
                      Citizenship countries ({item.countries!.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.countries!.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs"
                        >
                          <span aria-hidden>{countryFlag(c)}</span>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(item.players?.length ?? 0) > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">
                      Players ({item.players!.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.players!.map((p) => (
                        <Link
                          key={p.id}
                          href={`/player/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs transition-colors hover:border-primary/40 hover:text-primary"
                          title={`${p.name} · ${p.club} · ${p.represented_country}`}
                        >
                          <span aria-hidden>{countryFlag(p.represented_country)}</span>
                          {p.name}
                          {p.value ? (
                            <span className="text-[10px] text-muted">
                              {formatEuros(p.value)}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Label({ item, kind }: { item: RankedItem; kind: Kind }) {
  if (kind === "combo") {
    // Render the citizenship combo as a row of flags + names.
    const parts = item.countries ?? item.label.split(" + ");
    return (
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium">
        {parts.map((c, idx) => (
          <span key={c} className="inline-flex items-center gap-1">
            {idx > 0 && <span className="text-muted">+</span>}
            <span aria-hidden>{countryFlag(c)}</span>
            {c}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
      {kind === "country" && <span aria-hidden>{countryFlag(item.label)}</span>}
      <span className="truncate">{item.label}</span>
    </span>
  );
}
