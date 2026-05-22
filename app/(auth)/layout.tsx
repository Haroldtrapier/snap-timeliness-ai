import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-14 items-center">
          <Link href="/" className="font-bold text-brand-700 text-lg">SNAP AI</Link>
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}
