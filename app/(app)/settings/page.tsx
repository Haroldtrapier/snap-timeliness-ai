import { redirect } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { getCurrentProfile } from "@/lib/db/profiles";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600">Your profile, language, accessibility, and notification preferences.</p>
      </header>
      <Disclaimer variant="compact" />

      <SettingsForm profile={profile} />

      <div className="card card-pad">
        <h2 className="font-semibold">Privacy</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Your documents are private. Only you and your assigned caseworker can access them.</li>
          <li>AI requests are processed on our server. The AI provider does not see your account login.</li>
          <li>You can export or delete your data at any time during pilot.</li>
        </ul>
      </div>
    </div>
  );
}
