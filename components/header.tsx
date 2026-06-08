"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, BarChart3 } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Map", icon: Globe },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Globe className="h-4 w-4" />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight sm:block">
          World Cup Citizenship Map
        </span>
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex w-full max-w-md justify-end">
        <SearchBar />
      </div>
    </header>
  );
}
