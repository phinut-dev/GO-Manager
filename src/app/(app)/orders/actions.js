"use server";

import { createClient } from "@/lib/supabase/server";

const FIELDS = {
  payment_status: ["unpaid", "partial", "paid"],
  fulfillment_status: ["processing", "completed", "cancelled"],
};

export async function bulkUpdateOrders(ids, field, value) {
  const supabase = await createClient();

  // 1. Harus staff aktif (Owner atau Admin)
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Sesi habis, silakan login ulang." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .single();
  if (!profile?.is_active) return { error: "Akun tidak aktif." };

  // 2. Validasi input
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
    return { error: "Pilih 1 sampai 200 order." };
  }
  if (!FIELDS[field]?.includes(value)) {
    return { error: "Status tidak valid." };
  }

  // 3. Update
  if (field === "payment_status" && value === "paid") {
    // Lunas: jumlah dibayar = total tiap order
    const { data: rows, error: fetchError } = await supabase
      .from("orders")
      .select("id, unit_price, quantity")
      .in("id", ids);
    if (fetchError) return { error: fetchError.message };

    const results = await Promise.all(
      rows.map((row) =>
        supabase
          .from("orders")
          .update({
            payment_status: "paid",
            amount_paid: row.unit_price * row.quantity,
          })
          .eq("id", row.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed) return { error: failed.error.message };
  } else {
    const changes = { [field]: value };
    if (field === "payment_status" && value === "unpaid") {
      changes.amount_paid = 0;
    }
    const { error } = await supabase
      .from("orders")
      .update(changes)
      .in("id", ids);
    if (error) return { error: error.message };
  }

  // 4. Catat aktivitas
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "bulk_update_orders",
    table_name: "orders",
    details: { field, value, count: ids.length, ids },
  });

  return { success: true, count: ids.length };
}
