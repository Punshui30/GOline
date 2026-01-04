import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GO Line — Guided Outcomes Calculator",
  description: "Outcome Resolution Layer Prototype",
  icons: {
    icon: '/favicon.svg',
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

