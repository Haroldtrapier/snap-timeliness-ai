/**
 * Marketing imagery manifest.
 *
 * These photographs were generated for the SNAP AI marketing site with
 * Higgsfield (nano-banana / Fable-class image model): dignified, editorial,
 * government-grade visuals with no identifiable faces.
 *
 * Each entry has:
 *   - `local`: the preferred self-hosted path under /public/img
 *   - `cdn`:   the Higgsfield CDN URL, used as an automatic fallback until the
 *              asset is downloaded into the repo (see <Photo/> in components/)
 *   - `alt`:   accessible description
 *   - `fallback`: a CSS gradient rendered behind the image, so every media
 *                 surface reads as intentional even if no source resolves
 *
 * To self-host (recommended for production): download each `cdn` URL into
 * public/img/ using the exact `local` filename below, then commit. The
 * <Photo/> component prefers `local` and only falls back to `cdn` on error.
 *
 *   mkdir -p public/img
 *   B="https://d8j0ntlcm91z4.cloudfront.net/user_3F1AvYoVniiHQD6fzelAMpqB85u"
 *   curl -L -o public/img/hero-food.png       "$B/hf_20260711_025838_8cfaaed7-b941-4ce4-be38-0641db13fdb5.png"
 *   curl -L -o public/img/applicant-table.webp "$B/hf_20260711_031828_a2aa0ab2-1ae8-4caa-bdd2-fd542dded68f_min.webp"
 *   curl -L -o public/img/agency-desk.webp     "$B/hf_20260711_031856_319090bc-800b-4545-8ccc-4f838069a77d_min.webp"
 *   curl -L -o public/img/civic-building.webp  "$B/hf_20260711_031922_17b2c5e8-6795-48ff-a611-c63a01a4518c_min.webp"
 */

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3F1AvYoVniiHQD6fzelAMpqB85u";

export interface MediaAsset {
  local: string;
  cdn: string;
  alt: string;
  /** CSS gradient shown behind the image (and if it fails to load). */
  fallback: string;
}

export const media: Record<string, MediaAsset> = {
  hero: {
    local: "/img/hero-food.png",
    cdn: `${CDN}/hf_20260711_025838_8cfaaed7-b941-4ce4-be38-0641db13fdb5.png`,
    alt: "Fresh produce being sorted into a paper grocery bag at a community food distribution, warm morning light.",
    fallback: "linear-gradient(135deg, #1f6b39 0%, #14502a 45%, #0d1b2e 100%)",
  },
  applicant: {
    local: "/img/applicant-table.webp",
    cdn: `${CDN}/hf_20260711_031828_a2aa0ab2-1ae8-4caa-bdd2-fd542dded68f_min.webp`,
    alt: "A sunlit kitchen table with a benefits notice, a phone showing a checklist, and a person's hands holding documents.",
    fallback: "linear-gradient(135deg, #e6f3ea 0%, #f4f5f8 60%, #eef1f6 100%)",
  },
  agency: {
    local: "/img/agency-desk.webp",
    cdn: `${CDN}/hf_20260711_031856_319090bc-800b-4545-8ccc-4f838069a77d_min.webp`,
    alt: "A calm public-service caseworker desk with a monitor showing a clean analytics dashboard, in soft daylight.",
    fallback: "linear-gradient(135deg, #1c2c46 0%, #2a3a55 55%, #0d1b2e 100%)",
  },
  civic: {
    local: "/img/civic-building.webp",
    cdn: `${CDN}/hf_20260711_031922_17b2c5e8-6795-48ff-a611-c63a01a4518c_min.webp`,
    alt: "A neoclassical state government building with columns and a dome at golden hour.",
    fallback: "linear-gradient(135deg, #2a3a55 0%, #1c2c46 50%, #0d1b2e 100%)",
  },
};

/** Absolute CDN URL for the primary social-share (Open Graph) image. */
export const ogImage = media.hero.cdn;
