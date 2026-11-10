"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [loadingPath, setLoadingPath] = useState(null);
  const isLoading = loadingPath !== null && loadingPath !== pathname;

  useEffect(() => {
    function handleClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname !== window.location.pathname
      ) {
        setLoadingPath(destination.pathname);
      }
    }

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50"
      role="status"
    >
      <div className="h-1 w-full overflow-hidden bg-brand-100">
        <div className="route-loading-bar h-full w-1/3 bg-brand-700" />
      </div>
      <span className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-soft">
        <span className="size-2 animate-pulse rounded-full bg-brand-700" />
        Memuat halaman...
      </span>
    </div>
  );
}
