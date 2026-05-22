import Link from "next/link";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-applicants", label: "Applicants" },
  { href: "/for-recipients", label: "Recipients" },
  { href: "/for-navigators", label: "Navigators" },
  { href: "/for-agencies", label: "Agencies" },
  { href: "/integrity", label: "Integrity" },
  { href: "/pilot", label: "Pilot" },
  { href: "/faq", label: "FAQ" },
];

export function MarketingNav() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container-page flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-brand-700 text-lg">
          SNAP AI
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-700">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="container-page py-8 text-xs text-gray-500">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-700">SNAP AI</div>
            <div className="mt-1 max-w-md">
              SNAP AI is not a government agency. Final eligibility decisions are made by your state SNAP agency. SNAP AI provides guidance and preparation support only.
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/integrity">Program integrity</Link>
            <Link href="/pilot">Pilot program</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
