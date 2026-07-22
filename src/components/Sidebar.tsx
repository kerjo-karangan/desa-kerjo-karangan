// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { 
  usePathname, 
  useSearchParams, 
  useRouter 
} from "next/navigation";
import { 
  useState, 
  useEffect 
} from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  userEmail: string;
}

export default function Sidebar({ 
  isMobileOpen, 
  setIsMobileOpen, 
  userEmail 
}: SidebarProps) {
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const activeMenu = searchParams.get("menu") || "beranda";
  const activeSubMenu = searchParams.get("submenu") || "";
  
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const q = query(
            collection(db, "users_desa"), 
            where("email", "==", user.email)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setUserRole(snap.docs[0].data().role);
          } else if (user.email === "admin@kerjo.co.id") {
            setUserRole("Admin");
          }
        } catch (error) {
          console.error("Gagal mendeteksi role:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // STRUKTUR URUTAN MENU PERSIS SESUAI PERMINTAAN
  const menuList = [
    { 
      id: "beranda", 
      icon: "🏠", 
      label: "Beranda Utama", 
      path: "/dashboard?menu=beranda", 
      sub: [
        { id: "beranda-hero", label: "Pengaturan Header" },
        { id: "beranda-kontak", label: "Kontak & Sosmed" },
        { id: "beranda-slide", label: "Berita Slide" }
      ] 
    },
    { 
      id: "profil", 
      icon: "🏛️", 
      label: "Profil & UMKM", 
      path: "/dashboard?menu=profil",
      sub: [
        { id: "profil-hero", label: "Pengaturan Header" },
        { id: "profil-teks", label: "Sejarah & Visi Misi" },
        { id: "profil-sotk", label: "Susunan SOTK" },
        { id: "profil-lembaga", label: "Lembaga Masyarakat" },
        { id: "profil-umkm", label: "Katalog UMKM" }
      ]
    },
    { 
      id: "datadesa", 
      icon: "📊", 
      label: "Data Penduduk / Desa", 
      path: "/dashboard?menu=datadesa", 
      sub: [
        { id: "data-hero", label: "Pengaturan Header" },
        { id: "data-input", label: "Pengaturan Input Data" },
        { id: "data-kelola", label: "Data Penduduk" },
        { id: "data-upload", label: "Import & Ekspor Excel" }
      ] 
    },
    { 
      id: "kabar", 
      icon: "📰", 
      label: "Kabar & Agenda", 
      path: "/dashboard?menu=kabar",
      sub: [
        { id: "kabar-hero", label: "Pengaturan Header" },
        { id: "kabar-berita", label: "Manajemen Berita" },
        { id: "kabar-agenda", label: "Manajemen Agenda" }
      ]
    },
    { 
      id: "transparansi", 
      icon: "📈", 
      label: "Transparansi", 
      path: "/dashboard?menu=transparansi",
      sub: [
        { id: "trans-hero", label: "Pengaturan Header" },
        { id: "trans-apbdes", label: "Data APBdes" },
        { id: "trans-regulasi", label: "Regulasi & Perdes" }
      ]
    },
    { 
      id: "layanan", 
      icon: "💌", 
      label: "Layanan Warga", 
      path: "/dashboard?menu=layanan",
      sub: [
        { id: "layan-hero", label: "Pengaturan Header" },
        { id: "layan-master", label: "Daftar Jenis Surat" },
        { id: "layan-antrean", label: "Antrean Surat" },
        { id: "layan-pengaduan", label: "Kotak Pengaduan" }
      ]
    },
    { 
      id: "akun", 
      icon: "🛡️", 
      label: "Manajemen Akun", 
      path: "/dashboard?menu=akun", 
      sub: [] 
    },
  ];

  // FILTER MENU BERDASARKAN ROLE (KONTRIBUTOR VS PEMDES VS ADMIN)
  const filteredMenus = menuList.filter((item) => {
    if (userRole === "Admin" || userRole === "Pemerintah Desa") {
      return true;
    }
    if (userRole === "Kontributor") {
      // Kontributor hanya boleh akses Profil, Kabar, dan Akun
      return item.id === "profil" || item.id === "kabar" || item.id === "akun";
    }
    return item.id === "beranda"; 
  });

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Container utama dengan tinggi h-screen dan flex column agar bisa di-scroll */}
      <aside 
        className={`w-64 bg-gray-900 text-white h-screen fixed top-0 left-0 z-50 flex flex-col transform transition-transform duration-300 shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        
        {/* BAGIAN ATAS: Identitas & Panel Tombol Akun / Logout */}
        <div 
          className="p-4 border-b border-gray-800 bg-gray-950 flex-shrink-0"
        >
          <div 
            className="flex items-center justify-between mb-4"
          >
            <div 
              className="flex items-center gap-3"
            >
              <div 
                className="w-9 h-9 bg-white rounded-full p-1 flex-shrink-0 shadow-md"
              >
                <img 
                  src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h2 
                  className="font-black text-base tracking-wide text-white leading-tight"
                >
                  Desa Kerjo
                </h2>
                <span 
                  className="text-[9px] text-green-400 font-bold uppercase tracking-widest"
                >
                  Panel Admin
                </span>
              </div>
            </div>
            
            <button 
              className="lg:hidden text-gray-400 hover:text-white text-2xl font-black transition-colors px-2 py-1"
              onClick={() => setIsMobileOpen(false)}
            >
              ×
            </button>
          </div>

          <div 
            className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-inner border border-gray-700/50"
          >
            <div>
              <p 
                className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5"
              >
                Login Aktif:
              </p>
              <p 
                className="text-xs font-bold text-green-400 truncate"
              >
                {userEmail || "Memuat..."}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>🚪</span> 
              Keluar Sesi
            </button>
          </div>
        </div>

        {/* BAGIAN TENGAH: Menu Navigasi (Diberi overflow-y-auto agar bisa digeser di HP) */}
        <nav 
          className="flex-1 overflow-y-auto p-4 space-y-2 pb-24"
        >
          {filteredMenus.map((item) => {
            const isActive = activeMenu === item.id;
            const hasSub = item.sub.length > 0;
            const isHovered = hoveredMenu === item.id;

            return (
              <div 
                key={item.id} 
                className="relative group"
                onMouseEnter={() => setHoveredMenu(item.id)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                <Link 
                  href={item.path} 
                  onClick={() => setIsMobileOpen(false)} 
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    isActive 
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/50" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-green-400"
                  }`}
                >
                  <div 
                    className="flex items-center gap-3"
                  >
                    <span 
                      className="text-lg"
                    >
                      {item.icon}
                    </span>
                    <span>
                      {item.label}
                    </span>
                  </div>
                  {hasSub && (
                    <span 
                      className={`text-[10px] transform transition-transform duration-300 ease-in-out ${
                        isHovered || isActive 
                        ? 'rotate-90 text-white' 
                        : 'text-gray-600 group-hover:text-green-400'
                      }`}
                    >
                      ▶
                    </span>
                  )}
                </Link>

                {hasSub && (
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isHovered || isActive 
                      ? 'max-h-96 opacity-100 mt-1.5 mb-1.5' 
                      : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div 
                      className="pl-10 flex flex-col gap-1 border-l-2 border-gray-800 ml-6 relative"
                    >
                      {item.sub.map((subItem, idx) => (
                        <Link 
                          key={idx} 
                          href={`${item.path}&submenu=${subItem.id}`}
                          onClick={() => setIsMobileOpen(false)}
                          className={`text-xs font-bold py-2 px-3 rounded-r-lg transition-colors relative ${
                            activeSubMenu === subItem.id 
                            ? "text-white bg-gray-800" 
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          <span 
                            className="absolute left-[-2px] top-1/2 w-2.5 h-[2px] bg-gray-700"
                          ></span>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Kecil di Bawah Sidebar */}
        <div 
          className="p-3 bg-gray-950 border-t border-gray-800 flex-shrink-0 text-center"
        >
          <span 
            className="text-[10px] text-gray-500 font-bold uppercase tracking-widest"
          >
            Role: {userRole || "Admin"}
          </span>
        </div>

      </aside>
    </>
  );
}