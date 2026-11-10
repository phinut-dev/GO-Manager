"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGoStatus } from "@/app/(app)/group-orders/actions";

const ACTIONS = {
  draft: [{ to: "open", label: "Buka GO" }],
  open: [{ to: "closed", label: "Tutup GO", confirm: true }],
  closed: [
    { to: "open", label: "Buka kembali" },
    { to: "completed", label: "Tandai selesai", confirm: true },
  ],
  completed: [],
};

export default function GoStatusControl({ goId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actions = ACTIONS[status] ?? [];
  if (actions.length === 0) return null;

  async function handleClick(action) {
    if (action.confirm && !window.confirm(`${action.label}?`)) return;

    setLoading(true);
    setError("");
    const result = await updateGoStatus(goId, action.to);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={action.to}
            onClick={() => handleClick(action)}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 ${
              index === 0
                ? "bg-brand-300 hover:bg-brand-400"
                : "bg-sun-300 hover:brightness-95"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
