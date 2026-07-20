// src/app/profil/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ProfilDesa() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ProfilContent />
    </Suspense>
  );
}

// ==========================================
// KOMPONEN SLIDER GAMBAR UNTUK UMKM/WISATA
// ==========================================
const ImageCarousel = ({ gambarArray }: { gambarArray: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (gambarArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === gambarArray.length - 1 ? 0 : prevIndex + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [gambarArray.length]);

  const prevSlide = () => setCurrentIndex(currentIndex === 0 ? gambarArray.length - 1 : currentIndex - 1);
  const nextSlide = () => setCurrentIndex(currentIndex === gambarArray.length - 1 ? 0 : currentIndex + 1);

  if (gambarArray.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-5xl">
        📦
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group overflow-hidden bg-gray-100">
      <img
        src={gambarArray[currentIndex].startsWith("http") ? gambarArray[currentIndex] : `https://wsrv.nl/?url=${gambarArray[currentIndex]}`}
        alt="Galeri"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {gambarArray.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-md font-bold z-10">
            &#10094;
          </button>
          <button onClick={nextSlide} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-md font-bold z-10">
            &#10095;
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5 z-10">
            {gambarArray.map((_, idx) => (
              <span key={idx} className={`block h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-yellow-400 w-4" : "bg-white/60 w-1.5"}`}></span>
            ))}
          </div>
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN ISI HALAMAN
// ==========================================
function ProfilContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  const [tabAktif, setTabAktif] = useState("sejarah");

  const [profil, setProfil] = useState({ sejarah: "", visi_misi: "" });
  const [heroBg, setHeroBg] = useState("https://i.ibb.co.com/YFJVHD07/2239715431.webp"); 
  const [aparaturDesa, setAparaturDesa] = useState<any[]>([]);
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [daftarLembaga, setDaftarLembaga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabQuery === "sejarah" || tabQuery === "sotk" || tabQuery === "lembaga" || tabQuery === "umkm") {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const docRef = doc(db, "profil_desa", "utama");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfil({
            sejarah: docSnap.data().sejarah || "",
            visi_misi: docSnap.data().visi_misi || "",
          });
        }

        const heroRef = doc(db, "pengaturan_web", "profil_hero");
        const heroSnap = await getDoc(heroRef);
        if (heroSnap.exists() && heroSnap.data().bg) {
          setHeroBg(heroSnap.data().bg);
        }

        const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
        const dataAparatur = (await getDocs(qAparatur)).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAparaturDesa(dataAparatur);

        const qLembaga = query(collection(db, "lembaga_desa"));
        setDaftarLembaga((await getDocs(qLembaga)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const qUmkm = query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc"));
        setDaftarUmkm((await getDocs(qUmkm)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  // ==========================================
  // LOGIKA JAM CERDAS (SMART OPERATIONAL HOURS)
  // ==========================================
  const getHariIniString = () => {
    const hariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return hariIndo[new Date().getDay()];
  };

  const getSortedJamOperasional = (jamObj: any) => {
    if (!jamObj) return [];
    const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const hariIniStr = getHariIniString();
    
    const startIndex = urutanHari.indexOf(hariIniStr);
    
    // Potong dan sambung array agar hari ini selalu urutan ke-0
    const sortedHariList = [
      ...urutanHari.slice(startIndex),
      ...urutanHari.slice(0, startIndex)
    ];

    return sortedHariList.map(hari => ({
      hari: hari,
      isHariIni: hari === hariIniStr,
      ...jamObj[hari]
    }));
  };

  const cekStatusBuka = (jamObjHariIni: any) => {
    if (!jamObjHariIni || jamObjHariIni.libur) {
      return { status: "TUTUP HARI INI", color: "bg-red-100 text-red-700 border-red-200" };
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (currentStr >= jamObjHariIni.buka && currentStr <= jamObjHariIni.tutup) {
      return { status: "BUKA SEKARANG", color: "bg-green-100 text-green-800 border-green-300 shadow-sm" };
    } else {
      return { status: "SEDANG TUTUP", color: "bg-gray-100 text-gray-600 border-gray-300" };
    }
  };

  // ==========================================
  // KOMPONEN REKURSIF UNTUK MENGGAMBAR BAGAN SOTK
  // ==========================================
  const RenderPohonSOTK = ({ parentId }: { parentId: string }) => {
    const bawahan = aparaturDesa.filter((org) => (org.jalurAtas || "") === parentId);

    if (bawahan.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4 relative">
        {bawahan.map((child) => (
          <div key={child.id} className="flex flex-col items-center relative">
            {parentId !== "" && (
              <div
                className={`w-0 h-8 border-l-4 ${
                  child.jenisGaris === "Koordinasi"
                    ? "border-dashed border-blue-400"
                    : "border-solid border-green-600"
                }`}
              ></div>
            )}

            <div className="bg-white border-b-4 border-green-600 p-5 rounded-2xl shadow-md w-48 text-center z-10 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-inner border border-gray-200">
                {child.foto ? (
                  <img src={child.foto.startsWith("http") ? child.foto : `https://wsrv.nl/?url=${child.foto}`} className="w-full h-full object-cover" alt={child.nama} />
                ) : (
                  <span className="text-3xl text-gray-300">👤</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                {child.nama}
              </h4>
              <p className="text-[10px] bg-green-50 text-green-800 font-black uppercase tracking-widest px-2 py-1.5 rounded mt-2 inline-block border border-green-100">
                {child.jabatan}
              </p>
            </div>

            <RenderPohonSOTK parentId={child.id} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* HERO SECTION DINAMIS */}
      <div className="bg-green-900 text-white py-16 md:py-24 relative overflow-hidden shadow-md transition-all duration-700">
        <div className="absolute inset-0 z-0">
          <img src={heroBg.startsWith("http") ? heroBg : `https://wsrv.nl/?url=${heroBg}`} alt="Background Profil" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="bg-yellow-500 text-green-950 px-4 py-1 rounded-full font-extrabold tracking-widest uppercase text-xs mb-4 inline-block shadow-md">
            Mengenal Lebih Dekat
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">
            Profil & Kelembagaan
          </h1>
          <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto font-medium drop-shadow-md">
            Sejarah, susunan aparatur, pilar masyarakat, serta produk unggulan Desa Kerjo.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl flex-grow">
        
        {/* TABS NAVIGASI ISOLASI */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          <button
            onClick={() => setTabAktif("sejarah")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "sejarah" || !tabAktif
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">📖</span> Sejarah & Visi Misi
          </button>
          <button
            onClick={() => setTabAktif("sotk")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "sotk"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">👔</span> Pemerintah Desa
          </button>
          <button
            onClick={() => setTabAktif("lembaga")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "lembaga"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">🤝</span> Lembaga Masyarakat
          </button>
          <button
            onClick={() => setTabAktif("umkm")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "umkm"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">🛍️</span> Potensi & UMKM
          </button>
        </div>

        {/* ==========================================
            KONTEN ISOLASI 1: SEJARAH & VISI MISI
        ========================================== */}
        {(tabAktif === "sejarah" || !tabAktif) && (
          <div className="grid grid-cols-1 gap-8 animate-fade-in max-w-4xl mx-auto">
            <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-9xl opacity-5 select-none pointer-events-none">📖</div>
              <h2 className="text-3xl font-extrabold text-green-800 mb-6 flex items-center gap-3 relative z-10">
                Sejarah Desa
              </h2>
              {loading ? (
                <div className="animate-pulse space-y-3 relative z-10">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-justify relative z-10">
                  {profil.sejarah || "Sejarah desa belum dipublikasikan oleh admin."}
                </p>
              )}
            </section>
            
            <section className="bg-gradient-to-br from-green-800 to-green-900 p-8 md:p-12 rounded-3xl shadow-lg text-white transform hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 text-9xl opacity-10 select-none pointer-events-none">🎯</div>
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-green-50 relative z-10">
                Visi & Misi
              </h2>
              {loading ? (
                <div className="animate-pulse space-y-3 relative z-10">
                  <div className="h-4 bg-green-700 rounded w-full"></div>
                  <div className="h-4 bg-green-700 rounded w-full"></div>
                </div>
              ) : (
                <p className="text-green-50 text-lg leading-relaxed whitespace-pre-wrap text-justify font-medium relative z-10">
                  {profil.visi_misi || "Visi dan Misi desa belum dipublikasikan oleh admin."}
                </p>
              )}
            </section>
          </div>
        )}

        {/* ==========================================
            KONTEN ISOLASI 2: SOTK & HIERARKI DESA
        ========================================== */}
        {tabAktif === "sotk" && (
          <section className="animate-fade-in bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="text-center mb-10">
              <span className="text-green-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Struktur Organisasi (SOTK)
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Pemerintah Desa Kerjo
              </h2>
              
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-8 h-1 bg-green-600"></div> Garis Instruksi
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-8 h-1 border-b-2 border-dashed border-blue-400"></div> Garis Koordinasi
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : aparaturDesa.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                <span className="text-5xl text-gray-300 block mb-4">👔</span>
                <p className="text-gray-500 font-medium">Bagan aparatur belum diatur.</p>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center min-w-[800px]">
                <RenderPohonSOTK parentId="" />
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            KONTEN ISOLASI 3: LEMBAGA MASYARAKAT
        ========================================== */}
        {tabAktif === "lembaga" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-blue-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Pilar Masyarakat
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Lembaga Kemasyarakatan
              </h2>
              <p className="text-gray-500 mt-3">Mitra strategis dalam mewujudkan kemajuan desa.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : daftarLembaga.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300">
                <span className="text-4xl block mb-3">🤝</span>
                <p className="text-gray-500 font-medium">Belum ada lembaga yang terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {daftarLembaga.map((lem) => (
                  <div key={lem.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-5 hover:shadow-lg hover:border-blue-300 transition-all group">
                    <div className="flex flex-row items-center gap-5 w-full border-b border-gray-100 pb-5">
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-200 p-2 shadow-sm group-hover:scale-105 transition-transform">
                        {lem.foto ? (
                          <img src={lem.foto.startsWith("http") ? lem.foto : `https://wsrv.nl/?url=${lem.foto}`} className="w-full h-full object-contain" alt={lem.singkatan} />
                        ) : (
                          <span className="text-3xl">🏛️</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">{lem.singkatan}</h3>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{lem.nama}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify line-clamp-4 hover:line-clamp-none transition-all">{lem.deskripsi}</p>
                    
                    {/* Tombol Dinamis ke Halaman SOTK Lembaga Khusus (Rute: /profil/lembaga/[id]) */}
                    {lem.anggota_sotk && lem.anggota_sotk.length > 0 ? (
                      <Link href={`/profil/lembaga/${lem.id}`} className="mt-auto w-full text-center bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold py-3 rounded-xl transition-all shadow-sm">
                        Lihat Susunan Pengurus →
                      </Link>
                    ) : (
                      <button disabled className="mt-auto w-full text-center bg-gray-50 text-gray-400 border border-gray-200 font-bold py-3 rounded-xl cursor-not-allowed text-xs">
                        Struktur Organisasi Belum Tersedia
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            KONTEN ISOLASI 4: UMKM & POTENSI DESA
        ========================================== */}
        {tabAktif === "umkm" && (
          <section className="animate-fade-in bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <span className="text-yellow-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Pemberdayaan Ekonomi
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Katalog Potensi & UMKM
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : daftarUmkm.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300">
                <span className="text-4xl block mb-3">🛍️</span>
                <p className="text-gray-500 font-medium">Belum ada produk UMKM yang dipromosikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {daftarUmkm.map((umkm) => {
                  const gambarArray = Array.isArray(umkm.gambar) && umkm.gambar.length > 0 ? umkm.gambar : (umkm.foto ? [umkm.foto] : []);
                  const isGratis = umkm.harga_mulai === 0 && umkm.harga_sampai === 0;
                  const hargaText = isGratis ? "GRATIS" : `Rp ${formatRupiah(umkm.harga_mulai || umkm.harga)}${umkm.harga_sampai ? ` - Rp ${formatRupiah(umkm.harga_sampai)}` : ''}`;

                  // Menganalisis Jam Operasional dengan Cerdas
                  const listJamUrut = getSortedJamOperasional(umkm.jam_operasional);
                  const jamHariIniObj = listJamUrut.find(j => j.isHariIni);
                  const statusToko = cekStatusBuka(jamHariIniObj);

                  return (
                    <div key={umkm.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:border-yellow-400 transition-all duration-300 group">
                      <div className="h-56 relative bg-gray-200">
                        <ImageCarousel gambarArray={gambarArray} />
                        <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md z-10">
                          {umkm.kategori || "UMKM"}
                        </div>
                        {/* Indikator BUKA/TUTUP Otomatis di atas gambar */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md z-10 border ${statusToko.color}`}>
                          {statusToko.status}
                        </div>
                      </div>
                      
                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{umkm.nama_produk}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-2">Oleh: <span className="font-bold text-gray-700">{umkm.pemilik || "Warga Desa"}</span></p>
                        <p className="text-green-700 font-black text-lg mb-4">{hargaText}</p>
                        <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3 leading-relaxed">{umkm.deskripsi}</p>

                        {/* Akordeon Jam Operasional yang Cerdas dan Responsif */}
                        {listJamUrut.length > 0 && (
                          <details className="mb-6 group">
                            <summary className="text-xs font-bold text-yellow-800 cursor-pointer bg-yellow-50 hover:bg-yellow-100 px-4 py-2.5 rounded-xl border border-yellow-200 outline-none list-none flex justify-between items-center transition-colors">
                              <span className="flex items-center gap-1.5"><span className="text-lg">🕒</span> Lihat Jam Operasional</span>
                              <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-inner flex flex-col gap-1.5">
                              {listJamUrut.map((jam: any) => (
                                <div key={jam.hari} className={`flex justify-between items-center text-xs p-1.5 rounded-lg ${jam.isHariIni ? 'bg-yellow-100 border border-yellow-300' : 'border-b border-gray-200/50 last:border-0'}`}>
                                  <span className={`font-bold ${jam.isHariIni ? 'text-yellow-900' : 'text-gray-700'}`}>
                                    {jam.hari} {jam.isHariIni && <span className="text-[9px] bg-yellow-500 text-white px-1.5 py-0.5 rounded ml-1 shadow-sm">HARI INI</span>}
                                  </span>
                                  {jam.libur ? (
                                    <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">LIBUR / TUTUP</span>
                                  ) : (
                                    <span className={`font-medium ${jam.isHariIni ? 'text-green-800' : 'text-gray-600'}`}>{jam.buka} - {jam.tutup} WIB</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        {/* Tombol Aksi (WhatsApp & Maps) */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-auto">
                          <a href={`https://wa.me/${umkm.wa}?text=Halo,%20saya%20tertarik%20dengan%20informasi%20${umkm.nama_produk}%20yang%20ada%20di%20Website%20Desa.`} target="_blank" rel="noreferrer" className="flex-1 w-full sm:w-auto bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-green-600 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm shadow-sm whitespace-nowrap">
                            <span className="text-lg">💬</span> Kontak
                          </a>
                          {umkm.link_maps && (
                            <a href={umkm.link_maps} target="_blank" rel="noreferrer" className="flex-1 w-full sm:w-auto bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm shadow-sm whitespace-nowrap">
                              <span className="text-lg">📍</span> Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}