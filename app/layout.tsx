import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UjianKu — Platform Ujian Digital",
  description:
    "Aplikasi CBT buatan sendiri untuk ujian di kelas. Cepat, aman, dan terkendali.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}