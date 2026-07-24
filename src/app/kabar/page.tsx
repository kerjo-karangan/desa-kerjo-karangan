// src/app/kabar/page.tsx
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

// ==========================================
// FUNGSI KONVERSI LINK YOUTUBE -> EMBED
// ==========================================
const konversiLinkYouTube = (url: string) => {
  if (!url) return "";
  let embedUrl = url;
  if (url.includes("watch?v=")) {
    embedUrl = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
  }
  return embedUrl.split("&")[0]; // Membuang parameter tambahan seperti time stamp
};

function KabarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab") || "berita";
  const idBerita = searchParams.get("id"); // Untuk mendeteksi apakah sedang membuka detail berita

  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // STATE DATA KABAR & AGENDA
  // ==========================================
  const [heroData, setHeroData] = useState({
    judul: "Kabar & Agenda Desa",
    sub: "Pusat informasi berita terkini dan jadwal kegiatan di Desa Kerjo.",
    bg: ""
  });
  
  const [dataBerita, setDataBerita] = useState<any[]>([]);
  const [dataAgenda, setDataAgenda] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // State Khusus Detail Berita
  const [selectedBerita, setSelectedBerita] = useState<any | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (tabParam === "berita" || tabParam === "agenda") {
      setActiveTab(tabParam);
      setCurrentPage(1);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/kabar?tab=${tab}`);
  };

  useEffect(() => {
    const fetchKabarData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Header Kabar
        const snapHero = await getDoc(doc(db, "pengaturan_web", "kabar_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Kabar & Agenda Desa",
            sub: snapHero.data().sub || "Pusat informasi berita terkini dan jadwal kegiatan masyarakat.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Berita (DATABASE ASLI: kabar_desa)
        const qBerita = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
        const snapBerita = await getDocs(qBerita);
        const listBerita = snapBerita.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));
        setDataBerita(listBerita);

        // Jika URL memiliki param 'id', cari beritanya untuk ditampilkan selengkapnya
        if (idBerita) {
          const found = listBerita.find(b => b.id === idBerita);
          if (found) {
            setSelectedBerita(found);
          } else {
            // Jika ID tidak ada di database, bersihkan URL
            router.push('/kabar?tab=berita');
          }
        }

        // 3. Fetch Agenda (DATABASE ASLI: agenda_desa)
        const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "desc"));
        const snapAgenda = await getDocs(qAgenda);
        setDataAgenda(snapAgenda.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKabarData();
  }, [idBerita]);

  // ==========================================
  // PENGOLAHAN FILTER & PAGINASI
  // ==========================================
  const filteredBerita = dataBerita.filter((item) => 
    item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.kategori?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAgenda = dataAgenda.filter((item) => 
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.lokasi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeData = activeTab === "berita" ? filteredBerita : filteredAgenda;
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
          className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-green-700 font-bold tracking-widest animate-pulse"
        >
          MEMUAT INFORMASI DESA...
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER KHUSUS HALAMAN BACA SELENGKAPNYA (DETAIL BERITA)
  // ==========================================
  if (selectedBerita) {
    
    // Normalisasi array gambar
    let images: string[] = [];
    if (Array.isArray(selectedBerita.gambar) && selectedBerita.gambar.length > 0) {
      images = selectedBerita.gambar;
    } else if (typeof selectedBerita.gambar === "string" && selectedBerita.gambar !== "") {
      images = [selectedBerita.gambar];
    }

    // Pengecekan tautan YouTube
    const isYoutubeAvailable = selectedBerita.link_youtube && selectedBerita.link_youtube.trim() !== "";
    const embedYoutubeUrl = isYoutubeAvailable ? konversiLinkYouTube(selectedBerita.link_youtube) : "";

    return (
      <div 
        className="min-h-screen bg-gray-50 pt-24 md:pt-32 pb-24 font-sans animate-fade-in"
      >
        <div 
          className="container mx-auto px-4 max-w-4xl"
        >
          <button 
            onClick={() => { setSelectedBerita(null); router.push('/kabar?tab=berita'); }}
            className="mb-8 flex items-center gap-2 text-green-600 font-bold hover:text-green-800 transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 w-max"
          >
            <span>◀</span> Kembali ke Daftar Berita
          </button>

          <article 
            className="bg-white p-6 md:p-12 rounded-3xl shadow-lg border border-gray-100"
          >
            <div 
              className="mb-8"
            >
              <span 
                className="bg-green-100 text-green-800 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest border border-green-200"
              >
                {selectedBerita.kategori || "Berita Desa"}
              </span>
              <h1 
                className="text-3xl md:text-5xl font-black text-gray-900 mt-4 leading-tight mb-4"
              >
                {selectedBerita.judul}
              </h1>
              <div 
                className="flex items-center gap-4 text-xs md:text-sm font-bold text-gray-500 border-b border-gray-100 pb-6"
              >
                <span 
                  className="flex items-center gap-1.5"
                >
                  <span>📅</span> 
                  {selectedBerita.tanggal_posting ? new Date(selectedBerita.tanggal_posting).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </span>
                <span 
                  className="flex items-center gap-1.5"
                >
                  <span>✍️</span> 
                  {selectedBerita.penulis || "Admin Desa"}
                </span>
              </div>
            </div>

            {/* SLIDER GALERI FOTO (Jika Ada) */}
            {images.length > 0 && (
              <div 
                className="relative w-full h-[250px] md:h-[450px] rounded-2xl overflow-hidden bg-gray-100 mb-8 border border-gray-200 group shadow-md"
              >
                <img 
                  src={getSafeImageUrl(images[currentSlideIndex])} 
                  alt="Dokumentasi Berita"
                  className="w-full h-full object-cover transition-opacity duration-500" 
                />
                
                {images.length > 1 && (
                  <>
                    <div 
                      className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20"
                    >
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentSlideIndex ? "w-8 bg-green-500" : "w-2 bg-white/60 hover:bg-white"
                          }`}
                        ></button>
                      ))}
                    </div>
                    <div 
                      className="absolute inset-0 flex items-center justify-between px-4 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button 
                        onClick={() => setCurrentSlideIndex(currentSlideIndex === 0 ? images.length - 1 : currentSlideIndex - 1)}
                        className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => setCurrentSlideIndex((currentSlideIndex + 1) % images.length)}
                        className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* EMBED YOUTUBE VIDEO (Tampil Tepat di Bawah Slider Jika Ada) */}
            {isYoutubeAvailable && (
              <div 
                className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-900 mb-8"
              >
                <div 
                  className="relative pb-[56.25%] h-0"
                >
                  <iframe 
                    src={`${embedYoutubeUrl}?rel=0&modestbranding=1`}
                    title="YouTube Video Dokumentasi Berita" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
                <div 
                  className="bg-gray-800 px-4 py-2.5 text-center text-xs font-bold text-gray-300 tracking-widest uppercase"
                >
                  Tonton Liputan Video Di Atas 🎥
                </div>
              </div>
            )}

            {/* TEKS ISI BERITA */}
            <div 
              className="prose max-w-none text-gray-700 leading-loose whitespace-pre-wrap text-base md:text-lg"
            >
              {selectedBerita.isi}
            </div>
            
          </article>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER HALAMAN UTAMA KABAR & AGENDA
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
          heroData.bg ? "bg-gray-900" : "bg-green-700"
        }`}
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Kabar Background" 
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
            className="text-green-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-green-900/50 px-4 py-1.5 rounded-full border border-green-800 backdrop-blur-sm shadow-sm"
          >
            Pusat Informasi Masyarakat
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
            onClick={() => handleTabChange("berita")} 
            className={`min-w-[150px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "berita" 
              ? "bg-green-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            <span>📰</span> Berita Terkini
          </button>
          
          <button 
            onClick={() => handleTabChange("agenda")} 
            className={`min-w-[150px] py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "agenda" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span>🗓️</span> Jadwal Agenda
          </button>
        </div>

        <div 
          className="mb-8 max-w-2xl mx-auto relative"
        >
          <input 
            type="text" 
            placeholder={activeTab === "berita" ? "Cari judul berita atau kategori..." : "Cari kegiatan atau lokasi..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 shadow-sm text-gray-800 text-base font-bold"
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
                {activeTab === "berita" ? "🗞️" : "📅"}
              </span>
              <h2 
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                Data {activeTab === "berita" ? "Berita" : "Agenda"} Tidak Ditemukan
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
              {activeTab === "berita" ? (
                currentData.map((item) => {
                  let imgThumb = "";
                  if (Array.isArray(item.gambar) && item.gambar.length > 0) {
                    imgThumb = item.gambar[0];
                  } else if (typeof item.gambar === "string") {
                    imgThumb = item.gambar;
                  }

                  return (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col group"
                    >
                      <div 
                        className="h-48 relative overflow-hidden bg-gray-200"
                      >
                        {imgThumb ? (
                          <img 
                            src={getSafeImageUrl(imgThumb)} 
                            alt={item.judul} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-4xl text-gray-400"
                          >
                            📰
                          </div>
                        )}
                        <div 
                          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-green-700 font-black px-3 py-1 rounded-lg text-xs shadow-sm border border-white uppercase tracking-widest"
                        >
                          {item.kategori || "Umum"}
                        </div>
                      </div>
                      
                      <div 
                        className="p-6 flex-1 flex flex-col"
                      >
                        <div 
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3"
                        >
                          <span>📅</span>
                          <span>{item.tanggal_posting ? new Date(item.tanggal_posting).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</span>
                        </div>
                        <h3 
                          className="text-xl font-black text-gray-900 mb-3 leading-snug line-clamp-2"
                        >
                          {item.judul}
                        </h3>
                        <p 
                          className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1"
                        >
                          {item.isi}
                        </p>
                        
                        <div 
                          className="mt-auto"
                        >
                          <button 
                            onClick={() => router.push(`/kabar?tab=berita&id=${item.id}`)}
                            className="block w-full bg-green-50 hover:bg-green-600 hover:text-white text-green-700 font-black py-3 rounded-xl text-center transition-colors border border-green-200"
                          >
                            Baca Selengkapnya
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                currentData.map((agenda) => (
                  <div 
                    key={agenda.id} 
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-xl transition-all flex flex-col group cursor-default"
                  >
                    <div 
                      className="flex items-start gap-4 mb-6"
                    >
                      <div 
                        className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center font-black leading-none group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-100 flex-shrink-0"
                      >
                        <span 
                          className="text-2xl"
                        >
                          {agenda.tanggal ? new Date(agenda.tanggal).getDate() : "-"}
                        </span>
                        <span 
                          className="text-[10px] uppercase tracking-widest mt-1"
                        >
                          {agenda.tanggal ? new Date(agenda.tanggal).toLocaleDateString('id-ID', { month: 'short' }) : "-"}
                        </span>
                      </div>
                      <div>
                        <h3 
                          className="text-xl font-black text-gray-900 leading-tight mb-2"
                        >
                          {agenda.nama}
                        </h3>
                        <span 
                          className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest"
                        >
                          Kegiatan Desa
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      className="space-y-4 text-sm font-medium text-gray-600 border-t border-gray-100 pt-4 flex-1"
                    >
                      <p 
                        className="flex items-center gap-3"
                      >
                        <span 
                          className="text-gray-400 text-lg"
                        >
                          ⏰
                        </span> 
                        <span 
                          className="font-bold text-gray-800"
                        >
                          {agenda.tanggal ? new Date(agenda.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"} WIB
                        </span>
                      </p>
                      <p 
                        className="flex items-center gap-3"
                      >
                        <span 
                          className="text-gray-400 text-lg"
                        >
                          📍
                        </span> 
                        <span 
                          className="leading-snug"
                        >
                          {agenda.lokasi || "Lokasi belum ditentukan"}
                        </span>
                      </p>
                    </div>

                    {/* FITUR BARU: TOMBOL LINK GOOGLE MAPS UNTUK AGENDA */}
                    {agenda.link_maps && (
                      <div 
                        className="mt-6 pt-4 border-t border-gray-100"
                      >
                        <a 
                          href={agenda.link_maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold py-3 rounded-xl transition-colors text-sm"
                        >
                          <span>🗺️</span> Lihat di Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ==========================================
            KONTROL PAGINASI
        ========================================== */}
        {totalPages > 1 && !loading && (
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
              Halaman <span className="text-green-600 font-black">{currentPage}</span> dari {totalPages}
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

export default function KabarPublik() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        >
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-green-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN HALAMAN...
          </p>
        </div>
      }
    >
      <KabarContent />
    </Suspense>
  );
}