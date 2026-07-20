// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  const [daftarBerita, setDaftarBerita] = useState<any[]>([]);
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE HERO BEBAS FLICKER AYAM GORENG
  const [heroData, setHeroData] = useState({
    judul: "",
    sub: "",
    bg: "https://i.ibb.co.com/YFJVHD07/2239715431.webp" 
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // FETCH DATA BERANDA (Aman dijalankan karena berada di dalam useEffect Client-Side)
  useEffect(() => {
    const ambilDataBeranda = async () => {
      try {
        // 1. Fetch Pengaturan Hero Beranda
        const snapHero = await getDoc(doc(db, "pengaturan_web", "beranda"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Selamat Datang di\nDesa Kerjo",
            sub: snapHero.data().sub || "Mewujudkan pelayanan masyarakat yang transparan, inovatif, dan terdigitalisasi.",
            bg: snapHero.data().bg || "https://i.ibb.co.com/YFJVHD07/2239715431.webp"
          });
        }

        // 2. Fetch Berita
        const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
        const snapKabar = await getDocs(qKabar);
        const allKabar = snapKabar.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Memastikan berita yang dipin ada di atas (diutamakan)
        const pinnedKabar = allKabar.filter(item => item.is_pinned === true && item.is_featured !== false);
        const unpinnedKabar = allKabar.filter(item => item.is_pinned !== true && item.is_featured !== false);
        const kabarTampil = [...pinnedKabar, ...unpinnedKabar].slice(0, 10);
        setDaftarBerita(kabarTampil);

        // 3. Fetch Agenda
        const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
        const snapAgenda = await getDocs(qAgenda);
        const allAgenda = snapAgenda.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const now = new Date();
        const agendaTampil = allAgenda.filter(item => {
          if (!item.tanggal) return false;
          const tglAgenda = new Date(item.tanggal);
          return item.is_featured !== false && tglAgenda >= now;
        }).slice(0, 10);
        setDaftarAgenda(agendaTampil);

      } catch (error) {
        console.error("Gagal memuat data beranda", error);
      } finally {
        setLoading(false);
      }
    };
    
    ambilDataBeranda();
  }, []);

  // LOGIKA SLIDER OTOMATIS
  useEffect(() => {
    if (!isAutoPlay || daftarBerita.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === daftarBerita.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay, daftarBerita.length]);

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? daftarBerita.length - 1 : currentSlide - 1);
  };
  
  const nextSlide = () => {
    setCurrentSlide(currentSlide === daftarBerita.length - 1 ? 0 : currentSlide + 1);
  };

  // KERANGKA UTAMA AMAN (TIDAK ADA PENGAMAN isClient YANG MEMICU CRASH)
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      
      {/* 1. HERO SECTION (DINAMIS DAN BEBAS FLICKER) */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-green-900 transition-all duration-700">
        <div className="absolute inset-0 z-0">
          {/* PENGAMAN: Menggunakan Optional Chaining (?.) untuk mencegah error jika .bg kosong */}
          <img 
            src={heroData.bg?.startsWith("http") ? heroData.bg : `https://wsrv.nl/?url=${heroData.bg}`} 
            alt="Pemandangan Desa" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl animate-fade-in mt-16">
          <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 bg-white p-2 rounded-full shadow-2xl">
            <img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo Desa" className="w-full h-full object-contain" />
          </div>
          <span className="bg-yellow-500 text-green-950 font-black px-4 py-1.5 rounded-full text-xs md:text-sm uppercase tracking-widest shadow-md inline-block mb-6">
            Portal Informasi Publik
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-lg leading-tight whitespace-pre-wrap transition-all duration-500">
            {heroData.judul}
          </h1>
          <p className="text-lg md:text-2xl text-green-50 mb-10 font-medium max-w-2xl mx-auto drop-shadow-md whitespace-pre-wrap transition-all duration-500">
            {heroData.sub}
          </p>
        </div>
      </section>

      {/* 2. QUICK LINKS */}
      <section className="relative z-20 -mt-16 container mx-auto px-4 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/profil" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 group flex flex-col items-center text-center transform hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform">🏛️</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Profil & UMKM</h3>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Jelajahi potensi wisata dan dukung produk lokal asli desa.</p>
          </Link>
          <Link href="/kabar" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 group flex flex-col items-center text-center transform hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform">📰</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Kabar Desa</h3>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Pantau terus perkembangan berita dan kegiatan terkini.</p>
          </Link>
          <Link href="/transparansi" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 group flex flex-col items-center text-center transform hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Transparansi</h3>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Akses grafik rincian APBDes dan laporan anggaran publik.</p>
          </Link>
          <Link href="/layanan" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 group flex flex-col items-center text-center transform hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform">📄</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Layanan Surat</h3>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Urus surat pengantar, SKCK, SKTM, dll secara mandiri online.</p>
          </Link>
        </div>
      </section>

      {/* 3. BERITA & AGENDA SLIDER */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-green-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Informasi Publik</span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900">Kabar & Agenda</h2>
            </div>
            <Link href="/kabar" className="hidden md:inline-flex items-center gap-2 font-bold text-green-700 hover:text-green-800 bg-green-50 px-5 py-2.5 rounded-full transition-colors">
              Lihat Semua Informasi <span className="text-xl">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col h-full">
              {loading ? (
                 <div className="w-full h-96 bg-gray-100 rounded-3xl flex items-center justify-center shadow-inner">
                   <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : daftarBerita.length === 0 ? (
                <div className="w-full h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-center p-10">
                   <span className="text-5xl mb-4">📰</span>
                   <p className="text-gray-500 font-medium text-lg">Belum ada berita yang ditampilkan di beranda.</p>
                </div>
              ) : (
                <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-lg group bg-black">
                  {daftarBerita.map((berita, index) => {
                    const gambarSlide = Array.isArray(berita.gambar) && berita.gambar.length > 0 ? berita.gambar[0] : (berita.gambar || "");
                    return (
                      <div 
                        key={berita.id} 
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                      >
                        {gambarSlide ? (
                          <img 
                            src={gambarSlide.startsWith("http") ? gambarSlide : `https://wsrv.nl/?url=${gambarSlide}`} 
                            alt={berita.judul} 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[10000ms] ease-out" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl opacity-80">📸</div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                          <div className="flex items-center gap-2 mb-3">
                            {berita.is_pinned && (
                              <span className="bg-yellow-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
                                🔒 PINNED
                              </span>
                            )}
                            <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-sm">
                              Berita Terbaru
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight drop-shadow-md line-clamp-2">
                            {berita.judul}
                          </h3>
                          <div className="flex items-center gap-4 text-xs md:text-sm font-medium text-gray-300 mb-4">
                            <span className="flex items-center gap-1"><span>📅</span> {new Date(berita.tanggal_posting).toLocaleDateString("id-ID", { day:'numeric', month:'long', year:'numeric'})}</span>
                            <span className="flex items-center gap-1"><span>👤</span> Oleh: {berita.penulis}</span>
                          </div>
                          
                          <Link href={`/kabar/${berita.id}`} className="inline-block bg-white text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-400 transition-colors shadow-lg">
                            Baca Selengkapnya
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  <button 
                    onClick={prevSlide} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white text-white hover:text-green-900 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-20 font-black shadow-lg border border-white/20"
                  >
                    &#10094;
                  </button>
                  <button 
                    onClick={nextSlide} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white text-white hover:text-green-900 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-20 font-black shadow-lg border border-white/20"
                  >
                    &#10095;
                  </button>

                  <button 
                    onClick={() => setIsAutoPlay(!isAutoPlay)} 
                    className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-md z-20 text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/20"
                  >
                    {isAutoPlay ? "⏸️ Pause Slide" : "▶️ Play Slide"}
                  </button>

                  <div className="absolute bottom-4 right-6 flex space-x-1.5 z-20">
                    {daftarBerita.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setCurrentSlide(idx)} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-yellow-400 w-6" : "bg-white/50 w-2 hover:bg-white"}`}
                      ></button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 bg-yellow-50 p-6 md:p-8 rounded-3xl border border-yellow-200 shadow-inner flex flex-col h-[400px] md:h-[500px]">
              <h3 className="text-xl font-black text-yellow-900 mb-6 flex items-center gap-2 border-b border-yellow-300 pb-4">
                <span className="text-2xl">📅</span> Agenda Terdekat
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500 font-medium py-10 animate-pulse">Memuat agenda...</p>
                ) : daftarAgenda.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="text-4xl block mb-2 text-yellow-700 opacity-50">🗓️</span>
                    <p className="text-sm font-medium text-yellow-800">Tidak ada agenda / jadwal kegiatan dalam waktu dekat.</p>
                  </div>
                ) : (
                  daftarAgenda.map((agenda) => {
                    // PENGAMAN: Mencegah invalid date crash
                    if (!agenda.tanggal) return null;
                    const tgl = new Date(agenda.tanggal);
                    return (
                      <div key={agenda.id} className="bg-white p-4 rounded-2xl shadow-sm border border-yellow-100 flex gap-4 hover:border-yellow-400 transition-colors group">
                        <div className="flex-shrink-0 w-14 h-16 bg-yellow-100 rounded-xl flex flex-col items-center justify-center text-yellow-800 border border-yellow-200">
                          <span className="text-[10px] font-black uppercase">{tgl.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-xl font-black leading-none my-0.5">{tgl.getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                            {agenda.nama}
                          </h4>
                          <div className="text-xs text-gray-500 mt-1.5 flex flex-col gap-0.5 font-medium">
                            <span className="flex items-center gap-1"><span>🕒</span> {tgl.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })} WIB</span>
                            <span className="flex items-center gap-1 truncate w-40"><span>📍</span> {agenda.lokasi}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <Link href="/kabar?tab=agenda" className="block text-center bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold py-3 mt-4 rounded-xl transition-colors text-sm">
                Lihat Kalender Lengkap
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/kabar" className="inline-flex items-center gap-2 font-bold text-green-700 bg-green-50 px-6 py-3 rounded-full transition-colors border border-green-200">
              Lihat Semua Informasi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}