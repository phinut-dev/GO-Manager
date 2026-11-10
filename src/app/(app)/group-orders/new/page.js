import Link from "next/link";
import { redirect } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { createClient } from "@/lib/supabase/server";
import GroupOrderForm from "@/components/GroupOrderForm";

export default async function NewGroupOrderPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims?.claims?.sub)
    .single();

  if (profile?.role !== "owner") redirect("/group-orders");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/group-orders"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <LuArrowLeft size={16} />
        Kembali
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Buat Group Order</h1>
      <GroupOrderForm />
    </div>
  );
}
