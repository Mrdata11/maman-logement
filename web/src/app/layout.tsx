import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FavoritesNav } from "@/components/FavoritesNav";
import { ProfileNav } from "@/components/ProfileNav";
import { AppModeToggle } from "@/components/AppModeToggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maman Logement - Recherche Habitat Groupé",
  description:
    "Outil de recherche d'habitat groupé en Belgique pour Maman",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head />
      <body className={`${inter.variable} font-sans antialiased bg-[var(--background)] min-h-screen transition-colors`}>
        <header className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-4 py-3 sm:py-4 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <a href="/" className="text-lg sm:text-xl font-bold text-[var(--foreground)] shrink-0">
              Logement
            </a>
            <AppModeToggle />
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ProfileNav />
              <FavoritesNav />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
