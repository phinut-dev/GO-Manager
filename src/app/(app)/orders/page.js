import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrdersTable from "@/components/OrdersTable";

const LIMIT = 200;

const fieldClass =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-400 focus:outline-none";

export default async function OrdersPage({ searchParams }) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const goId = String(sp.go ?? "");
  const payment = String(sp.payment ?? "");
  const fulfillment = String(sp.fulfillment ?? "");

  const supabase = await createClient();

  const gosPromise = supabase
    .from("group_orders")
    .select("id, title")
    .order("created_at", { ascending: false });

  let query = supabase
    .from("orders")
    .select(
      "id, customer_name, phone, quantity, unit_price, amount_paid, payment_status, fulfillment_status, is_waitlist, source, created_at, group_orders(title)",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (goId) query = query.eq("go_id", goId);
  if (payment) query = query.eq("payment_status", payment);
  if (fulfillment) query = query.eq("fulfillment_status", fulfillment);
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ").trim();
    if (safe) {
      query = query.or(`customer_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
  }

  const [gosResult, ordersResult] = await Promise.all([gosPromise, query]);
  const { data: gos } = gosResult;
  const { data: orders, error } = ordersResult;
  const hasFilter = q || goId || payment || fulfillment;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Rekap Order</h1>

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-3 shadow-soft"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama atau no. HP"
          className={`${fieldClass} min-w-48 flex-1`}
        />

        <select name="go" defaultValue={goId} className={fieldClass}>
          <option value="">Semua GO</option>
          {gos?.map((go) => (
            <option key={go.id} value={go.id}>
              {go.title}
            </option>
          ))}
        </select>

        <select name="payment" defaultValue={payment} className={fieldClass}>
          <option value="">Semua pembayaran</option>
          <option value="unpaid">Belum bayar</option>
          <option value="partial">DP</option>
          <option value="paid">Lunas</option>
        </select>

        <select
          name="fulfillment"
          defaultValue={fulfillment}
          className={fieldClass}
        >
          <option value="">Semua pengerjaan</option>
          <option value="processing">Proses</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Batal</option>
        </select>

        <button
          type="submit"
          className="rounded-full bg-brand-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400"
        >
          Terapkan
        </button>

        {hasFilter && (
          <Link
            href="/orders"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            Reset
          </Link>
        )}
      </form>

      {error ? (
        <p className="rounded-xl bg-rose-100 p-4 text-rose-700">
          Gagal memuat order: {error.message}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {orders.length} order
            {orders.length === LIMIT && ` (menampilkan ${LIMIT} terbaru)`}
          </p>
          <OrdersTable orders={orders} />
        </>
      )}
    </div>
  );
}
