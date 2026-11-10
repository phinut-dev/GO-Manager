import Link from "next/link";
import { LuPlus } from "react-icons/lu";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";
import { formatRupiah, formatDate } from "@/lib/format";

export default async function GroupOrdersPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims?.claims?.sub)
    .single();
  const isOwner = profile?.role === "owner";

  const { data: gos, error } = await supabase
    .from("group_orders")
    .select("id, title, slug, price, quota, status, close_date, image_url")
    .order("created_at", { ascending: false });

  // Hitung slot terisi: order yang bukan waiting list dan tidak dibatalkan
  const filled = {};
  const ids = (gos ?? []).map((go) => go.id);

  if (ids.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("go_id, quantity")
      .in("go_id", ids)
      .eq("is_waitlist", false)
      .neq("fulfillment_status", "cancelled");

    (orders ?? []).forEach((order) => {
      filled[order.go_id] = (filled[order.go_id] ?? 0) + order.quantity;
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Group Order</h1>
        {isOwner && (
          <Link
            href="/group-orders/new"
            className="flex items-center gap-2 rounded-full bg-brand-300 px-4 py-2 font-semibold text-ink hover:bg-brand-400"
          >
            <LuPlus size={18} />
            Buat GO
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-100 p-4 text-rose-700">
          Gagal memuat data GO: {error.message}
        </p>
      )}

      {!error && gos?.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <p className="font-semibold">Belum ada Group Order</p>
          <p className="mt-1 text-sm text-muted">
            {isOwner
              ? "Klik Buat GO untuk membuka GO pertamamu."
              : "Owner belum membuat GO."}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gos?.map((go) => {
          const count = filled[go.id] ?? 0;
          const percent = Math.min(100, Math.round((count / go.quota) * 100));

          return (
            <Link
              key={go.id}
              href={`/group-orders/${go.id}`}
              className="block rounded-2xl border border-line bg-surface p-5 shadow-soft transition hover:border-brand-300"
            >
              {go.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={go.image_url}
                  alt={go.title}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              )}
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-bold leading-snug">{go.title}</h2>
                <StatusBadge type="go" value={go.status} />
              </div>

              <p className="text-lg font-semibold text-brand-700">
                {formatRupiah(go.price)}
              </p>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm text-muted">
                  <span>Slot terisi</span>
                  <span>
                    {count} / {go.quota}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
                  <div
                    className="h-full rounded-full bg-brand-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-muted">
                Tutup: {formatDate(go.close_date)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
