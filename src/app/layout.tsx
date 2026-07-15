import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // KITA IMPORT FOOTER BARU DI SINI

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Resmi Desa Kerjo",
  description: "Pusat Pelayanan dan Informasi Desa Kerjo, Kec. Karangan, Trenggalek",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <Navbar />
        {/* Konten Utama Web */}
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}