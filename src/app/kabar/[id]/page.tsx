// src/app/kabar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ==========================================
// KOMPONEN SLIDER GAMBAR (CLOUDINARY FIX)
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

  if (!gambarArray || gambarArray.length === 0) return null;

  const currentImage = gambarArray[currentIndex];
  const safeImageUrl = currentImage.startsWith("http") ? currentImage : `https://wsrv.nl/?url=${currentImage}`;

  return (
    <div className="relative w-full h-[300px] md:h-[450px] lg:h-[550px] mb-10 group overflow-hidden rounded-3xl shadow-sm bg-gray-100 border border-gray-200">
      <img 
        src={safeImageUrl} 
        alt={`Dokumentasi ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/800x450/e2e8f0/6b7280?text=Gambar+Tidak+Tersedia";
        }}
      />
      {gambarArray.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-green-600 hover:text-white shadow-xl font-bold border border-gray-200 z-10"
          >
            &#10094;
          </button>
          
          <button 
            onClick={nextSlide} 
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-green-600 hover:text-white shadow-xl font-bold border border-gray-200 z-10"
          >
            &#10095;
          </button>
          
          <div className="absolute bottom-5 left-0 right-0 flex justify-center space-x-2 z-10">
            {gambarArray.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentIndex(idx)}
                className={`block h-2.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? "bg-white w-8" : "bg-white/50 w-2.5 hover:bg-white/80"}`}
              ></button>
            ))}
          </div>
          
          <div className="absolute top-5 right-5 bg-black/70 text-white text-xs font-black tracking-widest px-4 py-2 rounded-full backdrop-blur-md z-10 shadow-sm border border-white/20">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// KONTEN UTAMA DETAIL BERITA
// ==========================================
export default function BeritaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [berita, setBerita] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeritaDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const docRef = doc(db, "kabar_desa", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBerita({ id: docSnap.id, ...docSnap.data() });
        } else {
          setBerita(null);
        }
      } catch (error) {
        console.error("Gagal mengambil detail berita:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBeritaDetail();
  }, [id]);

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + " WIB";
  };

  // LAYAR LOADING ANTI-FLICKER
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-green-700 font-bold tracking-widest animate-pulse">MEMUAT ARTIKEL...</p>
        </div>
      </div>
    );
  }

  // TAMPILAN JIKA BERITA TIDAK DITEMUKAN / DIHAPUS
  if (!berita) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <span className="text-7xl mb-4 opacity-50">📭</span>
        <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">Berita Tidak Ditemukan</h1>
        <p className="text-gray-500 font-medium mb-8 text-center">Artikel yang Anda cari mungkin telah dihapus atau URL tidak valid.</p>
        <button 
          onClick={() => router.push('/kabar')} 
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-all"
        >
          ← Kembali ke Kabar Desa
        </button>
      </div>
    );
  }

  // FORMAT ARRAY GAMBAR
  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-in">
        
        {/* TOMBOL KEMBALI */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/kabar')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-green-200"
          >
            <span>←</span> Kembali ke Indeks Berita
          </button>
        </div>

        {/* BUNGKUSAN ARTIKEL */}
        <article className="bg-white p-6 md:p-10 lg:p-14 rounded-[40px] shadow-sm border border-gray-100">
          
          {/* HEADER ARTIKEL */}
          <header className="mb-10 text-center md:text-left">
            {berita.is_pinned && (
              <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest mb-4 border border-yellow-200">
                📌 Info Penting
              </span>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              {berita.judul}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6 border-y border-gray-100 py-4">
              <span className="bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                📅 {formatTanggal(berita.tanggal_posting)}
              </span>
              <span className="text-gray-500 text-sm font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                👤 Ditulis oleh: <span className="font-bold text-gray-700">{berita.penulis || "Admin Desa"}</span>
              </span>
            </div>
          </header>

          {/* SLIDER GAMBAR */}
          <ImageCarousel gambarArray={gambarArray} />

          {/* ISI ARTIKEL */}
          <div className="prose max-w-none prose-lg md:prose-xl prose-green text-gray-700 leading-loose text-justify whitespace-pre-wrap">
            {berita.isi}
          </div>

          {/* FOOTER ARTIKEL (SHARE BUTTONS) */}
          <footer className="mt-14 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-gray-500 font-bold text-sm">Bagikan artikel ini:</span>
            <div className="flex gap-3">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(berita.judul + " - Baca selengkapnya di Website Desa Kerjo")}`} 
                target="_blank" 
                rel="noreferrer"
                className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <span>💬</span> WhatsApp
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link artikel berhasil disalin!");
                }}
                className="bg-gray-50 hover:bg-gray-800 text-gray-600 hover:text-white border border-gray-200 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <span>🔗</span> Salin Link
              </button>
            </div>
          </footer>

        </article>

      </div>
    </main>
  );
}