import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL('https://goline.netlify.app'),
  title: "GO Line — Guided Outcomes Calculator",
  description: "A deterministic calculator for cannabis formulation. Translates natural language intent into structured terpene blends.",
  openGraph: {
    title: "GO Line — Guided Outcomes Calculator",
    description: "Translate intent into structured cannabis blends. A deterministic formulation tool.",
    url: "https://goline.netlify.app/",
    siteName: "GO Line Calculator",
    images: [
      {
        url: "/context_anchor.png",
        width: 1200,
        height: 630,
        alt: "GO Line Interface",
        type: "image/png",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GO Line — Guided Outcomes Calculator",
    description: "Translate intent into structured cannabis blends.",
    images: ["/context_anchor.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (typeof window !== 'undefined') {
    console.log('[LAYOUT] AppShell mounted - Fixed viewport layout active');
  }

  return (
    <html lang="en" className="h-screen overflow-hidden">
      <body className="h-screen overflow-hidden bg-app text-app">
        <div id="app-shell" className="h-screen flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
