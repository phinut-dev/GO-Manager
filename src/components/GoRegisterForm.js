"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/format";

const PAYMENT_OPTIONS = [
  { value: "transfer", label: "Transfer bank" },
  { value: "ewallet", label: "E-wallet" },
  { value: "qris", label: "QRIS" },
];

const inputClass =
  "w-full rounded-xl border border-line bg-page px-3 py-2 text-ink focus:border-brand-400 focus:outline-none";

function toWaLink(number) {
  if (!number) return null;
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits ? `https://wa.me/${digits}` : null;
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export default function GoRegisterForm({ initial, whatsapp }) {
  const [go, setGo] = useState(initial);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Perbarui slot terisi tiap 15 detik
  useEffect(() => {
    const supabase = createClient();
    const timer = setInterval(async () => {
      const { data } = await supabase.rpc("get_public_go", {
        p_slug: initial.slug,
      });
      if (data?.[0]) setGo(data[0]);
    }, 15000);
    return () => clearInterval(timer);
  }, [initial.slug]);

  const percent = Math.min(100, Math.round((go.filled / go.quota) * 100));
  const isFull = go.filled >= go.quota;
  const waLink = toWaLink(whatsapp);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("register_for_go", {
      p_slug: go.slug,
      p_name: name,
      p_phone: phone,
      p_quantity: Number(quantity),
      p_payment_method: payment,
      p_notes: notes,
    });

    setLoading(false);

    if (rpcError) {
      setError("Terjadi kesalahan, coba lagi sebentar lagi.");
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }

    setResult(data);
    const { data: fresh } = await supabase.rpc("get_public_go", {
      p_slug: go.slug,
    });
    if (fresh?.[0]) setGo(fresh[0]);
  }

  function resetForm() {
    setResult(null);
    setName("");
    setPhone("");
    setQuantity(1);
    setPayment("");
    setNotes("");
  }

  return (
    <section className="space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-soft">
      {/* Progress kuota */}
      <div>
        <div className="mb-1 flex justify-between text-sm text-muted">
          <span>Slot terisi</span>
          <span>
            {go.filled} / {go.quota}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-brand-50">
          <div
            className="h-full rounded-full bg-brand-300 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {go.waitlist_count > 0 && (
          <p className="mt-1 text-xs text-muted">
            {go.waitlist_count} orang di waiting list
          </p>
        )}
      </div>

      {/* Hasil pendaftaran */}
      {result ? (
        <div className="space-y-3 rounded-2xl bg-mint-100 p-5">
          {result.status === "confirmed" ? (
            <>
              <p className="text-lg font-bold text-mint-700">
                Pendaftaran berhasil
              </p>
              <p className="text-sm">
                Total yang perlu dibayar:{" "}
                <span className="font-bold">{formatRupiah(result.total)}</span>
              </p>
              <p className="text-sm">
                Admin akan menghubungi kamu lewat WhatsApp untuk konfirmasi dan
                info pembayaran.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-sun-700">
                Kamu masuk waiting list
              </p>
              <p className="text-sm">
                Slot sedang penuh. Kalau ada slot yang lowong, admin akan
                menghubungi kamu lewat WhatsApp.
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400"
              >
                Hubungi via WhatsApp
              </a>
            )}
            <button
              onClick={resetForm}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-brand-50"
            >
              Daftar lagi
            </button>
          </div>
        </div>
      ) : !go.is_open ? (
        <p className="rounded-xl bg-sun-100 p-4 text-center font-semibold text-sun-700">
          {go.status === "completed"
            ? "GO ini sudah selesai."
            : "GO ini sudah ditutup."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isFull && (
            <p className="rounded-xl bg-sun-100 p-3 text-sm text-sun-700">
              Slot sudah penuh. Kamu masih bisa mendaftar dan akan masuk waiting
              list.
            </p>
          )}

          <Field label="Nama">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="No. HP / WhatsApp">
            <input
              type="tel"
              inputMode="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jumlah">
              <input
                type="number"
                min="1"
                max="20"
                className={inputClass}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Field>
            <Field label="Metode bayar">
              <select
                className={inputClass}
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                required
              >
                <option value="" disabled>
                  Pilih
                </option>
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Catatan (opsional)">
            <textarea
              className={inputClass}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </Field>

          <p className="text-sm text-muted">
            Total:{" "}
            <span className="font-bold text-ink">
              {formatRupiah(go.price * (Number(quantity) || 0))}
            </span>
          </p>

          {error && (
            <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sun-300 py-2.5 font-semibold text-ink hover:brightness-95 disabled:opacity-50"
          >
            {loading
              ? "Mengirim..."
              : isFull
                ? "Masuk waiting list"
                : "Ikut GO"}
          </button>
        </form>
      )}
    </section>
  );
}
