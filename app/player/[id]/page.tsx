import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Plane, Shirt } from "lucide-react";
import { getPlayer } from "@/lib/data/repository";
import { PlayerAvatar } from "@/components/player-avatar";
import { CountryFlag } from "@/components/flag";
import { MiniMap } from "@/components/mini-map";
import { Card, CardContent } from "@/components/ui/card";
import { countryFlag } from "@/lib/countries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return { title: "Player not found" };
  return {
    title: `${player.name} · World Cup Citizenship Map`,
    description: `${player.name} — ${player.club}. Citizenships: ${player.citizenships
      .map((c) => c.country)
      .join(", ")}.`,
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const citizenshipCountries = player.citizenships.map((c) => c.country);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to map
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Profile */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar name={player.name} imageUrl={player.image_url} size={88} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{player.name}</h1>
              <p className="mt-1 text-muted">
                {countryFlag(player.represented_country)}{" "}
                {player.represented_country}
                <span className="mx-2 text-border">·</span>
                {player.position}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-4">
              <InfoRow icon={Shirt} label="Club" value={player.club} />
              <InfoRow
                icon={MapPin}
                label="Represents"
                value={
                  <span>
                    {countryFlag(player.represented_country)}{" "}
                    {player.represented_country}
                  </span>
                }
              />
              <InfoRow
                icon={Plane}
                label="Birth country"
                value={
                  <span>
                    {countryFlag(player.birth_country)} {player.birth_country}
                  </span>
                }
              />
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted">
              Citizenships ({player.citizenships.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {player.citizenships.map((c) => (
                <CountryFlag
                  key={c.country}
                  country={c.country}
                  primary={c.is_primary}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mini-map */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Citizenship map</h2>
            <p className="text-xs text-muted">
              Countries where {player.name.split(" ")[0]} holds citizenship
            </p>
          </div>
          <div className="bg-[#0a1018] p-2">
            <MiniMap countries={citizenshipCountries} />
          </div>
        </Card>
      </div>
    </div>
  );
}
