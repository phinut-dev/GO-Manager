const STYLES = {
  go: {
    draft: ["Draft", "bg-gray-100 text-gray-600"],
    open: ["Open", "bg-mint-100 text-mint-700"],
    closed: ["Closed", "bg-sun-100 text-sun-700"],
    completed: ["Selesai", "bg-brand-100 text-brand-700"],
  },
  payment: {
    unpaid: ["Belum bayar", "bg-rose-100 text-rose-700"],
    partial: ["DP", "bg-sun-100 text-sun-700"],
    paid: ["Lunas", "bg-mint-100 text-mint-700"],
  },
  fulfillment: {
    processing: ["Proses", "bg-brand-100 text-brand-700"],
    completed: ["Selesai", "bg-mint-100 text-mint-700"],
    cancelled: ["Batal", "bg-gray-100 text-gray-600"],
  },
};

export default function StatusBadge({ type, value }) {
  const [label, style] = STYLES[type]?.[value] ?? [
    value,
    "bg-gray-100 text-gray-600",
  ];

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
