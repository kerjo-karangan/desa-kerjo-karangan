// src/app/kabar/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; 

// ==========================================
// KOMPONEN PEMBUNGKUS UTAMA MENGHINDARI ERROR LAYOUT
// ==========================================
export default function KabarDesa() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <KabarContent />
    </Suspense>
  );
}

// ==========================================
// KOMPONEN SLIDER GAMBAR UNTUK BERITA DESA
// ==========================================
const ImageCarousel = ({ gambarArray }: { gambarArray: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (gambarArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === gambarArray.length - 1 ? 0 : prevIndex + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [gambarArray.length]);

  const prevSlide = () => setCurrentIndex(currentIndex === 0 ? gambarArray.length - 1 : currentIndex - 1);
  const nextSlide = () => setCurrentIndex(currentIndex === gambarArray.length - 1 ? 0 : currentIndex + 1);

  if (gambarArray.length === 0) return null;

  return (
    <div className="relative w-full h-64 md:h-96 mb-6 group overflow-hidden rounded-2xl shadow-sm bg-gray-100 border border-gray-200">
      <img 
        src={`https://wsrv.nl/?url=${gambarArray[currentIndex]}`} 
        alt="Dokumentasi Kabar Desa" 
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      {gambarArray.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold">
            &#10094;
          </button>
          <button onClick={nextSlide} className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold">
            &#10095;
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10">
            {gambarArray.map((_, idx) => (
              <span key={idx} className={`block w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"}`}></span>
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm z-10">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN ISI HALAMAN UTAMA
// ==========================================
function KabarContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  
  const [tabAktif, setTabAktif] = useState("berita");

  const [daftarBerita, setDaftarBerita] = useState<any[]>([]);
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE KOTAK PENCARIAN & PAGINATION
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  useEffect(() => {
    if (tabQuery === "berita" || tabQuery === "agenda") {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
        const snapKabar = await getDocs(qKabar);
        const dataKabar: any[] = [];
        snapKabar.forEach((doc) => { dataKabar.push({ id: doc.id, ...doc.data() }); });
        setDaftarBerita(dataKabar);

        const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
        const snapAgenda = await getDocs(qAgenda);
        const dataAgenda: any[] = [];
        snapAgenda.forEach(doc => dataAgenda.push({ id: doc.id, ...doc.data() }));
        setDaftarAgenda(dataAgenda);

      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const beritaTerfilter = daftarBerita.filter((b) => 
    b.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.isi.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const agendaTerfilter = daftarAgenda.filter((a) => 
    a.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBerita = beritaTerfilter.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(beritaTerfilter.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">Pusat Informasi Terkini</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Kabar & Agenda Desa</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Pantau terus perkembangan pembangunan, kegiatan kemasyarakatan, dan jadwal acara resmi dari aparat desa.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl flex-grow">
        
        <div className="mb-10 max-w-2xl mx-auto relative z-20">
          <input 
            type="text" 
            placeholder="Ketik kata kunci pencarian berita atau kegiatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-green-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium text-gray-800 shadow-md"
          />
          <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl opacity-60">🔍</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          <button 
            onClick={() => setTabAktif("berita")}
            className={`px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "berita" || !tabAktif ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}
          >
            <span className="text-xl">📰</span> Berita & Kegiatan
          </button>
          <button 
            onClick={() => setTabAktif("agenda")}
            className={`px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "agenda" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}
          >
            <span className="text-xl">📅</span> Agenda Desa Terdekat
          </button>
        </div>

        {(tabAktif === "berita" || !tabAktif) && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex justify-center my-20"><div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div></div>
            ) : beritaTerfilter.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-3xl mx-auto">
                <span className="text-6xl mb-4 block opacity-50">📭</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{searchTerm ? "Berita Tidak Ditemukan" : "Belum Ada Kabar Baru"}</h3>
                <p className="text-gray-500 font-medium">{searchTerm ? `Tidak ada artikel yang cocok dengan kata kunci "${searchTerm}".` : "Pemerintah desa belum mempublikasikan berita apapun saat ini."}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {currentBerita.map((berita) => {
                  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];
                  return (
                    <article key={berita.id} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-lg group">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-green-700 transition-colors">
                        {berita.is_pinned && <span className="text-yellow-500 mr-2" title="Pinned Post">🔒</span>}
                        {berita.judul}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">📅 {formatTanggal(berita.tanggal_posting)}</span>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-1">👤 Oleh: <span className="font-bold text-gray-700">{berita.penulis || "Admin"}</span></span>
                      </div>
                      
                      <ImageCarousel gambarArray={gambarArray} />
                      
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg mt-4 text-justify line-clamp-4">
                        {berita.isi}
                      </p>
                      
                      <div className="mt-6 text-right border-t border-gray-100 pt-5">
                        <Link href={`/kabar/${berita.id}`} className="inline-block bg-white text-green-700 border-2 border-green-600 hover:bg-green-600 hover:text-white font-black px-8 py-3 rounded-xl transition-all transform hover:-translate-y-1 shadow-sm">
                          Baca Artikel Selengkapnya →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  &laquo; Prev
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)} 
                    className={`w-10 h-10 rounded-xl font-bold shadow-sm transition-colors ${currentPage === i + 1 ? "bg-green-600 text-white border-green-600" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next &raquo;
                </button>
              </div>
            )}
          </div>
        )}

        {tabAktif === "agenda" && (
          <div className="animate-fade-in">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3 border-b border-gray-100 pb-6">
                <span className="text-4xl">📅</span> Kalender Kegiatan Lengkap
              </h2>
              
              <div className="space-y-6">
                {loading ? (
                   <p className="text-gray-400 animate-pulse text-center py-10">Memuat jadwal kegiatan...</p>
                ) : agendaTerfilter.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center bg-gray-50 max-w-2xl mx-auto">
                    <span className="text-6xl text-gray-300 mb-4 block">🗓️</span>
                    <p className="text-gray-500 font-bold text-xl">{searchTerm ? "Jadwal Tidak Ditemukan" : "Belum ada agenda desa yang dijadwalkan."}</p>
                    <p className="text-gray-400 text-sm mt-2">{searchTerm && `Tidak ada kecocokan untuk kata kunci "${searchTerm}".`}</p>
                  </div>
                ) : (
                  agendaTerfilter.map((agenda) => {
                    const tgl = new Date(agenda.tanggal);
                    const isLewat = tgl < new Date();

                    return (
                      <div key={agenda.id} className={`flex gap-6 group p-6 rounded-2xl border transition-all ${isLewat ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-green-200 hover:border-green-400 hover:shadow-md'}`}>
                        <div className={`flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center border shadow-sm transition-colors ${isLewat ? 'bg-gray-200 border-gray-300 text-gray-500' : 'bg-green-50 border-green-300 text-green-800 group-hover:bg-green-600 group-hover:text-white'}`}>
                          <span className="text-sm font-bold uppercase tracking-wider">{tgl.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-3xl font-black leading-none my-1">{tgl.getDate()}</span>
                          <span className="text-xs font-bold">{tgl.getFullYear()}</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className={`font-bold text-xl leading-tight transition-colors ${isLewat ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-green-700'}`}>
                            {agenda.nama}
                          </h4>
                          <div className="flex flex-wrap gap-4 mt-3">
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">
                              <span className="text-lg">🕒</span> {tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </p>
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">
                              <span className="text-lg">📍</span> {agenda.lokasi}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}