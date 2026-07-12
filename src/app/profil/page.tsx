"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ProfilDesa() {
  const [profil, setProfil] = useState({ sejarah: "", visi_misi: "" });
  const [loading, setLoading] = useState(true);

  // Data Aparatur Desa (Bisa kita buat dinamis dari database nanti, sementara kita susun rapi di sini)
  const aparaturDesa = [
    { nama: "REBO", jabatan: "Kepala Desa" },
    { nama: "SUHIRMAN", jabatan: "Sekretaris Desa" },
    { nama: "MUHROJI", jabatan: "Kaur Perencanaan" },
    { nama: "DWI MURNI", jabatan: "Kaur Keuangan" },
    { nama: "WARSITO", jabatan: "Kaur Umum" },
    { nama: "IKHSANUL KARIM", jabatan: "Kasi Pemerintahan" },
    { nama: "SUMAJI", jabatan: "Kasi Kesra" },
    { nama: "AGUS SUBAGYO", jabatan: "Kasi Pemberdayaan" },
    { nama: "SUKAJI", jabatan: "Kasun Krajan" },
    { nama: "ZAINAL ABIDIN", jabatan: "Kasun Krandon" },
  ];

  // Mengambil data Sejarah dan Visi Misi dari Firestore
  useEffect(() => {
    const ambilDataProfil = async () => {
      try {
        const docRef = doc(db, "profil_desa", "utama");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfil({ 
            sejarah: docSnap.data().sejarah || "", 
            visi_misi: docSnap.data().visi_misi || "" 
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilDataProfil();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">Mengenal Lebih Dekat</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Profil & Lembaga Desa</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Sejarah, arah perjuangan, dan susunan aparatur pelayan masyarakat Desa Kerjo.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-16">
        
        {/* BAGIAN 1: SEJARAH & VISI MISI (DINAMIS DARI DATABASE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Kotak Sejarah */}
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-extrabold text-green-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">📖</span> Sejarah Desa
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            ) : (
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-justify">
                {profil.sejarah || "Sejarah desa belum dipublikasikan oleh perangkat desa."}
              </p>
            )}
          </section>

          {/* Kotak Visi Misi */}
          <section className="bg-gradient-to-br from-green-800 to-green-900 p-8 md:p-10 rounded-3xl shadow-lg text-white transform hover:-translate-y-1 transition-transform">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-green-50">
              <span className="text-3xl">🎯</span> Visi & Misi
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-green-700 rounded w-full"></div>
                <div className="h-3 bg-green-700 rounded w-5/6"></div>
              </div>
            ) : (
              <p className="text-green-50 leading-relaxed whitespace-pre-wrap text-justify font-medium">
                {profil.visi_misi || "Visi dan Misi desa belum dipublikasikan."}
              </p>
            )}
          </section>
        </div>

        {/* BAGIAN 2: STRUKTUR PEMERINTAH DESA */}
        <section>
          <div className="text-center mb-12">
            <span className="text-green-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Struktur Organisasi</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Aparatur Pemerintah Desa</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Susunan aparatur pelayan masyarakat Desa Kerjo yang siap membantu dan melayani sepenuh hati.</p>
          </div>

          {/* Kartu Kepala Desa (Puncak Hierarki) */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border-b-4 border-yellow-400 text-center w-full max-w-sm transform transition-transform hover:scale-105">
              <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4 border-2 border-green-500 shadow-inner">
                <span className="text-4xl">👤</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">{aparaturDesa[0].nama}</h3>
              <p className="text-green-700 font-extrabold text-sm uppercase tracking-widest mt-1">{aparaturDesa[0].jabatan}</p>
            </div>
          </div>

          {/* Grid Perangkat Desa Lainnya */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {aparaturDesa.slice(1).map((aparatur, index) => (
              <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:border-green-400 hover:shadow-md transition-all group">
                <div className="w-14 h-14 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-50 transition-colors">
                  <span className="text-2xl text-gray-400 group-hover:text-green-600 transition-colors">👔</span>
                </div>
                <h4 className="font-bold text-gray-800 line-clamp-1">{aparatur.nama}</h4>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-snug">{aparatur.jabatan}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BAGIAN 3: LEMBAGA KEMASYARAKATAN (Visual Pelengkap) */}
        <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Lembaga Kemasyarakatan Desa</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4"><div className="text-4xl mb-3">🌺</div><h4 className="font-bold text-gray-800">PKK</h4></div>
            <div className="p-4"><div className="text-4xl mb-3">🛡️</div><h4 className="font-bold text-gray-800">Linmas</h4></div>
            <div className="p-4"><div className="text-4xl mb-3">🤝</div><h4 className="font-bold text-gray-800">Karang Taruna</h4></div>
            <div className="p-4"><div className="text-4xl mb-3">🏛️</div><h4 className="font-bold text-gray-800">BPD</h4></div>
          </div>
        </section>

      </div>
    </main>
  );
}