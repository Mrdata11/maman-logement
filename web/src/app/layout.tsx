import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://maman-logement.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | Cohabitat Europe",
    default: "Cohabitat Europe — Recherche Habitat Groupé en Europe",
  },
  description:
    "Trouvez votre habitat groupé en Europe. Annonces évaluées par IA, profils communautaires, et outils de recherche personnalisés.",
  icons: {
    icon: "/favicon_alt_living.png",
    apple: "/favicon_alt_living.png",
  },
  openGraph: {
    siteName: "Cohabitat Europe",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
        <ConditionalHeader />
        <main id="main-content" role="main" className="px-4 sm:px-6 py-8 flex-1">{children}</main>
        <ConditionalFooter />
        <ScrollToTop />
        <CookieConsent />
      </body>
    </html>
  );
}
