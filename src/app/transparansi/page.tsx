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
  
  const tabParam = searchParams.get("tab") || "apbdes";
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // State Pencarian (Search)
  const [searchApbdes, setSearchApbdes] = useState("");
  const [searchRegulasi, setSearchRegulasi] = useState("");

  // State Paginasi (Pagination)
  const [pageApbdes, setPageApbdes] = useState(1);
  const [pageRegulasi, setPageRegulasi] = useState(1);
  const itemsPerPageApbdes = 6;
  const itemsPerPageRegulasi = 10;

  useEffect(() => {
    if (tabParam === "apbdes" || tabParam === "regulasi") {
      setActiveTab(tabParam);
      // Reset halaman ke 1 setiap kali pindah tab
      setPageApbdes(1);
      setPageRegulasi(1);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/transparansi?tab=${tab}`);
  };

  const [heroData, setHeroData] = useState({
    judul: "Transparansi Desa",
    sub: "Keterbukaan informasi publik terkait anggaran dan regulasi hukum Pemerintah Desa.",
    bg: ""
  });
  
  const [dataApbdes, setDataApbdes] = useState<any[]>([]);
  const [dataRegulasi, setDataRegulasi] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransparansiData = async () => {
      setLoading(true);
      try {
        const snapHero = await getDoc(doc(db, "pengaturan_web", "transparansi_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Transparansi Desa",
            sub: snapHero.data().sub || "Keterbukaan informasi publik terkait anggaran dan regulasi.",
            bg: snapHero.data().bg || ""
          });
        }

        const qApbdes = query(
          collection(db, "transparansi_apbdes"), 
          orderBy("tahun", "desc")
        );
        const snapApbdes = await getDocs(qApbdes);
        setDataApbdes(snapApbdes.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        const qRegulasi = query(
          collection(db, "transparansi_regulasi"), 
          orderBy("tahun", "desc")
        );
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

  // Logika Filter & Paginasi APBDes
  const filteredApbdes = dataApbdes.filter((item) => 
    item.judul?.toLowerCase().includes(searchApbdes.toLowerCase()) ||
    item.tahun?.toString().includes(searchApbdes)
  );
  const totalPageApbdes = Math.ceil(filteredApbdes.length / itemsPerPageApbdes);
  const paginatedApbdes = filteredApbdes.slice(
    (pageApbdes - 1) * itemsPerPageApbdes, 
    pageApbdes * itemsPerPageApbdes
  );

  // Logika Filter & Paginasi Regulasi
  const filteredRegulasi = dataRegulasi.filter((item) => 
    item.judul?.toLowerCase().includes(searchRegulasi.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(searchRegulasi.toLowerCase()) ||
    item.tahun?.toString().includes(searchRegulasi)
  );
  const totalPageRegulasi = Math.ceil(filteredRegulasi.length / itemsPerPageRegulasi);
  const paginatedRegulasi = filteredRegulasi.slice(
    (pageRegulasi - 1) * itemsPerPageRegulasi, 
    pageRegulasi * itemsPerPageRegulasi
  );

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
            
            <div 
              className="mb-8 max-w-2xl mx-auto relative"
            >
              <input 
                type="text" 
                placeholder="Cari laporan APBDes berdasarkan judul atau tahun..." 
                value={searchApbdes}
                onChange={(e) => {
                  setSearchApbdes(e.target.value);
                  setPageApbdes(1);
                }}
                className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 shadow-sm text-gray-800 text-sm md:text-base font-bold"
              />
              <span 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
              >
                🔍
              </span>
            </div>

            {paginatedApbdes.length === 0 ? (
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
                  {searchApbdes ? "Pencarian Tidak Ditemukan" : "Info Grafis Belum Tersedia"}
                </h2>
                <p 
                  className="text-gray-500"
                >
                  Silakan coba kata kunci lain atau periksa kembali nanti.
                </p>
              </div>
            ) : (
              <>
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {paginatedApbdes.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow"
                    >
                      <div 
                        className="h-64 sm:h-80 bg-gray-100 relative overflow-hidden"
                      >
                        {item.gambar || item.file_url || item.foto ? (
                          <img 
                            src={getSafeImageUrl(item.gambar || item.file_url || item.foto)} 
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

                {/* Kontrol Paginasi APBDes */}
                {totalPageApbdes > 1 && (
                  <div 
                    className="flex justify-center items-center gap-2 mt-10"
                  >
                    <button 
                      onClick={() => setPageApbdes(prev => Math.max(prev - 1, 1))}
                      disabled={pageApbdes === 1}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span 
                      className="px-4 py-2 font-bold text-gray-700"
                    >
                      Halaman {pageApbdes} dari {totalPageApbdes}
                    </span>
                    <button 
                      onClick={() => setPageApbdes(prev => Math.min(prev + 1, totalPageApbdes))}
                      disabled={pageApbdes === totalPageApbdes}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: REGULASI & PERATURAN
        ========================================== */}
        {activeTab === "regulasi" && (
          <div 
            className="animate-fade-in space-y-8"
          >
            
            <div 
              className="mb-8 max-w-2xl mx-auto relative"
            >
              <input 
                type="text" 
                placeholder="Cari regulasi berdasarkan judul, kategori, atau tahun..." 
                value={searchRegulasi}
                onChange={(e) => {
                  setSearchRegulasi(e.target.value);
                  setPageRegulasi(1);
                }}
                className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 shadow-sm text-gray-800 text-sm md:text-base font-bold"
              />
              <span 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
              >
                🔍
              </span>
            </div>

            {paginatedRegulasi.length === 0 ? (
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
                  {searchRegulasi ? "Regulasi Tidak Ditemukan" : "Regulasi Belum Tersedia"}
                </h2>
                <p 
                  className="text-gray-500"
                >
                  Coba kata kunci pencarian yang lain.
                </p>
              </div>
            ) : (
              <>
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
                        Silakan klik tombol Buka untuk membaca detail peraturan.
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
                        {paginatedRegulasi.map((item) => (
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
                                  Tidak Tersedia
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kontrol Paginasi Regulasi */}
                {totalPageRegulasi > 1 && (
                  <div 
                    className="flex justify-center items-center gap-2 mt-10"
                  >
                    <button 
                      onClick={() => setPageRegulasi(prev => Math.max(prev - 1, 1))}
                      disabled={pageRegulasi === 1}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span 
                      className="px-4 py-2 font-bold text-gray-700"
                    >
                      Halaman {pageRegulasi} dari {totalPageRegulasi}
                    </span>
                    <button 
                      onClick={() => setPageRegulasi(prev => Math.min(prev + 1, totalPageRegulasi))}
                      disabled={pageRegulasi === totalPageRegulasi}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

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