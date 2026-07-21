// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // STATE UNTUK MENYIMPAN DATA KONTAK DINAMIS
  const [kontak, setKontak] = useState({
    alamat: "Jl. Raya Kerjo No. 1, Desa Kerjo, Kec. Karangan, Kab. Trenggalek, Jawa Timur 66161",
    email: "pemdes@kerjo.desa.id",
    jamKerja: "Senin - Jumat (08:00 - 15:00 WIB)",
    wa: "6281234567890",
    ig: "",
    fb: "",
    yt: "",
    tiktok: ""
  });

  useEffect(() => {
    const ambilDataKontak = async () => {
      try {
        const snap = await getDoc(doc(db, "pengaturan_web", "kontak"));
        if (snap.exists()) {
          const data = snap.data();
          setKontak({
            alamat: data.alamat || kontak.alamat,
            email: data.email || kontak.email,
            jamKerja: data.jam_kerja || kontak.jamKerja,
            wa: data.wa || kontak.wa,
            ig: data.ig || "",
            fb: data.fb || "",
            yt: data.yt || "",
            tiktok: data.tiktok || ""
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data kontak footer:", error);
      }
    };
    ambilDataKontak();
  }, []);

  // Format nomor WA untuk memastikan dimulai dengan 62
  const formatWA = (no: string) => {
    if (!no) return "";
    let formatted = no.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.substring(1);
    return formatted;
  };

  return (
    <>
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16 border-t-4 border-green-600 font-sans relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            
            {/* Kolom 1: Info Desa & Sosial Media */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full p-1 flex-shrink-0">
                  <img 
                    src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                    alt="Logo Desa" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white leading-none">Desa Kerjo</h3>
                  <p className="text-xs text-green-400 font-bold tracking-widest uppercase mt-1">Kab. Trenggalek</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-400 text-justify">
                Pusat pelayanan pemerintahan dan informasi publik Desa Kerjo, Kecamatan Karangan, Kabupaten Trenggalek, Jawa Timur. Berkomitmen mewujudkan desa yang maju, transparan, dan sejahtera.
              </p>
              
              {/* IKON MEDIA SOSIAL DINAMIS */}
              <div className="flex gap-3 pt-2">
                {kontak.ig && (
                  <a href={kontak.ig} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg" title="Instagram">
                    📸
                  </a>
                )}
                {kontak.fb && (
                  <a href={kontak.fb} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg" title="Facebook">
                    🌐
                  </a>
                )}
                {kontak.yt && (
                  <a href={kontak.yt} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg" title="YouTube">
                    ▶️
                  </a>
                )}
                {kontak.tiktok && (
                  <a href={kontak.tiktok} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-black border border-gray-700 hover:border-white text-white rounded-full flex items-center justify-center transition-colors shadow-lg" title="TikTok">
                    🎵
                  </a>
                )}
              </div>
            </div>

            {/* Kolom 2: Tautan Cepat */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full block"></span> 
                Akses Cepat
              </h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2"><span>→</span> Beranda Utama</Link></li>
                <li><Link href="/profil" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2"><span>→</span> Profil & Sejarah Desa</Link></li>
                <li><Link href="/profil?tab=umkm" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2"><span>→</span> Katalog Potensi & UMKM</Link></li>
                <li><Link href="/kabar" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2"><span>→</span> Kabar Berita & Agenda</Link></li>
                <li><Link href="/layanan" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2"><span>→</span> Layanan Surat Mandiri</Link></li>
              </ul>
            </div>

            {/* Kolom 3: Transparansi Publik */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full block"></span> 
                Transparansi Publik
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/transparansi?tab=apbdes" className="group flex flex-col">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-blue-400 transition-colors flex items-center gap-2"><span>📊</span> Data APBDes</span>
                    <span className="text-xs text-gray-500 pl-6 mt-1">Infografis & Anggaran Desa</span>
                  </Link>
                </li>
                <li>
                  <Link href="/transparansi?tab=regulasi" className="group flex flex-col">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-blue-400 transition-colors flex items-center gap-2"><span>⚖️</span> Regulasi & Perdes</span>
                    <span className="text-xs text-gray-500 pl-6 mt-1">Peraturan & Keputusan Kades</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 4: Kontak Dinamis */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full block"></span> 
                Kontak Kami
              </h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">📍</span>
                  <p className="leading-relaxed">{kontak.alamat}</p>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-lg">📧</span>
                  <p>{kontak.email}</p>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-lg">🕒</span>
                  <p>{kontak.jamKerja}</p>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
                  <p>+{formatWA(kontak.wa)}</p>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-medium text-center md:text-left">
              &copy; {currentYear} Pemerintah Desa Kerjo. Hak Cipta Dilindungi.
            </p>
            <div className="flex gap-4">
              <Link href="/login" className="text-xs font-bold text-gray-600 hover:text-white transition-colors bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                🛡️ Portal Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================
          TOMBOL WHATSAPP MELAYANG (FLOATING WA)
      ========================================== */}
      {kontak.wa && (
        <a 
          href={`https://wa.me/${formatWA(kontak.wa)}?text=Halo%20Admin%20Desa%20Kerjo,%20saya%20warga%20yang%20ingin%20bertanya%20seputar%20informasi%20di%20Website.`}
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-110 animate-bounce-slow border-2 border-white"
          title="Hubungi Admin via WhatsApp"
        >
          <span className="text-3xl md:text-4xl">💬</span>
          {/* Animasi Gelombang (Ping) di Balik Tombol */}
          <span className="absolute w-full h-full rounded-full bg-green-400 opacity-50 animate-ping -z-10"></span>
        </a>
      )}
    </>
  );
}