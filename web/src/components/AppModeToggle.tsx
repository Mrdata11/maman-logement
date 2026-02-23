"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppModeToggle() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isHabitats =
    pathname.startsWith("/habitats") || pathname.startsWith("/listing");
  const isPersonnes = pathname.startsWith("/profils");
  const isRetraites = pathname.startsWith("/retraites");

  const activeClass =
    "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm";
  const inactiveClass =
    "text-[var(--muted)] hover:text-[var(--foreground)]";

  return (
    <div className="flex bg-[var(--surface)] p-0.5 rounded-xl">
      <Link
        href="/"
        className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isHome ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      <Link
        href="/habitats"
        className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isHabitats ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Habitats
      </Link>
      <Link
        href="/profils"
        className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isPersonnes ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Personnes
      </Link>
      <Link
        href="/retraites"
        className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
          isRetraites ? activeClass : inactiveClass
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Retraites
      </Link>
    </div>
  );
}
