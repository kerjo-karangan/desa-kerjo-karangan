// src/app/dashboard/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  useRouter, 
  useSearchParams 
} from "next/navigation";
import { 
  getAuth, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import "../../lib/firebase"; // Import ini memastikan Firebase diinisialisasi tanpa menarik variabel yang tidak diekspor

// Import Komponen Sidebar & Menu
import Sidebar from "../../components/Sidebar";
import PengaturanBeranda from "../../components/dashboard/PengaturanBeranda";
import ProfilUmkm from "../../components/dashboard/ProfilUmkm";
import DataPenduduk from "../../components/dashboard/DataPenduduk";
import KabarAgenda from "../../components/dashboard/KabarAgenda";
import Transparansi from "../../components/dashboard/Transparansi";
import LayananWarga from "../../components/dashboard/LayananWarga";
import ManajemenAkun from "../../components/dashboard/ManajemenAkun";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeMenu = searchParams.get("menu") || "beranda";
  const activeSubMenu = searchParams.get("submenu") || "";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ==========================================
  // AUTENTIKASI FIREBASE
  // ==========================================
  useEffect(() => {
    // Memanggil getAuth() secara langsung tanpa parameter app
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ==========================================
  // RENDERER KONTEN DINAMIS & PASSING PROPS
  // ==========================================
  const renderContent = () => {
    // Menyuntikkan userEmail ke komponen yang membutuhkannya untuk fitur pencatatan log admin
    const email = user?.email || null;

    switch (activeMenu) {
      case "beranda":
        return (
          <PengaturanBeranda 
            userEmail={email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "profil":
        return (
          <ProfilUmkm 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "datadesa":
        return (
          <DataPenduduk 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "kabar":
        return (
          <KabarAgenda 
            userEmail={email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "transparansi":
        return (
          <Transparansi 
            userEmail={email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "layanan":
        return (
          <LayananWarga 
            userEmail={email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "akun":
        return (
          <ManajemenAkun 
            userEmail={email} 
          />
        );
      default:
        return (
          <PengaturanBeranda 
            userEmail={email} 
            activeSubMenu={activeSubMenu} 
          />
        );
    }
  };

  // Layar Loading Otentikasi
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-900"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-green-500 font-bold tracking-widest animate-pulse"
        >
          MEMVERIFIKASI AKSES ADMIN...
        </p>
      </div>
    );
  }

  // Jika belum login, cegah render layout utama
  if (!user) {
    return null; 
  }

  return (
    <div 
      className="flex min-h-screen bg-gray-50 font-sans"
    >
      
      {/* ==========================================
          1. SIDEBAR NAVIGASI
      ========================================== */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        userEmail={user.email || ""} 
      />

      {/* ==========================================
          2. AREA KONTEN UTAMA (MAIN CONTENT)
      ========================================== */}
      <div 
        className="flex-1 flex flex-col lg:ml-64 w-full min-w-0"
      >
        
        {/* Header Mobile (Hanya Tampil di Layar Kecil) */}
        <header 
          className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md"
        >
          <div 
            className="flex items-center gap-3"
          >
            <div 
              className="w-8 h-8 bg-white rounded-full p-0.5 flex-shrink-0"
            >
              <img 
                src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 
              className="font-black text-sm tracking-widest"
            >
              PANEL ADMIN
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span 
              className="text-xl leading-none"
            >
              ☰
            </span>
          </button>
        </header>

        {/* Pembungkus Konten yang Dirender */}
        <main 
          className="flex-1 p-4 md:p-8 w-full max-w-[100vw]"
        >
          <div 
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[80vh]"
          >
            <h2 
              className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4"
            >
              Dashboard Panel
            </h2>
            
            {/* Inject Komponen Sesuai URL */}
            {renderContent()}
            
          </div>
        </main>
      </div>

    </div>
  );
}

// ==========================================
// SUSPENSE WRAPPER (STANDAR NEXT.JS APP ROUTER)
// ==========================================
export default function DashboardPage() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex items-center justify-center bg-gray-900"
        >
          <div 
            className="w-12 h-12 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin"
          ></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}