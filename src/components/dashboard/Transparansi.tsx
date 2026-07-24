// src/components/dashboard/Transparansi.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface TransparansiProps {
  userEmail: string | null;
  activeSubMenu?: string;
}

export default function Transparansi({ 
  userEmail, 
  activeSubMenu 
}: TransparansiProps) {
  
  const defaultTab = activeSubMenu === "transparansi-apbdes" ? "apbdes"
                   : activeSubMenu === "transparansi-regulasi" ? "regulasi"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "transparansi-hero") setTabAktif("hero");
    else if (activeSubMenu === "transparansi-apbdes") setTabAktif("apbdes");
    else if (activeSubMenu === "transparansi-regulasi") setTabAktif("regulasi");
  }, [activeSubMenu]);

  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // STATE: HERO
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: APBDES (DATABASE: transparansi_apbdes)
  // ==========================================
  const [dataApbdes, setDataApbdes] = useState<any[]>([]);
  const [isModalApbdesOpen, setIsModalApbdesOpen] = useState(false);
  const [editIdApbdes, setEditIdApbdes] = useState<string | null>(null);
  
  const [formApbdes, setFormApbdes] = useState({
    judul: "",
    tahun: new Date().getFullYear(),
    deskripsi: "",
    link_pdf: "", // Tambahan: Input File Dokumen APBDes
    gambar: ""
  });

  // ==========================================
  // STATE: REGULASI (DATABASE: transparansi_regulasi)
  // ==========================================
  const [dataRegulasi, setDataRegulasi] = useState<any[]>([]);
  const [isModalRegulasiOpen, setIsModalRegulasiOpen] = useState(false);
  const [editIdRegulasi, setEditIdRegulasi] = useState<string | null>(null);
  
  const [formRegulasi, setFormRegulasi] = useState({
    judul: "",
    kategori: "",
    tahun: new Date().getFullYear(),
    deskripsi: "",
    link: "", // Input File Dokumen Regulasi
    foto: "" // Tambahan: Thumbnail Sampul Regulasi
  });

  // ==========================================
  // FUNGSI KONVERSI HEIC -> JPG (WSVR)
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

  // ==========================================
  // FUNGSI FETCH DATA
  // ==========================================
  const ambilData = async () => {
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "transparansi_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      // Fetch APBDes
      const qApbdes = query(collection(db, "transparansi_apbdes"), orderBy("tahun", "desc"));
      const snapApbdes = await getDocs(qApbdes);
      setDataApbdes(snapApbdes.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Regulasi
      const qRegulasi = query(collection(db, "transparansi_regulasi"), orderBy("tahun", "desc"));
      const snapRegulasi = await getDocs(qRegulasi);
      setDataRegulasi(snapRegulasi.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // CLOUDINARY UPLOADER
  // ==========================================
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.url;
      return null;
    } catch (error) {
      return null;
    }
  };

  const hapusFotoDiCloudinary = async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/cloudinary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (error) {}
  };

  // ==========================================
  // HANDLER HERO
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Header...");
    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusProses("Mengunggah gambar...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        if (newBg) {
          if (heroBgLama) await hapusFotoDiCloudinary(heroBgLama);
          imageUrl = newBg;
        }
      }
      await setDoc(doc(db, "pengaturan_web", "transparansi_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });
      setHeroBgLama(imageUrl);
      setHeroBgList(null);
      setStatusProses("✅ Header berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan header.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLER APBDES
  // ==========================================
  const bukaModalApbdes = (item: any = null) => {
    if (item) {
      setEditIdApbdes(item.id);
      setFormApbdes({
        judul: item.judul || "",
        tahun: item.tahun || new Date().getFullYear(),
        deskripsi: item.deskripsi || "",
        link_pdf: item.link_pdf || item.file_url || "", // Mengakomodasi key lama
        gambar: item.gambar || ""
      });
    } else {
      setEditIdApbdes(null);
      setFormApbdes({
        judul: "",
        tahun: new Date().getFullYear(),
        deskripsi: "",
        link_pdf: "",
        gambar: ""
      });
    }
    setIsModalApbdesOpen(true);
  };

  const handleUploadFotoApbdes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFotoKeCloudinary(file);
    if (url) {
      if (formApbdes.gambar) await hapusFotoDiCloudinary(formApbdes.gambar);
      setFormApbdes(prev => ({ ...prev, gambar: url }));
    }
    setIsUploading(false);
  };

  const simpanApbdes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Laporan APBDes...");
    try {
      const payload = { 
        ...formApbdes,
        tahun: Number(formApbdes.tahun),
        tanggal_update: new Date().toISOString(),
        diperbarui_oleh: userEmail
      };
      if (editIdApbdes) {
        await updateDoc(doc(db, "transparansi_apbdes", editIdApbdes), payload);
      } else {
        await addDoc(collection(db, "transparansi_apbdes"), payload);
      }
      setIsModalApbdesOpen(false);
      ambilData();
      setStatusProses("✅ Laporan APBDes berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan APBDes.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusApbdes = async (id: string, urlFoto: string) => {
    if (confirm("Hapus laporan APBDes ini permanen?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "transparansi_apbdes", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER REGULASI & PERDES
  // ==========================================
  const bukaModalRegulasi = (item: any = null) => {
    if (item) {
      setEditIdRegulasi(item.id);
      setFormRegulasi({
        judul: item.judul || "",
        kategori: item.kategori || "",
        tahun: item.tahun || new Date().getFullYear(),
        deskripsi: item.deskripsi || "",
        link: item.link || "",
        foto: item.foto || item.gambar || "" // Mengakomodasi key gambar dari versi sebelumnya
      });
    } else {
      setEditIdRegulasi(null);
      setFormRegulasi({
        judul: "",
        kategori: "",
        tahun: new Date().getFullYear(),
        deskripsi: "",
        link: "",
        foto: ""
      });
    }
    setIsModalRegulasiOpen(true);
  };

  const handleUploadFotoRegulasi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFotoKeCloudinary(file);
    if (url) {
      if (formRegulasi.foto) await hapusFotoDiCloudinary(formRegulasi.foto);
      setFormRegulasi(prev => ({ ...prev, foto: url }));
    }
    setIsUploading(false);
  };

  const simpanRegulasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Dokumen Regulasi...");
    try {
      const payload = { 
        ...formRegulasi,
        tahun: Number(formRegulasi.tahun),
        tanggal_update: new Date().toISOString(),
        diperbarui_oleh: userEmail
      };
      if (editIdRegulasi) {
        await updateDoc(doc(db, "transparansi_regulasi", editIdRegulasi), payload);
      } else {
        await addDoc(collection(db, "transparansi_regulasi"), payload);
      }
      setIsModalRegulasiOpen(false);
      ambilData();
      setStatusProses("✅ Dokumen Regulasi berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan regulasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusRegulasi = async (id: string, urlFoto: string) => {
    if (confirm("Hapus dokumen regulasi ini permanen?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "transparansi_regulasi", id));
      ambilData();
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* MENU SELALU TAMPIL */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Pengaturan Header
        </button>
        <button 
          onClick={() => setTabAktif("apbdes")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "apbdes" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📊</span> Data APBDes
        </button>
        <button 
          onClick={() => setTabAktif("regulasi")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "regulasi" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>⚖️</span> Regulasi & Perdes
        </button>
      </div>

      {statusProses && (
        <div 
          className={`p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${
            statusProses.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {statusProses}
        </div>
      )}

      {/* ==========================================
          TAB 1: HEADER PUBLIK
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
          >
            <span>🖼️</span> Pengaturan Header Transparansi
          </h3>
          <form 
            onSubmit={handleSimpanHero} 
            className="space-y-6"
          >
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div 
                className="space-y-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2"
                  >
                    Judul Header (Mendukung Paragraf / Enter)
                  </label>
                  {/* PERBAIKAN: Judul Header diubah menjadi Textarea */}
                  <textarea 
                    required 
                    rows={3}
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold text-lg whitespace-pre-wrap leading-tight" 
                  ></textarea>
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2"
                  >
                    Teks Sub-Judul
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={heroSub} 
                    onChange={(e) => setHeroSub(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                  ></textarea>
                </div>
              </div>
              <div 
                className="space-y-4"
              >
                <label 
                  className="block text-sm font-bold mb-2"
                >
                  Gambar Background
                </label>
                {heroBgLama && (
                  <div 
                    className="relative w-full h-40 rounded-xl overflow-hidden shadow-sm border border-gray-200 group"
                  >
                    <img 
                      src={getSafeImageUrl(heroBgLama)} 
                      className="w-full h-full object-cover" 
                    />
                    {/* TOMBOL X HAPUS HEADER */}
                    <button 
                      type="button" 
                      onClick={() => { if(confirm("Hapus background?")) setHeroBgLama(""); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus Gambar</span>
                    </button>
                  </div>
                )}
                <label 
                  className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm"
                >
                  <span 
                    className="text-3xl mb-2"
                  >
                    📸
                  </span>
                  <span 
                    className="font-bold text-yellow-800 text-sm"
                  >
                    Upload Background Baru
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setHeroBgList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoading ? "Menyimpan..." : "Simpan Header"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: DATA APBDES (transparansi_apbdes)
      ========================================== */}
      {tabAktif === "apbdes" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>📊</span> Laporan Realisasi APBDes
            </h3>
            <button 
              onClick={() => bukaModalApbdes()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Buat Laporan Baru
            </button>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {dataApbdes.length === 0 ? (
              <div 
                className="col-span-full text-center py-10 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Belum ada data APBDes.
                </p>
              </div>
            ) : (
              dataApbdes.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-all"
                >
                  <div 
                    className="w-full md:w-32 h-32 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0"
                  >
                    {item.gambar ? (
                      <img 
                        src={getSafeImageUrl(item.gambar)} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-4xl text-gray-400"
                      >
                        📊
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex-1 flex flex-col"
                  >
                    <div>
                      <span 
                        className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded"
                      >
                        TAHUN {item.tahun}
                      </span>
                      <h4 
                        className="text-lg font-black text-gray-900 mt-1 mb-2 leading-snug"
                      >
                        {item.judul}
                      </h4>
                      {/* Peringatan jika belum ada link PDF */}
                      {(!item.link_pdf && !item.file_url) && (
                        <p 
                          className="text-[10px] text-red-600 font-bold mb-2 bg-red-50 p-1 rounded"
                        >
                          ⚠️ Link Dokumen PDF belum disematkan.
                        </p>
                      )}
                    </div>
                    <div 
                      className="mt-auto flex gap-2 pt-3 border-t border-gray-200"
                    >
                      <button 
                        onClick={() => bukaModalApbdes(item)} 
                        className="flex-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg border border-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => hapusApbdes(item.id, item.gambar)} 
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg border border-red-200 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: REGULASI & PERDES (transparansi_regulasi)
      ========================================== */}
      {tabAktif === "regulasi" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>⚖️</span> Dokumen Regulasi & Perdes
            </h3>
            <button 
              onClick={() => bukaModalRegulasi()} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Upload Regulasi Baru
            </button>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {dataRegulasi.length === 0 ? (
              <div 
                className="col-span-full text-center py-10 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Belum ada dokumen regulasi.
                </p>
              </div>
            ) : (
              dataRegulasi.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-all"
                >
                  {/* Penampil Thumbnail Regulasi (Jika Ada) */}
                  <div 
                    className="w-full md:w-32 h-32 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0"
                  >
                    {(item.foto || item.gambar) ? (
                      <img 
                        src={getSafeImageUrl(item.foto || item.gambar)} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-4xl text-gray-400"
                      >
                        ⚖️
                      </div>
                    )}
                  </div>

                  <div 
                    className="flex-1 flex flex-col"
                  >
                    <div>
                      <div 
                        className="flex items-center gap-2 mb-1"
                      >
                        <span 
                          className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded"
                        >
                          {item.kategori || "HUKUM"}
                        </span>
                        <span 
                          className="text-gray-500 text-[10px] font-bold"
                        >
                          TH: {item.tahun}
                        </span>
                      </div>
                      <h4 
                        className="text-lg font-black text-gray-900 leading-snug mb-2 line-clamp-2"
                      >
                        {item.judul}
                      </h4>
                      {/* Peringatan jika link belum ada */}
                      {!item.link && (
                        <p 
                          className="text-[10px] text-red-600 font-bold mb-2 bg-red-50 p-1 rounded"
                        >
                          ⚠️ Link Dokumen PDF belum diisi.
                        </p>
                      )}
                    </div>
                    <div 
                      className="mt-auto flex gap-2 pt-3 border-t border-gray-200"
                    >
                      <button 
                        onClick={() => bukaModalRegulasi(item)} 
                        className="flex-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg border border-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => hapusRegulasi(item.id, item.foto || item.gambar)} 
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg border border-red-200 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL APBDES (LEGA & LUAS)
      ========================================== */}
      {isModalApbdesOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          {/* PERBAIKAN: MAX-W-4XL AGAR LEGA */}
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-blue-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-3xl font-black text-gray-900"
              >
                {editIdApbdes ? "Edit Laporan APBDes" : "Buat Laporan APBDes Baru"}
              </h3>
              <button 
                onClick={() => setIsModalApbdesOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanApbdes} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Judul Laporan / Informasi APBDes
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formApbdes.judul} 
                    onChange={(e) => setFormApbdes({...formApbdes, judul: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" 
                    placeholder="Cth: Realisasi APBDes Desa Kerjo Tahun 2024"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tahun Anggaran
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formApbdes.tahun} 
                    onChange={(e) => setFormApbdes({...formApbdes, tahun: Number(e.target.value)})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg text-center" 
                  />
                </div>
              </div>

              {/* FITUR BARU: INPUT LINK DOKUMEN PDF APBDES */}
              <div 
                className="bg-blue-50 p-6 rounded-2xl border border-blue-100"
              >
                <label 
                  className="block text-sm font-black mb-2 text-blue-900 flex items-center gap-2"
                >
                  <span className="text-xl">📄</span> Link Tautan Dokumen PDF (Opsional)
                </label>
                <input 
                  type="url" 
                  value={formApbdes.link_pdf} 
                  onChange={(e) => setFormApbdes({...formApbdes, link_pdf: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-blue-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-blue-700" 
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p 
                  className="text-[10px] text-blue-600 mt-2 font-bold"
                >
                  *Sematkan link Google Drive / Link PDF disini. Warga akan bisa menekan tombol "Lihat Dokumen PDF" di halaman baca selengkapnya.
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Penjelasan Singkat / Rincian
                </label>
                <textarea 
                  required 
                  rows={6} 
                  value={formApbdes.deskripsi} 
                  onChange={(e) => setFormApbdes({...formApbdes, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed whitespace-pre-wrap text-sm"
                ></textarea>
              </div>

              <div 
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
              >
                <label 
                  className="block text-sm font-bold mb-3 text-gray-700"
                >
                  Gambar Grafik / Infografis APBDes
                </label>
                {formApbdes.gambar && (
                  <div 
                    className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-gray-300 mb-4 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(formApbdes.gambar)} 
                      className="w-full h-full object-cover" 
                    />
                    {/* TOMBOL X HAPUS THUMBNAIL (RESPONSIF) */}
                    <button 
                      type="button" 
                      onClick={() => { hapusFotoDiCloudinary(formApbdes.gambar); setFormApbdes(prev => ({...prev, gambar: ""})); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <span className="bg-red-600 px-4 py-2 rounded-full shadow-lg">❌ Hapus Gambar</span>
                    </button>
                  </div>
                )}
                <div 
                  className="flex items-center gap-4"
                >
                  <label 
                    className={`cursor-pointer bg-white border border-gray-300 hover:bg-blue-50 px-6 py-3 rounded-xl text-sm font-bold text-gray-700 transition-colors shadow-sm flex items-center gap-2 ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-xl">📸</span>
                    <span>{isUploading ? "Mengunggah..." : "Pilih Gambar Infografis"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadFotoApbdes} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalApbdesOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan APBDes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL REGULASI & PERDES (LEGA & LUAS)
      ========================================== */}
      {isModalRegulasiOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          {/* PERBAIKAN: MAX-W-4XL AGAR LEGA */}
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-purple-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-3xl font-black text-gray-900"
              >
                {editIdRegulasi ? "Edit Regulasi Desa" : "Buat Regulasi Baru"}
              </h3>
              <button 
                onClick={() => setIsModalRegulasiOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanRegulasi} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div 
                  className="md:col-span-2"
                >
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Judul Dokumen / Perdes
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formRegulasi.judul} 
                    onChange={(e) => setFormRegulasi({...formRegulasi, judul: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg" 
                    placeholder="Cth: Peraturan Desa No 02 Tahun 2024"
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Kategori Regulasi
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formRegulasi.kategori} 
                    onChange={(e) => setFormRegulasi({...formRegulasi, kategori: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-bold uppercase text-sm" 
                    placeholder="Cth: SK Kades, Perdes, dsb"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tahun Pengesahan
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formRegulasi.tahun} 
                    onChange={(e) => setFormRegulasi({...formRegulasi, tahun: Number(e.target.value)})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-black text-center text-sm" 
                  />
                </div>
              </div>

              {/* INPUT DOKUMEN PDF (Regulasi) */}
              <div 
                className="bg-purple-50 p-6 rounded-2xl border border-purple-100"
              >
                <label 
                  className="block text-sm font-black mb-2 text-purple-900 flex items-center gap-2"
                >
                  <span className="text-xl">📄</span> Link Tautan Dokumen PDF (Penting)
                </label>
                <input 
                  type="url" 
                  required 
                  value={formRegulasi.link} 
                  onChange={(e) => setFormRegulasi({...formRegulasi, link: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-purple-200 bg-white outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm text-purple-700" 
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p 
                  className="text-[10px] text-purple-600 mt-2 font-bold"
                >
                  *Masukkan link dokumen (Misal link dari Google Drive). Akan tampil sebagai tombol "Lihat Dokumen PDF".
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi / Isi Singkat Dokumen
                </label>
                <textarea 
                  required 
                  rows={6} 
                  value={formRegulasi.deskripsi} 
                  onChange={(e) => setFormRegulasi({...formRegulasi, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed whitespace-pre-wrap text-sm"
                ></textarea>
              </div>

              {/* FITUR BARU: INPUT GAMBAR THUMBNAIL UNTUK REGULASI */}
              <div 
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
              >
                <label 
                  className="block text-sm font-bold mb-3 text-gray-700"
                >
                  Gambar Sampul / Thumbnail Dokumen (Opsional)
                </label>
                {formRegulasi.foto && (
                  <div 
                    className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-gray-300 mb-4 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(formRegulasi.foto)} 
                      className="w-full h-full object-cover" 
                    />
                    {/* TOMBOL X HAPUS THUMBNAIL (RESPONSIF) */}
                    <button 
                      type="button" 
                      onClick={() => { hapusFotoDiCloudinary(formRegulasi.foto); setFormRegulasi(prev => ({...prev, foto: ""})); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <span className="bg-red-600 px-4 py-2 rounded-full shadow-lg">❌ Hapus Gambar</span>
                    </button>
                  </div>
                )}
                <div 
                  className="flex items-center gap-4"
                >
                  <label 
                    className={`cursor-pointer bg-white border border-gray-300 hover:bg-purple-50 px-6 py-3 rounded-xl text-sm font-bold text-gray-700 transition-colors shadow-sm flex items-center gap-2 ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-xl">📸</span>
                    <span>{isUploading ? "Mengunggah..." : "Pilih Gambar Sampul"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadFotoRegulasi} 
                      className="hidden" 
                    />
                  </label>
                  <p 
                    className="text-[10px] text-gray-500 font-bold"
                  >
                    *Memberikan gambar sampul akan membuat tampilan Regulasi lebih menarik dan setara dengan APBDes.
                  </p>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalRegulasiOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Regulasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}