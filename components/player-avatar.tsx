"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Deterministic accent based on the name, so avatars feel varied but stable. */
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

/**
 * Player image with a graceful initials fallback. `image_url` is rendered when
 * present; otherwise a colourful monogram is shown (no broken-image states).
 */
export function PlayerAvatar({
  name,
  imageUrl,
  size = 48,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (imageUrl && !errored) {
    // External, unoptimized to avoid next/image domain config for arbitrary hosts.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        className={cn("rounded-full bg-surface-2 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const hue = hueFor(name);
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size *