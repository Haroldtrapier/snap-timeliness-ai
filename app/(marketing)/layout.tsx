import { MarketingNav, MarketingFooter } from "@/components/MarketingNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </>
  );
}
