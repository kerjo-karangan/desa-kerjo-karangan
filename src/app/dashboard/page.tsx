// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

// Import SEMUA Komponen Modular yang sudah kita buat
import Welcome from "../../components/dashboard/Welcome";
import DataPenduduk from "../../components/dashboard/DataPenduduk";
import ManajemenAkun from "../../components/dashboard/ManajemenAkun";
import LayananWarga from "../../components/dashboard/LayananWarga";
import KabarAgenda from "../../components/dashboard/KabarAgenda";
import ProfilUmkm from "../../components/dashboard/ProfilUmkm";
import Transparansi from "../../components/dashboard/Transparansi";

export default function DashboardAdmin() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("welcome");

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800">
          <h2 className="text-2xl font-black mb-1">Ruang Kendali</h2>
          <p className="text-green-400 text-xs truncate">{userEmail}</p>
        </div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button onClick={() => setActiveMenu("welcome")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "welcome" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏠 Ringkasan Sistem</button>
          <button onClick={() => setActiveMenu("datadesa")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "datadesa" ? "bg-purple-600 text-white translate-x-2 shadow-md" : "hover:bg-green-800"}`}>👥 Data Penduduk (Excel)</button>
          
          <button onClick={() => setActiveMenu("profil")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "profil" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏛️ Profil & UMKM</button>
          <button onClick={() => setActiveMenu("kabar")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "kabar" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📰 Kabar & Agenda</button>
          <button onClick={() => setActiveMenu("transparansi")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "transparansi" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📊 Transparansi</button>
          <button onClick={() => setActiveMenu("layanan")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "layanan" ? "bg-yellow-500 text-gray-900 translate-x-2 shadow-md" : "hover:bg-green-800"}`}>✉️ Layanan Warga</button>
          
          <button onClick={() => setActiveMenu("akun")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "akun" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>👥 Manajemen Akun</button>
        </nav>
        <div className="p-4 border-t border-green-800">
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">🚪 Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeMenu === "welcome" && <Welcome />}
        {activeMenu === "datadesa" && <DataPenduduk />}
        {activeMenu === "akun" && <ManajemenAkun userEmail={userEmail} />}
        
        {/* SEMUA KOMPONEN KINI BEKERJA SEMPURNA! */}
        {activeMenu === "layanan" && <LayananWarga />}
        {activeMenu === "kabar" && <KabarAgenda userEmail={userEmail} />}
        {activeMenu === "profil" && <ProfilUmkm />}
        {activeMenu === "transparansi" && <Transparansi />}
      </main>
    </div>
  );
}