import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Resmi Desa Kerjo",
  description: "Pusat Pelayanan dan Informasi Desa Kerjo, Kec. Karangan, Trenggalek",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}