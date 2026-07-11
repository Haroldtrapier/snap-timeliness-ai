import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import { localeDir } from "@/lib/i18n/config";
import { ogImage } from "@/lib/media";
import "./globals.css";

// Self-hosted at build time via next/font (no CDN / external font requests).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SNAP AI — AI support for every step of the SNAP process",
  description:
    "SNAP AI helps applicants, recipients, benefits navigators, and county DSS agencies through the Supplemental Nutrition Assistance Program. Document checklists, notice explanations, deadline reminders, and agency workflow support.",
  applicationName: "SNAP AI",
  authors: [{ name: "SNAP AI, Public Benefit Corp." }],
  keywords: [
    "SNAP",
    "Supplemental Nutrition Assistance Program",
    "benefits navigator",
    "county DSS",
    "eligibility",
    "public benefits",
  ],
  openGraph: {
    title: "SNAP AI — AI support for every step of the SNAP process",
    description:
      "Document checklists, plain-language notice explanations, deadline reminders, and human-in-the-loop agency workflow support for SNAP.",
    siteName: "SNAP AI",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 2752,
        height: 1536,
        alt: "SNAP AI — preparing families for a complete, on-time SNAP application.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SNAP AI — AI support for every step of the SNAP process",
    description:
      "Document checklists, plain-language notice explanations, deadline reminders, and human-in-the-loop agency workflow support for SNAP.",
    images: [ogImage],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1b2e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
