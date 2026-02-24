"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProfileNav } from "./ProfileNav";
import { AppModeToggle } from "./AppModeToggle";

const MINIMAL_ROUTES = ["/profils/creer", "/creer"];

const wrapperStyle = {
  // Clip only above (top: -100%) so header sliding up gets hidden,
  // but dropdown below remains visible (bottom: 200vh)
  clipPath: "inset(var(--header-offset, 0px) 0 -200vh 0)",
} as React.CSSProperties;

const headerStyle = {
  transform: "translateY(var(--header-offset, 0px))",
} as React.CSSProperties;

export function ConditionalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isMinimal = MINIMAL_ROUTES.includes(pathname);

  if (isMinimal) {
    return (
      <div className="sticky top-0 z-50" style={wrapperStyle}>
        <header role="banner" style={headerStyle} className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-4 py-2.5 sm:py-3">
          <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2" aria-label="Navigation principale">
            <button
              onClick={() => router.back()}
              className="shrink-0 w-[100px] sm:w-[120px] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
              aria-label="Quitter le formulaire"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Quitter</span>
            </button>
            <Link href="/" className="shrink-0">
              <Image src="/logo_alt_living.png" alt="Cohabitat Europe" width={100} height={33} className="sm:w-[120px]" priority />
            </Link>
            <div className="shrink-0 w-[100px] sm:w-[120px] flex justify-end">
              <ProfileNav />
            </div>
          </nav>
        </header>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50" style={wrapperStyle}>
      <header role="banner" style={headerStyle} className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-4 py-2.5 sm:py-3">
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2" aria-label="Navigation principale">
          <Link href="/" className="shrink-0">
            <Image src="/logo_alt_living.png" alt="Cohabitat Europe" width={100} height={33} className="sm:w-[120px]" priority />
          </Link>
          <AppModeToggle />
          <div className="flex items-center shrink-0">
            <ProfileNav />
          </div>
        </nav>
      </header>
    </div>
  );
}
