// src/components/dashboard/LayananWarga.tsx
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

interface LayananWargaProps {
  userEmail: string | null;
  activeSubMenu?: string;
}

export default function LayananWarga({ 
  userEmail, 
  activeSubMenu 
}: LayananWargaProps) {
  
  const defaultTab = activeSubMenu === "layanan-antrean" ? "antrean"
                   : activeSubMenu === "layanan-master" ? "master"
                   : activeSubMenu === "layanan-pengaduan" ? "pengaduan"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "layanan-hero") setTabAktif("hero");
    else if (activeSubMenu === "layanan-antrean") setTabAktif("antrean");
    else if (activeSubMenu === "layanan-master") setTabAktif("master");
    else if (activeSubMenu === "layanan-pengaduan") setTabAktif("pengaduan");
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
  // STATE: ANTREAN SURAT (antrean_surat)
  // ==========================================
  const [dataAntrean, setDataAntrean] = useState<any[]>([]);
  const [searchAntrean, setSearchAntrean] = useState("");
  
  const [isModalAntreanOpen, setIsModalAntreanOpen] = useState(false);
  const [selectedAntrean, setSelectedAntrean] = useState<any | null>(null);
  const [keteranganAdmin, setKeteranganAdmin] = useState("");
  const [statusAntrean, setStatusAntrean] = useState("");

  // ==========================================
  // STATE: MASTER SURAT (master_surat)
  // ==========================================
  const [dataMaster, setDataMaster] = useState<any[]>([]);
  const [searchMaster, setSearchMaster] = useState("");

  const [isModalMasterOpen, setIsModalMasterOpen] = useState(false);
  const [editIdMaster, setEditIdMaster] = useState<string | null>(null);
  
  const [formMaster, setFormMaster] = useState({
    nama_surat: "",
    keterangan: "",
    syarat: [""] as string[],
    wajib_datang: false
  });

  // ==========================================
  // STATE: PENGADUAN WARGA (pengaduan_warga)
  // ==========================================
  const [dataPengaduan, setDataPengaduan] = useState<any[]>([]);
  const [searchPengaduan, setSearchPengaduan] = useState("");

  const [isModalPengaduanOpen, setIsModalPengaduanOpen] = useState(false);
  const [selectedPengaduan, setSelectedPengaduan] = useState<any | null>(null);
  const [statusPengaduan, setStatusPengaduan] = useState("");
  const [tanggapanAdmin, setTanggapanAdmin] = useState("");

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

  // ==========================================
  // FUNGSI FETCH DATA
  // ==========================================
  const ambilData = async () => {
    try {
      // 1. Fetch Header Layanan
      const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      // 2. Fetch Antrean Surat
      const qAntrean = query(collection(db, "antrean_surat"), orderBy("tanggal_pengajuan", "desc"));
      const snapAntrean = await getDocs(qAntrean);
      setDataAntrean(snapAntrean.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Fetch Master Surat
      const qMaster = query(collection(db, "master_surat"), orderBy("nama_surat", "asc"));
      const snapMaster = await getDocs(qMaster);
      setDataMaster(snapMaster.docs.map(d => ({ id: d.id, ...d.data() })));

      // 4. Fetch Pengaduan Warga (Diurutkan manual di memori untuk menghindari error index)
      const snapPengaduan = await getDocs(collection(db, "pengaduan_warga"));
      const listPengaduan = snapPengaduan.docs.map(d => ({ id: d.id, ...d.data() }));
      listPengaduan.sort((a: any, b: any) => {
        const dateA = a.tanggal || a.tanggal_pengaduan || a.createdAt || "";
        const dateB = b.tanggal || b.tanggal_pengaduan || b.createdAt || "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      setDataPengaduan(listPengaduan);

    } catch (error) {
      console.error("Gagal ambil data layanan:", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // CLOUDINARY UPLOADER & DELETER
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
      await setDoc(doc(db, "pengaturan_web", "layanan_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });
      setHeroBgLama(imageUrl);
      setHeroBgList(null);
      setStatusProses("✅ Header Layanan berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan header.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLER PENGADUAN WARGA
  // ==========================================
  const bukaModalPengaduan = (item: any) => {
    setSelectedPengaduan(item);
    setStatusPengaduan(item.status || "Menunggu");
    setTanggapanAdmin(item.tanggapan_admin || item.keterangan_admin || "");
    setIsModalPengaduanOpen(true);
  };

  const simpanStatusPengaduan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPengaduan) return;

    setIsLoading(true);
    setStatusProses("Menyimpan Tanggapan...");
    try {
      await updateDoc(doc(db, "pengaduan_warga", selectedPengaduan.id), {
        status: statusPengaduan,
        tanggapan_admin: tanggapanAdmin, // Simpan tanggapan
        keterangan_admin: tanggapanAdmin, // Kompatibilitas field lama
        diperbarui_oleh: userEmail,
        tanggal_update: new Date().toISOString()
      });
      setIsModalPengaduanOpen(false);
      ambilData();
      setStatusProses("✅ Tanggapan pengaduan berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan tanggapan.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusPengaduan = async (id: string, fotoBukti: string) => {
    if (confirm("Hapus laporan pengaduan ini permanen?")) {
      if (fotoBukti) {
        await hapusFotoDiCloudinary(fotoBukti);
      }
      await deleteDoc(doc(db, "pengaduan_warga", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER MASTER SURAT
  // ==========================================
  const bukaModalMaster = (item: any = null) => {
    if (item) {
      setEditIdMaster(item.id);
      let parsedSyarat: string[] = [];
      if (Array.isArray(item.syarat)) {
        parsedSyarat = item.syarat;
      } else if (typeof item.syarat === "string") {
        parsedSyarat = item.syarat.split(",").map((s: string) => s.trim()).filter((s: string) => s !== "");
      }
      if (parsedSyarat.length === 0) parsedSyarat = [""];

      setFormMaster({
        nama_surat: item.nama_surat || item.nama || "",
        keterangan: item.keterangan || item.deskripsi || "",
        syarat: parsedSyarat,
        wajib_datang: item.wajib_datang || false
      });
    } else {
      setEditIdMaster(null);
      setFormMaster({
        nama_surat: "",
        keterangan: "",
        syarat: [""],
        wajib_datang: false
      });
    }
    setIsModalMasterOpen(true);
  };

  const handleSyaratChange = (index: number, value: string) => {
    const newSyarat = [...formMaster.syarat];
    newSyarat[index] = value;
    setFormMaster(prev => ({ ...prev, syarat: newSyarat }));
  };

  const addSyaratBaris = () => {
    setFormMaster(prev => ({ ...prev, syarat: [...prev.syarat, ""] }));
  };

  const removeSyaratBaris = (indexToRemove: number) => {
    const newSyarat = formMaster.syarat.filter((_, idx) => idx !== indexToRemove);
    if (newSyarat.length === 0) newSyarat.push("");
    setFormMaster(prev => ({ ...prev, syarat: newSyarat }));
  };

  const simpanMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Master Surat...");
    try {
      const cleanedSyarat = formMaster.syarat.filter(s => s.trim() !== "");
      const payload = { 
        nama_surat: formMaster.nama_surat,
        keterangan: formMaster.keterangan,
        syarat: cleanedSyarat,
        wajib_datang: formMaster.wajib_datang
      };

      if (editIdMaster) {
        await updateDoc(doc(db, "master_surat", editIdMaster), payload);
      } else {
        await addDoc(collection(db, "master_surat"), payload);
      }

      setIsModalMasterOpen(false);
      ambilData();
      setStatusProses("✅ Jenis Surat berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan surat.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusMaster = async (id: string) => {
    if (confirm("Hapus jenis surat ini permanen?")) {
      await deleteDoc(doc(db, "master_surat", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER ANTREAN SURAT
  // ==========================================
  const bukaModalAntrean = (item: any) => {
    setSelectedAntrean(item);
    setStatusAntrean(item.status || "Menunggu");
    setKeteranganAdmin(item.keterangan_admin || "");
    setIsModalAntreanOpen(true);
  };

  const simpanStatusAntrean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAntrean) return;

    setIsLoading(true);
    setStatusProses("Menyimpan Status...");
    try {
      await updateDoc(doc(db, "antrean_surat", selectedAntrean.id), {
        status: statusAntrean,
        keterangan_admin: keteranganAdmin,
        diperbarui_oleh: userEmail,
        tanggal_update: new Date().toISOString()
      });
      setIsModalAntreanOpen(false);
      ambilData();
      setStatusProses("✅ Status antrean diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan status.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusAntrean = async (id: string, dokumenSyarat: any) => {
    if (confirm("Hapus data antrean warga ini permanen?")) {
      if (dokumenSyarat && typeof dokumenSyarat === 'object') {
        for (const key in dokumenSyarat) {
          if (dokumenSyarat[key]) {
            await hapusFotoDiCloudinary(dokumenSyarat[key]);
          }
        }
      }
      await deleteDoc(doc(db, "antrean_surat", id));
      ambilData();
    }
  };

  // ==========================================
  // FILTERING PENCARIAN
  // ==========================================
  const filteredAntrean = dataAntrean.filter((item) => 
    item.nama?.toLowerCase().includes(searchAntrean.toLowerCase()) || 
    item.jenis_surat?.toLowerCase().includes(searchAntrean.toLowerCase()) ||
    item.nik?.includes(searchAntrean)
  );

  const filteredMaster = dataMaster.filter((item) => 
    item.nama_surat?.toLowerCase().includes(searchMaster.toLowerCase()) ||
    item.keterangan?.toLowerCase().includes(searchMaster.toLowerCase())
  );

  const filteredPengaduan = dataPengaduan.filter((item) => 
    item.nama?.toLowerCase().includes(searchPengaduan.toLowerCase()) ||
    item.topik?.toLowerCase().includes(searchPengaduan.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(searchPengaduan.toLowerCase())
  );

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* MENU TAB UTAMA */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Header Layanan
        </button>
        <button 
          onClick={() => setTabAktif("antrean")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "antrean" ? "bg-red-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📋</span> Antrean Surat
        </button>
        <button 
          onClick={() => setTabAktif("master")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "master" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📁</span> Master Surat
        </button>
        {/* FITUR YANG KEMBALI: TAB KOTAK PENGADUAN */}
        <button 
          onClick={() => setTabAktif("pengaduan")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "pengaduan" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📢</span> Kotak Pengaduan
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
            <span>🖼️</span> Pengaturan Header Layanan Warga
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
                    Judul Utama Header (Paragraf)
                  </label>
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
                    Teks Sub-Judul (Deskripsi Singkat)
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={heroSub} 
                    onChange={(e) => setHeroSub(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed whitespace-pre-wrap"
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
                
                {/* PERBAIKAN PREVIEW UPLOAD HEADER */}
                {(heroBgLama || (heroBgList && heroBgList.length > 0)) && (
                  <div 
                    className="relative w-full h-48 md:h-56 rounded-xl overflow-hidden shadow-inner border-2 border-gray-200 group"
                  >
                    <img 
                      src={heroBgList && heroBgList.length > 0 ? URL.createObjectURL(heroBgList[0]) : getSafeImageUrl(heroBgLama)} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => { if(confirm("Hapus background?")) { setHeroBgLama(""); setHeroBgList(null); } }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus Gambar</span>
                    </button>
                  </div>
                )}
                
                <label 
                  className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm"
                >
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-yellow-800 text-sm">
                    {heroBgLama || (heroBgList && heroBgList.length > 0) ? "Pilih Gambar Pengganti" : "Upload Background Baru"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setHeroBgList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
                
                {/* Notifikasi Cerdas */}
                {heroBgList && heroBgList.length > 0 && (
                  <div 
                    className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200 mt-2"
                  >
                    ✅ Gambar baru telah dipilih. Tekan tombol simpan untuk menerapkan.
                  </div>
                )}
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
          TAB 2: DAFTAR ANTREAN SURAT WARGA
      ========================================== */}
      {tabAktif === "antrean" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-red-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h3 
                className="text-2xl font-bold flex items-center gap-2 mb-1"
              >
                <span>📋</span> Daftar Antrean Surat Warga
              </h3>
              <p 
                className="text-gray-500 text-xs font-bold"
              >
                Tinjau pengajuan, periksa kelengkapan dokumen warga, dan ubah status permohonan.
              </p>
            </div>
          </div>

          <div 
            className="mb-6 relative"
          >
            <input 
              type="text" 
              placeholder="Cari nama pemohon, NIK, atau jenis surat..." 
              value={searchAntrean}
              onChange={(e) => setSearchAntrean(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 shadow-sm text-sm"
            />
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            >
              🔍
            </span>
          </div>

          <div 
            className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
          >
            <table 
              className="w-full text-left text-sm whitespace-nowrap"
            >
              <thead 
                className="bg-gray-100 text-gray-700 uppercase font-black text-xs"
              >
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Waktu Pengajuan</th>
                  <th className="px-6 py-4">Pemohon</th>
                  <th className="px-6 py-4">Jenis Surat</th>
                  <th className="px-6 py-4 text-center">Aksi / Detail</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y border-t border-gray-200"
              >
                {filteredAntrean.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={5} 
                      className="px-6 py-10 text-center text-gray-500 font-bold"
                    >
                      Tidak ada antrean surat.
                    </td>
                  </tr>
                ) : (
                  filteredAntrean.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-red-50/50 transition-colors"
                    >
                      <td 
                        className="px-6 py-4"
                      >
                        <span 
                          className={`font-black px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase border ${
                            item.status === "Selesai" ? "bg-green-100 text-green-700 border-green-200" :
                            item.status === "Diproses" ? "bg-blue-100 text-blue-700 border-blue-200" :
                            item.status === "Ditolak" ? "bg-red-100 text-red-700 border-red-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {item.status || "Menunggu"}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 font-mono text-gray-600"
                      >
                        {item.tanggal_pengajuan ? new Date(item.tanggal_pengajuan).toLocaleString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : "-"}
                      </td>
                      <td 
                        className="px-6 py-4"
                      >
                        <div 
                          className="font-black text-gray-900"
                        >
                          {item.nama}
                        </div>
                        <div 
                          className="text-xs text-gray-500 font-mono"
                        >
                          NIK: {item.nik}
                        </div>
                      </td>
                      <td 
                        className="px-6 py-4 font-bold text-red-700"
                      >
                        {item.jenis_surat}
                      </td>
                      <td 
                        className="px-6 py-4"
                      >
                        <div 
                          className="flex items-center justify-center gap-2"
                        >
                          <button 
                            onClick={() => bukaModalAntrean(item)} 
                            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Tinjau Berkas & Status
                          </button>
                          
                          {item.no_wa && (
                            <a 
                              href={`https://wa.me/${item.no_wa}?text=Halo%20Bpk/Ibu%20${encodeURIComponent(item.nama)},%20kami%20dari%20Admin%20Desa%20ingin%20mengonfirmasi%20pengajuan%20surat%20${encodeURIComponent(item.jenis_surat)}%20Anda.`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-black px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-green-500"
                            >
                              <span>💬</span> Chat WA
                            </a>
                          )}

                          <button 
                            onClick={() => hapusAntrean(item.id, item.dokumen_syarat)} 
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
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
        </div>
      )}

      {/* ==========================================
          TAB 3: MASTER JENIS SURAT (master_surat)
      ========================================== */}
      {tabAktif === "master" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h3 
                className="text-2xl font-bold flex items-center gap-2 mb-1"
              >
                <span>📁</span> Master Jenis Layanan Surat
              </h3>
              <p 
                className="text-gray-500 text-xs font-bold"
              >
                Atur jenis-jenis surat yang dapat diajukan oleh warga secara mandiri di website.
              </p>
            </div>
            <button 
              onClick={() => bukaModalMaster()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Buat Jenis Surat Baru
            </button>
          </div>

          <div 
            className="mb-6 relative"
          >
            <input 
              type="text" 
              placeholder="Cari nama surat..." 
              value={searchMaster}
              onChange={(e) => setSearchMaster(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm text-sm"
            />
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            >
              🔍
            </span>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredMaster.length === 0 ? (
              <div 
                className="col-span-full text-center py-10 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Belum ada master layanan surat.
                </p>
              </div>
            ) : (
              filteredMaster.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-md transition-all flex flex-col group"
                >
                  <h4 
                    className="text-xl font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors"
                  >
                    {item.nama_surat || item.nama}
                  </h4>
                  
                  {item.wajib_datang && (
                    <span 
                      className="bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block w-max mb-3 border border-yellow-200"
                    >
                      ⚠️ Wajib Datang Ke Balai Desa
                    </span>
                  )}
                  
                  <p 
                    className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2"
                  >
                    {item.keterangan || item.deskripsi}
                  </p>
                  
                  <div 
                    className="bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4"
                  >
                    <div 
                      className="text-xs font-bold text-gray-500 mb-1"
                    >
                      Dokumen Persyaratan:
                    </div>
                    <div 
                      className="flex flex-wrap gap-1"
                    >
                      {(Array.isArray(item.syarat) ? item.syarat : (typeof item.syarat === "string" ? item.syarat.split(",") : [])).map((s: string, idx: number) => {
                        const cleanSyarat = s.trim();
                        if (!cleanSyarat) return null;
                        return (
                          <span 
                            key={idx} 
                            className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-gray-700"
                          >
                            {cleanSyarat}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div 
                    className="mt-auto flex gap-2 pt-4 border-t border-gray-100"
                  >
                    <button 
                      onClick={() => bukaModalMaster(item)} 
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      Edit Master
                    </button>
                    <button 
                      onClick={() => hapusMaster(item.id)} 
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: KOTAK PENGADUAN WARGA
      ========================================== */}
      {tabAktif === "pengaduan" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h3 
                className="text-2xl font-bold flex items-center gap-2 mb-1"
              >
                <span>📢</span> Kotak Pengaduan Warga
              </h3>
              <p 
                className="text-gray-500 text-xs font-bold"
              >
                Terima, kelola, dan tindak lanjuti aspirasi serta laporan dari masyarakat.
              </p>
            </div>
          </div>

          <div 
            className="mb-6 relative"
          >
            <input 
              type="text" 
              placeholder="Cari nama pelapor, topik, atau isi laporan..." 
              value={searchPengaduan}
              onChange={(e) => setSearchPengaduan(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm text-sm"
            />
            <span 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
            >
              🔍
            </span>
          </div>

          <div 
            className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
          >
            <table 
              className="w-full text-left text-sm whitespace-nowrap"
            >
              <thead 
                className="bg-gray-100 text-gray-700 uppercase font-black text-xs"
              >
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Nama Pelapor</th>
                  <th className="px-6 py-4">Kategori / Topik</th>
                  <th className="px-6 py-4 text-center">Aksi / Detail</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y border-t border-gray-200"
              >
                {filteredPengaduan.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={5} 
                      className="px-6 py-10 text-center text-gray-500 font-bold"
                    >
                      Tidak ada data laporan pengaduan.
                    </td>
                  </tr>
                ) : (
                  filteredPengaduan.map((item) => {
                    // Pengecekan atribut tanggal yang mungkin berbeda versi lama/baru
                    const tanggalLaporan = item.tanggal || item.tanggal_pengaduan || item.createdAt;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-purple-50/50 transition-colors"
                      >
                        <td 
                          className="px-6 py-4"
                        >
                          <span 
                            className={`font-black px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase border ${
                              item.status === "Selesai" ? "bg-green-100 text-green-700 border-green-200" :
                              item.status === "Diproses" ? "bg-blue-100 text-blue-700 border-blue-200" :
                              item.status === "Ditolak" ? "bg-red-100 text-red-700 border-red-200" :
                              "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {item.status || "Menunggu"}
                          </span>
                        </td>
                        <td 
                          className="px-6 py-4 font-mono text-gray-600"
                        >
                          {tanggalLaporan ? new Date(tanggalLaporan).toLocaleString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : "-"}
                        </td>
                        <td 
                          className="px-6 py-4"
                        >
                          <div 
                            className="font-black text-gray-900"
                          >
                            {item.nama || "Anonim"}
                          </div>
                        </td>
                        <td 
                          className="px-6 py-4 font-bold text-purple-700"
                        >
                          {item.topik || item.kategori || "Laporan Warga"}
                        </td>
                        <td 
                          className="px-6 py-4"
                        >
                          <div 
                            className="flex items-center justify-center gap-2"
                          >
                            <button 
                              onClick={() => bukaModalPengaduan(item)} 
                              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
                            >
                              Tinjau & Tanggapi
                            </button>
                            
                            {item.no_wa && (
                              <a 
                                href={`https://wa.me/${item.no_wa}?text=Halo%20Sdr/i%20${encodeURIComponent(item.nama)},%20kami%20dari%20Admin%20Desa%20ingin%20mengonfirmasi%20laporan%20pengaduan%20Anda%20terkait%20${encodeURIComponent(item.topik || "hal%20tersebut")}.`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-black px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-green-500"
                              >
                                <span>💬</span> Chat WA
                              </a>
                            )}

                            <button 
                              onClick={() => hapusPengaduan(item.id, item.foto || item.lampiran)} 
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TINJAU ANTREAN & BERKAS WARGA
      ========================================== */}
      {isModalAntreanOpen && selectedAntrean && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-red-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                Tinjau Pengajuan: {selectedAntrean.jenis_surat}
              </h3>
              <button 
                onClick={() => setIsModalAntreanOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
            >
              <div 
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4"
              >
                <h4 
                  className="font-black text-gray-800 border-b border-gray-200 pb-2"
                >
                  Data Pemohon
                </h4>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Nama Lengkap:</div>
                  <div className="font-black text-lg text-gray-900">{selectedAntrean.nama}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Nomor NIK:</div>
                  <div className="font-mono font-bold text-gray-800">{selectedAntrean.nik}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">No. WhatsApp:</div>
                  <div className="font-mono font-bold text-green-700">{selectedAntrean.no_wa}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Keperluan Pembuatan:</div>
                  <div className="text-sm font-medium text-gray-800 mt-1 whitespace-pre-wrap">{selectedAntrean.keperluan}</div>
                </div>
              </div>

              <div 
                className="bg-blue-50 p-6 rounded-2xl border border-blue-100"
              >
                <h4 
                  className="font-black text-blue-900 border-b border-blue-200 pb-2 mb-4"
                >
                  Berkas Persyaratan Terlampir
                </h4>
                {selectedAntrean.dokumen_syarat && Object.keys(selectedAntrean.dokumen_syarat).length > 0 ? (
                  <div 
                    className="space-y-4"
                  >
                    {Object.entries(selectedAntrean.dokumen_syarat).map(([namaSyarat, urlGambar]) => (
                      <div 
                        key={namaSyarat} 
                        className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm"
                      >
                        <div 
                          className="font-bold text-sm text-blue-800"
                        >
                          {namaSyarat}
                        </div>
                        <a 
                          href={getSafeImageUrl(urlGambar as string)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                        >
                          <span>🔍</span> Lihat File
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="text-center py-6 text-blue-600/60 font-bold text-sm"
                  >
                    Tidak ada lampiran dokumen untuk surat ini.
                  </div>
                )}
              </div>
            </div>

            <form 
              onSubmit={simpanStatusAntrean} 
              className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm"
            >
              <h4 
                className="font-black text-gray-900 mb-4"
              >
                Pembaruan Status Layanan
              </h4>
              
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
              >
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusAntrean === "Diproses" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Diproses" 
                    checked={statusAntrean === "Diproses"} 
                    onChange={(e) => setStatusAntrean(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">⏳</div>
                  <div className={`font-black text-sm ${statusAntrean === "Diproses" ? "text-blue-700" : "text-gray-500"}`}>Sedang Diproses</div>
                </label>
                
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusAntrean === "Selesai" ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Selesai" 
                    checked={statusAntrean === "Selesai"} 
                    onChange={(e) => setStatusAntrean(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">✅</div>
                  <div className={`font-black text-sm ${statusAntrean === "Selesai" ? "text-green-700" : "text-gray-500"}`}>Surat Selesai / Siap Ambil</div>
                </label>
                
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusAntrean === "Ditolak" ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Ditolak" 
                    checked={statusAntrean === "Ditolak"} 
                    onChange={(e) => setStatusAntrean(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">❌</div>
                  <div className={`font-black text-sm ${statusAntrean === "Ditolak" ? "text-red-700" : "text-gray-500"}`}>Ditolak / Berkas Kurang</div>
                </label>
              </div>

              <div 
                className="mb-6"
              >
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Catatan Tambahan untuk Warga (Opsional)
                </label>
                <textarea 
                  rows={3} 
                  value={keteranganAdmin} 
                  onChange={(e) => setKeteranganAdmin(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm" 
                  placeholder="Beri pesan seperti: Harap membawa pas foto 3x4 saat mengambil surat..."
                ></textarea>
              </div>

              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalAntreanOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Perbarui Status Surat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL MASTER JENIS SURAT (DINAMIS ARRAY)
      ========================================== */}
      {isModalMasterOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-blue-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-3xl font-black text-gray-900"
              >
                {editIdMaster ? "Edit Master Layanan Surat" : "Buat Jenis Surat Baru"}
              </h3>
              <button 
                onClick={() => setIsModalMasterOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanMaster} 
              className="space-y-6"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Nama / Jenis Surat
                </label>
                <input 
                  type="text" 
                  required 
                  value={formMaster.nama_surat} 
                  onChange={(e) => setFormMaster({...formMaster, nama_surat: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl" 
                  placeholder="Cth: Surat Keterangan Tidak Mampu (SKTM)"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi / Penjelasan Singkat
                </label>
                <textarea 
                  required 
                  rows={3} 
                  value={formMaster.keterangan} 
                  onChange={(e) => setFormMaster({...formMaster, keterangan: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 text-base leading-relaxed whitespace-pre-wrap"
                  placeholder="Berikan penjelasan kegunaan surat ini agar warga mengerti..."
                ></textarea>
              </div>

              <div 
                className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 flex items-start gap-4"
              >
                <label 
                  className="relative flex items-center cursor-pointer mt-1"
                >
                  <input 
                    type="checkbox" 
                    checked={formMaster.wajib_datang}
                    onChange={(e) => setFormMaster({...formMaster, wajib_datang: e.target.checked})}
                    className="w-6 h-6 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500 cursor-pointer"
                  />
                </label>
                <div>
                  <h4 
                    className="font-black text-yellow-900 text-lg cursor-pointer"
                    onClick={() => setFormMaster({...formMaster, wajib_datang: !formMaster.wajib_datang})}
                  >
                    Wajib Datang Langsung ke Balai Desa
                  </h4>
                  <p 
                    className="text-sm text-yellow-800 mt-1 leading-relaxed"
                  >
                    Centang ini jika pencetakan surat atau tanda tangan membutuhkan kehadiran fisik warga. Pendaftaran *online* hanya akan difungsikan sebagai sistem "Ambil Nomor Antrean Awal" dan form pengunggahan berkas awal.
                  </p>
                </div>
              </div>

              <div 
                className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200"
              >
                <div 
                  className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4"
                >
                  <div>
                    <h4 
                      className="text-xl font-black text-gray-900"
                    >
                      Daftar Dokumen Persyaratan
                    </h4>
                    <p 
                      className="text-xs text-gray-500 font-bold mt-1"
                    >
                      Setiap baris yang Anda tambahkan di bawah ini akan otomatis menjadi kolom *Upload Foto* di halaman warga.
                    </p>
                  </div>
                </div>

                <div 
                  className="space-y-4"
                >
                  {formMaster.syarat.map((syaratItem, index) => (
                    <div 
                      key={index} 
                      className="flex gap-3 items-center"
                    >
                      <div 
                        className="bg-white w-10 h-14 flex items-center justify-center rounded-xl border border-gray-300 font-black text-gray-400 shrink-0 shadow-sm"
                      >
                        {index + 1}
                      </div>
                      <input 
                        type="text" 
                        value={syaratItem}
                        onChange={(e) => handleSyaratChange(index, e.target.value)}
                        placeholder={`Cth: Fotokopi KTP Pemohon`}
                        className="flex-1 p-4 rounded-xl border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm shadow-sm" 
                      />
                      <button 
                        type="button" 
                        onClick={() => removeSyaratBaris(index)}
                        className="w-14 h-14 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors shadow-sm shrink-0"
                        title="Hapus Syarat"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div 
                  className="mt-6 pt-4 border-t border-gray-200"
                >
                  <button 
                    type="button" 
                    onClick={addSyaratBaris}
                    className="bg-white border-2 border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 font-black px-6 py-3 rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2"
                  >
                    <span>➕</span> Tambah Kolom Persyaratan
                  </button>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalMasterOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Jenis Surat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL TINJAU & TANGGAPI PENGADUAN WARGA
      ========================================== */}
      {isModalPengaduanOpen && selectedPengaduan && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-purple-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900 flex items-center gap-2"
              >
                <span>📢</span> Tinjau Laporan Warga
              </h3>
              <button 
                onClick={() => setIsModalPengaduanOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
            >
              {/* Detail Isi Laporan */}
              <div 
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4"
              >
                <h4 
                  className="font-black text-gray-800 border-b border-gray-200 pb-2"
                >
                  Data Pelapor & Isi Laporan
                </h4>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Nama Lengkap:</div>
                  <div className="font-black text-lg text-gray-900">{selectedPengaduan.nama || "Anonim"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">No. WhatsApp / Kontak:</div>
                  <div className="font-mono font-bold text-purple-700">{selectedPengaduan.no_wa || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Topik / Kategori Masalah:</div>
                  <div className="text-sm font-black text-gray-800 uppercase tracking-widest mt-1 bg-gray-200 px-2 py-1 rounded inline-block">
                    {selectedPengaduan.topik || selectedPengaduan.kategori || "Umum"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold">Deskripsi / Detail Laporan:</div>
                  <div className="text-sm font-medium text-gray-800 mt-1 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                    {selectedPengaduan.isi_laporan || selectedPengaduan.laporan || selectedPengaduan.deskripsi}
                  </div>
                </div>
              </div>

              {/* Bukti Lampiran Laporan */}
              <div 
                className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col"
              >
                <h4 
                  className="font-black text-purple-900 border-b border-purple-200 pb-2 mb-4"
                >
                  Lampiran Foto Bukti Kejadian
                </h4>
                <div 
                  className="flex-1 flex items-center justify-center bg-white rounded-xl border border-purple-200 overflow-hidden relative"
                >
                  {(selectedPengaduan.foto || selectedPengaduan.lampiran) ? (
                    <a 
                      href={getSafeImageUrl(selectedPengaduan.foto || selectedPengaduan.lampiran)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full block group relative"
                    >
                      <img 
                        src={getSafeImageUrl(selectedPengaduan.foto || selectedPengaduan.lampiran)} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-purple-600 text-white font-bold px-4 py-2 rounded-full shadow-lg">🔍 Perbesar Foto</span>
                      </div>
                    </a>
                  ) : (
                    <div 
                      className="text-center text-purple-400 font-bold text-sm py-10"
                    >
                      Tidak ada lampiran foto bukti.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORM UBAH STATUS PENGADUAN */}
            <form 
              onSubmit={simpanStatusPengaduan} 
              className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm"
            >
              <h4 
                className="font-black text-gray-900 mb-4"
              >
                Tindak Lanjut & Pembaruan Status
              </h4>
              
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
              >
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusPengaduan === "Diproses" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Diproses" 
                    checked={statusPengaduan === "Diproses"} 
                    onChange={(e) => setStatusPengaduan(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">🔍</div>
                  <div className={`font-black text-sm ${statusPengaduan === "Diproses" ? "text-blue-700" : "text-gray-500"}`}>Laporan Sedang Diproses</div>
                </label>
                
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusPengaduan === "Selesai" ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Selesai" 
                    checked={statusPengaduan === "Selesai"} 
                    onChange={(e) => setStatusPengaduan(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">✅</div>
                  <div className={`font-black text-sm ${statusPengaduan === "Selesai" ? "text-green-700" : "text-gray-500"}`}>Masalah Terselesaikan</div>
                </label>
                
                <label 
                  className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                    statusPengaduan === "Ditolak" ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value="Ditolak" 
                    checked={statusPengaduan === "Ditolak"} 
                    onChange={(e) => setStatusPengaduan(e.target.value)} 
                    className="hidden" 
                  />
                  <div className="text-2xl mb-1">❌</div>
                  <div className={`font-black text-sm ${statusPengaduan === "Ditolak" ? "text-red-700" : "text-gray-500"}`}>Laporan Ditolak / Hoaks</div>
                </label>
              </div>

              <div 
                className="mb-6"
              >
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Berikan Tanggapan / Balasan Admin
                </label>
                <textarea 
                  rows={3} 
                  value={tanggapanAdmin} 
                  onChange={(e) => setTanggapanAdmin(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-500 text-sm leading-relaxed" 
                  placeholder="Ketik tanggapan Anda di sini... (Misal: Tim desa sudah meninjau lokasi dan sedang melakukan perbaikan...)"
                ></textarea>
              </div>

              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalPengaduanOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Tutup
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Tanggapan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}