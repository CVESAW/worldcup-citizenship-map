import { Heart, Database, Info } from "lucide-react";

/** Official X (formerly Twitter) logo — not available in lucide. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-3 text-center text-xs leading-relaxed text-muted">
        <p className="flex items-center justify-center gap-1.5 text-foreground/80">
          <Heart className="h-3.5 w-3.5 text-primary" />
          Holding more than one citizenship doesn&apos;t make anyone any less a
          citizen of either country — dual and multiple nationals are full,
          equal citizens of every country they belong to.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          Player, club and citizenship data sourced from{" "}
          <a
            href="https://www.transfermarkt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Transfermarkt
          </a>
          ; squad compositions reflect listings at the time of fetching. Map
          boundaries from{" "}
          <a
            href="https://www.naturalearthdata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Natural Earth
          </a>
          .
        </p>
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
  