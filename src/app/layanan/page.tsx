"use client";

import { useState } from "react";

export default function LayananMandiri() {
  // State untuk mengatur Tab mana yang sedang aktif
  const [tabAktif, setTabAktif] = useState("surat");

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-green-800 text-white py-16 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="bg-green-600 text-green-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">E-Government Desa</span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Layanan Mandiri Warga</h1>
          <p className="text-base md:text-lg text-green-100 font-light leading-relaxed">
            Pusat pelayanan administrasi digital terpadu Desa Kerjo. Urus surat, lacak status, dan sampaikan aspirasi Anda tanpa harus antre di Balai Desa.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl flex-grow">
        
        {/* MENU TABS NAVIGASI */}
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-8">
          <button 
            onClick={() => setTabAktif("surat")}
            className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "surat" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}
          >
            <span className="text-xl">📄</span> Permohonan Surat
          </button>
          
          <button 
            onClick={() => setTabAktif("status")}
            className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "status" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}
          >
            <span className="text-xl">🔍</span> Lacak Pengajuan
          </button>
          
          <button 
            onClick={() => setTabAktif("pengaduan")}
            className={`w-full md:w-auto px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "pengaduan" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}
          >
            <span className="text-xl">📢</span> Kotak Pengaduan
          </button>
        </div>

        {/* KONTEN TAB 1: PERMOHONAN SURAT */}
        {tabAktif === "surat" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Formulir Pengajuan Surat Baru</h2>
              <p className="text-gray-500 text-sm">Silakan isi data diri dan pilih jenis surat yang Anda butuhkan secara teliti.</p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Induk Kependudukan (NIK)</label>
                  <input type="number" required placeholder="Contoh: 3503xxxxxxxxxxxx" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Sesuai KTP</label>
                  <input type="text" required placeholder="Masukkan nama lengkap" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Surat yang Diajukan</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white cursor-pointer font-medium text-gray-700">
                  <option value="">-- Pilih Jenis Surat --</option>
                  <option value="SKU">Surat Keterangan Usaha (SKU)</option>
                  <option value="SKCK">Surat Pengantar Kelakuan Baik</option>
                  <option value="SKTM">Surat Keterangan Tidak Mampu (SKTM)</option>
                  <option value="BEDA_NAMA">Surat Keterangan Beda Identitas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tujuan / Keperluan Pembuatan Surat</label>
                <textarea required rows={4} placeholder="Jelaskan untuk keperluan apa surat ini dibuat (contoh: Syarat pengajuan KUR BRI)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white leading-relaxed"></textarea>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                  Dengan menekan tombol kirim, Anda menyatakan bahwa data yang diisi adalah benar dan dapat dipertanggungjawabkan sesuai perundang-undangan.
                </p>
              </div>

              <button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-all hover:-translate-y-1 text-lg">
                Kirim Pengajuan Surat
              </button>
            </form>
          </div>
        )}

        {/* KONTEN TAB 2: LACAK PENGAJUAN */}
        {tabAktif === "status" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
             <div className="mb-8 text-center max-w-xl mx-auto">
              <span className="text-5xl block mb-4">🔍</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lacak Status Surat</h2>
              <p className="text-gray-500 text-sm">Masukkan NIK atau Kode Resi pengajuan Anda untuk melihat sampai tahap mana surat Anda sedang diproses oleh perangkat desa.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10 max-w-2xl mx-auto">
              <input type="text" placeholder="Masukkan NIK / Kode Resi Pengajuan..." className="flex-1 px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white font-medium text-center md:text-left" />
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-all">Lacak Berkas</button>
            </div>

            {/* Ilustrasi Timeline Kosong / Hasil Pencarian */}
            <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-gray-50">
              <p className="text-gray-400 font-medium">Silakan lakukan pencarian di atas untuk memunculkan linimasa proses berkas Anda.</p>
              <div className="mt-6 flex justify-between w-full max-w-md opacity-30 grayscale">
                <div className="flex flex-col items-center"><div className="w-8 h-8 bg-green-500 rounded-full mb-2"></div><span className="text-xs font-bold">Diajukan</span></div>
                <div className="flex-1 border-t-2 border-green-500 mt-4 mx-2"></div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div><span className="text-xs font-bold">Verifikasi</span></div>
                <div className="flex-1 border-t-2 border-gray-300 mt-4 mx-2"></div>
                <div className="flex flex-col items-center"><div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div><span className="text-xs font-bold">Ditandatangani</span></div>
              </div>
            </div>
          </div>
        )}

        {/* KONTEN TAB 3: KOTAK PENGADUAN */}
        {tabAktif === "pengaduan" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Sampaikan Aspirasi & Pengaduan</h2>
              <p className="text-gray-500 text-sm">Laporkan masalah infrastruktur rusak, keluhan pelayanan, atau usulan pembangunan langsung kepada Kepala Desa.</p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul Laporan / Pengaduan</label>
                <input type="text" placeholder="Contoh: Saluran Irigasi Dusun Krajan Tersumbat" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Detail</label>
                <textarea rows={5} placeholder="Ceritakan secara rinci apa yang terjadi, lokasi persisnya, dan apa harapan Anda..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white leading-relaxed"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bukti Foto Laporan (Wajib)</label>
                <div className="w-full flex flex-col items-center justify-center px-4 py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-gray-600 text-sm">Klik untuk memilih foto kerusakan / bukti kejadian</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="anonim" className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300 cursor-pointer" />
                <label htmlFor="anonim" className="text-sm font-bold text-gray-700 cursor-pointer">Sembunyikan nama saya (Kirim sebagai Anonim)</label>
              </div>

              <button type="button" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-all hover:-translate-y-1 text-lg">
                Kirim Pengaduan
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}