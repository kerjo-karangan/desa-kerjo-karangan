// src/components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Efek transisi warna Navbar saat di-scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  // Menentukan gaya dasar berdasarkan halaman yang sedang dibuka
  // Jika di Beranda, Navbar default transparan, lalu memutih jika discroll. 
  // Jika di halaman lain, selalu putih.
  const isBeranda = pathname === "/";
  const navBgClass = isBeranda 
    ? (scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent") 
    : "bg-white shadow-sm border-b border-gray-100";

  const textColorClass = isBeranda 
    ? (scrolled ? "text-gray-800 hover:text-green-700" : "text-white hover:text-yellow-400 drop-shadow-md")
    : "text-gray-700 hover:text-green-700";

  // Warna khusus Logo untuk Beranda yang belum di-scroll
  const logoColorClass = isBeranda && !scrolled ? "text-white drop-shadow-md" : "text-green-800";

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBgClass}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* BAGIAN LOGO */}
          <Link href="/" className="flex items-center gap-3 group" onClick={closeMenu}>
            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-sm transform group-hover:scale-105 transition-transform">
              <img 
                src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                alt="Logo Desa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className={`font-black text-2xl tracking-tight transition-colors ${logoColorClass}`}>
              Desa Kerjo
            </span>
          </Link>

          {/* MENU DESKTOP */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`font-bold text-sm tracking-wide transition-colors ${textColorClass}`}>
              Beranda
            </Link>
            
            {/* Menu Profil dgn Dropdown */}
            <div className="relative group">
              <Link href="/profil" className={`font-bold text-sm tracking-wide transition-colors flex items-center gap-1 py-4 ${textColorClass}`}>
                Profil & Lembaga <span>▾</span>
              </Link>
              <div className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <Link href="/profil?tab=sejarah" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 border-b border-gray-50">Sejarah & Visi Misi</Link>
                <Link href="/profil?tab=sotk" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 border-b border-gray-50">Pemerintah Desa (SOTK)</Link>
                <Link href="/profil?tab=lembaga" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 border-b border-gray-50">Lembaga Masyarakat</Link>
                <Link href="/profil?tab=umkm" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700">Katalog UMKM & Wisata</Link>
              </div>
            </div>

            {/* Menu Kabar dgn Dropdown */}
            <div className="relative group">
              <Link href="/kabar" className={`font-bold text-sm tracking-wide transition-colors flex items-center gap-1 py-4 ${textColorClass}`}>
                Kabar Desa <span>▾</span>
              </Link>
              <div className="absolute top-full left-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <Link href="/kabar?tab=berita" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 border-b border-gray-50">Berita Publik</Link>
                <Link href="/kabar?tab=agenda" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700">Agenda Kegiatan</Link>
              </div>
            </div>

            {/* Menu Transparansi dgn Dropdown BARU */}
            <div className="relative group">
              <Link href="/transparansi" className={`font-bold text-sm tracking-wide transition-colors flex items-center gap-1 py-4 ${textColorClass}`}>
                Transparansi <span>▾</span>
              </Link>
              <div className="absolute top-full left-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <Link href="/transparansi?tab=apbdes" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 border-b border-gray-50">Data APBDes</Link>
                <Link href="/transparansi?tab=regulasi" className="block px-5 py-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700">Regulasi & Perdes</Link>
              </div>
            </div>

            <Link href="/layanan" className={`font-bold text-sm tracking-wide transition-colors ${textColorClass}`}>
              Layanan Warga
            </Link>
          </nav>

          {/* TOMBOL TOGGLE MOBILE MENU */}
          <button 
            className="lg:hidden text-3xl focus:outline-none z-50 p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* Ikon Hamburger / Close */}
            <div className={`flex flex-col gap-1.5 transition-all ${isBeranda && !scrolled && !isOpen ? 'text-white' : 'text-green-800'}`}>
              <span className={`block h-0.5 w-6 transition-transform ${isOpen ? 'rotate-45 translate-y-2 bg-green-800' : 'bg-current'}`}></span>
              <span className={`block h-0.5 w-6 transition-opacity ${isOpen ? 'opacity-0' : 'bg-current'}`}></span>
              <span className={`block h-0.5 w-6 transition-transform ${isOpen ? '-rotate-45 -translate-y-2 bg-green-800' : 'bg-current'}`}></span>
            </div>
          </button>

        </div>
      </div>

      {/* OVERLAY & MENU MOBILE */}
      <div className={`lg:hidden fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex-1 overflow-y-auto pt-24 pb-10 px-6">
          <nav className="flex flex-col gap-6 text-center">
            <Link href="/" onClick={closeMenu} className="text-2xl font-black text-gray-800 hover:text-green-600 pb-4 border-b border-gray-100">
              Beranda Utama
            </Link>
            
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm font-bold text-green-600 mb-4 uppercase tracking-widest">Profil & Lembaga</p>
              <div className="flex flex-col gap-4">
                <Link href="/profil?tab=sejarah" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Sejarah & Visi Misi</Link>
                <Link href="/profil?tab=sotk" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Pemerintah Desa</Link>
                <Link href="/profil?tab=lembaga" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Lembaga Masyarakat</Link>
                <Link href="/profil?tab=umkm" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Katalog UMKM</Link>
              </div>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm font-bold text-green-600 mb-4 uppercase tracking-widest">Kabar & Informasi</p>
              <div className="flex flex-col gap-4">
                <Link href="/kabar?tab=berita" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Berita Publik</Link>
                <Link href="/kabar?tab=agenda" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Agenda Kegiatan</Link>
              </div>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm font-bold text-green-600 mb-4 uppercase tracking-widest">Transparansi Desa</p>
              <div className="flex flex-col gap-4">
                <Link href="/transparansi?tab=apbdes" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Data APBDes</Link>
                <Link href="/transparansi?tab=regulasi" onClick={closeMenu} className="text-xl font-bold text-gray-700 hover:text-green-600">Regulasi & Perdes</Link>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/layanan" onClick={closeMenu} className="text-2xl font-black text-green-600 hover:text-green-800">
                Layanan Surat Mandiri
              </Link>
            </div>
          </nav>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <Link href="/login" onClick={closeMenu} className="block w-full text-center bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg">
            Login Admin
          </Link>
        </div>
      </div>
    </header>
  );
}