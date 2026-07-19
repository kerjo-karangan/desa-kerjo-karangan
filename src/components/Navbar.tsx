// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Struktur Menu & Sub-Menu
  const navItems = [
    { name: "Beranda", path: "/", sub: [] },
    { 
      name: "Profil & Lembaga", path: "/profil", 
      sub: [
        { title: "Sejarah & Visi Misi", link: "/profil?tab=sejarah" },
        { title: "Pemerintah Desa", link: "/profil?tab=sotk" },
        { title: "Lembaga Masyarakat", link: "/profil?tab=lembaga" },
        { title: "Potensi & UMKM", link: "/profil?tab=umkm" }
      ] 
    },
    { 
      name: "Kabar Desa", path: "/kabar", 
      sub: [
        { title: "Berita & Kegiatan", link: "/kabar?tab=berita" },
        { title: "Agenda Desa", link: "/kabar?tab=agenda" }
      ] 
    },
    { 
      name: "Transparansi", path: "/transparansi", 
      sub: [
        { title: "Anggaran & APBDes", link: "/transparansi?tab=apbdes" },
        { title: "Realisasi Dana Desa", link: "/transparansi?tab=realisasi" },
        { title: "Regulasi & Perdes", link: "/transparansi?tab=regulasi" }
      ] 
    },
    { 
      name: "Layanan Mandiri", path: "/layanan", 
      sub: [
        { title: "Permohonan Surat", link: "/layanan?tab=surat" },
        { title: "Cek Status Pengajuan", link: "/layanan?tab=status" },
        { title: "Kotak Pengaduan", link: "/layanan?tab=pengaduan" }
      ] 
    },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              <img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo Desa Kerjo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-2xl text-green-800 tracking-tight">Desa Kerjo</span>
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => (
              <div 
                key={item.name} 
                className="relative group"
                onMouseEnter={() => setOpenDropdown(item.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link 
                  href={item.path}
                  className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 flex items-center gap-1
                    ${pathname === item.path ? "text-green-700 bg-green-50" : "text-gray-600 hover:text-green-700 hover:bg-green-50"}`}
                >
                  {item.name}
                  {item.sub.length > 0 && <span className="text-xs transition-transform duration-300 group-hover:rotate-180">▼</span>}
                </Link>

                {/* Sub Menu Desktop */}
                {item.sub.length > 0 && (
                  <div className={`absolute top-full left-0 w-64 bg-white shadow-xl rounded-xl border border-gray-100 py-3 transition-all duration-300 origin-top
                    ${openDropdown === item.name ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"}`}
                  >
                    {item.sub.map((subItem) => (
                      <Link 
                        key={subItem.title} 
                        href={subItem.link} 
                        className="block px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* TOMBOL HAMBURGER MOBILE */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="w-6 flex flex-col items-end gap-1.5">
              <span className={`h-0.5 bg-green-800 rounded-full transition-all duration-300 ${isOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}></span>
              <span className={`h-0.5 bg-green-800 rounded-full transition-all duration-300 ${isOpen ? "opacity-0" : "w-4"}`}></span>
              <span className={`h-0.5 bg-green-800 rounded-full transition-all duration-300 ${isOpen ? "w-6 -rotate-45 -translate-y-2" : "w-6"}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* MENU MOBILE (DROPDOWN) */}
      <div className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden ${isOpen ? "max-h-screen pb-4" : "max-h-0"}`}>
        <div className="container mx-auto px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.name} className="border-b border-gray-50 last:border-0">
              <div 
                className="flex justify-between items-center px-4 py-3 cursor-pointer text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg font-bold"
                onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
              >
                <Link href={item.path} onClick={() => { if(item.sub.length === 0) setIsOpen(false) }}>{item.name}</Link>
                {item.sub.length > 0 && <span>{openDropdown === item.name ? "▲" : "▼"}</span>}
              </div>
              
              {/* Sub Menu Mobile */}
              {item.sub.length > 0 && openDropdown === item.name && (
                <div className="bg-gray-50 rounded-lg mx-2 mb-2 py-2">
                  {item.sub.map((subItem) => (
                    <Link 
                      key={subItem.title} 
                      href={subItem.link} 
                      onClick={() => setIsOpen(false)}
                      className="block px-8 py-2 text-sm font-semibold text-gray-600 hover:text-green-700"
                    >
                      • {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}