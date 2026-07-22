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
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Ambil data Peta (Opsional: Jika nanti diatur dari panel Admin)
  const petaEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.457193231121!2d111.66699277413645!3d-8.054746480468972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e791b0f512dc34b%3A0x5027a76e3565540!2sDesa%20Kerjo%2C%20Kec.%20Karangan%2C%20Kabupaten%20Trenggalek%2C%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1714441584852!5m2!1sid!2sid";

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

        // 3. Fetch Berita (Pin Khusus Beranda)
        const qBerita = query(
          collection(db, "kabar_berita"), 
          where("pin_beranda", "==", true),
          orderBy("tanggal", "desc"), 
          limit(5)
        );
        const snapBerita = await getDocs(qBerita);
        setBeritaSlide(snapBerita.docs.map(doc => ({ 
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

  // Slider Otomatis
  useEffect(() => {
    if (beritaSlide.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % beritaSlide.length);
    }, 5000); // Ganti gambar tiap 5 detik
    
    return () => clearInterval(interval);
  }, [beritaSlide.length, isPaused]);

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
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
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
      {/* PERBAIKAN BUG Z-INDEX: Menambahkan pb-48 (padding bawah ekstra) agar teks aman */}
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
            className="text-yellow-400 font-black tracking-widest uppercase text-xs md:text-sm mb-4 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-700"
          >
            Portal Informasi Publik
          </span>
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 drop-shadow-2xl max-w-4xl leading-tight"
          >
            {heroData.judul}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 max-w-2xl font-medium drop-shadow-lg leading-relaxed"
          >
            {heroData.sub}
          </p>
        </div>
      </div>

      {/* ==========================================
          2. TOMBOL SHORTCUT MELAYANG (5 KOTAK)
      ========================================== */}
      {/* PERBAIKAN: z-20 agar di atas background tapi di bawah Navbar, grid dibuat 5 kolom */}
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

          {/* TOMBOL BARU: DATA DESA */}
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
          3. STATISTIK RINGKAS DESA
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
              className="text-green-600 font-black tracking-widest uppercase text-xs"
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
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center"
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
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center"
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
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center"
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
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center"
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
          4. SLIDER BERITA DESA
      ========================================== */}
      {beritaSlide.length > 0 && (
        <section 
          className="py-12 bg-gray-900 text-white"
        >
          <div 
            className="container mx-auto px-4"
          >
            <div 
              className="flex justify-between items-end mb-8"
            >
              <div>
                <span 
                  className="text-green-400 font-bold tracking-widest uppercase text-xs"
                >
                  Informasi Publik
                </span>
                <h2 
                  className="text-3xl font-black mt-1"
                >
                  Kabar & Agenda
                </h2>
              </div>
              <Link 
                href="/kabar" 
                className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Lihat Semua Berita <span>→</span>
              </Link>
            </div>

            <div 
              className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-gray-800 group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {beritaSlide.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={getSafeImageUrl(slide.gambar)}
                    alt={slide.judul}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"
                  ></div>
                  
                  <div 
                    className="absolute bottom-0 left-0 w-full p-6 md:p-12"
                  >
                    <span 
                      className="bg-green-600 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block"
                    >
                      Berita Terbaru
                    </span>
                    <h3 
                      className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-md"
                    >
                      {slide.judul}
                    </h3>
                    <p 
                      className="text-gray-300 text-sm md:text-base line-clamp-2 md:line-clamp-3 max-w-3xl drop-shadow-sm"
                    >
                      {slide.isi_berita}
                    </p>
                  </div>
                </div>
              ))}

              {isPaused && (
                <div 
                  className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 text-white"
                >
                  <span 
                    className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                  ></span> 
                  Pause Slide
                </div>
              )}

              {beritaSlide.length > 1 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 left-4 right-4 z-20 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button 
                    onClick={() => setCurrentSlide(currentSlide === 0 ? beritaSlide.length - 1 : currentSlide - 1)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors"
                  >
                    ◀
                  </button>
                  <button 
                    onClick={() => setCurrentSlide((currentSlide + 1) % beritaSlide.length)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
            
            <div 
              className="md:hidden mt-6 text-center"
            >
              <Link 
                href="/kabar" 
                className="inline-block bg-gray-800 text-white font-bold py-3 px-8 rounded-xl"
              >
                Lihat Semua Berita
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          5. GOOGLE MAPS EMBED
      ========================================== */}
      <section 
        className="w-full h-96 md:h-[500px] bg-gray-200 relative"
      >
        <div 
          className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-gray-900/50 to-transparent z-10 pointer-events-none flex justify-center"
        >
          <span 
            className="bg-white text-gray-900 font-black px-6 py-2 rounded-full shadow-lg text-sm flex items-center gap-2"
          >
            <span 
              className="text-red-500"
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
      </section>

    </div>
  );
}