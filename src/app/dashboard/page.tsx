// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

// Import semua komponen dashboard
import Sidebar from "../../components/Sidebar";
import Welcome from "../../components/dashboard/Welcome";
import PengaturanBeranda from "../../components/dashboard/PengaturanBeranda";
import ProfilUmkm from "../../components/dashboard/ProfilUmkm";
import KabarAgenda from "../../components/dashboard/KabarAgenda";
import Transparansi from "../../components/dashboard/Transparansi";
import LayananWarga from "../../components/dashboard/LayananWarga";
import DataPenduduk from "../../components/dashboard/DataPenduduk";
import ManajemenAkun from "../../components/dashboard/ManajemenAkun";

function DashboardContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeMenu = searchParams.get("menu") || "beranda";
  const activeSubMenu = searchParams.get("submenu") || "";

  useEffect(() => {
    // Memanggil getAuth tanpa parameter app untuk menghindari error import
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-green-700 font-bold tracking-widest animate-pulse">
            Memuat Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Fungsi untuk merender komponen berdasarkan parameter URL ?menu=...
  const renderContent = () => {
    switch (activeMenu) {
      case "beranda":
        return <PengaturanBeranda userEmail={user.email} activeSubMenu={activeSubMenu} />;
      case "profil":
        return <ProfilUmkm activeSubMenu={activeSubMenu} />;
      case "datadesa":
        return <DataPenduduk activeSubMenu={activeSubMenu} />;
      case "kabar":
        return <KabarAgenda userEmail={user.email} activeSubMenu={activeSubMenu} />;
      case "transparansi":
        return <Transparansi userEmail={user.email} activeSubMenu={activeSubMenu} />;
      case "layanan":
        return <LayananWarga activeSubMenu={activeSubMenu} />;
      case "akun":
        return <ManajemenAkun userEmail={user.email} />;
      default:
        // Menghapus parameter userEmail dari Welcome.tsx untuk memperbaiki Error TypeScript
        return <Welcome />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* Komponen Sidebar Admin Kiri */}
      <Sidebar />

      {/* Area Konten Utama Kanan */}
      <div className="flex-1 lg:ml-64 flex flex-col transition-all duration-300">
        
        {/* Header Atas Dashboard */}
        <header className="bg-white shadow-sm border-b border-gray-100 py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 z-40">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Dashboard Panel
          </h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Login Aktif
              </span>
              <span className="text-sm font-bold text-green-700">
                {user.email}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold py-2 px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <span>🚪</span> Keluar
            </button>
          </div>
        </header>

        {/* Render Komponen Sesuai Menu yang Dipilih */}
        <main className="p-6 md:p-8 flex-grow">
          {renderContent()}
        </main>
        
      </div>
    </div>
  );
}

// Membungkus DashboardContent dengan Suspense karena menggunakan useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}