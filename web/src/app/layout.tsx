import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import { ProfileNav } from "@/components/ProfileNav";
import { AppModeToggle } from "@/components/AppModeToggle";
import { CookieConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cohabitat Europe - Recherche Habitat Group\u00e9",
  description:
    "Trouvez votre habitat group\u00e9 en Europe. Annonces \u00e9valu\u00e9es par IA, profils communautaires, et outils de recherche personnalis\u00e9s.",
  icons: {
    icon: "/favicon_alt_living.png",
    apple: "/favicon_alt_living.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#5B8C5A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--background)] min-h-screen transition-colors flex flex-col`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:text-sm"
        >
          Aller au contenu principal
        </a>
        <header role="banner" className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-4 py-3 sm:py-4 transition-colors">
          <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2" aria-label="Navigation principale">
            <a href="/" className="shrink-0">
              <Image src="/logo_alt_living.png" alt="Alt Living" width={120} height={40} priority />
            </a>
            <AppModeToggle />
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ProfileNav />
            </div>
          </nav>
        </header>
        <main id="main-content" role="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
