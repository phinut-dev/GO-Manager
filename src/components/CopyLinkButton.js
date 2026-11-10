"use client";

import { useState } from "react";
import { LuCopy, LuCheck } from "react-icons/lu";

export default function CopyLinkButton({ path }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin link ini:", url);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-brand-50"
    >
      {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
      {copied ? "Tersalin" : "Salin link"}
    </button>
  );
}
