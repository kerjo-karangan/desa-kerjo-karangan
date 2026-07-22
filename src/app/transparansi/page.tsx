// src/app/transparansi/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  useSearchParams,
  useRouter
} from "next/navigation";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

function TransparansiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Mengambil parameter tab dari URL (default ke apbdes)
  const tabParam = searchParams.get("tab") || "apbdes";
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // Sinkronisasi state internal dengan URL jika terjadi perubahan dari Navbar
  useEffect(() => {
    if (tabParam === "apbdes" || tabParam === "regulasi") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fungsi untuk mengganti URL saat user klik Tab di dalam halaman
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/transparansi?tab=${tab}`);
  };

  // State Data
  const [heroData, setHeroData] = useState({
    judul: "Transparansi Desa",
    sub: "Keterbukaan informasi publik terkait anggaran dan regulasi hukum Pemerintah Desa.",
    bg: ""
  });
  const [dataApbdes, setDataApbdes] = useState<any[]>([]);
  const [dataRegulasi, setDataRegulasi] = useState<any[]>([]);

  // Fungsi Fetch Data dari Firebase
  useEffect(() => {
    const fetchTransparansiData = async () => {
      setLoading(true);
      try {
        // 1. Ambil Data Header Transparansi
        const snapHero = await getDoc(doc(db, "pengaturan_web", "transparansi_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Transparansi Desa",
            sub: snapHero.data().sub || "Keterbukaan informasi publik terkait anggaran dan regulasi.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Ambil Data APBDes
        const qApbdes = query(collection(db, "transparansi_apbdes"), orderBy("tahun", "desc"));
        const snapApbdes = await getDocs(qApbdes);
        setDataApbdes(snapApbdes.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        // 3. Ambil Data Regulasi
        const qRegulasi = query(collection(db, "transparansi_regulasi"), orderBy("tahun", "desc"));
        const snapRegulasi = await getDocs(qRegulasi);
        setDataRegulasi(snapRegulasi.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data transparansi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransparansiData();
  }, []);

  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    let safeUrl = url;
    if (safeUrl.includes("cloudinary.com") && safeUrl.toLowerCase().endsWith(".heic")) {
      safeUrl = safeUrl.replace(/\.heic$/i, ".jpg");
    }
    if (safeUrl.includes("cloudinary.com") || safeUrl.startsWith("http")) {
      return safeUrl;
    }
    return `https://wsrv.nl/?url=${safeUrl}`;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-yellow-700 font-bold tracking-widest animate-pulse"
        >
          MEMUAT DOKUMEN PUBLIK...
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24"
    >
      
      {/* ==========================================
          HEADER (HERO SECTION)
      ========================================== */}
      <div 
        className={`relative py-16 md:py-24 text-white overflow-hidden shadow-md transition-colors duration-500 ${
          heroData.bg ? "bg-gray-900" : "bg-yellow-600"
        }`}
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Transparansi Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"
          ></div>
        </div>
        
        <div 
          className="container mx-auto px-4 relative z-10 text-center animate-fade-in"
        >
          <span 
            className="text-yellow-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-yellow-900/50 px-4 py-1.5 rounded-full border border-yellow-800 backdrop-blur-sm shadow-sm"
          >
            Akses Informasi Terbuka
          </span>
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl whitespace-pre-wrap leading-tight"
          >
            {heroData.judul}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-lg whitespace-pre-wrap"
          >
            {heroData.sub}
          </p>
        </div>
      </div>

      {/* ==========================================
          KONTEN UTAMA & MENU TAB
      ========================================== */}
      <div 
        className="container mx-auto px-4 max-w-6xl relative z-20 -mt-8"
      >
        
        {/* Navigasi Tab Internal */}
        <div 
          className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2 md:gap-4 justify-center max-w-3xl mx-auto mb-10"
        >
          <button 
            onClick={() => handleTabChange("apbdes")} 
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "apbdes" 
              ? "bg-yellow-500 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              📊
            </span> 
            Info Grafis APBDes
          </button>
          
          <button 
            onClick={() => handleTabChange("regulasi")} 
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "regulasi" 
              ? "bg-yellow-500 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              ⚖️
            </span> 
            Regulasi & Peraturan
          </button>
        </div>

        {/* ==========================================
            TAB 1: INFO GRAFIS APBDES
        ========================================== */}
        {activeTab === "apbdes" && (
          <div 
            className="animate-fade-in space-y-8"
          >
            {dataApbdes.length === 0 ? (
              <div 
                className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <span 
                  className="text-6xl mb-4 block opacity-30"
                >
                  📭
                </span>
                <h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  Info Grafis Belum Tersedia
                </h2>
                <p 
                  className="text-gray-500"
                >
                  Pemerintah Desa belum mengunggah dokumen grafis APBDes.
                </p>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {dataApbdes.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow"
                  >
                    <div 
                      className="h-64 sm:h-80 bg-gray-100 relative overflow-hidden"
                    >
                      {item.gambar ? (
                        <img 
                          src={getSafeImageUrl(item.gambar)} 
                          alt={item.judul} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-4xl text-gray-300"
                        >
                          📊
                        </div>
                      )}
                      
                      <div 
                        className="absolute top-4 right-4 bg-yellow-500 text-white font-black px-4 py-1.5 rounded-full text-sm shadow-md"
                      >
                        Tahun {item.tahun || "Berjalan"}
                      </div>
                    </div>
                    <div 
                      className="p-6 border-t border-gray-50"
                    >
                      <h3 
                        className="text-xl font-bold text-gray-900 mb-2"
                      >
                        {item.judul}
                      </h3>
                      <p 
                        className="text-gray-500 text-sm leading-relaxed"
                      >
                        {item.deskripsi || "Dokumen rincian Anggaran Pendapatan dan Belanja Desa."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: REGULASI & PERATURAN
        ========================================== */}
        {activeTab === "regulasi" && (
          <div 
            className="animate-fade-in"
          >
            {dataRegulasi.length === 0 ? (
              <div 
                className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <span 
                  className="text-6xl mb-4 block opacity-30"
                >
                  ⚖️
                </span>
                <h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  Regulasi Belum Tersedia
                </h2>
                <p 
                  className="text-gray-500"
                >
                  Pemerintah Desa belum mengunggah dokumen peraturan atau regulasi.
                </p>
              </div>
            ) : (
              <div 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div 
                  className="p-6 md:p-8 border-b border-gray-100 bg-yellow-50/30 flex items-center gap-4"
                >
                  <div 
                    className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
                  >
                    ⚖️
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-black text-gray-900"
                    >
                      Daftar Regulasi & Dokumen Hukum
                    </h3>
                    <p 
                      className="text-gray-500 text-sm mt-1"
                    >
                      Silakan klik tombol unduh untuk membaca detail peraturan.
                    </p>
                  </div>
                </div>
                
                <div 
                  className="overflow-x-auto p-4 md:p-6"
                >
                  <table 
                    className="min-w-full text-sm text-left"
                  >
                    <thead 
                      className="bg-gray-50 border-b border-gray-200"
                    >
                      <tr>
                        <th 
                          className="py-4 px-4 font-bold text-gray-600 w-20 text-center"
                        >
                          Tahun
                        </th>
                        <th 
                          className="py-4 px-4 font-bold text-gray-600 w-40"
                        >
                          Kategori
                        </th>
                        <th 
                          className="py-4 px-4 font-bold text-gray-600"
                        >
                          Judul / Nomor Regulasi
                        </th>
                        <th 
                          className="py-4 px-4 text-center font-bold text-gray-600 w-32"
                        >
                          Dokumen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRegulasi.map((item) => (
                        <tr 
                          key={item.id} 
                          className="border-b border-gray-100 hover:bg-yellow-50/50 transition-colors"
                        >
                          <td 
                            className="py-4 px-4 text-center"
                          >
                            <span 
                              className="bg-gray-100 text-gray-700 font-black px-3 py-1.5 rounded-lg border border-gray-200"
                            >
                              {item.tahun || "-"}
                            </span>
                          </td>
                          <td 
                            className="py-4 px-4"
                          >
                            <span 
                              className="text-xs font-bold uppercase tracking-widest text-yellow-700 bg-yellow-100 px-2 py-1 rounded border border-yellow-200"
                            >
                              {item.kategori || "Regulasi"}
                            </span>
                          </td>
                          <td 
                            className="py-4 px-4"
                          >
                            <div 
                              className="font-bold text-gray-900 text-base"
                            >
                              {item.judul}
                            </div>
                            {item.deskripsi && (
                              <div 
                                className="text-xs text-gray-500 mt-1 line-clamp-2"
                              >
                                {item.deskripsi}
                              </div>
                            )}
                          </td>
                          <td 
                            className="py-4 px-4 text-center"
                          >
                            {item.file_url || item.link ? (
                              <a 
                                href={item.file_url || item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold px-4 py-2 rounded-xl transition-colors border border-blue-200 gap-2 shadow-sm text-xs"
                              >
                                <span>📄</span> 
                                Buka
                              </a>
                            ) : (
                              <span 
                                className="text-gray-400 text-xs italic"
                              >
                                File Tidak Tersedia
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Wrapper Suspense yang Wajib Ada di Next.js (App Router) bila menggunakan useSearchParams
export default function TransparansiPublik() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        >
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-yellow-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN HALAMAN...
          </p>
        </div>
      }
    >
      <TransparansiContent />
    </Suspense>
  );
}