"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppModeToggle() {
  const pathname = usePathname();
  const isApartment = pathname.startsWith("/appartements");

  return (
    <div className="flex bg-[var(--surface)] p-0.5 rounded-xl">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          !isApartment
            ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        Habitat Groupé
      </Link>
      <Link
        href="/appartements"
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isApartment
            ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        Apparts BXL
      </Link>
    </div>
  );
}
