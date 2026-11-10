"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuImagePlus } from "react-icons/lu";
import { createClient } from "@/lib/supabase/client";
import { createGroupOrder } from "@/app/(app)/group-orders/actions";

const inputClass =
  "w-full rounded-xl border border-line bg-page px-3 py-2 text-ink focus:border-brand-400 focus:outline-none";

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function GroupOrderForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quota, setQuota] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFile(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 2 * 1024 * 1024) {
      setError("Ukuran foto maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let imageUrl = null;

    if (file) {
      const supabase = createClient();
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `covers/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("go-images")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError(`Gagal upload foto: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      imageUrl = supabase.storage.from("go-images").getPublicUrl(path)
        .data.publicUrl;
    }

    const result = await createGroupOrder({
      title,
      description,
      price: Number(price),
      cost: Number(cost || 0),
      quota: Number(quota),
      closeDate: closeDate ? new Date(closeDate).toISOString() : null,
      imageUrl,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/group-orders");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-soft"
    >
      <Field label="Judul GO">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field label="Deskripsi">
        <textarea
          className={inputClass}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Harga jual per item (Rp)">
          <input
            type="number"
            min="0"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </Field>

        <Field
          label="Modal per item (Rp)"
          hint="Hanya Owner yang bisa melihat ini."
        >
          <input
            type="number"
            min="0"
            className={inputClass}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </Field>

        <Field label="Kuota (slot)">
          <input
            type="number"
            min="1"
            className={inputClass}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            required
          />
        </Field>

        <Field label="Tanggal tutup">
          <input
            type="datetime-local"
            className={inputClass}
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Foto produk" hint="JPG, PNG, atau WebP. Maksimal 2 MB.">
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-700">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Pratinjau"
                className="h-full w-full object-cover"
              />
            ) : (
              <LuImagePlus size={28} />
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="text-sm"
          />
        </div>
      </Field>

      {error && (
        <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-300 py-2.5 font-semibold text-ink hover:bg-brand-400 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Simpan GO"}
      </button>
    </form>
  );
}
