// src/app/dashboard/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  getAuth, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  useRouter, 
  useSearchParams 
} from "next/navigation";

// Import komponen internal dashboard
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
  
  // State untuk mengontrol Sidebar di layar HP (Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeMenu = searchParams.get("menu") || "beranda";
  const activeSubMenu = searchParams.get("submenu") || "";

  useEffect(() => {
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

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div 
          className="flex flex-col items-center gap-4"
        >
          <div 
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <p 
            className="text-green-700 font-bold tracking-widest animate-pulse"
          >
            Memuat Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "beranda":
        return (
          <PengaturanBeranda 
            userEmail={user.email} 
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
            userEmail={user.email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "transparansi":
        return (
          <Transparansi 
            userEmail={user.email} 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "layanan":
        return (
          <LayananWarga 
            activeSubMenu={activeSubMenu} 
          />
        );
      case "akun":
        return (
          <ManajemenAkun 
            userEmail={user.email} 
          />
        );
      default:
        return (
          <Welcome />
        );
    }
  };

  return (
    <div 
      className="flex min-h-screen bg-gray-50 font-sans"
    >
      
      {/* Komponen Sidebar yang kini menerima props untuk Mobile */}
      <Sidebar 
        isMobileOpen={isSidebarOpen} 
        setIsMobileOpen={setIsSidebarOpen} 
        userEmail={user.email} 
      />

      <div 
        className="flex-1 lg:ml-64 flex flex-col transition-all duration-300 min-w-0"
      >
        
        {/* Header Atas Khusus Judul & Tombol Hamburger Mobile */}
        <header 
          className="bg-white shadow-sm border-b border-gray-100 py-4 px-6 md:px-8 flex items-center sticky top-0 z-30"
        >
          <div 
            className="flex items-center gap-4"
          >
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Buka Menu"
            >
              <span 
                className="text-2xl font-black"
              >
                ☰
              </span>
            </button>
            <h1 
              className="text-xl md:text-2xl font-black text-gray-900 tracking-tight"
            >
              Dashboard Panel
            </h1>
          </div>
        </header>

        <main 
          className="p-4 md:p-8 flex-grow overflow-x-hidden"
        >
          {renderContent()}
        </main>
        
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex items-center justify-center bg-gray-50"
        >
          <div 
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}