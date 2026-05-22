import { AppShell } from "@/components/AppShell";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="org">{children}</AppShell>;
}
