import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL('https://goline.netlify.app'), // Updating to app domain if known, or relative
  title: "GO Line — Guided Outcomes Calculator",
  description: "A deterministic calculator for cannabis formulation. Translates natural language intent into structured terpene blends.",
  openGraph: {
    title: "GO Line — Guided Outcomes Calculator",
    description: "Translate intent into structured cannabis blends. A deterministic formulation tool.",
    url: "https://goline.netlify.app/",
    siteName: "GO Line Calculator",
    images: [
      {
        url: "/context_anchor.png", // Using the new specific app context image
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
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <div className="h-full flex flex-col">
          <Header />
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
