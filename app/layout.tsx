import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SNAP AI — Guidance and Preparation Support for SNAP",
  description:
    "SNAP AI helps applicants, recipients, navigators, and agencies prepare and move SNAP cases forward. Guidance only — not a government agency.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
