// src/app/kabar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// ==========================================
// KOMPONEN SLIDER GAMBAR UNTUK ARTIKEL
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

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? gambarArray.length - 1 : currentIndex - 1);
  };
  
  const nextSlide = () => {
    setCurrentIndex(currentIndex === gambarArray.length - 1 ? 0 : currentIndex + 1);
  };

  if (gambarArray.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] md:h-[500px] lg:h-[600px] mb-10 group overflow-hidden rounded-3xl shadow-lg bg-gray-100 border border-gray-200">
      <img 
        src={gambarArray[currentIndex].startsWith("http") ? gambarArray[currentIndex] : `https://wsrv.nl/?url=${gambarArray[currentIndex]}`} 
        alt="Dokumentasi Artikel" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {gambarArray.length > 1 && (
        <>
          {/* PERBAIKAN: opacity-100 di HP, baru opacity-0 saat hover di Desktop */}
          <button 
            onClick={prevSlide} 
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-900 rounded-full p-3 md:p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold text-xl z-10 border border-gray-200"
          >
            &#10094;
          </button>
          
          <button 
            onClick={nextSlide} 
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-900 rounded-full p-3 md:p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold text-xl z-10 border border-gray-200"
          >
            &#10095;
          </button>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
            {gambarArray.map((_, idx) => (
              <span 
                key={idx} 
                className={`block w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? "bg-yellow-400 w-10" : "bg-white/60"}`}
              ></span>
            ))}
          </div>
          
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs font-bold px-4 py-1.5 rounded-lg backdrop-blur-sm shadow-md z-10 border border-white/20">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// HALAMAN UTAMA DETAIL BERITA
// ==========================================
export default function DetailBerita() {
  const router = useRouter();
  
  // PERBAIKAN BUG ENDLESS LOADING: Menggunakan useParams()
  const params = useParams(); 
  const idArtikel = params?.id as string;
  
  const [berita, setBerita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    // Cegah eksekusi jika parameter URL belum terbaca oleh browser
    if (!idArtikel) return;

    const ambilDetailBerita = async () => {
      try {
        const docRef = doc(db, "kabar_desa", idArtikel);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBerita({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorStatus(true);
        }
      } catch (error) {
        console.error("Gagal mengambil detail berita", error);
        setErrorStatus(true);
      } finally {
        setLoading(false);
      }
    };

    ambilDetailBerita();
  }, [idArtikel]); // Hook bergantung secara reaktif pada idArtikel

  // Tampilan Proses Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-6 shadow-md"></div>
        <p className="text-gray-500 font-bold text-lg animate-pulse tracking-wide">Sedang membuka artikel...</p>
      </div>
    );
  }

  // Tampilan Jika ID Salah / Dihapus
  if (errorStatus || !berita) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <span className="text-7xl mb-6 drop-shadow-md">⚠️</span>
        <h1 className="text-3xl font-black text-gray-800 mb-2">Artikel Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8 max-w-md">Mohon maaf, berita atau pengumuman yang Anda cari mungkin sudah dihapus oleh Admin atau tautannya salah.</p>
        <Link href="/kabar" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
          Kembali ke Daftar Berita
        </Link>
      </div>
    );
  }

  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header Bar Lengket untuk Tombol Kembali */}
      <div className="bg-white/80 backdrop-blur-md py-4 border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-green-700 hover:text-white font-bold hover:bg-green-600 px-5 py-2 rounded-xl transition-colors text-sm border border-green-200 hover:border-green-600 bg-white"
          >
            <span className="text-xl">←</span> Kembali
          </button>
        </div>
      </div>

      {/* Konten Artikel */}
      <article className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl animate-fade-in">
        <div className="bg-white p-8 md:p-14 rounded-[40px] shadow-sm border border-gray-100">
          
          <div className="mb-10">
            <span className="bg-green-50 text-green-800 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg mb-6 inline-block border border-green-200 shadow-sm">
              Berita & Informasi Publik
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
              {berita.is_pinned && <span className="text-yellow-500 mr-3" title="Berita Disematkan">🔒</span>}
              {berita.judul}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500 border-t border-b border-gray-100 py-4 bg-gray-50 px-6 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xl opacity-70">📅</span>
                {new Date(berita.tanggal_posting).toLocaleDateString("id-ID", { 
                  weekday: 'long', 
                  day:'numeric', 
                  month:'long', 
                  year:'numeric'
                })}
              </div>
              <div className="w-px h-6 bg-gray-300 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xl opacity-70">👤</span>
                Ditulis oleh: <span className="text-gray-900 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{berita.penulis || "Admin Desa"}</span>
              </div>
            </div>
          </div>

          <ImageCarousel gambarArray={gambarArray} />

          <div className="prose prose-lg max-w-none text-gray-800">
            <p className="leading-loose whitespace-pre-wrap text-justify text-[17px] md:text-[19px] font-medium font-serif">
              {berita.isi}
            </p>
          </div>
          
          <div className="mt-20 pt-10 border-t-2 border-dashed border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Akhir dari artikel berita.</p>
            <div className="flex gap-4 w-full md:w-auto">
              <Link 
                href="/kabar" 
                className="flex-1 md:flex-none text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-4 rounded-2xl transition-colors shadow-sm border border-gray-200"
              >
                Baca Berita Lainnya
              </Link>
            </div>
          </div>

        </div>
      </article>
    </main>
  );
}