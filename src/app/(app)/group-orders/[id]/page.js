import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";
import GoStatusControl from "@/components/GoStatusControl";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatRupiah, formatDate } from "@/lib/format";

export default async function GoDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [claimsResult, goResult] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("group_orders").select("*").eq("id", id).single(),
  ]);
  const { data: claims } = claimsResult;
  const { data: go } = goResult;

  if (!go) notFound();

  const profilePromise = supabase
    .from("profiles")
    .select("role")
    .eq("id", claims?.claims?.sub)
    .single();
  const ordersPromise = supabase
    .from("orders")
    .select(
      "id, customer_name, phone, quantity, payment_status, fulfillment_status, is_waitlist",
    )
    .eq("go_id", id)
    .order("created_at", { ascending: true });

  const [profileResult, ordersResult] = await Promise.all([
    profilePromise,
    ordersPromise,
  ]);
  const isOwner = profileResult.data?.role === "owner";
  const { data: orders } = ordersResult;

  const list = orders ?? [];
  const active = list.filter(
    (o) => !o.is_waitlist && o.fulfillment_status !== "cancelled",
  );
  const filled = active.reduce((sum, o) => sum + o.quantity, 0);
  const waitlist = list.filter(
    (o) => o.is_waitlist && o.fulfillment_status !== "cancelled",
  );
  const percent = Math.min(100, Math.round((filled / go.quota) * 100));

  // Modal dan profit: hanya Owner (tabel go_costs terkunci untuk Admin)
  let cost = 0;
  if (isOwner) {
    const { data: costRow } = await supabase
      .from("go_costs")
      .select("cost_per_item")
      .eq("go_id", id)
      .single();
    cost = costRow?.cost_per_item ?? 0;
  }
  const revenue = go.price * filled;
  const profit = (go.price - cost) * filled;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/group-orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <LuArrowLeft size={16} />
        Kembali
      </Link>

      {/* Info utama */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row">
          {go.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={go.image_url}
              alt={go.title}
              className="h-48 w-full shrink-0 rounded-xl object-cover sm:w-48"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold">{go.title}</h1>
              <StatusBadge type="go" value={go.status} />
            </div>
            <p className="mt-1 text-lg font-semibold text-brand-700">
              {formatRupiah(go.price)}
            </p>
            {go.description && (
              <p className="mt-3 whitespace-pre-line text-muted">
                {go.description}
              </p>
            )}
            <p className="mt-3 text-sm text-muted">
              Tutup: {formatDate(go.close_date)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-sm text-muted">
            <span>Slot terisi</span>
            <span>
              {filled} / {go.quota}
              {waitlist.length > 0 && ` · ${waitlist.length} waiting list`}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
            <div
              className="h-full rounded-full bg-brand-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {isOwner && (
          <div className="mt-5 border-t border-line pt-5">
            <GoStatusControl goId={go.id} status={go.status} />
          </div>
        )}
      </section>

      {/* Link publik */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <h2 className="font-bold">Link form publik</h2>
        <p className="mt-1 break-all text-sm text-muted">/go/{go.slug}</p>
        {go.status === "draft" && (
          <p className="mt-2 text-sm text-sun-700">
            GO masih Draft, link belum bisa dibuka publik. Ubah status ke Open
            dulu.
          </p>
        )}
        <div className="mt-3">
          <CopyLinkButton path={`/go/${go.slug}`} />
        </div>
      </section>

      {/* Ringkasan keuangan: hanya Owner */}
      {isOwner && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-brand-100 p-4">
            <p className="text-sm text-muted">Omzet (slot terisi)</p>
            <p className="text-xl font-bold">{formatRupiah(revenue)}</p>
          </div>
          <div className="rounded-2xl bg-sun-100 p-4">
            <p className="text-sm text-muted">Modal per item</p>
            <p className="text-xl font-bold">{formatRupiah(cost)}</p>
          </div>
          <div className="rounded-2xl bg-mint-100 p-4">
            <p className="text-sm text-muted">Estimasi profit</p>
            <p className="text-xl font-bold">{formatRupiah(profit)}</p>
          </div>
        </section>
      )}

      {/* Daftar peserta */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <h2 className="mb-3 font-bold">Peserta ({list.length})</h2>

        {list.length === 0 ? (
          <p className="text-sm text-muted">Belum ada peserta.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-semibold">Nama</th>
                  <th className="py-2 pr-3 font-semibold">No. HP</th>
                  <th className="py-2 pr-3 font-semibold">Jumlah</th>
                  <th className="py-2 pr-3 font-semibold">Bayar</th>
                  <th className="py-2 font-semibold">Proses</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3">
                      {o.customer_name}
                      {o.is_waitlist && (
                        <span className="ml-2 text-xs text-sun-700">
                          waiting list
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{o.phone}</td>
                    <td className="py-2 pr-3">{o.quantity}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge type="payment" value={o.payment_status} />
                    </td>
                    <td className="py-2">
                      <StatusBadge
                        type="fulfillment"
                        value={o.fulfillment_status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
