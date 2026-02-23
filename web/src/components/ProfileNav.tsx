"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProfileNav() {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/profils");

  return (
    <Link
      href="/profils"
      className={`p-2 rounded-md border transition-colors ${
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
          : "border-[var(--border-color)] text-[var(--muted)] hover:bg-[var(--surface)]"
      }`}
      aria-label="Profils"
      title="Librairie de profils"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    </Link>
  );
}
