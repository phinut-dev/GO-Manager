"use server";

import { createClient } from "@/lib/supabase/server";

function slugify(text) {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base || "go";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}
const STATUS_FLOW = {
  draft: ["open"],
  open: ["closed"],
  closed: ["open", "completed"],
  completed: [],
};

export async function updateGoStatus(id, newStatus) {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Sesi habis, silakan login ulang." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active || profile.role !== "owner") {
    return { error: "Hanya Owner yang bisa mengubah status GO." };
  }

  const { data: go } = await supabase
    .from("group_orders")
    .select("status")
    .eq("id", id)
    .single();

  if (!go) return { error: "GO tidak ditemukan." };

  if (!(STATUS_FLOW[go.status] ?? []).includes(newStatus)) {
    return { error: "Perubahan status ini tidak diizinkan." };
  }

  const { error } = await supabase
    .from("group_orders")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: `Gagal mengubah status: ${error.message}` };

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "update_go_status",
    table_name: "group_orders",
    target_id: id,
    details: { from: go.status, to: newStatus },
  });

  return { success: true };
}
export async function createGroupOrder(input) {
  const supabase = await createClient();

  // 1. Pastikan yang memanggil adalah Owner
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Sesi habis, silakan login ulang." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active || profile.role !== "owner") {
    return { error: "Hanya Owner yang bisa membuat GO." };
  }

  // 2. Validasi
  const title = (input.title ?? "").trim();
  const price = Number(input.price);
  const cost = Number(input.cost ?? 0);
  const quota = Number(input.quota);

  if (!title) return { error: "Judul wajib diisi." };
  if (!Number.isFinite(price) || price < 0)
    return { error: "Harga tidak valid." };
  if (!Number.isFinite(cost) || cost < 0)
    return { error: "Modal tidak valid." };
  if (!Number.isInteger(quota) || quota < 1)
    return { error: "Kuota minimal 1." };

  // 3. Simpan GO (slug dicoba ulang kalau bentrok)
  const baseSlug = slugify(title);
  let go = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug =
      attempt === 0
        ? `${baseSlug}-${randomSuffix()}`
        : `${baseSlug}-${randomSuffix()}${attempt}`;

    const { data, error } = await supabase
      .from("group_orders")
      .insert({
        title,
        slug,
        description: input.description?.trim() || null,
        price,
        quota,
        close_date: input.closeDate || null,
        image_url: input.imageUrl || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (!error) {
      go = data;
      break;
    }
    if (error.code !== "23505") {
      return { error: `Gagal menyimpan GO: ${error.message}` };
    }
  }

  if (!go) return { error: "Gagal membuat link GO, coba lagi." };

  // 4. Simpan modal (tabel terpisah, hanya Owner yang bisa baca)
  const { error: costError } = await supabase
    .from("go_costs")
    .insert({ go_id: go.id, cost_per_item: cost });

  if (costError) {
    await supabase.from("group_orders").delete().eq("id", go.id);
    return { error: `Gagal menyimpan modal: ${costError.message}` };
  }

  // 5. Catat aktivitas
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "create_go",
    table_name: "group_orders",
    target_id: go.id,
    details: { title },
  });

  return { success: true, id: go.id };
}
