import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maman Logement - Recherche Habitat Group\u00e9",
  description:
    "Outil de recherche d'habitat group\u00e9 en Belgique pour Maman",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors`}>
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Maman Logement
            </a>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                {"Recherche Habitat Group\u00e9 en Belgique"}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
