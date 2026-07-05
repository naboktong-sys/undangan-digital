import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasyakuran Harlah ke-73 Abuya Prof. Dr. KH. Said Aqil Siroj, M.A.",
  description: "Undangan digital Tasyakuran Harlah ke-73 Abuya Prof. Dr. KH. Said Aqil Siroj, M.A.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&family=Playfair+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}