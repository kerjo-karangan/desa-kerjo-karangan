// src/app/kabar/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; 

// ==========================================
// KOMPONEN PEMBUNGKUS UTAMA (MENGHINDARI ERROR SUSPENSE)
// ==========================================
export default function KabarDesa() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-green-700 font-bold tracking-widest animate-pulse">MEMUAT HALAMAN...</p>
        </div>
      </div>
    }>
      <KabarContent />
    </Suspense>
  );
}

// ==========================================
// KOMPONEN SLIDER GAMBAR UNTUK BERITA DESA (CLOUDINARY FIX)
// ==========================================
const ImageCarousel = ({ gambarArray }: { gambarArray: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!gambarArray || gambarArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === gambarArray.length - 1 ? 0 : prevIndex + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [gambarArray]);

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? gambarArray.length - 1 : currentIndex - 1);
  };
  
  const nextSlide = () => {
    setCurrentIndex(currentIndex === gambarArray.length - 1 ? 0 : currentIndex + 1);
  };

  // Keamanan ekstra: Jika gambar kosong, jangan render apapun
  if (!gambarArray || gambarArray.length === 0) return null;

  // Pastikan URL valid. Cloudinary mengembalikan URL utuh (dimulai dengan http/https)
  const currentImage = gambarArray[currentIndex];
  const safeImageUrl = currentImage.startsWith("http") ? currentImage : `https://wsrv.nl/?url=${currentImage}`;

  return (
    <div className="relative w-full h-64 md:h-96 lg:h-[450px] mb-8 group overflow-hidden rounded-3xl shadow-md bg-gray-100 border border-gray-200">
      <img 
        src={safeImageUrl} 
        alt={`Dokumentasi Berita ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          // Fallback jika gambar gagal diload (Broken Image Fix)
          e.currentTarget.src = "https://via.placeholder.com/800x450/e2e8f0/6b7280?text=Gambar+Tidak+Tersedia";
        }}
      />
      {gambarArray.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-green-600 hover:text-white shadow-xl font-bold border border-gray-200 z-10"
            aria-label="Previous image"
          >
            &#10094;
          </button>
          
          <button 
            onClick={nextSlide} 
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-green-600 hover:text-white shadow-xl font-bold border border-gray-200 z-10"
            aria-label="Next image"
          >
            &#10095;
          </button>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
            {gambarArray.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentIndex(idx)}
                className={`block h-2 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? "bg-white w-8" : "bg-white/50 w-2 hover:bg-white/80"}`}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
          
          <div className="absolute top-4 right-4 bg-black/70 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md z-10 shadow-sm border border-white/20">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN ISI HALAMAN UTAMA (KABAR CONTENT)
// ==========================================
function KabarContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  
  const [tabAktif, setTabAktif] = useState("berita");

  const [heroData, setHeroData] = useState({
    judul: "Kabar & Agenda Desa",
    sub: "Pantau terus perkembangan pembangunan, kegiatan kemasyarakatan, dan jadwal acara resmi dari aparat desa.",
    bg: "" 
  });

  const [daftarBerita, setDaftarBerita] = useState<any[]>([]);
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  
  // State Loading Global untuk mematikan Flicker
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  useEffect(() => {
    if (tabQuery === "berita" || tabQuery === "agenda") {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tabAktif, searchTerm, itemsPerPage]);

  useEffect(() => {
    const ambilData = async () => {
      setLoading(true); // Memastikan layar loading menyala saat pindah halaman
      try {
        const snapHero = await getDoc(doc(db, "pengaturan_web", "kabar_hero"));
        if (snapHero.exists() && snapHero.data()) {
          const dataHero = snapHero.data();
          setHeroData({
            judul: dataHero.judul || "Kabar & Agenda Desa",
            sub: dataHero.sub || "Pantau terus perkembangan pembangunan, kegiatan kemasyarakatan, dan jadwal acara resmi dari aparat desa.",
            bg: dataHero.bg || "" // Biarkan kosong jika tidak ada gambar
          });
        }

        const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
        const snapKabar = await getDocs(qKabar);
        const dataKabar: any[] = [];
        snapKabar.forEach((doc) => { 
          dataKabar.push({ id: doc.id, ...doc.data() }); 
        });
        setDaftarBerita(dataKabar);

        const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
        const snapAgenda = await getDocs(qAgenda);
        const dataAgenda: any[] = [];
        snapAgenda.forEach(doc => {
          dataAgenda.push({ id: doc.id, ...doc.data() });
        });
        setDaftarAgenda(dataAgenda);

      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false); // Matikan loading setelah SEMUA data (termasuk Hero) masuk
      }
    };
    ambilData();
  }, []);

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const beritaTerfilter = daftarBerita.filter((b) => 
    b.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.isi.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const indexOfLastBerita = currentPage * itemsPerPage;
  const indexOfFirstBerita = indexOfLastBerita - itemsPerPage;
  const currentBerita = beritaTerfilter.slice(indexOfFirstBerita, indexOfLastBerita);
  const totalPagesBerita = Math.ceil(beritaTerfilter.length / itemsPerPage);

  const agendaTerfilter = daftarAgenda.filter((a) => 
    a.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const now = new Date();
  const agendaAkanDatang = agendaTerfilter
    .filter(a => new Date(a.tanggal) >= now)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  const agendaLewat = agendaTerfilter
    .filter(a => new Date(a.tanggal) < now)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const agendaDisusun = [...agendaAkanDatang, ...agendaLewat];

  const indexOfLastAgenda = currentPage * itemsPerPage;
  const indexOfFirstAgenda = indexOfLastAgenda - itemsPerPage;
  const currentAgenda = agendaDisusun.slice(indexOfFirstAgenda, indexOfLastAgenda);
  const totalPagesAgenda = Math.ceil(agendaDisusun.length / itemsPerPage);

  // Jika Data Masih Loading, Tampilkan Layar Penuh Loading (Anti-Flicker)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-green-700 font-bold tracking-widest animate-pulse">MENYIAPKAN DATA...</p>
        </div>
      </div>
    );
  }

  // Format URL Background Hero
  let heroBgSafe = "";
  if (typeof heroData.bg === "string" && heroData.bg.trim() !== "") {
    heroBgSafe = heroData.bg.startsWith("http") ? heroData.bg : `https://wsrv.nl/?url=${heroData.bg}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* ==========================================
          HEADER SECTION (HERO DINAMIS)
      ========================================== */}
      <div className={`text-white py-16 md:py-24 relative overflow-hidden shadow-md transition-colors duration-500 ${heroBgSafe ? 'bg-gray-900' : 'bg-green-900'}`}>
        <div className="absolute inset-0 z-0">
          {heroBgSafe && (
            <img 
              src={heroBgSafe} 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              onError={(e) => {
                e.currentTarget.style.display = 'none'; // Sembunyikan gambar jika rusak
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-green-900/50 px-4 py-1.5 rounded-full border border-green-800 backdrop-blur-sm shadow-sm">
            Pusat Informasi Terkini
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl whitespace-pre-wrap leading-tight text-white">
            {heroData.judul}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-lg whitespace-pre-wrap">
            {heroData.sub}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl flex-grow">
        
        {/* KOTAK PENCARIAN PINTAR */}
        <div className="mb-10 max-w-2xl mx-auto relative z-20">
          <input 
            type="text" 
            placeholder="Ketik kata kunci pencarian berita atau kegiatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-gray-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium text-gray-800 shadow-sm"
          />
          <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl opacity-40">🔍</span>
        </div>

        {/* TABS NAVIGASI */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          <button 
            onClick={() => setTabAktif("berita")}
            className={`px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${
              tabAktif === "berita" || !tabAktif 
              ? "bg-green-600 text-white shadow-xl transform -translate-y-1 border-2 border-green-500" 
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            <span className="text-xl">📰</span> Berita & Kegiatan
          </button>
          
          <button 
            onClick={() => setTabAktif("agenda")}
            className={`px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${
              tabAktif === "agenda" 
              ? "bg-green-600 text-white shadow-xl transform -translate-y-1 border-2 border-green-500" 
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            <span className="text-xl">📅</span> Agenda Desa Terdekat
          </button>
        </div>

        {/* ==========================================
            KONTEN TAB BERITA 
        ========================================== */}
        {(tabAktif === "berita" || !tabAktif) && (
          <div className="animate-fade-in">
            
            {beritaTerfilter.length > 0 && (
              <div className="flex justify-end mb-6">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <span className="text-sm font-bold text-gray-600">Tampilkan:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-1.5 font-bold outline-none cursor-pointer"
                  >
                    <option value={10}>10 Baris</option>
                    <option value={20}>20 Baris</option>
                    <option value={50}>50 Baris</option>
                  </select>
                </div>
              </div>
            )}

            {beritaTerfilter.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-3xl mx-auto">
                <span className="text-6xl mb-4 block opacity-50">📭</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {searchTerm ? "Berita Tidak Ditemukan" : "Belum Ada Kabar Baru"}
                </h3>
                <p className="text-gray-500 font-medium">
                  {searchTerm ? `Tidak ada artikel yang cocok dengan kata kunci "${searchTerm}".` : "Pemerintah desa belum mempublikasikan berita apapun saat ini."}
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {currentBerita.map((berita) => {
                  // Pastikan array gambar aman
                  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];
                  
                  return (
                    <article key={berita.id} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-lg group">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-green-700 transition-colors">
                        {berita.is_pinned && <span className="text-yellow-500 mr-2" title="Pinned Post">🔒</span>}
                        {berita.judul}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-8">
                        <span className="bg-green-50 text-green-800 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                          📅 {formatTanggal(berita.tanggal_posting)}
                        </span>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                          👤 Oleh: <span className="font-bold text-gray-700">{berita.penulis || "Admin"}</span>
                        </span>
                      </div>
                      
                      <ImageCarousel gambarArray={gambarArray} />
                      
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg mt-6 text-justify line-clamp-4">
                        {berita.isi}
                      </p>
                      
                      <div className="mt-8 text-right border-t border-gray-100 pt-6">
                        <Link 
                          href={`/kabar/${berita.id}`} 
                          className="inline-block bg-white text-green-700 border-2 border-green-600 hover:bg-green-600 hover:text-white font-black px-8 py-3.5 rounded-xl transition-all transform hover:-translate-y-1 shadow-sm"
                        >
                          Baca Artikel Selengkapnya →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* KOMPONEN PAGINATION BERITA */}
            {totalPagesBerita > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 mb-8 flex-wrap">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  &laquo; Prev
                </button>
                
                {Array.from({ length: totalPagesBerita }, (_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)} 
                    className={`w-10 h-10 rounded-xl font-bold shadow-sm transition-colors ${
                      currentPage === i + 1 
                      ? "bg-green-600 text-white border-green-600" 
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesBerita))} 
                  disabled={currentPage === totalPagesBerita}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Next &raquo;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            KONTEN TAB AGENDA 
        ========================================== */}
        {tabAktif === "agenda" && (
          <div className="animate-fade-in">
            
            {agendaDisusun.length > 0 && (
              <div className="flex justify-end mb-6">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <span className="text-sm font-bold text-gray-600">Tampilkan:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-1.5 font-bold outline-none cursor-pointer"
                  >
                    <option value={10}>10 Baris</option>
                    <option value={20}>20 Baris</option>
                    <option value={50}>50 Baris</option>
                  </select>
                </div>
              </div>
            )}

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3 border-b border-gray-100 pb-6">
                <span className="text-4xl">📅</span> Kalender Kegiatan Lengkap
              </h2>
              
              <div className="space-y-6">
                {agendaDisusun.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center bg-gray-50 max-w-2xl mx-auto">
                    <span className="text-6xl text-gray-300 mb-4 block">🗓️</span>
                    <p className="text-gray-500 font-bold text-xl">
                      {searchTerm ? "Jadwal Tidak Ditemukan" : "Belum ada agenda desa yang dijadwalkan."}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm && `Tidak ada kecocokan untuk kata kunci "${searchTerm}".`}
                    </p>
                  </div>
                ) : (
                  currentAgenda.map((agenda) => {
                    const tgl = new Date(agenda.tanggal);
                    const isLewat = tgl < new Date();

                    return (
                      <div key={agenda.id} className={`flex flex-col sm:flex-row gap-6 group p-6 rounded-2xl border transition-all ${isLewat ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-green-200 hover:border-green-400 hover:shadow-md'}`}>
                        <div className={`flex-shrink-0 w-full sm:w-24 h-24 rounded-xl flex flex-col items-center justify-center border shadow-sm transition-colors ${isLewat ? 'bg-gray-200 border-gray-300 text-gray-500' : 'bg-green-50 border-green-300 text-green-800 group-hover:bg-green-600 group-hover:text-white'}`}>
                          <span className="text-sm font-bold uppercase tracking-wider">{tgl.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-3xl font-black leading-none my-1">{tgl.getDate()}</span>
                          <span className="text-xs font-bold">{tgl.getFullYear()}</span>
                        </div>
                        <div className="flex flex-col justify-center flex-grow">
                          <h4 className={`font-bold text-xl leading-tight transition-colors ${isLewat ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-green-700'}`}>
                            {agenda.nama}
                          </h4>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-base">🕒</span> {tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </p>
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-base">📍</span> {agenda.lokasi}
                            </p>
                            {isLewat && (
                              <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-lg border border-red-200 uppercase tracking-widest shadow-sm">
                                ⚠️ Telah Lewat
                              </p>
                            )}
                          </div>
                          
                          {agenda.deskripsi && (
                            <p className="text-sm text-gray-600 mt-4 leading-relaxed border-t border-gray-100 pt-3">
                              {agenda.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* KOMPONEN PAGINATION AGENDA */}
            {totalPagesAgenda > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 mb-8 flex-wrap">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  &laquo; Prev
                </button>
                
                {Array.from({ length: totalPagesAgenda }, (_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)} 
                    className={`w-10 h-10 rounded-xl font-bold shadow-sm transition-colors ${
                      currentPage === i + 1 
                      ? "bg-green-600 text-white border-green-600" 
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesAgenda))} 
                  disabled={currentPage === totalPagesAgenda}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Next &raquo;
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}