import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
// PERBAIKAN FATAL: Menggunakan huruf "F" besar menyesuaikan standar Linux Vercel
import Footer from "../components/Footer"; 
import { Suspense } from "react";

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
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <Navbar />
        {/* Konten Utama Web dibungkus Suspense untuk mencegah Error useSearchParams */}
        <div className="flex-grow">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            {children}
          </Suspense>
        </div>
        <Footer />
      </body>
    </html>
  );
}