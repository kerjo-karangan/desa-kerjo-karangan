// src/app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Logika Pemblokiran:
  // Jika path dimulai dengan "/dashboard" atau "/login", maka hideNavbar = true
  const isDashboardOrLogin = pathname.startsWith("/dashboard") || pathname.startsWith("/login");

  return (
    <html 
      lang="id"
    >
      <head>
        <title>
          Sistem Informasi Desa Kerjo
        </title>
        <meta 
          name="description" 
          content="Portal Resmi E-Government Desa Kerjo, Kabupaten Trenggalek" 
        />
      </head>
      <body 
        className={inter.className}
      >
        
        {/* Render Navbar hanya jika BUKAN di halaman Admin/Login */}
        {!isDashboardOrLogin && <Navbar />}
        
        <main 
          className="min-h-screen"
        >
          {children}
        </main>

        {/* Render Footer hanya jika BUKAN di halaman Admin/Login */}
        {!isDashboardOrLogin && <Footer />}

      </body>
    </html>
  );
}