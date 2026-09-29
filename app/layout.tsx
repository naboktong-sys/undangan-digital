import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undangan Launching & Bedah Buku oleh Abuya Prof. Dr. KH. Said Aqil Siroj, M.A.",
  description: "Undangan digital Launching & Bedah Buku oleh Abuya Prof. Dr. KH. Said Aqil Siroj, M.A.",
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}