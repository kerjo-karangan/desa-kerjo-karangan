"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  // State untuk pergeseran banner otomatis (Carousel)
  const [currentBanner, setCurrentBanner] = useState(0);

  const bannerPengumuman = [
    {
      judul: "Jadwal Pelayanan Posyandu Serentak",
      keterangan: "Dilaksanakan besok Senin di masing-masing Pos Dusun Krajan & Krandon mulai pukul 08.00 WIB.",
      bg: "bg-green-700"
    },
    {
      judul: "Transparansi Anggaran Dana Desa Perdana",
      keterangan: "Laporan APBDes tahun anggaran berjalan kini dapat diakses secara terbuka di menu Transparansi.",
      bg: "bg-emerald-800"
    }
  ];

  // Efek geser banner otomatis setiap 4 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev === bannerPengumuman.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerPengumuman.length]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* 1. CAROUSEL PENGUMUMAN TERKINI */}
      <div className="w-full text-white overflow-hidden relative shadow-inner">
        {bannerPengumuman.map((banner, index) => (
          <div
            key={index}
            className={`w-full p-6 md:p-12 text-center transition-all duration-700 ease-in-out ${banner.bg} ${
              index === currentBanner ? "block animate-fade-in" : "hidden"
            }`}
          >
            <span className="inline-block bg-yellow-400 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm">
              📢 Pengumuman Terkini
            </span>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight mb-2 max-w-3xl mx-auto">
              {banner.judul}
            </h2>
            <p className="text-sm md:text-base text-green-50 max-w-2xl mx-auto font-light">
              {banner.keterangan}
            </p>
          </div>
        ))}
      </div>

      {/* 2. HERO SECTION / SELAMAT DATANG */}
      <div className="container mx-auto px-4 py-12 md:py-16 text-center max-w-4xl flex-grow">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Selamat Datang di Portal Resmi <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-600">
            Desa Kerjo
          </span>
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Pusat pelayanan digital mandiri, pusat informasi pembangunan publik, serta wadah keterbukaan informasi bagi seluruh masyarakat.
        </p>

        {/* 3. WIDGET COUNTER RINGKASAN DESA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
            <span className="text-3xl mb-1">👥</span>
            <p className="text-2xl font-black text-green-800">1.840+</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Penduduk</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
            <span className="text-3xl mb-1">🏡</span>
            <p className="text-2xl font-black text-green-800">540+</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kepala Keluarga</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
            <span className="text-3xl mb-1">🗺️</span>
            <p className="text-2xl font-black text-green-800">2</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dusun Wilayah</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
            <span className="text-3xl mb-1">📍</span>
            <p className="text-2xl font-black text-green-800">23</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rukun Tetangga (RT)</p>
          </div>
        </div>

        {/* 4. AREA PETA LOKASI WILAYAH DESA INTERAKTIF */}
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-md border border-gray-100 max-w-3xl mx-auto text-left">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            📍 Peta Batas Wilayah Interaktif
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Lokasi pusat administrasi Kantor Desa Kerjo, Kecamatan Karangan, Trenggalek.
          </p>
          
          {/* Pembungkus Peta Google Maps Responsive */}
          <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-inner border border-gray-150 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3950.396513428833!2d111.66158007476895!3d-8.060974991966665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zOMKwMDMnMzkuNSJTIDExMcKwMzknNTEuMCJF!5e0!3m2!1sid!2sid!4v1783875233794!5m2!1sid!2sid"
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

      </div>

      {/* TOMBOL QUICK ACCESS WHATSAPP (MELAYANG DI POJOK JEMPOL) */}
      <a
        href="https://wa.me/6281234567890" // Ganti dengan nomor pelayanan desa asli kelak
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-2xl transition-transform duration-300 hover:scale-110 hover:bg-green-700 z-50 flex items-center justify-center group"
      >
        <span className="text-2xl">💬</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-sm font-bold transition-all duration-350 ease-in-out whitespace-nowrap">
          Hubungi Desa
        </span>
      </a>

      {/* FOOTER SEDERHANA */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-medium">
        © {new Date().getFullYear()} Pemerintah Desa Kerjo. Hak Cipta Dilindungi Undang-Undang.
      </footer>
    </main>
  );
}