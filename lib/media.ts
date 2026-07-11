/**
 * Marketing imagery manifest.
 *
 * These photographs were generated for the SNAP AI marketing site with
 * Higgsfield (nano-banana / Fable-class image model) and are hosted on
 * Higgsfield's asset CDN. They are dignified, editorial, government-grade
 * visuals with no identifiable faces.
 *
 * Each entry provides a `src` (full resolution) and `min` (optimized WebP).
 * Components pair every image with a CSS gradient fallback, so the layout
 * still reads as intentional if an asset URL is ever unavailable.
 *
 * To fully self-host: download each `src` into `public/img/` and swap the
 * URLs below for local paths (e.g. `/img/hero-food.png`). The CDN host is
 * currently outside this environment's egress allow-list, so the download
 * must happen from a network that can reach the asset host.
 */

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3F1AvYoVniiHQD6fzelAMpqB85u";

export interface MediaAsset {
  src: string;
  min: string;
  alt: string;
  /** CSS gradient shown behind the image (and if it fails to load). */
  fallback: string;
}

export const media: Record<string, MediaAsset> = {
  hero: {
    src: `${CDN}/hf_20260711_025838_8cfaaed7-b941-4ce4-be38-0641db13fdb5.png`,
    min: `${CDN}/hf_20260711_025838_8cfaaed7-b941-4ce4-be38-0641db13fdb5_min.webp`,
    alt: "Fresh produce being sorted into a paper grocery bag at a community food distribution, warm morning light.",
    fallback: "linear-gradient(135deg, #1f6b39 0%, #14502a 45%, #0d1b2e 100%)",
  },
  applicant: {
    src: `${CDN}/hf_20260711_031828_a2aa0ab2-1ae8-4caa-bdd2-fd542dded68f.png`,
    min: `${CDN}/hf_20260711_031828_a2aa0ab2-1ae8-4caa-bdd2-fd542dded68f_min.webp`,
    alt: "A sunlit kitchen table with a benefits notice, a phone showing a checklist, and a person's hands holding documents.",
    fallback: "linear-gradient(135deg, #e6f3ea 0%, #f4f5f8 60%, #eef1f6 100%)",
  },
  agency: {
    src: `${CDN}/hf_20260711_031856_319090bc-800b-4545-8ccc-4f838069a77d.png`,
    min: `${CDN}/hf_20260711_031856_319090bc-800b-4545-8ccc-4f838069a77d_min.webp`,
    alt: "A calm public-service caseworker desk with a monitor showing a clean analytics dashboard, in soft daylight.",
    fallback: "linear-gradient(135deg, #1c2c46 0%, #2a3a55 55%, #0d1b2e 100%)",
  },
  civic: {
    src: `${CDN}/hf_20260711_031922_17b2c5e8-6795-48ff-a611-c63a01a4518c.png`,
    min: `${CDN}/hf_20260711_031922_17b2c5e8-6795-48ff-a611-c63a01a4518c_min.webp`,
    alt: "A neoclassical state government building with columns and a dome at golden hour.",
    fallback: "linear-gradient(135deg, #2a3a55 0%, #1c2c46 50%, #0d1b2e 100%)",
  },
};
