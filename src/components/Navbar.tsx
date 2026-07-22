// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getActiveStyle = (menuPath: string) => {
    if (pathname === menuPath) {
      if (menuPath === "/profil") return "text-blue-600 font-black";
      if (menuPath === "/datadesa") return "text-yellow-600 font-black";
      if (menuPath === "/transparansi") return "text-yellow-600 font-black";
      if (menuPath === "/layanan") return "text-purple-600 font-black";
      return "text-green-600 font-black"; 
    }
    return "text-gray-600 font-bold hover:text-green-500 transition-colors";
  };

  const getDropdownHoverStyle = (menuPath: string) => {
    if (menuPath === "/profil") return "hover:bg-blue-50 hover:text-blue-600";
    if (menuPath === "/datadesa") return "hover:bg-yellow-50 hover:text-yellow-600";
    if (menuPath === "/transparansi") return "hover:bg-yellow-50 hover:text-yellow-600";
    if (menuPath === "/layanan") return "hover:bg-purple-50 hover:text-purple-600";
    return "hover:bg-green-50 hover:text-green-600";
  };

  const toggleMobileDropdown = (menu: string) => {
    if (mobileDropdown === menu) {
      setMobileDropdown(null);
    } else {
      setMobileDropdown(menu);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
        isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-md py-3" 
        : "bg-white py-4 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 xl:px-8 flex items-center justify-between">
        
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-50 rounded-full p-1 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
            <img 
              src="https://i.ibb.co.com/4ny8JgGm/1.png" 
              alt="Logo Desa Kerjo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black text-gray-900 leading-none group-hover:text-green-700 transition-colors">
              Desa Kerjo
            </span>
            <span className="text-[10px] md:text-xs font-bold text-gray-500 tracking-widest uppercase">
              Kab. Trenggalek
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          
          <Link 
            href="/" 
            className={`${getActiveStyle("/")}`}
          >
            Beranda
          </Link>

          <div className="relative group">
            <Link 
              href="/profil" 
              className={`flex items-center gap-1.5 py-2 ${getActiveStyle("/profil")}`}
            >
              Profil & Lembaga
              <span className="text-[10px] transform transition-transform duration-300 group-hover:rotate-180">
                ▼
              </span>
            </Link>
            <div className="absolute top-full left-0 mt-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col overflow-hidden transform origin-top scale-95 group-hover:scale-100">
              <Link 
                href="/profil?tab=sejarah" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 border-b border-gray-50 transition-colors ${getDropdownHoverStyle("/profil")}`}
              >
                Sejarah & Visi Misi
              </Link>
              <Link 
                href="/profil?tab=sotk" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 border-b border-gray-50 transition-colors ${getDropdownHoverStyle("/profil")}`}
              >
                Pemerintah Desa
              </Link>
              <Link 
                href="/profil?tab=lembaga" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 border-b border-gray-50 transition-colors ${getDropdownHoverStyle("/profil")}`}
              >
                Lembaga Masyarakat
              </Link>
              <Link 
                href="/profil?tab=umkm" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 transition-colors ${getDropdownHoverStyle("/profil")}`}
              >
                Data Potensi & UMKM
              </Link>
            </div>
          </div>

          <Link 
            href="/datadesa" 
            className={`${getActiveStyle("/datadesa")}`}
          >
            Data Desa
          </Link>

          <div className="relative group">
            <Link 
              href="/kabar" 
              className={`flex items-center gap-1.5 py-2 ${getActiveStyle("/kabar")}`}
            >
              Kabar Desa
              <span className="text-[10px] transform transition-transform duration-300 group-hover:rotate-180">
                ▼
              </span>
            </Link>
            <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col overflow-hidden transform origin-top scale-95 group-hover:scale-100">
              <Link 
                href="/kabar?tab=berita" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 border-b border-gray-50 transition-colors ${getDropdownHoverStyle("/kabar")}`}
              >
                Berita & Kegiatan
              </Link>
              <Link 
                href="/kabar?tab=agenda" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 transition-colors ${getDropdownHoverStyle("/kabar")}`}
              >
                Agenda Terdekat
              </Link>
            </div>
          </div>

          <div className="relative group">
            <Link 
              href="/transparansi" 
              className={`flex items-center gap-1.5 py-2 ${getActiveStyle("/transparansi")}`}
            >
              Transparansi
              <span className="text-[10px] transform transition-transform duration-300 group-hover:rotate-180">
                ▼
              </span>
            </Link>
            <div className="absolute top-full left-0 mt-0 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col overflow-hidden transform origin-top scale-95 group-hover:scale-100">
              <Link 
                href="/transparansi?tab=apbdes" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 border-b border-gray-50 transition-colors ${getDropdownHoverStyle("/transparansi")}`}
              >
                Info Grafis APBDes
              </Link>
              <Link 
                href="/transparansi?tab=regulasi" 
                className={`px-5 py-3.5 text-sm font-bold text-gray-600 transition-colors ${getDropdownHoverStyle("/transparansi")}`}
              >
                Regulasi & Perdes
              </Link>
            </div>
          </div>

          <Link 
            href="/layanan" 
            className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-md shadow-green-600/30 flex items-center gap-2`}
          >
            <span>💌</span> Layanan Surat
          </Link>
          
        </nav>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-900 border border-gray-200"
          aria-label="Toggle Mobile Menu"
        >
          <span className="text-2xl font-black">
            {isMobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl overflow-y-auto max-h-[85vh] transition-all animate-fade-in">
          <nav className="flex flex-col px-4 py-6 space-y-2">
            
            <Link 
              href="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-4 rounded-xl ${pathname === "/" ? "bg-green-50 text-green-700 font-black" : "text-gray-700 font-bold hover:bg-gray-50"}`}
            >
              🏠 Beranda Utama
            </Link>

            <div>
              <button 
                onClick={() => toggleMobileDropdown("profil")}
                className={`w-full flex items-center justify-between p-4 rounded-xl font-bold ${pathname === "/profil" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span>🏛️</span> Profil & Lembaga
                </div>
                <span className={`text-[10px] transform transition-transform duration-300 ${mobileDropdown === "profil" ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {mobileDropdown === "profil" && (
                <div className="flex flex-col pl-10 pr-4 py-2 space-y-1 border-l-2 border-blue-100 ml-6 mt-1">
                  <Link href="/profil?tab=sejarah" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600">Sejarah & Visi Misi</Link>
                  <Link href="/profil?tab=sotk" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600">Pemerintah Desa</Link>
                  <Link href="/profil?tab=lembaga" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600">Lembaga Masyarakat</Link>
                  <Link href="/profil?tab=umkm" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600">Data Potensi & UMKM</Link>
                </div>
              )}
            </div>

            <Link 
              href="/datadesa" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-4 rounded-xl ${pathname === "/datadesa" ? "bg-yellow-50 text-yellow-700 font-black" : "text-gray-700 font-bold hover:bg-gray-50"}`}
            >
              📊 Data Desa
            </Link>

            <div>
              <button 
                onClick={() => toggleMobileDropdown("kabar")}
                className={`w-full flex items-center justify-between p-4 rounded-xl font-bold ${pathname === "/kabar" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span>📰</span> Kabar Desa
                </div>
                <span className={`text-[10px] transform transition-transform duration-300 ${mobileDropdown === "kabar" ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {mobileDropdown === "kabar" && (
                <div className="flex flex-col pl-10 pr-4 py-2 space-y-1 border-l-2 border-green-100 ml-6 mt-1">
                  <Link href="/kabar?tab=berita" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-green-600">Berita & Kegiatan</Link>
                  <Link href="/kabar?tab=agenda" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-green-600">Agenda Terdekat</Link>
                </div>
              )}
            </div>

            <div>
              <button 
                onClick={() => toggleMobileDropdown("transparansi")}
                className={`w-full flex items-center justify-between p-4 rounded-xl font-bold ${pathname === "/transparansi" ? "bg-yellow-50 text-yellow-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span>📈</span> Transparansi
                </div>
                <span className={`text-[10px] transform transition-transform duration-300 ${mobileDropdown === "transparansi" ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {mobileDropdown === "transparansi" && (
                <div className="flex flex-col pl-10 pr-4 py-2 space-y-1 border-l-2 border-yellow-100 ml-6 mt-1">
                  <Link href="/transparansi?tab=apbdes" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-yellow-600">Info Grafis APBDes</Link>
                  <Link href="/transparansi?tab=regulasi" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-sm font-bold text-gray-600 hover:text-yellow-600">Regulasi & Peraturan</Link>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100">
              <Link 
                href="/layanan" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-black shadow-md transition-colors"
              >
                <span>💌</span> Layanan Surat Mandiri
              </Link>
            </div>
            
          </nav>
        </div>
      )}
    </header>
  );
}