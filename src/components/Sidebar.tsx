// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { 
  usePathname, 
  useSearchParams 
} from "next/navigation";
import { 
  useState, 
  useEffect 
} from "react";
import { 
  getAuth, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeMenu = searchParams.get("menu") || "beranda";
  
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
    <aside 
      className="w-64 bg-gray-900 text-white min-h-screen fixed top-0 left-0 overflow-y-auto hidden lg:block shadow-2xl z-50"
    >
      <div 
        className="p-6 flex items-center gap-3 border-b border-gray-800 bg-gray-950 sticky top-0 z-10"
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

      <nav 
        className="p-4 space-y-2 mt-2 pb-24"
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
                        className="text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 py-2.5 px-4 rounded-r-lg transition-colors relative"
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

      <div 
        className="absolute bottom-0 w-full bg-gray-950 p-5 border-t border-gray-800"
      >
        <p 
          className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1"
        >
          Status Hak Akses
        </p>
        <div 
          className="flex items-center gap-2"
        >
          <span 
            className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"
          ></span>
          <span 
            className="text-xs font-bold text-green-400 truncate"
          >
            {userRole || "Mendeteksi..."}
          </span>
        </div>
      </div>
    </aside>
  );
}