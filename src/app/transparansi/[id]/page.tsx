// src/app/transparansi/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function DetailTransparansi() {
  const router = useRouter();
  const params = useParams(); 
  const idDokumen = params?.id as string;
  
  const [dokumen, setDokumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    if (!idDokumen) return;

    const ambilDetailDokumen = async () => {
      try {
        const docRef = doc(db, "transparansi_desa", idDokumen);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDokumen({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorStatus(true);
        }
      } catch (error) {
        console.error("Gagal mengambil detail dokumen", error);
        setErrorStatus(true);
      } finally {
        setLoading(false);
      }
    };

    ambilDetailDokumen();
  }, [idDokumen]);

  // Tampilan Proses Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-6 shadow-md"></div>
        <p className="text-gray-500 font-bold text-lg animate-pulse tracking-wide">Membuka arsip dokumen...</p>
      </div>
    );
  }

  // Tampilan Jika ID Salah / Dihapus
  if (errorStatus || !dokumen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <span className="text-7xl mb-6 drop-shadow-md">⚠️</span>
        <h1 className="text-3xl font-black text-gray-800 mb-2">Dokumen Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8 max-w-md">Mohon maaf, dokumen transparansi yang Anda cari mungkin sudah dihapus oleh Admin atau tautannya salah.</p>
        <Link href="/transparansi" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
          Kembali ke Daftar Transparansi
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header Bar Lengket untuk Tombol Kembali */}
      <div className="bg-white/80 backdrop-blur-md py-4 border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-blue-700 hover:text-white font-bold hover:bg-blue-600 px-5 py-2 rounded-xl transition-colors text-sm border border-blue-200 hover:border-blue-600 bg-white"
          >
            <span className="text-xl">←</span> Kembali
          </button>
        </div>
      </div>

      {/* Konten Detail Dokumen */}
      <article className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl animate-fade-in">
        <div className="bg-white p-8 md:p-14 rounded-[40px] shadow-sm border border-gray-100 border-t-8 border-t-blue-600">
          
          <div className="mb-10 text-center">
            <span className="bg-blue-50 text-blue-800 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg mb-6 inline-block border border-blue-200 shadow-sm">
              Dokumen: {dokumen.kategori}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-gray-900 leading-tight mb-8">
              {dokumen.judul}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-gray-500 border-t border-b border-gray-100 py-4 bg-gray-50 px-6 rounded-2xl max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <span className="text-xl opacity-70">📅</span>
                {new Date(dokumen.tanggal_posting).toLocaleDateString("id-ID", { 
                  weekday: 'long', 
                  day:'numeric', 
                  month:'long', 
                  year:'numeric'
                })}
              </div>
              <div className="w-px h-6 bg-gray-300 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xl opacity-70">👤</span>
                Oleh: <span className="text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{dokumen.penulis || "Admin Desa"}</span>
              </div>
            </div>
          </div>

          {/* Gambar Sampul Dokumen Besar */}
          {dokumen.gambar ? (
            <div className="w-full mb-10 overflow-hidden rounded-3xl shadow-lg bg-gray-100 border border-gray-200 flex justify-center p-4">
              <img 
                src={dokumen.gambar.startsWith("http") ? dokumen.gambar : `https://wsrv.nl/?url=${dokumen.gambar}`} 
                alt="Sampul Dokumen APBDes / Perdes" 
                className="max-w-full max-h-[800px] object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="w-full h-64 mb-10 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-5xl text-gray-300">📄 File Dokumen</span>
            </div>
          )}

          {/* Teks Deskripsi */}
          <div className="prose prose-lg max-w-none text-gray-800 mb-12">
            <p className="leading-loose whitespace-pre-wrap text-justify text-[16px] md:text-[18px] font-medium font-sans">
              {dokumen.deskripsi || "Admin tidak menyertakan deskripsi teks untuk dokumen ini. Silakan klik tombol unduh/buka di bawah untuk melihat rincian arsip yang asli."}
            </p>
          </div>
          
          {/* Action Box (Tombol Download) */}
          <div className="mt-10 p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
            <div className="text-center md:text-left">
              <h4 className="font-black text-blue-900 text-xl mb-1">Akses Dokumen Resmi</h4>
              <p className="text-sm font-medium text-blue-700">Unduh atau buka file asli (PDF/Drive) untuk melihat rincian resolusi tinggi.</p>
            </div>
            <a 
              href={dokumen.link_dokumen} 
              target="_blank" 
              rel="noreferrer"
              className="w-full md:w-auto text-center bg-green-600 hover:bg-green-700 text-white font-black px-10 py-4 rounded-2xl transition-transform transform hover:-translate-y-1 shadow-lg text-lg flex items-center justify-center gap-3"
            >
              <span className="text-2xl">⬇️</span> Download Arsip
            </a>
          </div>

        </div>
      </article>
    </main>
  );
}