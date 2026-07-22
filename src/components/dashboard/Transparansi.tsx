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
  
  const defaultTab = activeSubMenu === "trans-apbdes" ? "apbdes"
                   : activeSubMenu === "trans-regulasi" ? "regulasi"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "trans-hero") setTabAktif("hero");
    else if (activeSubMenu === "trans-apbdes") setTabAktif("apbdes");
    else if (activeSubMenu === "trans-regulasi") setTabAktif("regulasi");
  }, [activeSubMenu]);

  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE: HERO
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: APBDES
  // ==========================================
  const [dataApbdes, setDataApbdes] = useState<any[]>([]);
  const [searchApbdes, setSearchApbdes] = useState("");
  const [pageApbdes, setPageApbdes] = useState(1);
  const perPageApbdes = 10;
  
  const [isModalApbdesOpen, setIsModalApbdesOpen] = useState(false);
  const [editIdApbdes, setEditIdApbdes] = useState<string | null>(null);
  const [formApbdes, setFormApbdes] = useState({
    judul: "",
    tahun: new Date().getFullYear().toString(),
    deskripsi: ""
  });
  const [gambarApbdes, setGambarApbdes] = useState<FileList | null>(null);
  const [gambarApbdesLama, setGambarApbdesLama] = useState("");

  // ==========================================
  // STATE: REGULASI
  // ==========================================
  const [dataRegulasi, setDataRegulasi] = useState<any[]>([]);
  const [searchRegulasi, setSearchRegulasi] = useState("");
  const [pageRegulasi, setPageRegulasi] = useState(1);
  const perPageRegulasi = 10;

  const [isModalRegulasiOpen, setIsModalRegulasiOpen] = useState(false);
  const [editIdRegulasi, setEditIdRegulasi] = useState<string | null>(null);
  const [formRegulasi, setFormRegulasi] = useState({
    judul: "",
    kategori: "", // Manual input sesuai permintaan
    tahun: new Date().getFullYear().toString(),
    deskripsi: "",
    link: "" // Link GDrive / PDF eksternal
  });

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

      const qApbdes = query(collection(db, "transparansi_apbdes"), orderBy("tahun", "desc"));
      const snapApbdes = await getDocs(qApbdes);
      setDataApbdes(snapApbdes.docs.map(d => ({ id: d.id, ...d.data() })));

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
        judul: item.judul,
        tahun: item.tahun?.toString() || new Date().getFullYear().toString(),
        deskripsi: item.deskripsi || ""
      });
      setGambarApbdesLama(item.gambar || item.foto || item.file_url || ""); // Mengakomodasi format lama
    } else {
      setEditIdApbdes(null);
      setFormApbdes({
        judul: "",
        tahun: new Date().getFullYear().toString(),
        deskripsi: ""
      });
      setGambarApbdesLama("");
    }
    setGambarApbdes(null);
    setIsModalApbdesOpen(true);
  };

  const simpanApbdes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Info Grafis APBDes...");
    try {
      let imageUrl = gambarApbdesLama;
      if (gambarApbdes && gambarApbdes.length > 0) {
        const newImg = await uploadFotoKeCloudinary(gambarApbdes[0]);
        if (newImg) {
          if (gambarApbdesLama) await hapusFotoDiCloudinary(gambarApbdesLama);
          imageUrl = newImg;
        }
      }

      const payload = { 
        ...formApbdes, 
        gambar: imageUrl, // Standarisasi menggunakan field "gambar"
        diperbarui_oleh: userEmail,
        tanggal_update: new Date().toISOString()
      };

      if (editIdApbdes) {
        await updateDoc(doc(db, "transparansi_apbdes", editIdApbdes), payload);
      } else {
        await addDoc(collection(db, "transparansi_apbdes"), payload);
      }

      setIsModalApbdesOpen(false);
      ambilData();
      setStatusProses("✅ APBDes berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan APBDes.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusApbdes = async (id: string, urlFoto: string) => {
    if (confirm("Hapus Info Grafis APBDes ini permanen?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "transparansi_apbdes", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER REGULASI
  // ==========================================
  const bukaModalRegulasi = (item: any = null) => {
    if (item) {
      setEditIdRegulasi(item.id);
      setFormRegulasi({
        judul: item.judul,
        kategori: item.kategori || "",
        tahun: item.tahun?.toString() || new Date().getFullYear().toString(),
        deskripsi: item.deskripsi || "",
        link: item.link || item.file_url || "" // Standarisasi menggunakan field "link"
      });
    } else {
      setEditIdRegulasi(null);
      setFormRegulasi({
        judul: "",
        kategori: "",
        tahun: new Date().getFullYear().toString(),
        deskripsi: "",
        link: ""
      });
    }
    setIsModalRegulasiOpen(true);
  };

  const simpanRegulasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Regulasi...");
    try {
      const payload = { 
        ...formRegulasi, 
        diperbarui_oleh: userEmail,
        tanggal_update: new Date().toISOString()
      };
      
      if (editIdRegulasi) {
        await updateDoc(doc(db, "transparansi_regulasi", editIdRegulasi), payload);
      } else {
        await addDoc(collection(db, "transparansi_regulasi"), payload);
      }

      setIsModalRegulasiOpen(false);
      ambilData();
      setStatusProses("✅ Regulasi berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan regulasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusRegulasi = async (id: string) => {
    if (confirm("Hapus dokumen regulasi ini permanen?")) {
      await deleteDoc(doc(db, "transparansi_regulasi", id));
      ambilData();
    }
  };

  // ==========================================
  // FILTER & PAGINASI APBDES
  // ==========================================
  const filteredApbdes = dataApbdes.filter((b) => 
    b.judul?.toLowerCase().includes(searchApbdes.toLowerCase()) ||
    b.tahun?.toString().includes(searchApbdes.toLowerCase())
  );
  const totalPageApbdes = Math.ceil(filteredApbdes.length / perPageApbdes);
  const paginatedApbdes = filteredApbdes.slice((pageApbdes - 1) * perPageApbdes, pageApbdes * perPageApbdes);

  // ==========================================
  // FILTER & PAGINASI REGULASI
  // ==========================================
  const filteredRegulasi = dataRegulasi.filter((a) => 
    a.judul?.toLowerCase().includes(searchRegulasi.toLowerCase()) ||
    a.kategori?.toLowerCase().includes(searchRegulasi.toLowerCase()) ||
    a.tahun?.toString().includes(searchRegulasi.toLowerCase())
  );
  const totalPageRegulasi = Math.ceil(filteredRegulasi.length / perPageRegulasi);
  const paginatedRegulasi = filteredRegulasi.slice((pageRegulasi - 1) * perPageRegulasi, pageRegulasi * perPageRegulasi);

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
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Pengaturan Header
        </button>
        <button 
          onClick={() => setTabAktif("apbdes")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "apbdes" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📊</span> Data APBDes
        </button>
        <button 
          onClick={() => setTabAktif("regulasi")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
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
            <span>🖼️</span> Pengaturan Header Transparansi Publik
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
                    Judul Header
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold" 
                  />
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
                    className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200"
                  >
                    <img 
                      src={getSafeImageUrl(heroBgLama)} 
                      className="w-full h-full object-cover" 
                    />
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
          TAB 2: DATA APBDES
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
              <span>📊</span> Manajemen APBDes
            </h3>
            <button 
              onClick={() => bukaModalApbdes()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Tambah APBDes
            </button>
          </div>

          <div 
            className="mb-6 relative"
          >
            <input 
              type="text" 
              placeholder="Cari berdasarkan judul atau tahun..." 
              value={searchApbdes}
              onChange={(e) => { setSearchApbdes(e.target.value); setPageApbdes(1); }}
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm text-sm font-bold"
            />
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            >
              🔍
            </span>
          </div>

          <div 
            className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
          >
            <table 
              className="min-w-full text-sm text-left bg-white"
            >
              <thead 
                className="bg-gray-50 border-b border-gray-200"
              >
                <tr>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600 w-24 text-center"
                  >
                    Tahun
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Detail Laporan APBDes
                  </th>
                  <th 
                    className="py-3 px-4 text-center font-bold text-gray-600 w-32"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedApbdes.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={3} 
                      className="text-center py-8 font-bold text-gray-400"
                    >
                      Data APBDes tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedApbdes.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                    >
                      <td 
                        className="py-3 px-4 text-center align-top"
                      >
                        <span 
                          className="bg-blue-100 text-blue-800 font-black px-3 py-1.5 rounded border border-blue-200"
                        >
                          {item.tahun}
                        </span>
                      </td>
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <div 
                          className="flex items-start gap-4"
                        >
                          <div 
                            className="w-16 h-16 rounded border border-gray-200 bg-gray-100 flex-shrink-0 overflow-hidden"
                          >
                            {(item.gambar || item.foto || item.file_url) ? (
                              <img 
                                src={getSafeImageUrl(item.gambar || item.foto || item.file_url)} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center text-xl text-gray-400"
                              >
                                📊
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 
                              className="font-black text-gray-900 text-base mb-1"
                            >
                              {item.judul}
                            </h4>
                            <p 
                              className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
                            >
                              {item.deskripsi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td 
                        className="py-3 px-4 align-top text-center"
                      >
                        <div 
                          className="flex flex-col gap-2 items-center"
                        >
                          <button 
                            onClick={() => bukaModalApbdes(item)} 
                            className="w-[70px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusApbdes(item.id, item.gambar || item.foto || item.file_url)} 
                            className="w-[70px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kontrol Paginasi APBDes */}
          {totalPageApbdes > 1 && (
            <div 
              className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200"
            >
              <button 
                onClick={() => setPageApbdes(prev => Math.max(prev - 1, 1))}
                disabled={pageApbdes === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                ◀ Sebelumnya
              </button>
              <span 
                className="font-bold text-gray-600 text-sm"
              >
                Halaman {pageApbdes} dari {totalPageApbdes}
              </span>
              <button 
                onClick={() => setPageApbdes(prev => Math.min(prev + 1, totalPageApbdes))}
                disabled={pageApbdes === totalPageApbdes}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                Selanjutnya ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: MANAJEMEN REGULASI
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
              <span>⚖️</span> Manajemen Regulasi
            </h3>
            <button 
              onClick={() => bukaModalRegulasi()} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Tambah Regulasi
            </button>
          </div>

          <div 
            className="mb-6 relative"
          >
            <input 
              type="text" 
              placeholder="Cari regulasi berdasarkan judul, kategori, atau tahun..." 
              value={searchRegulasi}
              onChange={(e) => { setSearchRegulasi(e.target.value); setPageRegulasi(1); }}
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm text-sm font-bold"
            />
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            >
              🔍
            </span>
          </div>

          <div 
            className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
          >
            <table 
              className="min-w-full text-sm text-left bg-white"
            >
              <thead 
                className="bg-gray-50 border-b border-gray-200"
              >
                <tr>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600 w-24 text-center"
                  >
                    Tahun
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Detail Dokumen Regulasi
                  </th>
                  <th 
                    className="py-3 px-4 text-center font-bold text-gray-600 w-32"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegulasi.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={3} 
                      className="text-center py-8 font-bold text-gray-400"
                    >
                      Data Regulasi tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedRegulasi.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      <td 
                        className="py-3 px-4 text-center align-top"
                      >
                        <span 
                          className="bg-purple-100 text-purple-800 font-black px-3 py-1.5 rounded border border-purple-200"
                        >
                          {item.tahun}
                        </span>
                      </td>
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <h4 
                          className="font-black text-gray-900 text-base mb-1"
                        >
                          {item.judul}
                        </h4>
                        <span 
                          className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 mb-2 inline-block"
                        >
                          {item.kategori}
                        </span>
                        <p 
                          className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
                        >
                          {item.deskripsi}
                        </p>
                        {item.link || item.file_url ? (
                          <a 
                            href={item.link || item.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline mt-2"
                          >
                            <span>🔗</span> Buka Dokumen Eksternal
                          </a>
                        ) : (
                          <p 
                            className="text-[11px] font-bold text-red-500 mt-2"
                          >
                            Tautan Dokumen Tidak Tersedia
                          </p>
                        )}
                      </td>
                      <td 
                        className="py-3 px-4 align-top text-center"
                      >
                        <div 
                          className="flex flex-col gap-2 items-center"
                        >
                          <button 
                            onClick={() => bukaModalRegulasi(item)} 
                            className="w-[70px] bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusRegulasi(item.id)} 
                            className="w-[70px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kontrol Paginasi Regulasi */}
          {totalPageRegulasi > 1 && (
            <div 
              className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200"
            >
              <button 
                onClick={() => setPageRegulasi(prev => Math.max(prev - 1, 1))}
                disabled={pageRegulasi === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                ◀ Sebelumnya
              </button>
              <span 
                className="font-bold text-gray-600 text-sm"
              >
                Halaman {pageRegulasi} dari {totalPageRegulasi}
              </span>
              <button 
                onClick={() => setPageRegulasi(prev => Math.min(prev + 1, totalPageRegulasi))}
                disabled={pageRegulasi === totalPageRegulasi}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                Selanjutnya ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL APBDES
      ========================================== */}
      {isModalApbdesOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8 border-t-8 border-blue-600"
          >
            <h3 
              className="text-2xl font-black mb-6 text-gray-900"
            >
              {editIdApbdes ? "Edit Info Grafis APBDes" : "Tambah Info Grafis APBDes"}
            </h3>
            <form 
              onSubmit={simpanApbdes} 
              className="space-y-5"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Judul Laporan
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formApbdes.judul} 
                    onChange={(e) => setFormApbdes({...formApbdes, judul: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" 
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
                    onChange={(e) => setFormApbdes({...formApbdes, tahun: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-center" 
                  />
                </div>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea 
                  required 
                  rows={4} 
                  value={formApbdes.deskripsi} 
                  onChange={(e) => setFormApbdes({...formApbdes, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Upload Gambar Info Grafis APBDes
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setGambarApbdes(e.target.files)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50" 
                />
                {gambarApbdesLama && (
                  <p 
                    className="text-xs text-blue-600 mt-2 font-bold"
                  >
                    ✅ Gambar Info Grafis sudah terpasang. Biarkan kosong jika tidak ingin mengubahnya.
                  </p>
                )}
              </div>

              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalApbdesOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {isLoading ? "Menyimpan..." : "Simpan APBDes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL REGULASI
      ========================================== */}
      {isModalRegulasiOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8 border-t-8 border-purple-600"
          >
            <h3 
              className="text-2xl font-black mb-6 text-gray-900"
            >
              {editIdRegulasi ? "Edit Regulasi" : "Tambah Dokumen Regulasi Baru"}
            </h3>
            <form 
              onSubmit={simpanRegulasi} 
              className="space-y-5"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Judul / Nomor Regulasi
                </label>
                <input 
                  type="text" 
                  required 
                  value={formRegulasi.judul} 
                  onChange={(e) => setFormRegulasi({...formRegulasi, judul: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg" 
                  placeholder="Cth: Perdes No. 04 Tahun 2026..."
                />
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Kategori Dokumen (Input Manual)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formRegulasi.kategori} 
                    onChange={(e) => setFormRegulasi({...formRegulasi, kategori: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 uppercase font-bold" 
                    placeholder="Cth: PERDES, SK KADES, LAPORAN..."
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tahun Terbit
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formRegulasi.tahun} 
                    onChange={(e) => setFormRegulasi({...formRegulasi, tahun: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-bold text-center" 
                  />
                </div>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi Singkat / Tentang
                </label>
                <textarea 
                  required 
                  rows={3} 
                  value={formRegulasi.deskripsi} 
                  onChange={(e) => setFormRegulasi({...formRegulasi, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Link Dokumen Eksternal (Google Drive / PDF Link)
                </label>
                <input 
                  type="url" 
                  required 
                  value={formRegulasi.link} 
                  onChange={(e) => setFormRegulasi({...formRegulasi, link: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm text-blue-600" 
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p 
                  className="text-[10px] text-gray-500 mt-1 font-bold"
                >
                  *Pastikan akses link Google Drive telah diatur menjadi "Siapa saja yang memiliki link (Viewer)".
                </p>
              </div>

              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalRegulasiOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors"
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