// src/app/kabar/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; // Ditambahkan untuk link detail berita

// --- KOMPONEN SLIDER GAMBAR ---
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
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
            {gambarArray.map((_, idx) => (
              <span key={idx} className={`block w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"}`}></span>
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// --- KOMPONEN UTAMA ---
export default function KabarDesa() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <KabarContent />
    </Suspense>
  );
}

// --- KOMPONEN ISI HALAMAN ---
function KabarContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  
  const [tabAktif, setTabAktif] = useState("berita");

  const [daftarBerita, setDaftarBerita] = useState<any[]>([]);
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE KOTAK PENCARIAN
  const [searchTerm, setSearchTerm] = useState("");

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

  // LOGIKA PENCARIAN (FILTER DATA)
  const beritaTerfilter = daftarBerita.filter((b) => 
    b.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.isi.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const agendaTerfilter = daftarAgenda.filter((a) => 
    a.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">Pusat Informasi Terkini</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Kabar & Agenda Desa</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Pantau terus perkembangan pembangunan, kegiatan gotong royong, dan jadwal kegiatan resmi dari aparat desa.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-grow">
        
        {/* KOTAK PENCARIAN PINTAR */}
        <div className="mb-10 max-w-2xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Cari berita atau kegiatan desa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-green-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium text-gray-800 shadow-sm"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-green-600">🔍</span>
        </div>

        {/* TABS NAVIGASI */}
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
            <span className="text-xl">📅</span> Agenda Desa
          </button>
        </div>

        {/* KONTEN ISOLASI 1: BERITA DESA */}
        {(tabAktif === "berita" || !tabAktif) && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex justify-center my-20"><div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div></div>
            ) : beritaTerfilter.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
                <span className="text-5xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{searchTerm ? "Berita Tidak Ditemukan" : "Belum Ada Kabar Baru"}</h3>
                <p className="text-gray-500">{searchTerm ? `Coba gunakan kata kunci pencarian yang lain.` : "Pemerintah desa belum mempublikasikan berita apapun saat ini."}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {beritaTerfilter.map((berita) => {
                  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];
                  return (
                    <article key={berita.id} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-lg">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">{berita.judul}</h2>
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">📅 {formatTanggal(berita.tanggal_posting)}</span>
                        <span className="text-gray-400 text-sm font-medium">Oleh: {berita.penulis || "Admin"}</span>
                      </div>
                      
                      <ImageCarousel gambarArray={gambarArray} />
                      
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg mt-4 text-justify line-clamp-4">
                        {berita.isi}
                      </p>
                      
                      <div className="mt-6 text-right border-t border-gray-100 pt-4">
                        <Link href={`/kabar/${berita.id}`} className="inline-block bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 font-bold px-6 py-2.5 rounded-xl transition-colors">
                          Baca Artikel Selengkapnya →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KONTEN ISOLASI 2: AGENDA DESA */}
        {tabAktif === "agenda" && (
          <div className="animate-fade-in">
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <span className="text-4xl">📅</span> Kalender Kegiatan Terdekat
              </h2>
              
              <div className="space-y-6">
                {loading ? (
                   <p className="text-gray-400 animate-pulse text-center py-10">Memuat jadwal kegiatan...</p>
                ) : agendaTerfilter.length === 0 ? (
                  <div className="border border-dashed border-gray-300 p-10 rounded-2xl text-center bg-gray-50">
                    <span className="text-4xl text-gray-300 mb-3 block">🗓️</span>
                    <p className="text-gray-500 font-medium text-lg">{searchTerm ? "Jadwal Tidak Ditemukan" : "Belum ada agenda terdekat yang dijadwalkan."}</p>
                  </div>
                ) : (
                  agendaTerfilter.map((agenda) => {
                    const tgl = new Date(agenda.tanggal);
                    return (
                      <div key={agenda.id} className="flex gap-6 group bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all">
                        {/* Kotak Tanggal */}
                        <div className="flex-shrink-0 w-20 h-24 bg-white border-2 border-yellow-400 rounded-xl flex flex-col items-center justify-center text-yellow-800 shadow-sm group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                          <span className="text-sm font-bold uppercase tracking-wider">{tgl.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-3xl font-black leading-none my-1">{tgl.getDate()}</span>
                          <span className="text-xs font-bold">{tgl.getFullYear()}</span>
                        </div>
                        {/* Detail Agenda */}
                        <div className="flex flex-col justify-center">
                          <h4 className="font-bold text-gray-900 text-xl leading-tight group-hover:text-green-700 transition-colors">{agenda.nama}</h4>
                          <div className="flex flex-wrap gap-4 mt-3">
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                              <span className="text-lg">🕒</span> {tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </p>
                            <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
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