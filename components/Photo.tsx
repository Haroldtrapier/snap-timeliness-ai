"use client";

import { useState } from "react";

/**
 * Renders a self-hosted image with an automatic CDN fallback.
 *
 * `local` is the preferred, self-hosted path under /public (e.g. /img/hero.png).
 * If it 404s (because the asset hasn't been downloaded into the repo yet), the
 * component transparently swaps to the Higgsfield `cdn` URL, so the marketing
 * site looks correct both before and after self-hosting the imagery.
 *
 * A gradient fallback (rendered separately behind the image) covers the brief
 * gap and any case where neither source resolves.
 */
export function Photo({
  local,
  cdn,
  alt,
  width,
  height,
  className,
  loading = "lazy",
}: {
  local: string;
  cdn: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [src, setSrc] = useState(local);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => {
        if (src !== cdn) setSrc(cdn);
      }}
    />
  );
}
