// src/app/layanan/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Komponen Pembungkus Utama untuk keamanan Next.js
export default function LayananMandiri() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LayananContent />
    </Suspense>
  );
}

function LayananContent() {
  const [tabAktif, setTabAktif] = useState("buat");

  // STATE HEADER HERO DINAMIS
  const [heroData, setHeroData] = useState({
    judul: "Layanan Surat Mandiri",
    sub: "Ajukan surat administrasi (SKTM, Pengantar, dll) langsung dari HP Anda tanpa perlu antre di balai desa.",
    bg: "" 
  });

  // ==========================================
  // STATE MASTER SURAT (DARI ADMIN)
  // ==========================================
  const [masterSuratList, setMasterSuratList] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // ==========================================
  // STATE FORMULIR PENGAJUAN SURAT
  // ==========================================
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [jenisSuratId, setJenisSuratId] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [fileBerkas, setFileBerkas] = useState<{ [key: string]: File }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusSubmit, setStatusSubmit] = useState("");

  // ==========================================
  // STATE LACAK SURAT
  // ==========================================
  const [searchNik, setSearchNik] = useState("");
  const [hasilLacak, setHasilLacak] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Ambil Data dari Firebase
  useEffect(() => {
    const fetchAwalData = async () => {
      try {
        // 1. Fetch Pengaturan Header
        const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Layanan Surat Mandiri",
            sub: snapHero.data().sub || "Ajukan surat administrasi (SKTM, Pengantar, dll) langsung dari HP Anda tanpa perlu antre di balai desa.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Master Surat
        const qMaster = query(collection(db, "master_surat"));
        const snap = await getDocs(qMaster);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMasterSuratList(data);

      } catch (error) {
        console.error("Gagal memuat data awal:", error);
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchAwalData();
  }, []);

  const selectedSurat = masterSuratList.find(s => s.id === jenisSuratId);

  const handleFileChange = (namaSyarat: string, file: File | null) => {
    if (file) {
      setFileBerkas(prev => ({ ...prev, [namaSyarat]: file }));
    } else {
      const temp = { ...fileBerkas };
      delete temp[namaSyarat];
      setFileBerkas(temp);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if ((encoded.length % 4) > 0) { encoded += '='.repeat(4 - (encoded.length % 4)); }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const uploadFotoKeImgBB = async (file: File) => {
    try {
      const base64Data = await fileToBase64(file);
      const formData = new FormData();
      formData.append("image", base64Data);
      const apiKeyImgBB = "6755e61bb042b746d83c71595313674e";
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      try {
        const base64Data = await fileToBase64(file);
        const formData = new FormData();
        formData.append("image", base64Data);
        const apiKeyImgBB = "6755e61bb042b746d83c71595313674e";
        const cdnUrl = `https://corsproxy.io/?https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`;
        
        const resCdn = await fetch(cdnUrl, { method: "POST", body: formData });
        const dataCdn = await resCdn.json();
        if (dataCdn.success) return dataCdn.data.url;
        return null;
      } catch (errCdn) { return null; }
    }
  };

  const handleSubmitPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurat) {
      setStatusSubmit("❌ Silakan pilih jenis surat terlebih dahulu.");
      return;
    }

    if (!selectedSurat.harus_datang && selectedSurat.persyaratan) {
      const syaratWajib = selectedSurat.persyaratan as string[];
      for (const syarat of syaratWajib) {
        if (!fileBerkas[syarat]) {
          setStatusSubmit(`❌ Anda belum mengunggah berkas untuk: ${syarat}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setStatusSubmit("Memproses data Anda...");

    try {
      const berkasTerunggah: { [key: string]: string } = {};

      if (!selectedSurat.harus_datang && selectedSurat.persyaratan) {
        setStatusSubmit("Mengunggah berkas foto...");
        const syaratWajib = selectedSurat.persyaratan as string[];
        
        for (const syarat of syaratWajib) {
          const file = fileBerkas[syarat];
          if (file) {
            const linkGambar = await uploadFotoKeImgBB(file);
            if (linkGambar) {
              berkasTerunggah[syarat] = linkGambar;
            } else {
              throw new Error(`Gagal mengunggah ${syarat}. Pastikan koneksi stabil.`);
            }
          }
        }
      }

      let formattedWA = wa.replace(/\D/g, "");
      if (formattedWA.startsWith("0")) formattedWA = "62" + formattedWA.substring(1);

      setStatusSubmit("Menyimpan pengajuan ke server desa...");
      await addDoc(collection(db, "layanan_surat"), {
        nik: nik,
        nama: nama,
        wa: formattedWA,
        jenis_surat: selectedSurat.nama_surat,
        keperluan: keperluan,
        berkas: berkasTerunggah, 
        status: "Menunggu",
        tanggal_pengajuan: new Date().toISOString(),
        alasan_penolakan: ""
      });

      setStatusSubmit("✅ Pengajuan Surat Berhasil! Silakan cek menu Lacak secara berkala.");
      
      setNik(""); setNama(""); setWa(""); setKeperluan(""); setFileBerkas({}); setJenisSuratId("");
      setTimeout(() => setStatusSubmit(""), 6000);

    } catch (error: any) {
      setStatusSubmit(error.message || "❌ Terjadi kesalahan pada sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLacakSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNik) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const q = query(collection(db, "layanan_surat"), where("nik", "==", searchNik));
      const snap = await getDocs(q);
      
      const hasil = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const sortedHasil = hasil.sort((a, b) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime());
      
      setHasilLacak(sortedHasil);
    } catch (error) {
      console.error("Gagal melacak surat:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTanggalLacak = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    }) + " WIB";
  };

  // Mencegah Crash Hero Image
  let heroBgSafe = "";
  if (typeof heroData.bg === "string" && heroData.bg.trim() !== "") {
    heroBgSafe = heroData.bg;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* ==========================================
          HEADER SECTION (HERO DINAMIS)
      ========================================== */}
      <div className="bg-yellow-700 text-yellow-50 py-16 md:py-24 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 z-0">
          {heroBgSafe && (
            <img 
              src={heroBgSafe.startsWith("http") ? heroBgSafe : `https://wsrv.nl/?url=${heroBgSafe}`} 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in">
          <span className="text-yellow-100 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-yellow-900/50 px-4 py-1.5 rounded-full border border-yellow-800">
            Akses Cepat & Mudah
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white drop-shadow-lg whitespace-pre-wrap leading-tight">
            {heroData.judul}
          </h1>
          <p className="text-lg md:text-xl text-yellow-100 max-w-2xl mx-auto font-medium drop-shadow-md whitespace-pre-wrap">
            {heroData.sub}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-grow">
        
        {/* TABS NAVIGASI */}
        <div className="flex justify-center gap-2 md:gap-4 mb-10 relative z-20 -mt-20">
          <button 
            onClick={() => setTabAktif("buat")}
            className={`px-8 py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
              tabAktif === "buat" 
              ? "bg-yellow-500 text-white shadow-xl transform -translate-y-2 border-2 border-yellow-400" 
              : "bg-white text-gray-600 hover:bg-yellow-50 border border-gray-200 shadow-sm"
            }`}
          >
            <span className="text-2xl">📝</span> Buat Surat
          </button>
          
          <button 
            onClick={() => setTabAktif("lacak")}
            className={`px-8 py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
              tabAktif === "lacak" 
              ? "bg-yellow-500 text-white shadow-xl transform -translate-y-2 border-2 border-yellow-400" 
              : "bg-white text-gray-600 hover:bg-yellow-50 border border-gray-200 shadow-sm"
            }`}
          >
            <span className="text-2xl">🔍</span> Cek Status
          </button>
        </div>

        {/* ==========================================
            KONTEN TAB: BUAT SURAT BARU
        ========================================== */}
        {tabAktif === "buat" && (
          <div className="bg-white p-6 md:p-12 rounded-[40px] shadow-sm border border-gray-100 animate-fade-in border-t-8 border-t-yellow-400">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Formulir Pengajuan Surat</h2>
              <p className="text-gray-500 text-sm">Isi data diri Anda dengan benar sesuai KTP.</p>
            </div>

            {loadingMaster ? (
              <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : masterSuratList.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <span className="text-6xl opacity-50 block mb-4">📭</span>
                <p className="font-bold text-gray-600">Admin belum mendata jenis surat yang tersedia.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPengajuan} className="space-y-6">
                
                <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200">
                  <label className="block text-sm font-bold mb-2 text-yellow-900">Pilih Jenis Surat yang Ingin Dibuat</label>
                  <select 
                    required 
                    value={jenisSuratId} 
                    onChange={(e) => setJenisSuratId(e.target.value)}
                    className="w-full p-4 border border-yellow-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-600 bg-white font-bold text-gray-800"
                  >
                    <option value="" disabled>-- Pilih Dokumen --</option>
                    {masterSuratList.map((surat) => (
                      <option key={surat.id} value={surat.id}>{surat.nama_surat}</option>
                    ))}
                  </select>
                </div>

                {selectedSurat && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {selectedSurat.harus_datang && (
                      <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex gap-4">
                        <span className="text-4xl">🏢</span>
                        <div>
                          <h4 className="font-black text-red-800 text-lg mb-1">WAJIB DATANG KE BALAI DESA</h4>
                          <p className="text-sm text-red-600 font-medium">Surat ini membutuhkan verifikasi tatap muka atau cap basah. Silakan isi form antrean di bawah, lalu bawa persyaratan fisik secara langsung ke Kantor Desa.</p>
                          {selectedSurat.persyaratan && selectedSurat.persyaratan.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-red-900 mb-1">Persyaratan Fisik yang Dibawa:</p>
                              <ul className="list-disc pl-5 text-xs text-red-700 font-medium">
                                {selectedSurat.persyaratan.map((syarat: string, idx: number) => (
                                  <li key={idx}>{syarat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="md:col-span-2 border-b border-gray-200 pb-2 mb-2">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">👤</span> Identitas Diri</h4>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-2 text-gray-800">Nomor Induk Kependudukan (NIK)</label>
                        <input 
                          type="number" 
                          required 
                          value={nik} 
                          onChange={(e) => setNik(e.target.value)} 
                          placeholder="16 Digit NIK Anda..."
                          className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-mono tracking-widest text-lg" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold mb-2 text-gray-800">Nama Lengkap Sesuai KTP</label>
                        <input 
                          type="text" 
                          required 
                          value={nama} 
                          onChange={(e) => setNama(e.target.value)} 
                          placeholder="Nama Lengkap..."
                          className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-white uppercase" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold mb-2 text-gray-800">No. WhatsApp Aktif</label>
                        <input 
                          type="number" 
                          required 
                          value={wa} 
                          onChange={(e) => setWa(e.target.value)} 
                          placeholder="0812..."
                          className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-mono" 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-2 text-gray-800">Alasan / Keperluan Surat</label>
                        <textarea 
                          required 
                          rows={3}
                          value={keperluan} 
                          onChange={(e) => setKeperluan(e.target.value)} 
                          placeholder="Misal: Untuk syarat daftar sekolah anak..."
                          className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-white" 
                        ></textarea>
                      </div>
                    </div>

                    {!selectedSurat.harus_datang && selectedSurat.persyaratan && selectedSurat.persyaratan.length > 0 && (
                      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200">
                        <div className="border-b border-blue-200 pb-2 mb-6">
                          <h4 className="font-bold text-blue-900 flex items-center gap-2"><span className="text-xl">📸</span> Foto Persyaratan</h4>
                          <p className="text-xs text-blue-700 mt-1 font-medium">Unggah foto dokumen dengan jelas agar admin dapat memverifikasinya.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {selectedSurat.persyaratan.map((syarat: string, idx: number) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
                              <label className="block text-xs font-black mb-3 text-gray-800 uppercase tracking-wide">
                                📋 {syarat}
                              </label>
                              <label className="cursor-pointer flex flex-col items-center justify-center py-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-blue-100 hover:border-blue-400 transition-all text-center">
                                <span className="text-2xl mb-1">{fileBerkas[syarat] ? "✅" : "📷"}</span>
                                <span className={`text-xs font-bold ${fileBerkas[syarat] ? "text-green-600" : "text-gray-500"}`}>
                                  {fileBerkas[syarat] ? fileBerkas[syarat].name.substring(0,20)+"..." : "Ambil Foto"}
                                </span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => handleFileChange(syarat, e.target.files ? e.target.files[0] : null)} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {statusSubmit && (
                      <div className={`p-4 rounded-2xl text-sm font-bold text-center border shadow-sm ${statusSubmit.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
                        {statusSubmit}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className={`w-full text-white font-black py-5 rounded-2xl shadow-lg transition-transform transform text-lg flex items-center justify-center gap-2 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-1"}`}
                    >
                      {isSubmitting ? "Sedang Mengirim..." : "🚀 Kirim Pengajuan Surat"}
                    </button>

                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ==========================================
            KONTEN TAB: LACAK SURAT
        ========================================== */}
        {tabAktif === "lacak" && (
          <div className="bg-white p-6 md:p-12 rounded-[40px] shadow-sm border border-gray-100 animate-fade-in border-t-8 border-t-gray-800">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Lacak Status Surat</h2>
              <p className="text-gray-500 text-sm">Masukkan NIK Anda untuk melihat progres dokumen yang telah diajukan.</p>
            </div>

            <form onSubmit={handleLacakSurat} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4 mb-12">
              <input 
                type="number" 
                required 
                value={searchNik}
                onChange={(e) => setSearchNik(e.target.value)}
                placeholder="Ketik 16 Digit NIK..."
                className="flex-grow p-4 border-2 border-gray-300 rounded-2xl outline-none focus:border-gray-800 focus:ring-4 focus:ring-gray-100 font-mono text-lg tracking-widest text-center sm:text-left"
              />
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-gray-900 hover:bg-black text-white font-bold px-8 py-4 rounded-2xl shadow-md transition-all sm:w-auto"
              >
                {isSearching ? "Mencari..." : "Lacak"}
              </button>
            </form>

            {hasSearched && (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-3">Hasil Pelacakan untuk NIK: <span className="font-mono text-gray-500">{searchNik}</span></h3>
                
                {hasilLacak.length === 0 ? (
                  <div className="text-center py-10 bg-red-50 rounded-3xl border border-red-100">
                    <span className="text-4xl mb-3 block opacity-50">📂</span>
                    <p className="text-red-700 font-bold">Tidak ada riwayat pengajuan surat dengan NIK tersebut.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {hasilLacak.map((surat) => (
                      <div key={surat.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        
                        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest text-white shadow-sm
                          ${surat.status === "Selesai" ? "bg-green-500" :
                            surat.status === "Diproses" ? "bg-blue-500" :
                            surat.status === "Ditolak" ? "bg-red-500" :
                            "bg-yellow-500"}`}
                        >
                          {surat.status || "Menunggu"}
                        </div>

                        <div className="text-xs font-bold text-gray-400 mb-2">{formatTanggalLacak(surat.tanggal_pengajuan)}</div>
                        <h4 className="text-xl font-black text-gray-900 leading-tight w-3/4 mb-1">{surat.jenis_surat}</h4>
                        <p className="text-sm font-bold text-gray-500 mb-4 uppercase">{surat.nama}</p>
                        
                        <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
                          <span className="font-bold text-gray-900 block mb-1">Keperluan:</span> {surat.keperluan}
                        </p>

                        {surat.status === "Ditolak" && surat.alasan_penolakan && (
                          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                              <span className="font-black text-red-800 text-sm block mb-1">Ditolak oleh Admin</span>
                              <p className="text-xs font-medium text-red-700 leading-relaxed italic">Alasan: "{surat.alasan_penolakan}"</p>
                              <p className="text-[10px] text-red-500 mt-2 font-bold">Silakan buat pengajuan ulang dengan memperbaiki data Anda.</p>
                            </div>
                          </div>
                        )}
                        
                        {surat.status === "Selesai" && (
                          <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-green-800 text-center">✅ Surat Anda telah selesai dicetak. Silakan ambil di Kantor Balai Desa pada jam kerja.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}