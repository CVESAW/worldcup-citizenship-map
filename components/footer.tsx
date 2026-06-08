import { Heart, Database, Info } from "lucide-react";

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
          Note: the underlying base map renders Crimea within Russia&apos;s
          borders. This is incorrect — Crimea is part of Ukraine, illegally
          occupied by Russia.
        </p>
        <p className="text-muted/70">
          World Cup Citizenship Map — an independent, educational visualisation.
          Not affiliated with FIFA or Transfermarkt.
        </p>
      </div>
    </footer>
  );
}
