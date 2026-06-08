import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "@/components/player-avatar";
import { CitizenshipFlags } from "@/components/flag";
import { countryFlag } from "@/lib/countries";

/**
 * Player card: photo, name, club, represented national team, and mini-flag
 * badges for every held citizenship. Links to the full player profile.
 */
export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/player/${player.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary/40 hover:bg-surface-2"
    >
      <PlayerAvatar name={player.name} imageUrl={player.image_url} size={48} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{player.name}</span>
          <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
            {player.position}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm text-muted">
          {player.club}
          <span className="mx-1.5 text-border">·</span>
          <span title={`Represents ${player.represented_country}`}>
            {countryFlag(player.represented_country)} {player.represented_country}
          </span>
        </div>
        <CitizenshipFlags citizenships={player.citizenships} className="mt-2" />
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
