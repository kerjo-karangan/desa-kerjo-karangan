"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
      <img src={`https://wsrv.nl/?url=${gambarArray[currentIndex]}`} alt="Berita" className="w-full h-full object-cover transition-opacity duration-500" />
      {gambarArray.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold">&#10094;</button>
          <button onClick={nextSlide} className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold">&#10095;</button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
            {gambarArray.map((_, idx) => ( <span key={idx} className={`block w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"}`}></span> ))}
          </div>
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">{currentIndex + 1} / {gambarArray.length}</div>
        </>
      )}
    </div>
  );
};

export default function KabarDesa() {
  const [daftarBerita, setDaftarBerita] = useState<any[]>([]);
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]); // STATE BARU UNTUK AGENDA
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilData = async () => {
      try {
        // 1. Tarik Berita
        const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
        const snapKabar = await getDocs(qKabar);
        const dataKabar: any[] = [];
        snapKabar.forEach((doc) => { dataKabar.push({ id: doc.id, ...doc.data() }); });
        setDaftarBerita(dataKabar);

        // 2. Tarik Agenda (BARU)
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

      <div className="container mx-auto px-4 py-12 max-w-6xl flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: DAFTAR BERITA (Porsi 2/3 Layar) */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center my-20"><div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div></div>
            ) : daftarBerita.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
                <span className="text-5xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Kabar Baru</h3>
                <p className="text-gray-500">Pemerintah desa belum mempublikasikan berita apapun saat ini.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {daftarBerita.map((berita) => {
                  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];
                  return (
                    <article key={berita.id} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-lg">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">{berita.judul}</h2>
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">📅 {formatTanggal(berita.tanggal_posting)}</span>
                        <span className="text-gray-400 text-sm font-medium">Dipublikasikan oleh {berita.penulis || "Admin"}</span>
                      </div>
                      <ImageCarousel gambarArray={gambarArray} />
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg mt-4 text-justify">{berita.isi}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* KOLOM KANAN: AGENDA DESA (Porsi 1/3 Layar) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 sticky top-28">
              <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📅</span> Kalender Kegiatan
              </h3>
              
              <div className="space-y-6">
                {loading ? (
                   <p className="text-gray-400 animate-pulse text-sm">Memuat jadwal...</p>
                ) : daftarAgenda.length === 0 ? (
                  <div className="border border-dashed border-gray-300 p-6 rounded-2xl text-center">
                    <p className="text-sm text-gray-500 font-medium">Belum ada agenda terdekat.</p>
                  </div>
                ) : (
                  daftarAgenda.map((agenda) => {
                    const tgl = new Date(agenda.tanggal);
                    return (
                      <div key={agenda.id} className="flex gap-4 group">
                        {/* Kotak Tanggal */}
                        <div className="flex-shrink-0 w-14 h-16 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col items-center justify-center text-yellow-800 shadow-sm group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                          <span className="text-xs font-bold uppercase">{tgl.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-xl font-black leading-none">{tgl.getDate()}</span>
                        </div>
                        {/* Detail Agenda */}
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm md:text-base leading-tight group-hover:text-green-700 transition-colors">{agenda.nama}</h4>
                          <p className="text-xs text-gray-500 mt-1 font-medium">🕒 {tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                            <span className="mt-0.5">📍</span> {agenda.lokasi}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}