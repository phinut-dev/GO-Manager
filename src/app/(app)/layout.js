import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import RouteLoadingIndicator from "@/components/RouteLoadingIndicator";

export default async function AppLayout({ children }) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", data.claims.sub)
    .single();

  if (!profile || !profile.is_active) {
    return (
      <main className="space-y-4 p-6">
        <p className="text-rose-700">
          Akun belum punya profil aktif. Hubungi Owner.
        </p>
        <LogoutButton />
      </main>
    );
  }

  const { data: store } = await supabase
    .from("store_settings")
    .select("name")
    .eq("id", 1)
    .single();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        storeName={store?.name ?? "GO Manager"}
        fullName={profile.full_name}
        role={profile.role}
      />
      <RouteLoadingIndicator />
      <main className="min-w-0 flex-1 p-4 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
