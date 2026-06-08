import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe2,
  Layers,
  Users,
  Flag,
  Shuffle,
  TrendingUp,
  TrendingDown,
  Shield,
  MapPin,
  Plane,
  Send,
  Coins,
} from "lucide-react";
import { getStats } from "@/lib/data/repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankedList } from "@/components/ranked-list";
import type { RankedItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Statistics · World Cup Citizenship Map",
  description:
    "Aggregate insights: most/least diverse national teams and clubs, citizenship hubs, dual-citizens, and the most common and most unique citizenship combinations.",
};

export const dynamic = "force-dynamic";

function KpiCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: number | string;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  title,
  hint,
  items,
  kind,
  color,
  unit,
  showBar = true,
  className,
}: {
  icon: typeof Users;
  iconColor: string;
  title: string;
  hint: string;
  items: RankedItem[];
  kind: "country" | "club" | "combo";
  color: string;
  unit: string;
  showBar?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
          {title}
        </CardTitle>
        <p className="text-xs text-muted">{hint}</p>
      </CardHeader>
      <CardContent>
        <RankedList items={items} kind={kind} color={color} unit={unit} showBar={showBar} />
      </CardContent>
    </Card>
  );
}

export default async function StatsPage() {
  const stats = await getStats();
  const { kpis } = stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
        <p className="mt-1 text-sm text-muted">
          Aggregate insights across the dataset — tap any row to expand its details.{" "}
          <Link href="/" className="text-primary hover:underline">
            Back to the map
          </Link>
          .
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={Users} value={kpis.players} label="Players" />
        <KpiCard icon={Flag} value={kpis.nations} label="Teams" />
        <KpiCard icon={Globe2} value={kpis.countries} label="Countries" />
        <KpiCard icon={Layers} value={kpis.dual} label="Dual+ citizens" />
        <KpiCard icon={Shuffle} value={kpis.uniqueCombos} label="Unique combos" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard
          icon={TrendingUp}
          iconColor="#34d399"
          title="Most diverse national teams"
          hint="Squads drawing on the most distinct citizenship countries"
          items={stats.mostDiverseTeams}
          kind="country"
          color="#34d399"
          unit="countries"
        />
        <StatCard
          icon={TrendingDown}
          iconColor="#8a97ad"
          title="Least diverse national teams"
          hint="Squads with the fewest distinct citizenship countries"
          items={stats.leastDiverseTeams}
          kind="country"
          color="#64748b"
          unit="countries"
        />

        <StatCard
          icon={Shield}
          iconColor="#22d3ee"
          title="Clubs supplying the most players"
          hint="Clubs sending the most players to World Cup national-team squads"
          items={stats.clubsMostPlayers}
          kind="club"
          color="#22d3ee"
          unit="players"
        />
        <StatCard
          icon={MapPin}
          iconColor="#34d399"
          title="Top birth countries"
          hint="Where the most WC players were physically born"
          items={stats.topBirthCountries}
          kind="country"
          color="#34d399"
          unit="players"
        />

        <StatCard
          icon={Send}
          iconColor="#f59e0b"
          title="Top talent exporters"
          hint="Citizens of these countries who represent another nation"
          items={stats.topExporters}
          kind="country"
          color="#f59e0b"
          unit="players"
        />
        <StatCard
          icon={Plane}
          iconColor="#a78bfa"
          title="Most foreign-born squads"
          hint="Players born outside the nation they represent"
          items={stats.foreignBornTeams}
          kind="country"
          color="#a78bfa"
          unit="players"
        />

        <StatCard
          icon={Globe2}
          iconColor="#22d3ee"
          title="Most linked countries"
          hint="Players holding each citizenship (squad + heritage)"
          items={stats.mostLinkedCountries}
          kind="country"
          color="#22d3ee"
          unit="players"
        />
        <StatCard
          icon={Coins}
          iconColor="#fbbf24"
          title="Most valuable countries"
          hint="Combined market value of every citizen (squad + heritage)"
          items={stats.mostValuableCountries}
          kind="country"
          color="#fbbf24"
          unit=""
        />
        <StatCard
          icon={Layers}
          iconColor="#34d399"
          title="Most dual-citizens"
          hint="Multi-citizenship players per country"
          items={stats.mostDualCountries}
          kind="country"
          color="#34d399"
          unit="players"
        />

        <StatCard
          icon={Shuffle}
          iconColor="#22d3ee"
          title="Most common citizenship combinations"
          hint="Citizenship pairings shared by the most players"
          items={stats.commonCombos}
          kind="combo"
          color="#22d3ee"
          unit="players"
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}
