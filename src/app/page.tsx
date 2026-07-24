// src/app/page.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import Link from "next/link";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  limit,
  where
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  
  // ==========================================
  // STATE DATA BERANDA
  // ==========================================
  const [heroData, setHeroData] = useState({
    judul: "Selamat Datang Di Desa Kerjo",
    sub: "Mewujudkan pelayanan masyarakat yang transparan, inovatif, dan terdigitalisasi.",
    bg: ""
  });
  
  const [statistik, setStatistik] = useState({
    penduduk: 0,
    keluarga: 0,
    laki: 0,
    perempuan: 0
  });

  const [beritaSlide, setBeritaSlide] = useState<any[]>([]);
  const [agendaList, setAgendaList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Ambil data Peta
  const petaEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.3963895278016!2d111.66164507373044!3d-8.060987680540897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e791000c680611b%3A0x6a4b06525c9657c!2sKantor%20Kepala%20Desa%20Kerjo!5e0!3m2!1sid!2sid!4v1784769815814!5m2!1sid!2sid";

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // 1. Fetch Header Beranda
        const snapHero = await getDoc(doc(db, "pengaturan_web", "beranda_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Selamat Datang Di Desa Kerjo",
            sub: snapHero.data().sub || "Mewujudkan pelayanan masyarakat yang transparan.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Statistik Data Penduduk
        const snapPenduduk = await getDocs(collection(db, "data_penduduk"));
        let totalPenduduk = 0;
        let totalLaki = 0;
        let totalPerempuan = 0;
        const setKeluarga = new Set();

        snapPenduduk.docs.forEach((doc) => {
          totalPenduduk++;
          const data = doc.data();
          if (data.id_keluarga) {
            setKeluarga.add(data.id_keluarga);
          }
          if (data.jenis_kelamin === "LAKI-LAKI") {
            totalLaki++;
          } else if (data.jenis_kelamin === "PEREMPUAN") {
            totalPerempuan++;
          }
        });

        setStatistik({
          penduduk: totalPenduduk,
          keluarga: setKeluarga.size,
          laki: totalLaki,
          perempuan: totalPerempuan
        });

        // 3. Fetch Berita (DATABASE ASLI: kabar_desa) - Menarik yg di Pin (Maks 15)
        const qBerita = query(
          collection(db, "kabar_desa"), 
          where("is_pinned", "==", true)
        );
        const snapBerita = await getDocs(qBerita);
        let beritaTerpilih = snapBerita.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));
        // Mengurutkan berdasarkan tanggal terbaru dan batasi maksimal 15
        beritaTerpilih.sort((a, b) => new Date(b.tanggal_posting).getTime() - new Date(a.tanggal_posting).getTime());
        setBeritaSlide(beritaTerpilih.slice(0, 15));

        // 4. Fetch Agenda (DATABASE ASLI: agenda_desa) - 3 Agenda Terbaru
        const qAgenda = query(
          collection(db, "agenda_desa"), 
          orderBy("tanggal", "asc"), 
          limit(3)
        );
        const snapAgenda = await getDocs(qAgenda);
        setAgendaList(snapAgenda.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data beranda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Slider Otomatis (Akan terjeda jika isPaused true / kursor diarahkan ke area slide)
  useEffect(() => {
    if (beritaSlide.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % beritaSlide.length);
    }, 5000); 
    
    return () => clearInterval(interval);
  }, [beritaSlide.length, isPaused]);

  // Fungsi memanipulasi Link YouTube biasa menjadi Link Embed
  const konversiLinkYouTube = (url: string) => {
    if (!url) return "";
    let embedUrl = url;
    if (url.includes("watch?v=")) {
      embedUrl = url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
      embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
    }
    // Hapus parameter waktu jika ada agar bersih
    return embedUrl.split("&")[0];
  };

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
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div 
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 font-sans"
    >
      
      {/* ==========================================
          1. HEADER (HERO SECTION)
      ========================================== */}
      <div 
        className="relative pt-24 pb-48 md:pt-32 md:pb-56 text-white overflow-hidden bg-gray-900"
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Desa Background" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          )}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"
          ></div>
        </div>

        <div 
          className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center animate-fade-in"
        >
          <div 
            className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-md rounded-full p-2 mb-6 shadow-2xl border border-white/20"
          >
            <img 
              src="https://i.ibb.co.com/4ny8JgGm/1.png" 
              alt="Logo Desa" 
              className="w-full h-full object-contain" 
            />
          </div>
          <span 
            className="text-blue-400 font-black tracking-widest uppercase text-xs md:text-sm mb-4 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-700"
          >
            Portal Informasi Publik
          </span>
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 drop-shadow-2xl max-w-4xl leading-tight whitespace-pre-wrap"
          >
            {heroData.judul}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 max-w-2xl font-medium drop-shadow-lg leading-relaxed whitespace-pre-wrap"
          >
            {heroData.sub}
          </p>
        </div>
      </div>

      {/* ==========================================
          2. TOMBOL SHORTCUT MELAYANG (5 KOTAK)
      ========================================== */}
      <div 
        className="container mx-auto px-4 relative z-20 -mt-24 md:-mt-32"
      >
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
        >
          <Link 
            href="/profil" 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-b-4 border-blue-500 flex flex-col items-center text-center"
          >
            <div 
              className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform"
            >
              🏛️
            </div>
            <h3 
              className="text-gray-900 font-black text-sm md:text-base mb-2"
            >
              Profil & UMKM
            </h3>
            <p 
              className="text-gray-500 text-xs hidden md:block"
            >
              Jelajahi potensi wisata dan produk lokal desa.
            </p>
          </Link>

          <Link 
            href="/datadesa" 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-b-4 border-purple-500 flex flex-col items-center text-center"
          >
            <div 
              className="w-12 h-12 md:w-16 md:h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform"
            >
              📊
            </div>
            <h3 
              className="text-gray-900 font-black text-sm md:text-base mb-2"
            >
              Data Desa
            </h3>
            <p 
              className="text-gray-500 text-xs hidden md:block"
            >
              Visualisasi statistik kependudukan akurat.
            </p>
          </Link>

          <Link 
            href="/kabar" 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-b-4 border-green-500 flex flex-col items-center text-center"
          >
            <div 
              className="w-12 h-12 md:w-16 md:h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform"
            >
              📰
            </div>
            <h3 
              className="text-gray-900 font-black text-sm md:text-base mb-2"
            >
              Kabar Desa
            </h3>
            <p 
              className="text-gray-500 text-xs hidden md:block"
            >
              Pantau terus perkembangan berita terkini.
            </p>
          </Link>

          <Link 
            href="/transparansi" 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-b-4 border-yellow-500 flex flex-col items-center text-center"
          >
            <div 
              className="w-12 h-12 md:w-16 md:h-16 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform"
            >
              📈
            </div>
            <h3 
              className="text-gray-900 font-black text-sm md:text-base mb-2"
            >
              Transparansi
            </h3>
            <p 
              className="text-gray-500 text-xs hidden md:block"
            >
              Akses grafik APBDes & dokumen publik.
            </p>
          </Link>

          <Link 
            href="/layanan" 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group border-b-4 border-red-500 flex flex-col items-center text-center col-span-2 md:col-span-1 lg:col-span-1"
          >
            <div 
              className="w-12 h-12 md:w-16 md:h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 group-hover:scale-110 transition-transform"
            >
              💌
            </div>
            <h3 
              className="text-gray-900 font-black text-sm md:text-base mb-2"
            >
              Layanan Surat
            </h3>
            <p 
              className="text-gray-500 text-xs hidden md:block"
            >
              Urus surat pengantar secara mandiri.
            </p>
          </Link>

        </div>
      </div>

      {/* ==========================================
          3. STATISTIK RINGKAS DESA (HOVER ANIMASI)
      ========================================== */}
      <section 
        className="py-16 md:py-24"
      >
        <div 
          className="container mx-auto px-4"
        >
          <div 
            className="text-center mb-12"
          >
            <span 
              className="text-blue-600 font-black tracking-widest uppercase text-xs"
            >
              Data Real-Time
            </span>
            <h2 
              className="text-3xl md:text-4xl font-black text-gray-900 mt-2"
            >
              Statistik Kependudukan
            </h2>
          </div>
          
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto"
          >
            <div 
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-default"
            >
              <div 
                className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-xl mb-3"
              >
                👥
              </div>
              <h4 
                className="text-3xl md:text-4xl font-black text-gray-900 mb-1"
              >
                {statistik.penduduk}
              </h4>
              <p 
                className="text-gray-500 text-xs font-bold uppercase tracking-widest"
              >
                Total Warga
              </p>
            </div>
            
            <div 
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-default"
            >
              <div 
                className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-xl mb-3"
              >
                👨‍👩‍👧‍👦
              </div>
              <h4 
                className="text-3xl md:text-4xl font-black text-gray-900 mb-1"
              >
                {statistik.keluarga}
              </h4>
              <p 
                className="text-gray-500 text-xs font-bold uppercase tracking-widest"
              >
                Kepala Keluarga
              </p>
            </div>

            <div 
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-default"
            >
              <div 
                className="w-12 h-12 bg-cyan-50 rounded-full flex items-center justify-center text-xl mb-3"
              >
                👨
              </div>
              <h4 
                className="text-3xl md:text-4xl font-black text-gray-900 mb-1"
              >
                {statistik.laki}
              </h4>
              <p 
                className="text-gray-500 text-xs font-bold uppercase tracking-widest"
              >
                Laki-Laki
              </p>
            </div>

            <div 
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-default"
            >
              <div 
                className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-xl mb-3"
              >
                👩
              </div>
              <h4 
                className="text-3xl md:text-4xl font-black text-gray-900 mb-1"
              >
                {statistik.perempuan}
              </h4>
              <p 
                className="text-gray-500 text-xs font-bold uppercase tracking-widest"
              >
                Perempuan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          4. SLIDER BERITA DENGAN BINGKAI CERAH & YOUTUBE
      ========================================== */}
      {beritaSlide.length > 0 && (
        <section 
          className="py-12 bg-gray-50"
        >
          <div 
            className="container mx-auto px-4 max-w-6xl"
          >
            <div 
              className="flex justify-between items-end mb-8"
            >
              <div>
                <span 
                  className="text-blue-600 font-bold tracking-widest uppercase text-xs"
                >
                  Kabar Terbaru
                </span>
                <h2 
                  className="text-3xl font-black mt-1 text-gray-900"
                >
                  Informasi & Berita Desa Terkini
                </h2>
              </div>
              <Link 
                href="/kabar" 
                className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Lihat Semua Kabar <span>→</span>
              </Link>
            </div>

            {/* Area Bingkai Kotak Membulat Untuk Slider */}
            <div 
              className="relative w-full h-[450px] md:h-[550px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100 group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {beritaSlide.map((slide, index) => {
                
                // Cek apakah ada link YouTube
                const hasYoutube = slide.link_youtube && slide.link_youtube.trim() !== "";
                const embedUrl = hasYoutube ? konversiLinkYouTube(slide.link_youtube) : "";

                // Ambil gambar pertama jika array
                let imageUrl = "";
                if (Array.isArray(slide.gambar) && slide.gambar.length > 0) {
                  imageUrl = slide.gambar[0];
                } else if (typeof slide.gambar === "string") {
                  imageUrl = slide.gambar;
                }

                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    {/* Render Video YouTube atau Gambar */}
                    {hasYoutube ? (
                      <div 
                        className="w-full h-full"
                      >
                        <iframe 
                          src={`${embedUrl}?rel=0&modestbranding=1`} 
                          title="YouTube Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen 
                          className="w-full h-full object-cover"
                        ></iframe>
                        {/* Overlay gradient di bawah agar teks tetap terbaca */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-none"
                        ></div>
                      </div>
                    ) : (
                      imageUrl && (
                        <>
                          <img
                            src={getSafeImageUrl(imageUrl)}
                            alt={slide.judul}
                            className="w-full h-full object-cover"
                          />
                          <div 
                            className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent pointer-events-none"
                          ></div>
                        </>
                      )
                    )}
                    
                    {/* Konten Teks di Bawah (Dibuat mengambang dan rapi) */}
                    <div 
                      className="absolute bottom-0 left-0 w-full p-6 md:p-12 pointer-events-none"
                    >
                      <div 
                        className="flex items-center gap-3 mb-4"
                      >
                        <span 
                          className="bg-blue-600 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"
                        >
                          {slide.kategori || "Berita"}
                        </span>
                        <span 
                          className="text-gray-200 text-xs font-bold drop-shadow-md"
                        >
                          {slide.tanggal_posting ? new Date(slide.tanggal_posting).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
                        </span>
                      </div>
                      <h3 
                        className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-lg"
                      >
                        {slide.judul}
                      </h3>
                      <p 
                        className="text-gray-200 text-sm md:text-base line-clamp-2 md:line-clamp-3 max-w-3xl drop-shadow-md mb-6"
                      >
                        {slide.isi}
                      </p>
                      
                      {/* Tombol Lihat Selengkapnya (Diaktifkan pointer-events-auto agar bisa diklik) */}
                      <div 
                        className="pointer-events-auto"
                      >
                        <Link 
                          href={`/kabar?id=${slide.id}`} 
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-sm border border-blue-500"
                        >
                          Lihat Selengkapnya
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Indikator Titik Bawah Slide */}
              <div 
                className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20 flex gap-1.5"
              >
                {beritaSlide.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? "w-6 bg-blue-500" : "w-2 bg-white/50 hover:bg-white/90"
                    }`}
                  ></button>
                ))}
              </div>

              {/* Tanda Pause (Muncul saat diarahkan kursor) */}
              {isPaused && (
                <div 
                  className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 text-white shadow-md"
                >
                  <span 
                    className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                  ></span> 
                  Slider Berhenti (Mode Video / Baca)
                </div>
              )}

              {/* Tombol Next & Prev (Panah Putih) */}
              {beritaSlide.length > 1 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 left-4 right-4 z-20 flex justify-between pointer-events-none"
                >
                  <button 
                    onClick={() => setCurrentSlide(currentSlide === 0 ? beritaSlide.length - 1 : currentSlide - 1)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shadow-lg border border-white/20"
                  >
                    ◀
                  </button>
                  <button 
                    onClick={() => setCurrentSlide((currentSlide + 1) % beritaSlide.length)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shadow-lg border border-white/20"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          5. AGENDA DESA TERBARU DIATAS MAPS
      ========================================== */}
      {agendaList.length > 0 && (
        <section 
          className="py-16 bg-gray-50"
        >
          <div 
            className="container mx-auto px-4 max-w-5xl"
          >
            <div 
              className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8"
            >
              <div>
                <span 
                  className="text-blue-600 font-bold tracking-widest uppercase text-xs"
                >
                  Kegiatan Desa
                </span>
                <h2 
                  className="text-2xl md:text-3xl font-black mt-1 text-gray-900"
                >
                  Agenda Terdekat
                </h2>
              </div>
              <Link 
                href="/kabar?tab=agenda" 
                className="hidden md:block text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Lihat Semua Agenda
              </Link>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {agendaList.map((agenda) => (
                <div 
                  key={agenda.id}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default"
                >
                  <div 
                    className="flex items-center gap-3 mb-4"
                  >
                    <div 
                      className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center font-black leading-none group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    >
                      <span 
                        className="text-lg"
                      >
                        {new Date(agenda.tanggal).getDate()}
                      </span>
                      <span 
                        className="text-[9px] uppercase tracking-wider"
                      >
                        {new Date(agenda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <h4 
                        className="text-lg font-black text-gray-900 leading-tight line-clamp-2"
                      >
                        {agenda.nama}
                      </h4>
                    </div>
                  </div>
                  
                  <div 
                    className="space-y-2 text-xs font-bold text-gray-600"
                  >
                    <p 
                      className="flex items-center gap-2"
                    >
                      <span 
                        className="text-gray-400"
                      >
                        📍
                      </span> 
                      {agenda.lokasi || "Balai Desa"}
                    </p>
                    <p 
                      className="flex items-center gap-2"
                    >
                      <span 
                        className="text-gray-400"
                      >
                        ⏰
                      </span> 
                      {agenda.tanggal ? new Date(agenda.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "Menyesuaikan"} WIB
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div 
              className="md:hidden mt-6 text-center"
            >
              <Link 
                href="/kabar?tab=agenda" 
                className="inline-block w-full bg-blue-50 text-blue-700 font-bold py-3 px-8 rounded-xl border border-blue-100"
              >
                Lihat Semua Agenda
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          6. GOOGLE MAPS EMBED (BINGKAI KOTAK MEMBULAT)
      ========================================== */}
      <section 
        className="py-12 bg-gray-50 pb-24"
      >
        <div 
          className="container mx-auto px-4 max-w-6xl"
        >
          <div 
            className="w-full h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-200 relative"
          >
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            >
              <span 
                className="bg-white/90 backdrop-blur-sm text-gray-900 font-black px-6 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 border border-gray-200"
              >
                <span 
                  className="text-red-500 text-lg"
                >
                  📍
                </span> 
                Peta Lokasi Desa Kerjo
              </span>
            </div>
            
            <iframe 
              src={petaEmbedUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

    </div>
  );
}