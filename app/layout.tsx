import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://daniel-simmonds.com'),
  title: "Daniel Simmonds - Cannabis Industry Expert & Expert Witness",
  description: "Cannabis industry operator, product formulator, and policy & advocacy expert",
  openGraph: {
    title: "Daniel Simmonds - Cannabis Operator • Product Formulator • Expert Witness • Policy & Safety Specialist",
    description: "Operator and product innovator with hands-on experience across formulation, sourcing, product development, and regulated market strategy.",
    url: "https://daniel-simmonds.com/",
    siteName: "Daniel Simmonds Portfolio",
    images: [
      {
        url: "https://daniel-simmonds.com/og/portfolio-main.jpg",
        width: 1200,
        height: 630,
        alt: "Daniel Simmonds - Cannabis Industry Expert",
        type: "image/jpeg",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daniel Simmonds - Cannabis Industry Expert & Expert Witness",
    description: "Operator and product innovator with hands-on experience across formulation, sourcing, product development, and regulated market strategy.",
    images: ["https://daniel-simmonds.com/og/portfolio-main.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

