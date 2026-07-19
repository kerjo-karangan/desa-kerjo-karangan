// src/app/kabar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Komponen Slider Gambar (Di-reuse dari halaman daftar berita)
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

  if (gambarArray.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[600px] mb-8 group overflow-hidden rounded-3xl shadow-md bg-gray-100 border border-gray-200">
      <img 
        src={`https://wsrv.nl/?url=${gambarArray[currentIndex]}`} 
        alt="Dokumentasi Kabar Desa" 
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      {gambarArray.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold text-xl">
            &#10094;
          </button>
          <button onClick={nextSlide} className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-70 text-gray-900 rounded-full p-3 md:p-4 opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-100 hover:scale-110 shadow-lg font-bold text-xl">
            &#10095;
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {gambarArray.map((_, idx) => (
              <span key={idx} className={`block w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-yellow-400 w-8" : "bg-white/60"}`}></span>
            ))}
          </div>
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs font-bold px-4 py-1.5 rounded-lg backdrop-blur-sm shadow-md">
            {currentIndex + 1} / {gambarArray.length}
          </div>
        </>
      )}
    </div>
  );
};

export default function DetailBerita({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [berita, setBerita] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilDetailBerita = async () => {
      try {
        const docRef = doc(db, "kabar_desa", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBerita({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Jika ID salah, kembali ke halaman daftar berita
          router.push("/kabar");
        }
      } catch (error) {
        console.error("Gagal mengambil detail berita", error);
      } finally {
        setLoading(false);
      }
    };
    ambilDetailBerita();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold animate-pulse">Menyiapkan artikel...</p>
      </div>
    );
  }

  if (!berita) return null;

  const gambarArray = Array.isArray(berita.gambar) ? berita.gambar : berita.gambar ? [berita.gambar] : [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Bar untuk Kembali */}
      <div className="bg-green-900 py-6 sticky top-20 z-40 shadow-md">
        <div className="container mx-auto px-4 max-w-4xl flex items-center">
          <Link href="/kabar" className="flex items-center gap-2 text-green-100 hover:text-white font-bold bg-green-800 hover:bg-green-700 px-4 py-2 rounded-xl transition-colors text-sm">
            <span className="text-xl">←</span> Kembali ke Daftar Kabar
          </Link>
        </div>
      </div>

      <article className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100">
          
          <div className="mb-8">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4 inline-block border border-yellow-200">
              Kabar Desa
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
              {berita.judul}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                {new Date(berita.tanggal_posting).toLocaleDateString("id-ID", { weekday: 'long', day:'numeric', month:'long', year:'numeric'})}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                Ditulis oleh: <span className="text-gray-800 font-bold">{berita.penulis || "Admin Desa"}</span>
              </div>
            </div>
          </div>

          <ImageCarousel gambarArray={gambarArray} />

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="leading-loose whitespace-pre-wrap text-justify text-[17px]">
              {berita.isi}
            </p>
          </div>
          
          <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <p className="text-sm font-bold text-gray-400">Akhir dari artikel.</p>
            <Link href="/kabar" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition-colors">
              Baca Berita Lainnya
            </Link>
          </div>

        </div>
      </article>
    </main>
  );
}