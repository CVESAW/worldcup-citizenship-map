"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, User, Globe2, Shield } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  player: User,
  country: Globe2,
  team: Shield,
} as const;

async function fetchResults(q: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/players?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results ?? [];
}

export function SearchBar({
  className,
  onSelectResult,
}: {
  className?: string;
  /** Optional override; defaults to URL navigation. */
  onSelectResult?: (result: SearchResult) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input → instant-feeling but not chatty.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 120);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => fetchResults(debounced),
    enabled: debounced.length > 0,
    staleTime: 30_000,
  });

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function select(result: SearchResult) {
    setOpen(false);
    setValue("");
    setDebounced("");
    if (onSelectResult) {
      onSelectResult(result);
      return;
    }
    if (result.type === "player") router.push(`/player/${result.id}`);
    else if (result.type === "country")
      router.push(`/?country=${encodeURIComponent(result.id)}`);
    else router.push(`/?team=${encodeURIComponent(result.id)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) select(r);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && debounced.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search players, countries, or teams (e.g. 'Nigeria', 'Saka', 'Arsenal')…"
          className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Global search"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-2xl animate-fade-in">
          {results.length === 0 && !isFetching ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No matches for “{debounced}”
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r, i) => {
                const Icon = ICONS[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => select(r)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        i === activeIndex ? "bg-surface-2" : "hover:bg-surface-2"
                      )}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 text-muted">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {r.label}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {r.sublabel}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">
                        {r.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
