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
  // PERBAIKAN ERROR TYPESCRIPT: Mendeklarasikan activeSubMenu
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

  const menuList = [
    { 
      id: "beranda", 
      icon: "🏠", 
      label: "Beranda Utama", 
      path: "/dashboard?menu=beranda", 
      sub: [
        { 
          id: "beranda-hero", 
          label: "Header Beranda" 
        },
        { 
          id: "beranda-kontak", 
          label: "Kontak & Sosmed" 
        },
        { 
          id: "beranda-slide", 
          label: "Berita Slide" 
        }
      ] 
    },
    { 
      id: "profil", 
      icon: "🏛️", 
      label: "Profil & UMKM", 
      path: "/dashboard?menu=profil",
      sub: [
        { 
          id: "profil-hero", 
          label: "Pengaturan Header" 
        },
        { 
          id: "profil-teks", 
          label: "Sejarah & Visi Misi" 
        },
        { 
          id: "profil-sotk", 
          label: "Susunan SOTK" 
        },
        { 
          id: "profil-lembaga", 
          label: "Lembaga Desa" 
        },
        { 
          id: "profil-umkm", 
          label: "Katalog UMKM" 
        }
      ]
    },
    { 
      id: "datadesa", 
      icon: "📊", 
      label: "Data Desa", 
      path: "/dashboard?menu=datadesa", 
      sub: [
        { 
          id: "data-kelola", 
          label: "Daftar Penduduk" 
        },
        { 
          id: "data-upload", 
          label: "Impor Excel" 
        },
        { 
          id: "data-hero", 
          label: "Pengaturan Publik" 
        }
      ] 
    },
    { 
      id: "kabar", 
      icon: "📰", 
      label: "Kabar & Agenda", 
      path: "/dashboard?menu=kabar",
      sub: [
        { 
          id: "kabar-hero", 
          label: "Pengaturan Header" 
        },
        { 
          id: "kabar-berita", 
          label: "Manajemen Berita" 
        },
        { 
          id: "kabar-agenda", 
          label: "Manajemen Agenda" 
        }
      ]
    },
    { 
      id: "transparansi", 
      icon: "📈", 
      label: "Transparansi", 
      path: "/dashboard?menu=transparansi",
      sub: [
        { 
          id: "trans-hero", 
          label: "Pengaturan Header" 
        },
        { 
          id: "trans-apbdes", 
          label: "Data APBDes" 
        },
        { 
          id: "trans-regulasi", 
          label: "Regulasi & Perdes" 
        }
      ]
    },
    { 
      id: "layanan", 
      icon: "💌", 
      label: "Layanan Warga", 
      path: "/dashboard?menu=layanan",
      sub: [
        { 
          id: "layan-hero", 
          label: "Pengaturan Header" 
        },
        { 
          id: "layan-antrean", 
          label: "Antrean Surat" 
        },
        { 
          id: "layan-master", 
          label: "Daftar Jenis Surat" 
        },
        { 
          id: "layan-pengaduan", 
          label: "Kotak Pengaduan" 
        }
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

  const filteredMenus = menuList.filter((item) => {
    if (userRole === "Admin") {
      return true;
    }
    if (userRole === "Pemerintah Desa") {
      return item.id !== "akun";
    }
    if (userRole === "Kontributor") {
      return item.id === "beranda" || item.id === "profil" || item.id === "kabar";
    }
    return item.id === "beranda"; 
  });

  return (
    <>
      {/* Layar Gelap (Overlay) untuk Mobile saat Sidebar terbuka */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Container Utama Sidebar (Flex Column & H-Screen) */}
      <aside 
        className={`w-64 bg-gray-900 text-white h-screen fixed top-0 left-0 z-50 flex flex-col transform transition-transform duration-300 shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        
        {/* BAGIAN ATAS: Logo & Profil Login (Terkunci / Tidak ikut di-scroll) */}
        <div 
          className="p-5 border-b border-gray-800 bg-gray-950 flex-shrink-0"
        >
          
          <div 
            className="flex items-center justify-between mb-5"
          >
            <div 
              className="flex items-center gap-3"
            >
              <div 
                className="w-10 h-10 bg-white rounded-full p-1 flex-shrink-0 shadow-lg"
              >
                <img 
                  src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h2 
                  className="font-black text-lg tracking-wide text-white leading-tight"
                >
                  Desa Kerjo
                </h2>
                <span 
                  className="text-[10px] text-green-400 font-bold uppercase tracking-widest"
                >
                  Panel Admin
                </span>
              </div>
            </div>
            {/* Tombol Tutup Khusus Mobile */}
            <button 
              className="lg:hidden text-gray-400 hover:text-white text-3xl font-black transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              ×
            </button>
          </div>

          <div 
            className="bg-gray-800 rounded-xl p-3 flex flex-col gap-3 shadow-inner"
          >
            <div>
              <p 
                className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5"
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
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>
                🚪
              </span> 
              Keluar Sesi
            </button>
          </div>

        </div>

        {/* BAGIAN TENGAH: Menu Navigasi (Bisa di-scroll ke bawah) */}
        <nav 
          className="flex-1 overflow-y-auto p-4 space-y-2 pb-8"
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
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    isActive 
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/50" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-green-400"
                  }`}
                >
                  <div 
                    className="flex items-center gap-3"
                  >
                    <span 
                      className="text-xl"
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
                      ? 'max-h-96 opacity-100 mt-2 mb-2' 
                      : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div 
                      className="pl-12 flex flex-col gap-1 border-l-2 border-gray-800 ml-6 relative"
                    >
                      {item.sub.map((subItem, idx) => (
                        <Link 
                          key={idx} 
                          href={`${item.path}&submenu=${subItem.id}`}
                          onClick={() => setIsMobileOpen(false)}
                          className={`text-xs font-bold py-2.5 px-4 rounded-r-lg transition-colors relative ${
                            activeSubMenu === subItem.id 
                            ? "text-white bg-gray-800" 
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          <span 
                            className="absolute left-[-2px] top-1/2 w-3 h-[2px] bg-gray-700"
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

      </aside>
    </>
  );
}