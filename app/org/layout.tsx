import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <AppShell variant="org" userEmail={user?.email ?? null}>
      {children}
    </AppShell>
  );
}
