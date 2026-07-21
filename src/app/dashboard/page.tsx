// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// Import Komponen Dashboard
import Welcome from "../../components/dashboard/Welcome";
import PengaturanBeranda from "../../components/dashboard/PengaturanBeranda";
import DataPenduduk from "../../components/dashboard/DataPenduduk";
import ManajemenAkun from "../../components/dashboard/ManajemenAkun";
import ProfilUmkm from "../../components/dashboard/ProfilUmkm";
import KabarAgenda from "../../components/dashboard/KabarAgenda";
import Transparansi from "../../components/dashboard/Transparansi";
import LayananWarga from "../../components/dashboard/LayananWarga";

export default function DashboardAdmin() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // State Navigasi Menu
  const [activeMenu, setActiveMenu] = useState("welcome");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            setUserRole("Admin");
          }
        } catch (error) {
          console.error("Gagal mengambil role:", error);
          setUserRole("Admin");
        }
        setLoadingAuth(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Struktur Menu Sidebar dengan Sub-Menu Baru (Termasuk Pengaturan Header/Hero)
  const menuItems = [
    { id: "welcome", label: "Dashboard", icon: "🏠" },
    { id: "beranda", label: "Beranda Utama", icon: "🖼️" },
    { id: "datadesa", label: "Data Penduduk", icon: "👥" },
    { 
      id: "profil", label: "Profil & UMKM", icon: "🏛️", 
      subMenu: [
        { id: "profil-teks", label: "Sejarah & Visi Misi" },
        { id: "profil-sotk", label: "Aparatur (SOTK)" },
        { id: "profil-lembaga", label: "Lembaga Masyarakat" },
        { id: "profil-umkm", label: "Potensi & UMKM" },
        { id: "profil-hero", label: "Pengaturan Header" }
      ] 
    },
    { 
      id: "kabar", label: "Kabar & Agenda", icon: "📰", 
      subMenu: [
        { id: "kabar-berita", label: "Berita Desa" },
        { id: "kabar-agenda", label: "Agenda Kegiatan" },
        { id: "kabar-hero", label: "Pengaturan Header" }
      ] 
    },
    { 
      id: "trans", label: "Transparansi", icon: "📊", 
      subMenu: [
        { id: "trans-apbdes", label: "Data APBDes" },
        { id: "trans-regulasi", label: "Regulasi & Perdes" },
        { id: "trans-hero", label: "Pengaturan Header" }
      ] 
    },
    { 
      id: "layan", label: "Layanan Warga", icon: "📄", 
      subMenu: [
        { id: "layan-antrean", label: "Antrean Surat" },
        { id: "layan-master", label: "Daftar Jenis Surat" },
        { id: "layan-pengaduan", label: "Kotak Pengaduan" },
        { id: "layan-hero", label: "Pengaturan Header" }
      ] 
    },
  ];

  if (userRole === "Super Admin") {
    menuItems.push({ id: "akun", label: "Manajemen Akun", icon: "🔑" });
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold tracking-widest animate-pulse">MEMUAT SISTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* NAVBAR MOBILE */}
      <div className="md:hidden bg-gray-900 text-white flex items-center justify-between p-4 shadow-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full p-1"><img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo" className="w-full h-full object-contain" /></div>
          <span className="font-black tracking-widest text-sm">ADMIN DESA</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-2xl focus:outline-none">
          {isSidebarOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative w-64 h-full bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 ease-in-out z-40 shadow-2xl`}>
        <div className="p-6 border-b border-gray-800 hidden md:flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full p-1"><img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo" className="w-full h-full object-contain" /></div>
          <div>
            <h2 className="font-black text-white text-lg leading-none tracking-wide">Admin Panel</h2>
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">Desa Kerjo</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isMainActive = activeMenu === item.id || activeMenu.startsWith(item.id + "-");
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.subMenu) {
                        // Jika punya submenu, default buka submenu pertama
                        setActiveMenu(item.subMenu[0].id);
                      } else {
                        setActiveMenu(item.id);
                      }
                      if (window.innerWidth < 768 && !item.subMenu) setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                      isMainActive ? "bg-green-600 text-white shadow-lg shadow-green-900/50" : "hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>

                  {/* Render SubMenu jika Main Menu sedang aktif */}
                  {item.subMenu && isMainActive && (
                    <div className="ml-11 mt-2 space-y-1 border-l-2 border-gray-700 pl-3">
                      {item.subMenu.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveMenu(sub.id);
                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeMenu === sub.id ? "bg-gray-800 text-green-400" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Login Aktif</div>
            <div className="text-xs font-bold text-white truncate">{userEmail}</div>
            <div className="text-[10px] text-green-400 font-bold mt-1 bg-green-900/30 inline-block px-2 py-0.5 rounded">{userRole}</div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
            <span>🚪</span> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative w-full h-[calc(100vh-64px)] md:h-screen bg-gray-50">
        {activeMenu === "welcome" && <Welcome />}
        {activeMenu === "beranda" && <PengaturanBeranda userEmail={userEmail} />}
        {activeMenu === "datadesa" && <DataPenduduk />}
        {activeMenu === "akun" && <ManajemenAkun userEmail={userEmail} />}
        
        {/* Parsing activeMenu menjadi prop activeSubMenu ke komponen bersangkutan */}
        {activeMenu.startsWith("profil") && <ProfilUmkm activeSubMenu={activeMenu} />}
        {activeMenu.startsWith("kabar") && <KabarAgenda userEmail={userEmail} activeSubMenu={activeMenu} />}
        {activeMenu.startsWith("trans") && <Transparansi activeSubMenu={activeMenu} userEmail={userEmail} />}
        {activeMenu.startsWith("layan") && <LayananWarga activeSubMenu={activeMenu} />}
      </main>

    </div>
  );
}