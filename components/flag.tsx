import { countryFlag } from "@/lib/countries";
import { cn } from "@/lib/utils";

/** A single citizenship pill: flag emoji + country name. */
export function CountryFlag({
  country,
  primary = false,
  className,
}: {
  country: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <span
      title={`${country}${primary ? " (primary)" : ""}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        primary
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-surface-2 text-foreground/80",
        className
      )}
    >
      <span aria-hidden className="text-sm leading-none">
        {countryFlag(country)}
      </span>
      {country}
    </span>
  );
}

/** Row of citizenship flags, primary first. */
export function CitizenshipFlags({
  citizenships,
  className,
}: {
  citizenships: { country: string; is_primary: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {citizenships.map((c) => (
        <CountryFlag key={c.country} country={c.country} primary={c.is_primary} />
      ))}
    </div>
  );
}
