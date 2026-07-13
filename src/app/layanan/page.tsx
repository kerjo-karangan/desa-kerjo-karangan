"use client";

import { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Pastikan path ini benar

export default function LayananMandiri() {
  const [tabAktif, setTabAktif] = useState("surat");

  // --- STATE PERMOHONAN SURAT ---
  const [nikSurat, setNikSurat] = useState("");
  const [namaSurat, setNamaSurat] = useState("");
  const [jenisSurat, setJenisSurat] = useState("");
  const [keperluanSurat, setKeperluanSurat] = useState("");
  const [statusSubmitSurat, setStatusSubmitSurat] = useState("");
  const [isLoadingSurat, setIsLoadingSurat] = useState(false);

  // --- STATE KOTAK PENGADUAN ---
  const [judulPengaduan, setJudulPengaduan] = useState("");
  const [isiPengaduan, setIsiPengaduan] = useState("");
  const [fotoPengaduan, setFotoPengaduan] = useState<File | null>(null);
  const [isAnonim, setIsAnonim] = useState(false);
  const [statusSubmitPengaduan, setStatusSubmitPengaduan] = useState("");
  const [isLoadingPengaduan, setIsLoadingPengaduan] = useState(false);

  // --- STATE LACAK STATUS ---
  const [lacakNik, setLacakNik] = useState("");
  const [hasilLacak, setHasilLacak] = useState<any | null>(null);
  const [statusLacak, setStatusLacak] = useState("");
  const [isLoadingLacak, setIsLoadingLacak] = useState(false);

  // FUNGSI 1: KIRIM PERMOHONAN SURAT
  const handleKirimSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSurat(true);
    setStatusSubmitSurat("Mengirim permohonan...");

    try {
      // Membuat kode resi acak
      const kodeResi = "SRT-" + Math.floor(1000 + Math.random() * 9000);

      await addDoc(collection(db, "layanan_surat"), {
        resi: kodeResi,
        nik: nikSurat,
        nama: namaSurat,
        jenis_surat: jenisSurat,
        keperluan: keperluanSurat,
        status_berkas: "Diajukan", // Status awal
        tanggal_pengajuan: new Date().toISOString()
      });

      setStatusSubmitSurat(`✅ Berhasil! Simpan KODE RESI Anda: ${kodeResi}`);
      setNikSurat(""); setNamaSurat(""); setJenisSurat(""); setKeperluanSurat("");
    } catch (error) {
      setStatusSubmitSurat("❌ Gagal mengirim permohonan.");
    } finally {
      setIsLoadingSurat(false);
    }
  };

  // FUNGSI 2: KIRIM PENGADUAN (DENGAN IMGBB)
  const handleKirimPengaduan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPengaduan(true);
    setStatusSubmitPengaduan("Memproses laporan...");

    try {
      let imageUrl = "";
      if (fotoPengaduan) {
        setStatusSubmitPengaduan("Mengunggah bukti foto...");
        const formData = new FormData();
        formData.append("image", fotoPengaduan);
        
        // --- MASUKKAN KEMBALI API KEY IMGBB ANDA DI SINI ---
        const apiKeyImgBB = "6755e61bb042b746d83c71595313674e"; 
        
        const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
        const hasil = await tanggapan.json();
        
        if (hasil.success) {
          imageUrl = hasil.data.url;
        } else {
          setStatusSubmitPengaduan("❌ Gagal mengunggah foto.");
          setIsLoadingPengaduan(false);
          return;
        }
      }

      setStatusSubmitPengaduan("Mengirim laporan ke server desa...");
      await addDoc(collection(db, "pengaduan_warga"), {
        judul: judulPengaduan,
        isi: isiPengaduan,
        foto_bukti: imageUrl,
        anonim: isAnonim,
        status_tanggapan: "Menunggu",
        tanggal_laporan: new Date().toISOString()
      });

      setStatusSubmitPengaduan("✅ Laporan berhasil dikirim! Terima kasih atas partisipasi Anda.");
      setJudulPengaduan(""); setIsiPengaduan(""); setFotoPengaduan(null); setIsAnonim(false);
    } catch (error) {
      setStatusSubmitPengaduan("❌ Gagal mengirim laporan.");
    } finally {
      setIsLoadingPengaduan(false);
    }
  };

  // FUNGSI 3: LACAK STATUS BERKAS
  const handleLacakBerkas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lacakNik) return;
    
    setIsLoadingLacak(true);
    setStatusLacak("Mencari data...");
    setHasilLacak(null);

    try {
      // Mencari berdasarkan NIK atau Resi
      const q = query(
        collection(db, "layanan_surat"), 
        where("nik", "==", lacakNik)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Mengambil dokumen pertama yang cocok (bisa dikembangkan jadi list nanti)
        setHasilLacak(querySnapshot.docs[0].data());
        setStatusLacak("");
      } else {
        // Coba cari berdasarkan Resi jika NIK tidak ketemu
        const qResi = query(collection(db, "layanan_surat"), where("resi", "==", lacakNik));
        const resiSnapshot = await getDocs(qResi);
        
        if (!resiSnapshot.empty) {
          setHasilLacak(resiSnapshot.docs[0].data());
          setStatusLacak("");
        } else {
          setStatusLacak("❌ Data tidak ditemukan. Periksa kembali NIK atau Resi Anda.");
        }
      }
    } catch (error) {
      setStatusLacak("❌ Terjadi kesalahan sistem.");
    } finally {
      setIsLoadingLacak(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER HERO SECTION UTUH */}
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
        
        {/* MENU TABS NAVIGASI UTUH */}
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-8">
          <button onClick={() => setTabAktif("surat")} className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "surat" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}><span className="text-xl">📄</span> Permohonan Surat</button>
          <button onClick={() => setTabAktif("status")} className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "status" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}><span className="text-xl">🔍</span> Lacak Pengajuan</button>
          <button onClick={() => setTabAktif("pengaduan")} className={`w-full md:w-auto px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${tabAktif === "pengaduan" ? "bg-green-600 text-white shadow-md transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"}`}><span className="text-xl">📢</span> Kotak Pengaduan</button>
        </div>

        {/* TAB 1: PERMOHONAN SURAT (AKTIF BACKEND) */}
        {tabAktif === "surat" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4"><h2 className="text-2xl font-extrabold text-gray-900 mb-2">Formulir Pengajuan Surat Baru</h2><p className="text-gray-500 text-sm">Silakan isi data diri dan pilih jenis surat yang Anda butuhkan secara teliti.</p></div>
            <form onSubmit={handleKirimSurat} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">NIK Pemohon</label>
                  <input type="number" required value={nikSurat} onChange={(e)=>setNikSurat(e.target.value)} placeholder="Contoh: 3503xxxxxxxxxxxx" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap KTP</label>
                  <input type="text" required value={namaSurat} onChange={(e)=>setNamaSurat(e.target.value)} placeholder="Masukkan nama lengkap" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Surat yang Diajukan</label>
                <select required value={jenisSurat} onChange={(e)=>setJenisSurat(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white cursor-pointer font-medium">
                  <option value="">-- Pilih Jenis Surat --</option>
                  <option value="Surat Keterangan Usaha (SKU)">Surat Keterangan Usaha (SKU)</option>
                  <option value="Surat Pengantar SKCK">Surat Pengantar Kelakuan Baik</option>
                  <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu (SKTM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tujuan / Keperluan</label>
                <textarea required value={keperluanSurat} onChange={(e)=>setKeperluanSurat(e.target.value)} rows={4} placeholder="Contoh: Syarat pengajuan KUR BRI" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white"></textarea>
              </div>
              
              {statusSubmitSurat && (
                <div className={`p-4 rounded-xl font-bold text-center border ${statusSubmitSurat.includes("❌") ? "bg-red-50 text-red-700" : "bg-green-100 text-green-800 text-lg border-green-300"}`}>
                  {statusSubmitSurat}
                </div>
              )}

              <button type="submit" disabled={isLoadingSurat} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${isLoadingSurat ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 hover:-translate-y-1"}`}>
                {isLoadingSurat ? "Memproses..." : "Kirim Pengajuan Surat"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: LACAK PENGAJUAN (AKTIF BACKEND) */}
        {tabAktif === "status" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
             <div className="mb-8 text-center max-w-xl mx-auto"><span className="text-5xl block mb-4">🔍</span><h2 className="text-2xl font-extrabold text-gray-900 mb-2">Lacak Status Surat</h2><p className="text-gray-500 text-sm">Masukkan NIK atau Kode Resi pengajuan Anda.</p></div>
            
            <form onSubmit={handleLacakBerkas} className="flex flex-col md:flex-row gap-4 mb-10 max-w-2xl mx-auto">
              <input type="text" required value={lacakNik} onChange={(e)=>setLacakNik(e.target.value)} placeholder="Masukkan NIK / Kode Resi..." className="flex-1 px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white font-medium text-center md:text-left" />
              <button type="submit" disabled={isLoadingLacak} className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-all">
                {isLoadingLacak ? "Mencari..." : "Lacak Berkas"}
              </button>
            </form>

            {statusLacak && <p className="text-center font-bold text-red-600 mb-6">{statusLacak}</p>}

            {/* HASIL PENCARIAN DINAMIS */}
            {hasilLacak ? (
              <div className="border border-green-200 rounded-2xl p-6 md:p-10 bg-green-50">
                <div className="flex flex-col md:flex-row justify-between mb-8 pb-6 border-b border-green-200 gap-4">
                  <div>
                    <p className="text-sm text-green-700 font-bold uppercase tracking-wider mb-1">Informasi Berkas</p>
                    <h3 className="text-xl font-black text-gray-900">{hasilLacak.jenis_surat}</h3>
                    <p className="text-gray-600 font-medium">{hasilLacak.nama} ({hasilLacak.nik})</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-green-700 font-bold uppercase tracking-wider mb-1">Kode Resi</p>
                    <span className="bg-white border border-green-300 px-4 py-2 rounded-lg font-mono font-bold text-green-800">{hasilLacak.resi}</span>
                  </div>
                </div>
                
                {/* Visualisasi Linimasa Otomatis */}
                <div className="flex justify-between w-full max-w-2xl mx-auto relative">
                  <div className="absolute top-4 left-0 w-full h-1 bg-gray-300 -z-10"></div>
                  
                  {/* Step 1: Diajukan */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">✓</div>
                    <span className="text-xs font-bold mt-2 text-green-700">Diajukan</span>
                  </div>
                  
                  {/* Step 2: Verifikasi */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md transition-colors ${hasilLacak.status_berkas === "Verifikasi" || hasilLacak.status_berkas === "Selesai" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}>
                      {hasilLacak.status_berkas === "Verifikasi" || hasilLacak.status_berkas === "Selesai" ? "✓" : "2"}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${hasilLacak.status_berkas === "Verifikasi" || hasilLacak.status_berkas === "Selesai" ? "text-green-700" : "text-gray-500"}`}>Verifikasi</span>
                  </div>
                  
                  {/* Step 3: Selesai */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md transition-colors ${hasilLacak.status_berkas === "Selesai" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}>
                      {hasilLacak.status_berkas === "Selesai" ? "✓" : "3"}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${hasilLacak.status_berkas === "Selesai" ? "text-green-700" : "text-gray-500"}`}>Selesai/Siap Ambil</span>
                  </div>
                </div>
              </div>
            ) : (
              !statusLacak && (
                <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-gray-50">
                  <p className="text-gray-400 font-medium">Silakan lakukan pencarian di atas untuk memunculkan linimasa proses berkas Anda.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 3: KOTAK PENGADUAN (AKTIF BACKEND + IMGBB) */}
        {tabAktif === "pengaduan" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4"><h2 className="text-2xl font-extrabold text-gray-900 mb-2">Sampaikan Aspirasi & Pengaduan</h2><p className="text-gray-500 text-sm">Laporkan masalah infrastruktur rusak, keluhan pelayanan, atau usulan.</p></div>
            <form onSubmit={handleKirimPengaduan} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul Laporan</label>
                <input type="text" required value={judulPengaduan} onChange={(e)=>setJudulPengaduan(e.target.value)} placeholder="Contoh: Saluran Irigasi Tersumbat" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Detail</label>
                <textarea required rows={5} value={isiPengaduan} onChange={(e)=>setIsiPengaduan(e.target.value)} placeholder="Ceritakan secara rinci apa yang terjadi..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bukti Foto Laporan (Wajib)</label>
                <label className="w-full flex flex-col items-center justify-center px-4 py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 cursor-pointer">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-gray-600 text-sm">Klik untuk memilih foto kerusakan</span>
                  <input type="file" required accept="image/*" onChange={(e) => { if (e.target.files) setFotoPengaduan(e.target.files[0]); }} className="hidden" />
                </label>
                {fotoPengaduan && <p className="text-sm font-bold text-blue-600 mt-2">✅ 1 foto bukti siap dikirim.</p>}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="anonim" checked={isAnonim} onChange={(e)=>setIsAnonim(e.target.checked)} className="w-5 h-5 text-green-600 rounded cursor-pointer" />
                <label htmlFor="anonim" className="text-sm font-bold text-gray-700 cursor-pointer">Kirim sebagai Anonim</label>
              </div>

              {statusSubmitPengaduan && (
                <div className={`p-3 rounded-lg font-bold text-center border ${statusSubmitPengaduan.includes("❌") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                  {statusSubmitPengaduan}
                </div>
              )}

              <button type="submit" disabled={isLoadingPengaduan} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${isLoadingPengaduan ? "bg-gray-400" : "bg-gray-900 hover:bg-black hover:-translate-y-1"}`}>
                {isLoadingPengaduan ? "Memproses Laporan..." : "Kirim Pengaduan"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}