"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppModeToggle() {
  const pathname = usePathname();
  const isHabitats =
    pathname.startsWith("/habitats") || pathname.startsWith("/listing");
  const isPersonnes = pathname.startsWith("/profils");

  const activeClass =
    "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm";
  const inactiveClass =
    "text-[var(--muted)] hover:text-[var(--foreground)]";

  return (
    <div className="flex bg-[var(--surface)] p-0.5 sm:p-1 rounded-xl gap-0.5">
      <Link
        href="/habitats"
        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isHabitats ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Habitats
      </Link>
      <Link
        href="/profils"
        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isPersonnes ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Personnes
      </Link>
    </div>
  );
}
