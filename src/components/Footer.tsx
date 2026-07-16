"use client";

import Link from "next/link";
// IMPORT LOGO ASLI DARI REACT ICONS
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-green-950 text-green-100 pt-16 pb-8 border-t-4 border-yellow-500">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Kolom 1: Profil Singkat */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden bg-white rounded-full p-1">
                {/* Ganti dengan link logo desa jika ada */}
                <img src="https://i.ibb.co.com/4ny8JgGm/1.png" alt="Logo Desa" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-black text-2xl text-white tracking-tighter">Desa Kerjo</h3>
            </div>
            <p className="text-sm leading-relaxed text-green-200">
              Pusat pelayanan pemerintahan dan informasi publik Desa Kerjo, Kecamatan Karangan, Kabupaten Trenggalek, Jawa Timur. Berkomitmen mewujudkan desa yang maju, transparan, dan sejahtera.
            </p>
          </div>

          {/* Kolom 2: Tautan Cepat */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 border-b border-green-800 pb-2 inline-block">Tautan Cepat</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/layanan?tab=surat" className="hover:text-yellow-400 transition-colors flex items-center gap-2"><span>→</span> Permohonan Surat</Link></li>
              <li><Link href="/layanan?tab=pengaduan" className="hover:text-yellow-400 transition-colors flex items-center gap-2"><span>→</span> Kotak Pengaduan</Link></li>
              <li><Link href="/transparansi?tab=apbdes" className="hover:text-yellow-400 transition-colors flex items-center gap-2"><span>→</span> Transparansi APBDes</Link></li>
              <li><Link href="/profil?tab=umkm" className="hover:text-yellow-400 transition-colors flex items-center gap-2"><span>→</span> Katalog UMKM Desa</Link></li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Sosial Media */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 border-b border-green-800 pb-2 inline-block">Hubungi Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-yellow-400">📍</span>
                <span>Jl. Raya Kerjo No. 1, Kec. Karangan, Kab. Trenggalek, Kodepos 66161</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-yellow-400">📧</span>
                <a href="mailto:pemdes@kerjo.desa.id" className="hover:text-white transition-colors">pemdes@kerjo.desa.id</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-yellow-400">📞</span>
                <span>(0355) 1234567</span>
              </li>
            </ul>

            {/* Ikon Sosial Media (Logo Asli & Buka Tab Baru) */}
            <div className="flex gap-4 mt-6">
              <a href="https://www.facebook.com/profile.php?id=61591678422864" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center hover:bg-yellow-500 hover:text-green-950 transition-all text-xl" title="Facebook">
                <FaFacebook />
              </a>
              <a href="https://www.instagram.com/desakerjounggul?igshid=u7rfq9zt22tj" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center hover:bg-yellow-500 hover:text-green-950 transition-all text-xl" title="Instagram">
                <FaInstagram />
              </a>
              <a href="https://www.youtube.com/channel/UCI-pW_tl0MKZDkR4whv6iSw" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center hover:bg-yellow-500 hover:text-green-950 transition-all text-xl" title="YouTube">
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-green-800 text-xs font-medium text-green-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Pemerintah Desa Kerjo. Hak Cipta Dilindungi.</p>
          <p>Dikembangkan untuk kemajuan <span className="text-white font-bold">E-Government Desa</span></p>
        </div>
      </div>
    </footer>
  );
}