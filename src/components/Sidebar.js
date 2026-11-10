"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuClipboardList,
  LuUsers,
  LuSettings,
} from "react-icons/lu";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/group-orders", label: "Group Order", icon: LuShoppingBag },
  { href: "/orders", label: "Rekap Order", icon: LuClipboardList },
  { href: "/admins", label: "Admin", icon: LuUsers, ownerOnly: true },
  { href: "/settings", label: "Pengaturan", icon: LuSettings, ownerOnly: true },
];

export default function Sidebar({ storeName, fullName, role }) {
  const pathname = usePathname();

  const items = NAV.filter((item) => !item.ownerOnly || role === "owner");
  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop: sidebar kiri */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        <div className="mb-6 rounded-2xl bg-brand-100 p-4">
          <p className="text-lg font-bold">{storeName}</p>
          <p className="text-sm text-muted">
            {fullName} · {role === "owner" ? "Owner" : "Admin"}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition ${
                isActive(href)
                  ? "bg-sun-100 text-ink"
                  : "text-muted hover:bg-brand-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <LogoutButton />
      </aside>

      {/* Mobile: bar atas */}
      <header className="border-b border-line bg-surface p-3 md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold">{storeName}</p>
          <LogoutButton />
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                isActive(href)
                  ? "bg-sun-100 text-ink"
                  : "bg-brand-50 text-muted"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
