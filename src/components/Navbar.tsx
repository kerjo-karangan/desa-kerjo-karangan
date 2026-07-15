// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownMobile, setOpenDropdownMobile] = useState<string | null>(null);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDropdownMobile = (name: string) => setOpenDropdownMobile(openDropdownMobile === name ? null : name);

  // Struktur Menu & Sub-Menu DENGAN ROUTING SPESIFIK
  const navItems = [
    { name: "Beranda", path: "/", sub: [] },
    { 
      name: "Layanan Mandiri", path: "/layanan", 
      sub: [
        { title: "Permohonan Surat", link: "/layanan?tab=surat" },
        { title: "Cek Status Pengajuan", link: "/layanan?tab=status" },
        { title: "Kotak Pengaduan", link: "/layanan?tab=pengaduan" }
      ] 
    },
    { 
      name: "Kabar Desa", path: "/kabar", 
      sub: [
        { title: "Berita & Kegiatan", link: "/kabar#berita" },
        { title: "Agenda Desa", link: "/kabar#agenda" }
      ] 
    },
    { 
      name: "Transparansi", path: "/transparansi", 
      sub: [
        { title: "Anggaran & APBDes", link: "/transparansi#apbdes" },
        { title: "Realisasi Dana Desa", link: "/transparansi#realisasi" },
        { title: "Regulasi & Perdes", link: "/transparansi#regulasi" }
      ] 
    },
    { 
      name: "Profil & Lembaga", path: "/profil", 
      sub: [
        { title: "Sejarah & Visi Misi", link: "/profil#sejarah" },
        { title: "Pemerintah Desa", link: "/profil#sotk" },
        { title: "Lembaga Masyarakat", link: "/profil#lembaga" },
        { title: "Potensi & UMKM", link: "/profil#umkm" }
      ] 
    },
  ];
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              {/* PASTE LINK LANGSUNG (DIRECT LINK) DARI IMGBB DI SINI */}
              <img 
                src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                alt="Logo Desa" 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2633/2633804.png"; }}
              />
            </div>
            <Link href="/" className="font-black text-2xl text-green-900 tracking-tighter hover:text-green-700 transition-colors">
              Desa Kerjo
            </Link>
          </div>

          <div className="hidden lg:flex space-x-1 items-center">
            {navItems.map((item, index) => (
              <div key={index} className="relative group px-3 py-2">
                {item.sub.length === 0 ? (
                  <Link href={item.path} className="text-gray-600 hover:text-green-700 font-bold transition-colors">{item.name}</Link>
                ) : (
                  <div className="cursor-pointer text-gray-600 hover:text-green-700 font-bold transition-colors flex items-center gap-1">
                    <Link href={item.path}>{item.name}</Link><FiChevronDown className="mt-0.5 group-hover:rotate-180 transition-transform duration-300" />
                  </div>
                )}
                {item.sub.length > 0 && (
                  <div className="absolute left-0 mt-4 w-56 bg-white border border-gray-100 shadow-xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                    <div className="p-2 flex flex-col">
                      {item.sub.map((subItem, idx) => (<Link key={idx} href={subItem.link} className="px-4 py-3 text-sm font-semibold text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors">{subItem.title}</Link>))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lg:hidden flex items-center"><button onClick={toggleMenu} className="text-gray-800 hover:text-green-700 p-2 rounded-lg bg-gray-50 focus:outline-none">{isMobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}</button></div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-inner max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl">
                  <Link href={item.path} onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-gray-800 flex-grow">{item.name}</Link>
                  {item.sub.length > 0 && (<button onClick={() => toggleDropdownMobile(item.name)} className="p-2 bg-gray-200 rounded-lg text-gray-600"><FiChevronDown className={`transition-transform duration-300 ${openDropdownMobile === item.name ? "rotate-180" : ""}`} /></button>)}
                </div>
                {item.sub.length > 0 && openDropdownMobile === item.name && (
                  <div className="pl-6 pr-4 py-2 space-y-1 mt-1 border-l-2 border-green-500 ml-4">
                    {item.sub.map((subItem, idx) => (<Link key={idx} href={subItem.link} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-gray-600 hover:text-green-700 hover:bg-green-100 rounded-lg">- {subItem.title}</Link>))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}