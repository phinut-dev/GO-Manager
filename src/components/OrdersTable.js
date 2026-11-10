"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { formatRupiah, formatDate } from "@/lib/format";
import { bulkUpdateOrders } from "@/app/(app)/orders/actions";

const ACTIONS = [
  {
    group: "Status pembayaran",
    items: [
      ["payment_status:unpaid", "Belum bayar"],
      ["payment_status:partial", "DP"],
      ["payment_status:paid", "Lunas"],
    ],
  },
  {
    group: "Status pengerjaan",
    items: [
      ["fulfillment_status:processing", "Proses"],
      ["fulfillment_status:completed", "Selesai"],
      ["fulfillment_status:cancelled", "Batal"],
    ],
  },
];

export default function OrdersTable({ orders }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState("payment_status:paid");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Abaikan pilihan yang sudah tidak ada di daftar (misalnya setelah filter)
  const visibleIds = new Set(orders.map((o) => o.id));
  const current = selected.filter((id) => visibleIds.has(id));
  const allSelected = orders.length > 0 && current.length === orders.length;

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : orders.map((o) => o.id));
  }

  async function handleApply() {
    const [field, value] = action.split(":");

    if (
      value === "cancelled" &&
      !window.confirm(`Batalkan ${current.length} order?`)
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    const result = await bulkUpdateOrders(current, field, value);
    setLoading(false);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    setMessage({ type: "ok", text: `${result.count} order diperbarui.` });
    setSelected([]);
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
        <p className="font-semibold">Tidak ada order</p>
        <p className="mt-1 text-sm text-muted">
          Coba ubah filter, atau tunggu pendaftar baru dari form GO.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {current.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sun-100 p-3">
          <span className="text-sm font-semibold">
            {current.length} order dipilih
          </span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm"
          >
            {ACTIONS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map(([value, label]) => (
                  <option key={value} value={value}>
                    Ubah ke {label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            onClick={handleApply}
            disabled={loading}
            className="rounded-full bg-brand-300 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Terapkan"}
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-sm text-muted hover:text-ink"
          >
            Batal pilih
          </button>
        </div>
      )}

      {message && (
        <p
          className={`rounded-xl p-3 text-sm ${
            message.type === "ok"
              ? "bg-mint-100 text-mint-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Pilih semua"
                />
              </th>
              <th className="p-3 font-semibold">Tanggal</th>
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">GO</th>
              <th className="p-3 font-semibold">Jml</th>
              <th className="p-3 font-semibold">Total</th>
              <th className="p-3 font-semibold">Bayar</th>
              <th className="p-3 font-semibold">Proses</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isChecked = current.includes(o.id);
              return (
                <tr
                  key={o.id}
                  className={`border-b border-line last:border-0 ${
                    isChecked ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(o.id)}
                      aria-label={`Pilih ${o.customer_name}`}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-muted">{o.phone}</p>
                    <div className="mt-1 flex gap-1">
                      {o.is_waitlist && (
                        <span className="rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-700">
                          Waiting list
                        </span>
                      )}
                      {o.source === "manual" && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          Manual
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{o.group_orders?.title ?? "-"}</td>
                  <td className="p-3">{o.quantity}</td>
                  <td className="p-3 whitespace-nowrap">
                    <p>{formatRupiah(o.unit_price * o.quantity)}</p>
                    {o.payment_status === "partial" && (
                      <p className="text-xs text-muted">
                        Dibayar {formatRupiah(o.amount_paid)}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge type="payment" value={o.payment_status} />
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      type="fulfillment"
                      value={o.fulfillment_status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
