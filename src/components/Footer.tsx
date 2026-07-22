// src/components/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Footer() {
  const [kontak, setKontak] = useState({
    alamat: "Jl. Raya Kerjo No. 1, Kecamatan Karangan, Kabupaten Trenggalek",
    email: "pemdes@kerjo.desa.id",
    wa: "",
    ig: "",
    fb: "",
    yt: "",
    tiktok: "",
    jamKerja: "Senin - Jumat (08:00 - 15:00 WIB)"
  });

  useEffect(() => {
    const ambilDataKontak = async () => {
      try {
        const snap = await getDoc(doc(db, "pengaturan_web", "kontak"));
        if (snap.exists() && snap.data()) {
          const d = snap.data();
          setKontak({
            alamat: d.alamat || "Jl. Raya Kerjo No. 1, Karangan, Trenggalek",
            email: d.email || "pemdes@kerjo.desa.id",
            wa: d.wa || "",
            ig: d.ig || "",
            fb: d.fb || "",
            yt: d.yt || "",
            tiktok: d.tiktok || "",
            jamKerja: d.jam_kerja || "Senin - Jumat (08:00 - 15:00 WIB)"
          });
        }
      } catch (error) {
        console.error("Gagal memuat kontak footer:", error);
      }
    };
    
    ambilDataKontak();
  }, []);

  const formatWA = (no: string) => {
    if (!no) return "";
    let formatted = no.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.substring(1);
    return formatted;
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-green-950 text-green-50 pt-16 pb-8 relative z-20 border-t-4 border-green-600">
      <div className="container mx-auto px-4 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-12">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-20 h-20 bg-white rounded-full p-2 mb-4 shadow-lg">
              <img 
                src="https://i.ibb.co.com/4ny8JgGm/1.png" 
                alt="Logo Desa" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Desa Kerjo</h3>
            <p className="text-green-200/80 text-sm leading-relaxed mb-4">
              Mewujudkan pelayanan masyarakat yang transparan, inovatif, dan terdigitalisasi untuk kemajuan bersama.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Akses Cepat
            </h4>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/" 
                  className="text-green-200/80 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>→</span> Beranda Utama
                </Link>
              </li>
              <li>
                <Link 
                  href="/profil" 
                  className="text-green-200/80 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>→</span> Profil & Lembaga
                </Link>
              </li>
              <li>
                <Link 
                  href="/datadesa" 
                  className="text-green-200/80 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>→</span> Visualisasi Data Desa
                </Link>
              </li>
              <li>
                <Link 
                  href="/kabar" 
                  className="text-green-200/80 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>→</span> Kabar & Agenda Terkini
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Kontak Kami
            </h4>
            <ul className="space-y-5 text-sm text-green-200/80">
              <li className="flex items-start gap-3">
                <span className="text-lg mt-0.5 text-green-500">📍</span>
                <span className="leading-relaxed">{kontak.alamat}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg text-green-500">✉️</span>
                <span>{kontak.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg mt-0.5 text-green-500">🕒</span>
                <div>
                  <strong className="block text-white font-medium mb-1">Jam Pelayanan:</strong>
                  {kontak.jamKerja}
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Sosial Media Resmi
            </h4>
            <p className="text-sm text-green-200/80 mb-6">
              Ikuti media sosial resmi kami untuk mendapatkan pembaruan informasi terkini.
            </p>
            <div className="flex items-center gap-4">
              
              {kontak.ig && (
                <a 
                  href={kontak.ig} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform group"
                  title="Instagram"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2">
                        <stop offset="0%" stopColor="#fd5949"/>
                        <stop offset="50%" stopColor="#d6249f"/>
                        <stop offset="100%" stopColor="#285AEB"/>
                      </linearGradient>
                    </defs>
                    <path d="M7.75 2C4.57 2 2 4.57 2 7.75V16.25C2 19.43 4.57 22 7.75 22H16.25C19.43 22 22 19.43 22 16.25V7.75C22 4.57 19.43 2 16.25 2H7.75ZM16.25 20H7.75C5.68 20 4 18.32 4 16.25V7.75C4 5.68 5.68 4 7.75 4H16.25C18.32 4 20 5.68 20 7.75V16.25C20 18.32 18.32 20 16.25 20Z" fill="url(#ig-gradient)"/>
                    <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15C10.35 15 9 13.65 9 12C9 10.35 10.35 9 12 9C13.65 9 15 10.35 15 12C15 13.65 13.65 15 12 15Z" fill="url(#ig-gradient)"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)"/>
                  </svg>
                </a>
              )}
              
              {kontak.fb && (
                <a 
                  href={kontak.fb} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform group"
                  title="Facebook"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073C24 5.394 18.627 0 12 0C5.373 0 0 5.394 0 12.073C0 18.118 4.814 23.11 10.125 24V15.56H7.078V12.073H10.125V9.412C10.125 6.398 11.916 4.73 14.657 4.73C15.969 4.73 17.343 4.965 17.343 4.965V7.942H15.83C14.339 7.942 13.875 8.875 13.875 9.831V12.073H17.203L16.669 15.56H13.875V24C19.186 23.11 24 18.118 24 12.073Z"/>
                  </svg>
                </a>
              )}
              
              {kontak.yt && (
                <a 
                  href={kontak.yt} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform group"
                  title="YouTube"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.582 6.471C21.353 5.563 20.612 4.823 19.704 4.594C17.962 4.125 12 4.125 12 4.125C12 4.125 6.038 4.125 4.296 4.594C3.388 4.823 2.647 5.563 2.418 6.471C1.949 8.213 1.949 12 1.949 12C1.949 12 1.949 15.787 2.418 17.529C2.647 18.437 3.388 19.177 4.296 19.406C6.038 19.875 12 19.875 12 19.875C12 19.875 17.962 19.875 19.704 19.406C20.612 19.177 21.353 18.437 21.582 17.529C22.051 15.787 22.051 12 22.051 12C22.051 12 22.051 8.213 21.582 6.471ZM10 15.5V8.5L16 12L10 15.5Z"/>
                  </svg>
                </a>
              )}
              
              {kontak.tiktok && (
                <a 
                  href={kontak.tiktok} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform group"
                  title="TikTok"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.63-1.07 5.16-2.93 7.03-1.57 1.58-3.77 2.61-5.99 2.8-2.6.22-5.32-.3-7.51-1.8-2.18-1.5-3.66-3.88-4.08-6.5-.4-2.48.06-5.11 1.4-7.25 1.58-2.52 4.41-4.08 7.35-4.32v4.06c-1.41.09-2.82.72-3.86 1.73-1.11 1.08-1.8 2.62-1.9 4.18-.08 1.34.25 2.72 1.01 3.8.72.99 1.84 1.66 3.07 1.87 1.25.19 2.62.06 3.73-.59 1.1-.64 1.87-1.72 2.18-2.97.16-.62.21-1.28.2-1.92-.05-3.32-.01-6.64-.03-9.97.02-3.13-.01-6.26.03-9.39z"/>
                  </svg>
                </a>
              )}
              
            </div>
          </div>

        </div>

        <div className="border-t border-green-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-green-400 gap-4">
          <p>
            &copy; {currentYear} Desa Kerjo, Karangan, Trenggalek. Hak Cipta Dilindungi.
          </p>
          <div className="flex gap-4">
            <span className="cursor-default">Portal E-Government V.2</span>
          </div>
        </div>

      </div>

      {kontak.wa && (
        <a 
          href={`https://wa.me/${formatWA(kontak.wa)}?text=Halo%20Admin%20Desa%20Kerjo,%20saya%20ingin%20bertanya...`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-[60] bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(34,197,94,0.5)] transition-transform hover:-translate-y-2 group"
          title="Hubungi Admin (WhatsApp)"
        >
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.01 2.015A9.974 9.974 0 002.04 11.988c0 1.96.514 3.877 1.488 5.564L2.015 22l4.587-1.503a9.92 9.92 0 005.408 1.583h.004c5.511 0 9.996-4.485 9.996-9.997A9.957 9.957 0 0012.01 2.015zm0 18.064c-1.658 0-3.275-.446-4.697-1.288l-.337-.2-3.486 1.14.929-3.396-.219-.348a8.312 8.312 0 01-1.272-4.453c0-4.606 3.75-8.354 8.36-8.354A8.32 8.32 0 0120.37 11.99c0 4.605-3.748 8.353-8.356 8.353zm4.588-6.257c-.251-.126-1.487-.734-1.718-.818-.231-.084-.4-.126-.569.126-.168.251-.645.818-.792.986-.146.167-.293.188-.544.062-.251-.125-1.062-.39-2.023-1.196-.748-.627-1.253-1.404-1.399-1.655-.147-.251-.016-.388.11-.513.113-.113.251-.293.377-.44.126-.146.168-.25.252-.418.084-.168.042-.314-.021-.44-.063-.125-.569-1.371-.778-1.878-.204-.493-.41-.426-.569-.434-.146-.006-.314-.008-.482-.008a.925.925 0 00-.671.314c-.23.25-1.068 1.047-1.068 2.553s1.093 2.96 1.24 3.17c.147.208 2.164 3.298 5.244 4.56.732.3 1.303.48 1.748.614.736.232 1.406.199 1.933.12.589-.088 1.815-.743 2.066-1.46.252-.718.252-1.33.177-1.461-.073-.131-.282-.209-.533-.335z"></path>
          </svg>
        </a>
      )}

    </footer>
  );
}