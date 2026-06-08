"use client";

import { X, Globe2, Shield, Users, Layers } from "lucide-react";
import type { CountryDetail, Player, TeamDetail } from "@/lib/types";
import { PlayerCard } from "@/components/player-card";
import { CountryFlag } from "@/components/flag";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag } from "@/lib/countries";
import { normalize } from "@/lib/utils";

interface BaseProps {
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

type Props =
  | (BaseProps & { kind: "country"; detail: CountryDetail | null })
  | (BaseProps & { kind: "team"; detail: TeamDetail | null });

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
      <Icon className="h-4 w-4 text-primary" />
      <div className="leading-tight">
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

export function SidePanel(props: Props) {
  const { loading, error, onClose, kind } = props;

  return (
    <aside className="flex h-full w-full flex-col bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
            {kind === "country" ? (
              <Globe2 className="h-3.5 w-3.5" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            {kind === "country" ? "Country" : "Team"}
          </div>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
            {props.detail ? (
              <>
                {kind === "country" && (
                  <span aria-hidden>{countryFlag(props.detail.country)}</span>
                )}
                <span className="truncate">
                  {kind === "country" ? props.detail.country : props.detail.team}
                </span>
              </>
            ) : loading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              "—"
            )}
          </h2>
        </div>
        <button
          aria-label="Close panel"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
            {error}
          </div>
        ) : loading ? (
          <LoadingState />
        ) : props.kind === "country" && props.detail ? (
          <CountryBody detail={props.detail} />
        ) : props.kind === "team" && props.detail ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Stat icon={Users} label="WC players" value={props.detail.playerCount} />
              <Stat
                icon={Globe2}
                label="Countries"
                value={props.detail.countries.length}
              />
            </div>
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Citizenships represented
              </div>
              <div className="flex flex-wrap gap-1">
                {props.detail.countries.map((c) => (
                  <CountryFlag key={c} country={c} />
                ))}
              </div>
            </div>
            <PlayerList players={props.detail.players} />
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
            Nothing to show.
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Country view: splits players into those who represent the nation and those
 * who merely hold its citizenship (but represent another country).
 */
function CountryBody({ detail }: { detail: CountryDetail }) {
  const target = normalize(detail.country);
  const playsFor = detail.players.filter(
    (p) => normalize(p.represented_country) === target
  );
  const alsoCitizen = detail.players.filter(
    (p) => normalize(p.represented_country) !== target
  );

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat icon={Users} label="Citizens" value={detail.playerCount} />
        <Stat icon={Layers} label="Dual citizens" value={detail.dualCount} />
      </div>
      {playsFor.length > 0 && (
        <PlayerList
          title={`Plays for ${detail.country} (${playsFor.length})`}
          players={playsFor}
        />
      )}
      {alsoCitizen.length > 0 && (
        <PlayerList
          title={`Also a citizen · represents another nation (${alsoCitizen.length})`}
          players={alsoCitizen}
          className={playsFor.length > 0 ? "mt-5" : undefined}
        />
      )}
    </>
  );
}

function PlayerList({
  players,
  title = "Players",
  className,
}: {
  players: Player[];
  title?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {title}
      </div>
      {players.map((p) => (
        <PlayerCard key={p.id} player={p} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px]" />
      ))}
    </div>
  );
}
