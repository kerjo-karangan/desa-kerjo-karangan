// src/app/layanan/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  useSearchParams, 
  useRouter 
} from "next/navigation";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

function LayananContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab") || "buat";
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam === "buat" || tabParam === "cek" || tabParam === "pengaduan") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/layanan?tab=${tab}`);
  };

  const [heroData, setHeroData] = useState({
    judul: "Layanan Warga Mandiri",
    sub: "Pusat pelayanan administrasi persuratan dan kotak pengaduan masyarakat secara daring.",
    bg: ""
  });
  
  const [masterSurat, setMasterSurat] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Layanan Warga Mandiri",
            sub: snapHero.data().sub || "Pusat pelayanan administrasi persuratan secara daring.",
            bg: snapHero.data().bg || ""
          });
        }

        const snapMaster = await getDocs(collection(db, "master_surat"));
        setMasterSurat(snapMaster.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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

  const [formSurat, setFormSurat] = useState({
    jenis_surat: "",
    nik: "",
    nama: "",
    no_wa: "",
    keperluan: ""
  });
  const [statusSurat, setStatusSurat] = useState("");
  const [isSubmittingSurat, setIsSubmittingSurat] = useState(false);

  const handleSubmitSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSurat(true);
    setStatusSurat("Mengirim permohonan surat...");

    try {
      await addDoc(collection(db, "antrean_surat"), {
        jenis_surat: formSurat.jenis_surat,
        nik: formSurat.nik,
        nama: formSurat.nama,
        no_wa: formSurat.no_wa,
        keperluan: formSurat.keperluan,
        status: "Menunggu",
        tanggal_pengajuan: new Date().toISOString(),
        keterangan_admin: ""
      });
      
      setStatusSurat("✅ Permohonan berhasil dikirim! Silakan cek status secara berkala.");
      setFormSurat({ 
        jenis_surat: "", 
        nik: "", 
        nama: "", 
        no_wa: "", 
        keperluan: "" 
      });
      
      setTimeout(() => setStatusSurat(""), 5000);
    } catch (error) {
      setStatusSurat("❌ Gagal mengirim permohonan. Coba lagi.");
    } finally {
      setIsSubmittingSurat(false);
    }
  };

  const [searchNik, setSearchNik] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleCekSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNik) return;
    
    setIsSearching(true);
    try {
      const q = query(
        collection(db, "antrean_surat"), 
        where("nik", "==", searchNik)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setSearchResult([]);
      } else {
        const results = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));
        
        results.sort((a, b) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime());
        setSearchResult(results);
      }
    } catch (error) {
      console.error("Gagal mencari data:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const [formPengaduan, setFormPengaduan] = useState({
    nama: "",
    no_wa: "",
    isi_laporan: ""
  });
  const [fotoPengaduan, setFotoPengaduan] = useState<FileList | null>(null);
  const [statusPengaduan, setStatusPengaduan] = useState("");
  const [isSubmittingPengaduan, setIsSubmittingPengaduan] = useState(false);

  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/cloudinary", { 
        method: "POST", 
        body: formData 
      });
      
      const data = await res.json();
      if (data.success) {
        return data.url;
      }
      throw new Error(data.error);
    } catch (error) {
      return null;
    }
  };

  const handleSubmitPengaduan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPengaduan(true);
    setStatusPengaduan("Mengirim laporan Anda...");

    try {
      let imageUrl = "";
      if (fotoPengaduan && fotoPengaduan.length > 0) {
        setStatusPengaduan("Mengunggah foto bukti...");
        const newBg = await uploadFotoKeCloudinary(fotoPengaduan[0]);
        if (newBg) {
          imageUrl = newBg;
        }
      }

      await addDoc(collection(db, "pengaduan_warga"), {
        nama: formPengaduan.nama,
        no_wa: formPengaduan.no_wa,
        isi_laporan: formPengaduan.isi_laporan,
        foto: imageUrl,
        status: "Belum Dibaca",
        tanggal_masuk: new Date().toISOString()
      });
      
      setStatusPengaduan("✅ Laporan berhasil dikirim dan akan segera ditindaklanjuti.");
      setFormPengaduan({ 
        nama: "", 
        no_wa: "", 
        isi_laporan: "" 
      });
      setFotoPengaduan(null);
      
      const fileInput = document.getElementById("inputFotoPengaduan") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      setTimeout(() => setStatusPengaduan(""), 5000);
    } catch (error) {
      setStatusPengaduan("❌ Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setIsSubmittingPengaduan(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-green-700 font-bold tracking-widest animate-pulse"
        >
          MEMUAT LAYANAN...
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24"
    >
      
      <div 
        className={`relative py-16 md:py-24 text-white overflow-hidden shadow-md transition-colors duration-500 ${
          heroData.bg ? "bg-gray-900" : "bg-green-700"
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
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
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
            className="text-green-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-green-900/50 px-4 py-1.5 rounded-full border border-green-800 backdrop-blur-sm shadow-sm"
          >
            Portal Layanan Terpadu
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
        className="container mx-auto px-4 max-w-5xl relative z-20 -mt-8"
      >
        
        <div 
          className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2 md:gap-4 justify-center mx-auto mb-10"
        >
          <button 
            onClick={() => handleTabChange("buat")} 
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "buat" 
              ? "bg-green-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              📝
            </span> 
            Layanan Surat Mandiri
          </button>
          
          <button 
            onClick={() => handleTabChange("cek")} 
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "cek" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              🔍
            </span> 
            Cek Status Surat
          </button>

          <button 
            onClick={() => handleTabChange("pengaduan")} 
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "pengaduan" 
              ? "bg-red-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              📢
            </span> 
            Kotak Pengaduan
          </button>
        </div>

        {/* ==========================================
            TAB 1: BUAT SURAT MANDIRI
        ========================================== */}
        {activeTab === "buat" && (
          <div 
            className="animate-fade-in max-w-3xl mx-auto"
          >
            <div 
              className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border-t-4 border-green-600"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-2 text-center"
              >
                Form Pengajuan Surat
              </h2>
              <p 
                className="text-gray-500 text-center text-sm mb-8"
              >
                Silakan lengkapi data diri Anda. Surat akan diproses oleh perangkat desa pada jam kerja.
              </p>

              <form 
                onSubmit={handleSubmitSurat} 
                className="space-y-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Pilih Jenis Surat
                  </label>
                  <select 
                    required 
                    value={formSurat.jenis_surat} 
                    onChange={(e) => setFormSurat({...formSurat, jenis_surat: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold text-gray-800"
                  >
                    <option 
                      value="" 
                      disabled
                    >
                      -- Pilih Jenis Dokumen --
                    </option>
                    {masterSurat.map((surat) => (
                      <option 
                        key={surat.id} 
                        value={surat.nama_surat}
                      >
                        {surat.nama_surat}
                      </option>
                    ))}
                  </select>
                </div>

                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label 
                      className="block text-sm font-bold text-gray-700 mb-2"
                    >
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={formSurat.nik} 
                      onChange={(e) => setFormSurat({...formSurat, nik: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono"
                      placeholder="16 Digit NIK Anda"
                    />
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-bold text-gray-700 mb-2"
                    >
                      Nama Lengkap Sesuai KTP
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formSurat.nama} 
                      onChange={(e) => setFormSurat({...formSurat, nama: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all uppercase"
                      placeholder="Nama Lengkap"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Nomor WhatsApp Aktif
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formSurat.no_wa} 
                    onChange={(e) => setFormSurat({...formSurat, no_wa: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono"
                    placeholder="Contoh: 08123456789"
                  />
                  <p 
                    className="text-[10px] text-gray-500 mt-1"
                  >
                    Digunakan jika petugas desa perlu menghubungi Anda.
                  </p>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Tujuan / Keperluan Pembuatan Surat
                  </label>
                  <textarea 
                    required 
                    rows={3} 
                    value={formSurat.keperluan} 
                    onChange={(e) => setFormSurat({...formSurat, keperluan: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Jelaskan secara singkat kegunaan surat ini..."
                  ></textarea>
                </div>

                {statusSurat && (
                  <div 
                    className={`p-4 rounded-xl text-sm font-bold text-center border ${
                      statusSurat.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {statusSurat}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmittingSurat} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-lg"
                >
                  {isSubmittingSurat ? "MENGIRIM..." : "KIRIM PERMOHONAN SURAT"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: CEK STATUS SURAT
        ========================================== */}
        {activeTab === "cek" && (
          <div 
            className="animate-fade-in max-w-3xl mx-auto"
          >
            <div 
              className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border-t-4 border-blue-600"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-2 text-center"
              >
                Lacak Status Surat
              </h2>
              <p 
                className="text-gray-500 text-center text-sm mb-8"
              >
                Masukkan NIK Anda untuk melihat proses pengerjaan surat yang telah Anda ajukan.
              </p>

              <form 
                onSubmit={handleCekSurat} 
                className="flex flex-col md:flex-row gap-4 mb-10"
              >
                <input 
                  type="number" 
                  required 
                  value={searchNik} 
                  onChange={(e) => setSearchNik(e.target.value)} 
                  className="flex-1 p-4 rounded-xl border border-blue-200 bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-center md:text-left text-lg font-bold"
                  placeholder="Masukkan 16 Digit NIK"
                />
                <button 
                  type="submit" 
                  disabled={isSearching} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-xl shadow-md transition-colors"
                >
                  {isSearching ? "Mencari..." : "Cari Data"}
                </button>
              </form>

              {searchResult !== null && (
                <div 
                  className="space-y-4"
                >
                  <h3 
                    className="font-bold text-gray-800 border-b border-gray-100 pb-2"
                  >
                    Hasil Pencarian ({searchResult.length} Dokumen)
                  </h3>
                  
                  {searchResult.length === 0 ? (
                    <div 
                      className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500"
                    >
                      Tidak ditemukan riwayat pengajuan surat dengan NIK tersebut.
                    </div>
                  ) : (
                    searchResult.map((res) => (
                      <div 
                        key={res.id} 
                        className="p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <div 
                          className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4"
                        >
                          <div>
                            <span 
                              className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1"
                            >
                              {new Date(res.tanggal_pengajuan).toLocaleDateString("id-ID", {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </span>
                            <h4 
                              className="font-black text-gray-900 text-lg"
                            >
                              {res.jenis_surat}
                            </h4>
                          </div>
                          <span 
                            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border text-center ${
                              res.status === "Selesai" ? "bg-green-100 text-green-800 border-green-300" :
                              res.status === "Ditolak" ? "bg-red-100 text-red-800 border-red-300" :
                              res.status === "Diproses" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>
                        
                        <div 
                          className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 border border-gray-100"
                        >
                          <span 
                            className="font-bold block mb-1 text-gray-800"
                          >
                            Keperluan:
                          </span>
                          {res.keperluan}
                        </div>

                        {res.keterangan_admin && (
                          <div 
                            className="mt-3 bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-200"
                          >
                            <span 
                              className="font-bold block mb-1 text-blue-900"
                            >
                              Pesan dari Admin Desa:
                            </span>
                            {res.keterangan_admin}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: KOTAK PENGADUAN
        ========================================== */}
        {activeTab === "pengaduan" && (
          <div 
            className="animate-fade-in max-w-3xl mx-auto"
          >
            <div 
              className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border-t-4 border-red-600"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-2 text-center"
              >
                Kotak Pengaduan Warga
              </h2>
              <p 
                className="text-gray-500 text-center text-sm mb-8"
              >
                Sampaikan laporan, kritik, atau saran Anda demi kemajuan Desa. Identitas Anda akan kami rahasiakan.
              </p>

              <form 
                onSubmit={handleSubmitPengaduan} 
                className="space-y-6"
              >
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label 
                      className="block text-sm font-bold text-gray-700 mb-2"
                    >
                      Nama / Inisial (Opsional)
                    </label>
                    <input 
                      type="text" 
                      value={formPengaduan.nama} 
                      onChange={(e) => setFormPengaduan({...formPengaduan, nama: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all uppercase"
                      placeholder="Anonim"
                    />
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-bold text-gray-700 mb-2"
                    >
                      No. WhatsApp (Wajib)
                    </label>
                    {/* PERBAIKAN: Menambahkan 'required' untuk Nomor WA Pengaduan */}
                    <input 
                      type="number" 
                      required 
                      value={formPengaduan.no_wa} 
                      onChange={(e) => setFormPengaduan({...formPengaduan, no_wa: e.target.value})} 
                      className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono"
                      placeholder="Untuk konfirmasi balasan"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Isi Laporan / Pengaduan
                  </label>
                  <textarea 
                    required 
                    rows={5} 
                    value={formPengaduan.isi_laporan} 
                    onChange={(e) => setFormPengaduan({...formPengaduan, isi_laporan: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all leading-relaxed"
                    placeholder="Tuliskan secara detail apa yang ingin Anda laporkan..."
                  ></textarea>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Lampirkan Bukti Foto (Opsional)
                  </label>
                  <label 
                    className="cursor-pointer flex flex-col items-center justify-center py-8 bg-red-50 border-2 border-dashed border-red-300 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                  >
                    <span 
                      className="text-3xl mb-2"
                    >
                      📸
                    </span>
                    <span 
                      className="font-bold text-red-800 text-sm"
                    >
                      Pilih Foto dari Galeri
                    </span>
                    <input 
                      id="inputFotoPengaduan"
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setFotoPengaduan(e.target.files)} 
                      className="hidden" 
                    />
                  </label>
                  {fotoPengaduan && (
                    <div 
                      className="text-xs font-bold text-green-700 p-3 mt-2 bg-green-50 rounded-lg border border-green-200 text-center"
                    >
                      ✅ Foto "{fotoPengaduan[0].name}" siap dikirim.
                    </div>
                  )}
                </div>

                {statusPengaduan && (
                  <div 
                    className={`p-4 rounded-xl text-sm font-bold text-center border ${
                      statusPengaduan.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {statusPengaduan}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmittingPengaduan} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
                >
                  <span>🚀</span> 
                  {isSubmittingPengaduan ? "MENGIRIM LAPORAN..." : "KIRIM PENGADUAN"}
                </button>
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
            className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-green-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN LAYANAN...
          </p>
        </div>
      }
    >
      <LayananContent />
    </Suspense>
  );
}