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

// ==========================================
// FUNGSI KONVERSI GAMBAR (HEIC & CLOUDINARY)
// ==========================================
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

function TransparansiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab") || "apbdes";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // STATE DATA TRANSPARANSI
  // ==========================================
  const [heroData, setHeroData] = useState({
    judul: "Transparansi Publik",
    sub: "Wujud keterbukaan informasi pemerintahan desa kepada masyarakat.",
    bg: ""
  });
  
  const [dataApbdes, setDataApbdes] = useState<any[]>([]);
  const [dataRegulasi, setDataRegulasi] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // State Khusus Tampilan Detail (Selengkapnya)
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    if (tabParam === "apbdes" || tabParam === "regulasi") {
      setActiveTab(tabParam);
      setCurrentPage(1);
      setSelectedItem(null); // Reset detail jika pindah tab
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedItem(null);
    router.push(`/transparansi?tab=${tab}`);
  };

  useEffect(() => {
    const fetchTransparansiData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Header Transparansi
        const snapHero = await getDoc(doc(db, "pengaturan_web", "transparansi_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Transparansi Publik",
            sub: snapHero.data().sub || "Wujud keterbukaan informasi pemerintahan desa kepada masyarakat secara akuntabel.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Data APBDes (DATABASE: transparansi_apbdes)
        const qApbdes = query(collection(db, "transparansi_apbdes"), orderBy("tahun", "desc"));
        const snapApbdes = await getDocs(qApbdes);
        setDataApbdes(snapApbdes.docs.map(doc => ({ 
          id: doc.id, 
          type: "apbdes",
          ...(doc.data() as any) 
        })));

        // 3. Fetch Data Regulasi (DATABASE: transparansi_regulasi)
        const qRegulasi = query(collection(db, "transparansi_regulasi"), orderBy("tahun", "desc"));
        const snapRegulasi = await getDocs(qRegulasi);
        setDataRegulasi(snapRegulasi.docs.map(doc => ({ 
          id: doc.id, 
          type: "regulasi",
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

  // ==========================================
  // PENGOLAHAN FILTER & PAGINASI
  // ==========================================
  const filteredApbdes = dataApbdes.filter((item) => 
    item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.tahun?.toString().includes(searchQuery.toLowerCase())
  );
  
  const filteredRegulasi = dataRegulasi.filter((item) => 
    item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tahun?.toString().includes(searchQuery.toLowerCase())
  );

  const activeData = activeTab === "apbdes" ? filteredApbdes : filteredRegulasi;
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const currentData = activeData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // ==========================================
  // TAMPILAN LOADING
  // ==========================================
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-yellow-600 font-bold tracking-widest animate-pulse"
        >
          MENYIAPKAN DOKUMEN PUBLIK...
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER KHUSUS HALAMAN DETAIL (SELENGKAPNYA)
  // ==========================================
  if (selectedItem) {
    // Mengecek atribut tautan PDF/Dokumen (Bisa dari link, file_url, atau link_pdf)
    const dokumenUrl = selectedItem.link || selectedItem.file_url || selectedItem.link_pdf;
    
    // Mengecek atribut gambar (Bisa dari gambar atau foto)
    const imageUrl = selectedItem.gambar || selectedItem.foto;

    return (
      <div 
        className="min-h-screen bg-gray-50 pt-24 md:pt-32 pb-24 font-sans animate-fade-in"
      >
        <div 
          className="container mx-auto px-4 max-w-4xl"
        >
          <button 
            onClick={() => setSelectedItem(null)}
            className="mb-8 flex items-center gap-2 text-yellow-600 font-bold hover:text-yellow-800 transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 w-max"
          >
            <span>◀</span> Kembali ke Daftar {selectedItem.type === "apbdes" ? "APBDes" : "Regulasi"}
          </button>

          <article 
            className="bg-white p-6 md:p-12 rounded-3xl shadow-lg border border-gray-100"
          >
            <div 
              className="mb-8"
            >
              <div 
                className="flex flex-wrap items-center gap-2 mb-4"
              >
                <span 
                  className={`font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest border ${
                    selectedItem.type === "apbdes" 
                    ? "bg-blue-100 text-blue-800 border-blue-200" 
                    : "bg-purple-100 text-purple-800 border-purple-200"
                  }`}
                >
                  {selectedItem.kategori || (selectedItem.type === "apbdes" ? "Laporan Keuangan" : "Dokumen Hukum")}
                </span>
                <span 
                  className="bg-gray-100 text-gray-700 font-black px-3 py-1.5 rounded-lg text-xs border border-gray-200"
                >
                  TAHUN: {selectedItem.tahun}
                </span>
              </div>
              
              <h1 
                className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6"
              >
                {selectedItem.judul}
              </h1>
            </div>

            {/* GAMBAR / THUMBNAIL (JIKA ADA) */}
            {imageUrl && (
              <div 
                className="relative w-full h-auto max-h-[600px] rounded-2xl overflow-hidden bg-gray-100 mb-10 border border-gray-200 shadow-md"
              >
                <img 
                  src={getSafeImageUrl(imageUrl)} 
                  alt="Dokumentasi Visual"
                  className="w-full h-full object-contain" 
                />
              </div>
            )}

            {/* TOMBOL BUKA DOKUMEN PDF */}
            {dokumenUrl && (
              <div 
                className="mb-10 bg-yellow-50 p-6 md:p-8 rounded-2xl border border-yellow-200 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div>
                  <h4 
                    className="font-black text-yellow-900 text-lg mb-1 text-center md:text-left"
                  >
                    Lampiran Dokumen Resmi
                  </h4>
                  <p 
                    className="text-sm text-yellow-700 text-center md:text-left"
                  >
                    Klik tombol di samping untuk melihat atau mengunduh dokumen secara lengkap.
                  </p>
                </div>
                <a 
                  href={dokumenUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-center border border-yellow-400 shrink-0 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📄</span> Lihat Dokumen PDF
                </a>
              </div>
            )}

            {/* TEKS ISI DESKRIPSI LENGKAP */}
            <div 
              className="prose max-w-none text-gray-700 leading-loose whitespace-pre-wrap text-base md:text-lg border-t border-gray-100 pt-8"
            >
              {selectedItem.deskripsi || "Tidak ada deskripsi detail untuk dokumen ini."}
            </div>
            
          </article>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER HALAMAN UTAMA TRANSPARANSI (DAFTAR)
  // ==========================================
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
            Pusat Dokumen Terbuka
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
          className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex gap-2 justify-center mx-auto mb-10 w-max"
        >
          <button 
            onClick={() => handleTabChange("apbdes")} 
            className={`min-w-[160px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "apbdes" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span>📊</span> Grafik APBDes
          </button>
          
          <button 
            onClick={() => handleTabChange("regulasi")} 
            className={`min-w-[160px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "regulasi" 
              ? "bg-purple-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            <span>⚖️</span> Regulasi & Perdes
          </button>
        </div>

        <div 
          className="mb-8 max-w-2xl mx-auto relative"
        >
          <input 
            type="text" 
            placeholder={activeTab === "apbdes" ? "Cari Laporan APBDes atau Tahun..." : "Cari Judul Perdes, Kategori, atau Tahun..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 shadow-sm text-gray-800 text-base font-bold"
          />
          <span 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
          >
            🔍
          </span>
        </div>

        <div 
          className="animate-fade-in"
        >
          {currentData.length === 0 ? (
            <div 
              className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
            >
              <span 
                className="text-6xl mb-4 block opacity-30"
              >
                {activeTab === "apbdes" ? "📊" : "⚖️"}
              </span>
              <h2 
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                Data Tidak Ditemukan
              </h2>
              <p 
                className="text-gray-500"
              >
                Coba gunakan kata kunci pencarian yang berbeda.
              </p>
            </div>
          ) : (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {currentData.map((item) => {
                // Menangani gambar untuk APBDes & Regulasi
                const imgThumb = item.gambar || item.foto;

                return (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col group"
                  >
                    <div 
                      className="h-48 relative overflow-hidden bg-gray-200 border-b border-gray-100"
                    >
                      {imgThumb ? (
                        <img 
                          src={getSafeImageUrl(imgThumb)} 
                          alt={item.judul} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-4xl text-gray-300"
                        >
                          📄
                        </div>
                      )}
                      
                      <div 
                        className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm font-black px-3 py-1 rounded-lg text-xs shadow-sm border border-white uppercase tracking-widest ${
                          activeTab === "apbdes" ? "text-blue-700" : "text-purple-700"
                        }`}
                      >
                        {item.kategori || (activeTab === "apbdes" ? "Keuangan" : "Hukum")}
                      </div>
                      <div 
                        className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white font-black px-3 py-1.5 rounded-lg text-xs shadow-sm border border-gray-700"
                      >
                        TAHUN: {item.tahun}
                      </div>
                    </div>
                    
                    <div 
                      className="p-6 flex-1 flex flex-col"
                    >
                      <h3 
                        className="text-xl font-black text-gray-900 mb-3 leading-snug line-clamp-2"
                      >
                        {item.judul}
                      </h3>
                      <p 
                        className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1"
                      >
                        {item.deskripsi}
                      </p>
                      
                      <div 
                        className="mt-auto"
                      >
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className={`block w-full font-black py-3 rounded-xl text-center transition-colors border ${
                            activeTab === "apbdes" 
                            ? "bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-200" 
                            : "bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border-purple-200"
                          }`}
                        >
                          Baca Selengkapnya
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==========================================
            KONTROL PAGINASI
        ========================================== */}
        {totalPages > 1 && !loading && !selectedItem && (
          <div 
            className="flex justify-center items-center gap-4 mt-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-max mx-auto"
          >
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-black hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              ◀
            </button>
            <span 
              className="font-bold text-gray-700 text-sm"
            >
              Halaman <span className="text-yellow-600 font-black">{currentPage}</span> dari {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-black hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              ▶
            </button>
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
            className="text-yellow-600 font-bold tracking-widest animate-pulse"
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