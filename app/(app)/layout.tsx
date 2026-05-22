import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <AppShell variant="applicant" userEmail={user?.email ?? null}>
      {children}
    </AppShell>
  );
}
