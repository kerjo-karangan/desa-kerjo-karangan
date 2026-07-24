// src/app/layanan/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// ==========================================
// FUNGSI KONVERSI GAMBAR (HEIC & CLOUDINARY)
// ==========================================
const getSafeImageUrl = (url: string) => {
  if (!url) return "";
  let safeUrl = url;
  if (safeUrl.includes("cloudinary.com") && safeUrl.toLowerCase().endsWith(".heic")) {
    safeUrl = safeUrl.replace(/\.heic$/i, ".jpg");
  }
  if (safeUrl.includes("cloudinary.com") || safeUrl.startsWith("http")) {
    return safeUrl;
  }
  return `https://wsrv.nl/?url=${safeUrl}`;
};

function LayananContent() {
  
  const [loading, setLoading] = useState(true);
  
  // ==========================================
  // STATE DATA LAYANAN
  // ==========================================
  const [heroData, setHeroData] = useState({
    judul: "Layanan Surat Mandiri",
    sub: "Urus surat pengantar dan administrasi desa dari rumah dengan mudah dan cepat.",
    bg: ""
  });

  const [masterSurat, setMasterSurat] = useState<any[]>([]);
  const [selectedSurat, setSelectedSurat] = useState<any | null>(null);

  // State Form Warga
  const [formWarga, setFormWarga] = useState({
    nik: "",
    nama: "",
    no_wa: "",
    keperluan: ""
  });

  // State untuk menyimpan URL file dokumen persyaratan yang diunggah
  // Format: { "Nama Syarat 1": "url_gambar...", "Nama Syarat 2": "url_gambar..." }
  const [dokumenSyarat, setDokumenSyarat] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusProses, setStatusProses] = useState({ type: "", message: "" });
  const [berhasilDaftar, setBerhasilDaftar] = useState(false);

  useEffect(() => {
    const fetchLayananData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Header Layanan
        const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Layanan Surat Mandiri",
            sub: snapHero.data().sub || "Urus surat pengantar dan administrasi desa secara online.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Master Jenis Surat (DATABASE: master_surat)
        const qSurat = query(collection(db, "master_surat"), orderBy("nama_surat", "asc"));
        const snapSurat = await getDocs(qSurat);
        setMasterSurat(snapSurat.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data layanan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayananData();
  }, []);

  // ==========================================
  // CLOUDINARY UPLOADER UNTUK DOKUMEN WARGA
  // ==========================================
  const handleUploadDokumenSyarat = async (e: React.ChangeEvent<HTMLInputElement>, namaSyarat: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/cloudinary", { 
        method: "POST", 
        body: formData 
      });
      const data = await res.json();
      
      if (data.success) {
        setDokumenSyarat(prev => ({
          ...prev,
          [namaSyarat]: data.url
        }));
      } else {
        alert("Gagal mengunggah dokumen. Silakan coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // HANDLER SUBMIT PENGAJUAN SURAT
  // ==========================================
  const handleKirimPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurat) return;

    setIsSubmitting(true);
    setStatusProses({ type: "loading", message: "Sedang mengirim pengajuan surat Anda..." });

    try {
      // 1. Simpan ke koleksi antrean_surat
      await addDoc(collection(db, "antrean_surat"), {
        jenis_surat: selectedSurat.nama_surat || selectedSurat.nama, // Mengakomodasi format lama/baru
        nama: formWarga.nama,
        nik: formWarga.nik,
        no_wa: formWarga.no_wa,
        keperluan: formWarga.keperluan,
        dokumen_syarat: dokumenSyarat, // Data upload foto persyaratan
        keterangan_admin: "",
        status: "Menunggu",
        tanggal_pengajuan: new Date().toISOString()
      });

      setStatusProses({ type: "success", message: "Pengajuan berhasil dikirim!" });
      setBerhasilDaftar(true);
      
      // Bersihkan form
      setFormWarga({
        nik: "",
        nama: "",
        no_wa: "",
        keperluan: ""
      });
      setDokumenSyarat({});

    } catch (error) {
      setStatusProses({ type: "error", message: "Gagal mengirim pengajuan. Pastikan koneksi internet Anda stabil." });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // PENGOLAHAN LIST SYARAT (Kompatibilitas Versi Lama & Baru)
  // ==========================================
  const getListSyarat = (syaratData: any): string[] => {
    if (!syaratData) return [];
    if (Array.isArray(syaratData)) return syaratData;
    if (typeof syaratData === "string") {
      return syaratData.split(",").map(s => s.trim()).filter(s => s !== "");
    }
    return [];
  };

  // ==========================================
  // TAMPILAN LOADING
  // ==========================================
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-red-700 font-bold tracking-widest animate-pulse"
        >
          MENYIAPKAN LAYANAN SURAT...
        </p>
      </div>
    );
  }

  // ==========================================
  // HALAMAN SUKSES PENGAJUAN
  // ==========================================
  if (berhasilDaftar) {
    return (
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in"
      >
        <div 
          className="bg-white max-w-2xl w-full p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center"
        >
          <div 
            className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner"
          >
            ✅
          </div>
          <h2 
            className="text-3xl font-black text-gray-900 mb-4"
          >
            Pengajuan Berhasil Terkirim!
          </h2>
          <p 
            className="text-gray-600 leading-relaxed mb-8"
          >
            Permohonan surat <b>{selectedSurat?.nama_surat || selectedSurat?.nama}</b> Anda telah masuk ke dalam antrean pelayanan desa. 
            Silakan tunggu konfirmasi selanjutnya dari staf kami melalui nomor WhatsApp yang telah Anda berikan.
          </p>
          <div 
            className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left mb-8"
          >
            <h4 
              className="font-bold text-blue-900 mb-2 flex items-center gap-2"
            >
              <span>ℹ️</span> Informasi Penting
            </h4>
            <ul 
              className="list-disc list-inside text-sm text-blue-800 space-y-2 ml-4"
            >
              {selectedSurat?.wajib_datang && (
                <li>
                  Surat ini <b>wajib memerlukan kedatangan Anda ke Balai Desa</b>. Pengajuan ini berfungsi sebagai nomor antrean awal agar proses lebih cepat.
                </li>
              )}
              <li>
                Pastikan nomor WhatsApp Anda aktif agar admin dapat menghubungi jika ada kekurangan berkas.
              </li>
            </ul>
          </div>
          <button 
            onClick={() => {
              setBerhasilDaftar(false);
              setSelectedSurat(null);
            }}
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"
          >
            Ajukan Surat Lainnya
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER UTAMA HALAMAN LAYANAN SURAT
  // ==========================================
  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24"
    >
      
      {/* ==========================================
          HEADER (HERO SECTION)
      ========================================== */}
      <div 
        className={`relative py-16 md:py-24 text-white overflow-hidden shadow-md transition-colors duration-500 ${
          heroData.bg ? "bg-gray-900" : "bg-red-600"
        }`}
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Layanan Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
          )}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"
          ></div>
        </div>
        
        <div 
          className="container mx-auto px-4 relative z-10 text-center animate-fade-in"
        >
          <span 
            className="text-red-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-red-900/50 px-4 py-1.5 rounded-full border border-red-800 backdrop-blur-sm shadow-sm"
          >
            Layanan Administrasi Warga
          </span>
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl whitespace-pre-wrap leading-tight"
          >
            {heroData.judul}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-lg whitespace-pre-wrap"
          >
            {heroData.sub}
          </p>
        </div>
      </div>

      <div 
        className="container mx-auto px-4 max-w-5xl relative z-20 -mt-10"
      >
        
        {/* ==========================================
            MODE 1: TAMPILAN PILIH JENIS SURAT
        ========================================== */}
        {!selectedSurat && (
          <div 
            className="animate-fade-in"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 mb-8 text-center"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-2"
              >
                Pilih Jenis Surat
              </h2>
              <p 
                className="text-gray-500"
              >
                Pilih layanan administrasi yang Anda butuhkan dari daftar di bawah ini.
              </p>
            </div>

            {masterSurat.length === 0 ? (
              <div 
                className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <div 
                  className="text-5xl mb-4 opacity-30"
                >
                  ✉️
                </div>
                <h3 
                  className="text-xl font-bold text-gray-700"
                >
                  Belum ada layanan surat yang tersedia.
                </h3>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {masterSurat.map((surat) => (
                  <div 
                    key={surat.id} 
                    onClick={() => { setSelectedSurat(surat); setDokumenSyarat({}); }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 hover:border-red-300 transition-all cursor-pointer group flex flex-col h-full"
                  >
                    <div 
                      className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors"
                    >
                      📄
                    </div>
                    <h3 
                      className="text-xl font-black text-gray-900 mb-3 group-hover:text-red-700 transition-colors"
                    >
                      {surat.nama_surat || surat.nama}
                    </h3>
                    <p 
                      className="text-sm text-gray-600 line-clamp-3 leading-relaxed flex-1"
                    >
                      {surat.keterangan || surat.deskripsi || "Pelayanan administrasi kependudukan."}
                    </p>
                    <div 
                      className="mt-6 pt-4 border-t border-gray-100 text-xs font-bold text-red-600 flex justify-between items-center"
                    >
                      <span>{getListSyarat(surat.syarat).length} Persyaratan</span>
                      <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            MODE 2: TAMPILAN FORMULIR PENGISIAN
        ========================================== */}
        {selectedSurat && (
          <div 
            className="animate-fade-in"
          >
            <button 
              onClick={() => setSelectedSurat(null)}
              className="mb-6 flex items-center gap-2 text-red-600 font-bold hover:text-red-800 transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 w-max"
            >
              <span>◀</span> Kembali Pilih Surat
            </button>

            <div 
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div 
                className="bg-gray-900 text-white p-8 md:p-10"
              >
                <div 
                  className="flex items-center gap-3 mb-2"
                >
                  <span 
                    className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded"
                  >
                    Formulir Permohonan
                  </span>
                </div>
                <h2 
                  className="text-3xl md:text-4xl font-black leading-tight mb-4"
                >
                  {selectedSurat.nama_surat || selectedSurat.nama}
                </h2>
                <p 
                  className="text-gray-300 text-sm md:text-base leading-relaxed"
                >
                  {selectedSurat.keterangan || selectedSurat.deskripsi}
                </p>
              </div>

              {/* PERINGATAN WAJIB DATANG (Merespon Setingan Admin Nanti) */}
              {selectedSurat.wajib_datang && (
                <div 
                  className="bg-yellow-50 border-b border-yellow-200 p-6 md:p-8 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  <div 
                    className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  >
                    ⚠️
                  </div>
                  <div>
                    <h4 
                      className="font-black text-yellow-900 text-lg mb-1"
                    >
                      Peringatan: Dokumen Asli Wajib Dibawa!
                    </h4>
                    <p 
                      className="text-sm text-yellow-800 leading-relaxed"
                    >
                      Surat ini mengharuskan Anda <b>datang langsung ke Balai Desa</b>. Formulir ini hanya berfungsi untuk mendaftarkan antrean dan mempercepat proses. Silakan bawa berkas fisik Anda saat berkunjung.
                    </p>
                  </div>
                </div>
              )}

              <form 
                onSubmit={handleKirimPengajuan} 
                className="p-6 md:p-10 space-y-8"
              >
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label 
                      className="block text-sm font-bold mb-2 text-gray-800"
                    >
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={formWarga.nik} 
                      onChange={(e) => setFormWarga({...formWarga, nik: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-lg" 
                      placeholder="16 Digit NIK KTP Anda"
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-bold mb-2 text-gray-800"
                    >
                      Nama Lengkap (Sesuai KTP)
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formWarga.nama} 
                      onChange={(e) => setFormWarga({...formWarga, nama: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg uppercase" 
                      placeholder="NAMA LENGKAP"
                    />
                  </div>
                </div>

                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label 
                      className="block text-sm font-bold mb-2 text-gray-800"
                    >
                      Nomor WhatsApp Aktif
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={formWarga.no_wa} 
                      onChange={(e) => setFormWarga({...formWarga, no_wa: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-lg text-green-700" 
                      placeholder="Contoh: 08123456789"
                    />
                    <p 
                      className="text-[10px] mt-2 text-gray-500 font-bold"
                    >
                      *Pemberitahuan surat selesai akan dikirimkan ke nomor ini.
                    </p>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-bold mb-2 text-gray-800"
                    >
                      Keperluan / Tujuan Pembuatan Surat
                    </label>
                    <textarea 
                      required 
                      rows={3}
                      value={formWarga.keperluan} 
                      onChange={(e) => setFormWarga({...formWarga, keperluan: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed" 
                      placeholder="Jelaskan secara singkat untuk apa surat ini digunakan..."
                    ></textarea>
                  </div>
                </div>

                {/* AREA UNGGAH PERSYARATAN DINAMIS */}
                {getListSyarat(selectedSurat.syarat).length > 0 && (
                  <div 
                    className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 mt-10"
                  >
                    <h4 
                      className="text-lg font-black text-gray-900 mb-2 border-b border-gray-200 pb-3"
                    >
                      Upload Dokumen Persyaratan
                    </h4>
                    <p 
                      className="text-sm text-gray-600 mb-6"
                    >
                      Silakan unggah foto dokumen persyaratan di bawah ini. Pastikan foto terlihat jelas dan dapat terbaca. (Format yang didukung: JPG, PNG, HEIC).
                    </p>
                    
                    <div 
                      className="space-y-5"
                    >
                      {getListSyarat(selectedSurat.syarat).map((syaratItem: string, idx: number) => {
                        const isUploaded = dokumenSyarat[syaratItem] !== undefined;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                              isUploaded ? "bg-green-50 border-green-200" : "bg-white border-gray-300"
                            }`}
                          >
                            <div 
                              className="flex items-start gap-3"
                            >
                              <span 
                                className="text-xl"
                              >
                                {isUploaded ? "✅" : "📄"}
                              </span>
                              <div>
                                <h5 
                                  className={`font-bold text-sm ${isUploaded ? "text-green-800" : "text-gray-800"}`}
                                >
                                  {syaratItem} <span className="text-red-500">*</span>
                                </h5>
                                <p 
                                  className="text-[10px] text-gray-500 mt-0.5"
                                >
                                  {isUploaded ? "Dokumen berhasil diunggah." : "Silakan ambil foto / pilih file."}
                                </p>
                              </div>
                            </div>
                            
                            <div 
                              className="shrink-0"
                            >
                              {isUploaded ? (
                                <div 
                                  className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-300 group"
                                >
                                  <img 
                                    src={getSafeImageUrl(dokumenSyarat[syaratItem])} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = {...dokumenSyarat};
                                      delete updated[syaratItem];
                                      setDokumenSyarat(updated);
                                    }}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                                  >
                                    Ubah
                                  </button>
                                </div>
                              ) : (
                                <label 
                                  className={`cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg border border-gray-300 transition-colors text-xs flex items-center justify-center gap-2 ${
                                    isUploading ? "opacity-50 pointer-events-none" : ""
                                  }`}
                                >
                                  <span>{isUploading ? "⏳ Uploading..." : "Upload Foto"}</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    required // Wajib diisi agar form tidak bisa disubmit jika ada yang bolong
                                    onChange={(e) => handleUploadDokumenSyarat(e, syaratItem)}
                                    className="hidden" 
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {statusProses.message && (
                  <div 
                    className={`p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${
                      statusProses.type === "error" ? "bg-red-50 text-red-700 border-red-200" 
                      : statusProses.type === "success" ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}
                  >
                    {statusProses.message}
                  </div>
                )}

                <div 
                  className="pt-6 border-t border-gray-100"
                >
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isUploading} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-xl shadow-xl transition-transform transform hover:-translate-y-1 text-lg flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses Pengajuan...
                      </>
                    ) : "Kirim Pengajuan Surat Sekarang"}
                  </button>
                  <p 
                    className="text-center text-xs text-gray-500 font-bold mt-4"
                  >
                    Dengan menekan tombol di atas, Anda menyatakan bahwa data yang diisi adalah benar dan dapat dipertanggungjawabkan.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LayananPublik() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        >
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-red-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN HALAMAN...
          </p>
        </div>
      }
    >
      <LayananContent />
    </Suspense>
  );
}