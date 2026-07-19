// src/components/dashboard/Welcome.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function Welcome() {
  const [totalPenduduk, setTotalPenduduk] = useState(0);
  const [totalSurat, setTotalSurat] = useState(0);
  const [totalKabar, setTotalKabar] = useState(0);
  const [totalPengaduan, setTotalPengaduan] = useState(0);

  useEffect(() => {
    const ambilStatistik = async () => {
      const snapPenduduk = await getDocs(collection(db, "kependudukan"));
      setTotalPenduduk(snapPenduduk.size);
      
      const snapSurat = await getDocs(collection(db, "layanan_surat"));
      setTotalSurat(snapSurat.size);
      
      const snapKabar = await getDocs(collection(db, "kabar_desa"));
      setTotalKabar(snapKabar.size);
      
      const snapPengaduan = await getDocs(collection(db, "pengaduan_warga"));
      setTotalPengaduan(snapPengaduan.size);
    };
    ambilStatistik();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 bg-gradient-to-r from-white to-green-50">
        <h3 className="text-3xl font-extrabold text-green-900 mb-2">Selamat Datang, Admin!</h3>
        <p className="text-gray-600 font-medium">
          Sistem Informasi Desa Kerjo berjalan normal. Berikut adalah ringkasan data saat ini:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-purple-500 flex flex-col justify-center items-center">
          <span className="text-4xl mb-3">👥</span>
          <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Total Data Penduduk</h4>
          <p className="text-4xl font-black text-gray-900 mt-2">{totalPenduduk}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-yellow-500 flex flex-col justify-center items-center">
          <span className="text-4xl mb-3">✉️</span>
          <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Permohonan Surat</h4>
          <p className="text-4xl font-black text-gray-900 mt-2">{totalSurat}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-green-500 flex flex-col justify-center items-center">
          <span className="text-4xl mb-3">📰</span>
          <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Berita Dipublikasi</h4>
          <p className="text-4xl font-black text-gray-900 mt-2">{totalKabar}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-blue-500 flex flex-col justify-center items-center">
          <span className="text-4xl mb-3">📢</span>
          <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Pengaduan Masuk</h4>
          <p className="text-4xl font-black text-gray-900 mt-2">{totalPengaduan}</p>
        </div>
      </div>
    </div>
  );
}