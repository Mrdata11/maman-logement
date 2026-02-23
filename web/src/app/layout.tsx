import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FavoritesNav } from "@/components/FavoritesNav";
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
        <header className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-4 py-4 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-[var(--foreground)]">
              Maman Logement
            </a>
            <div className="flex items-center gap-2">
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
