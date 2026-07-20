// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

// Import SEMUA Komponen Modular
import Welcome from "../../components/dashboard/Welcome";
import PengaturanBeranda from "../../components/dashboard/PengaturanBeranda";
import DataPenduduk from "../../components/dashboard/DataPenduduk";
import ProfilUmkm from "../../components/dashboard/ProfilUmkm";
import KabarAgenda from "../../components/dashboard/KabarAgenda";
import Transparansi from "../../components/dashboard/Transparansi";
import LayananWarga from "../../components/dashboard/LayananWarga";
import ManajemenAkun from "../../components/dashboard/ManajemenAkun";

export default function DashboardAdmin() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // State untuk Navigasi Menu & Dropdown
  const [activeMenu, setActiveMenu] = useState("welcome");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email);
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleMainMenuClick = (menuId: string, hasSubMenu: boolean) => {
    if (hasSubMenu) {
      setOpenDropdown(openDropdown === menuId ? null : menuId);
    } else {
      setActiveMenu(menuId);
      setOpenDropdown(null);
      setIsSidebarOpen(false); 
    }
  };

  const handleSubMenuClick = (subMenuId: string) => {
    setActiveMenu(subMenuId);
    setIsSidebarOpen(false); 
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Struktur Menu Dinamis Dashboard (DITAMBAH MENU PENGATURAN BERANDA)
  const menuItems = [
    { id: "welcome", label: "Ringkasan Sistem", icon: "🏠", sub: [] },
    { id: "beranda", label: "Pengaturan Beranda", icon: "🖼️", sub: [] },
    { id: "datadesa", label: "Data Penduduk", icon: "👥", sub: [] },
    { 
      id: "profil", label: "Profil & UMKM", icon: "🏛️", 
      sub: [
        { id: "profil-teks", label: "Teks Sejarah & Visi Misi" },
        { id: "profil-sotk", label: "SOTK (Aparatur Desa)" },
        { id: "profil-lembaga", label: "Lembaga Masyarakat" },
        { id: "profil-umkm", label: "Potensi & UMKM" }
      ] 
    },
    { 
      id: "kabar", label: "Kabar & Agenda", icon: "📰", 
      sub: [
        { id: "kabar-berita", label: "Publikasi Berita" },
        { id: "kabar-agenda", label: "Kalender Agenda" }
      ] 
    },
    { 
      id: "transparansi", label: "Transparansi", icon: "📊", 
      sub: [
        { id: "trans-apbdes", label: "Grafik APBDes" },
        { id: "trans-realisasi", label: "Realisasi Dana" },
        { id: "trans-regulasi", label: "Dokumen Regulasi" }
      ] 
    },
    { 
      id: "layanan", label: "Layanan Warga", icon: "✉️", 
      sub: [
        { id: "layan-surat", label: "Antrean Surat" },
        { id: "layan-pengaduan", label: "Kotak Pengaduan" }
      ] 
    },
    { id: "akun", label: "Manajemen Akun", icon: "⚙️", sub: [] }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-green-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full p-1 flex items-center justify-center">
            <img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black">Ruang Kendali</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-green-800 rounded-lg transition-colors focus:outline-none"
        >
          <div className="w-6 flex flex-col items-end gap-1.5">
            <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isSidebarOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}></span>
            <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isSidebarOpen ? "opacity-0" : "w-4"}`}></span>
            <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isSidebarOpen ? "w-6 -rotate-45 -translate-y-2" : "w-6"}`}></span>
          </div>
        </button>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-green-900 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        <div className="p-6 border-b border-green-800 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center">
              <img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-black">Admin Panel</h2>
          </div>
          <p className="text-green-400 text-xs font-mono truncate">{userEmail}</p>
        </div>
        
        <nav className="p-4 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((menu) => {
            const hasSub = menu.sub.length > 0;
            const isMenuOrSubActive = activeMenu === menu.id || menu.sub.some(sub => activeMenu === sub.id);
            const isDropdownOpen = openDropdown === menu.id;

            return (
              <div key={menu.id} className="flex flex-col">
                <button 
                  onClick={() => handleMainMenuClick(menu.id, hasSub)} 
                  className={`text-left px-4 py-3.5 rounded-xl font-semibold flex justify-between items-center transition-all ${
                    isMenuOrSubActive && !hasSub ? "bg-green-700 text-white shadow-md transform translate-x-2" : 
                    isDropdownOpen ? "bg-green-800 text-white" : "hover:bg-green-800 text-green-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{menu.icon}</span> 
                    {menu.label}
                  </span>
                  {hasSub && (
                    <span className={`text-xs transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}>▼</span>
                  )}
                </button>
                
                {hasSub && (
                  <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? "max-h-96 opacity-100 mt-2 ml-4 border-l-2 border-green-700 pl-2" : "max-h-0 opacity-0 pointer-events-none"}`}>
                    {menu.sub.map((sub) => (
                      <button 
                        key={sub.id}
                        onClick={() => handleSubMenuClick(sub.id)}
                        className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          activeMenu === sub.id ? "bg-green-700 text-white font-bold shadow-sm translate-x-1" : "text-green-200 hover:text-white hover:bg-green-800"
                        }`}
                      >
                        <span className="text-xs opacity-50">•</span> {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* RELOKASI TOMBOL LOGOUT (TEPAT DI BAWAH MENU TERAKHIR) */}
          <div className="mt-4 pt-4 border-t border-green-800">
            <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 transform hover:-translate-y-1">
              <span className="text-xl">🚪</span> Keluar Sistem
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative w-full h-[calc(100vh-64px)] md:h-screen">
        {activeMenu === "welcome" && <Welcome />}
        {activeMenu === "beranda" && <PengaturanBeranda userEmail={userEmail} />}
        {activeMenu === "datadesa" && <DataPenduduk />}
        {activeMenu === "akun" && <ManajemenAkun userEmail={userEmail} />}
        {activeMenu.startsWith("profil") && <ProfilUmkm activeSubMenu={activeMenu} />}
        {activeMenu.startsWith("kabar") && <KabarAgenda userEmail={userEmail} activeSubMenu={activeMenu} />}
        {activeMenu.startsWith("trans") && <Transparansi activeSubMenu={activeMenu} />}
        {activeMenu.startsWith("layan") && <LayananWarga activeSubMenu={activeMenu} />}
      </main>
    </div>
  );
}