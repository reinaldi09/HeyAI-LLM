import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmaCare by heyAI",
  description:
    "Ruang kerja klinis modern untuk asesmen farmasi yang lebih terarah dan aman.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
