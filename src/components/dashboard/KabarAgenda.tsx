// src/components/dashboard/KabarAgenda.tsx
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

interface KabarAgendaProps {
  userEmail: string | null;
  activeSubMenu?: string;
}

export default function KabarAgenda({ 
  userEmail, 
  activeSubMenu 
}: KabarAgendaProps) {
  
  const defaultTab = activeSubMenu === "kabar-berita" ? "berita"
                   : activeSubMenu === "kabar-agenda" ? "agenda"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "kabar-hero") setTabAktif("hero");
    else if (activeSubMenu === "kabar-berita") setTabAktif("berita");
    else if (activeSubMenu === "kabar-agenda") setTabAktif("agenda");
  }, [activeSubMenu]);

  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  // ==========================================
  // STATE: HERO
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: BERITA (DATABASE: kabar_desa)
  // ==========================================
  const [dataBerita, setDataBerita] = useState<any[]>([]);
  const [searchBerita, setSearchBerita] = useState("");
  const [pageBerita, setPageBerita] = useState(1);
  const [perPageBerita, setPerPageBerita] = useState(10);
  
  const [isModalBeritaOpen, setIsModalBeritaOpen] = useState(false);
  const [editIdBerita, setEditIdBerita] = useState<string | null>(null);
  
  const [formBerita, setFormBerita] = useState({
    judul: "",
    kategori: "", 
    isi: "",
    tanggal_posting: "",
    link_youtube: "", // Tambahan Link YouTube
    gambar: [] as string[]
  });

  // ==========================================
  // STATE: AGENDA (DATABASE: agenda_desa)
  // ==========================================
  const [dataAgenda, setDataAgenda] = useState<any[]>([]);
  const [searchAgenda, setSearchAgenda] = useState("");
  const [pageAgenda, setPageAgenda] = useState(1);
  const [perPageAgenda, setPerPageAgenda] = useState(10);

  const [isModalAgendaOpen, setIsModalAgendaOpen] = useState(false);
  const [editIdAgenda, setEditIdAgenda] = useState<string | null>(null);
  
  const [formAgenda, setFormAgenda] = useState({
    nama: "",
    tanggal: "",
    lokasi: "",
    link_maps: "" // Tambahan Link Google Maps
  });

  // ==========================================
  // FUNGSI BANTUAN
  // ==========================================
  const toDateTimeLocal = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

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
      const snapHero = await getDoc(doc(db, "pengaturan_web", "kabar_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      const qBerita = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapBerita = await getDocs(qBerita);
      setDataBerita(snapBerita.docs.map(d => ({ id: d.id, ...d.data() })));

      const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "desc"));
      const snapAgenda = await getDocs(qAgenda);
      setDataAgenda(snapAgenda.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data:", error);
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
      await setDoc(doc(db, "pengaturan_web", "kabar_hero"), {
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
  // HANDLER BERITA (KABAR DESA)
  // ==========================================
  // PERBAIKAN: Fungsi Toggle Play/Pause Berita ke Slider (Maks 15)
  const togglePlayBerita = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      const jumlahDiPlay = dataBerita.filter(b => b.is_pinned === true).length;
      if (jumlahDiPlay >= 15) {
        alert("⚠️ BATAS SLIDER PENUH!\n\nAnda sudah memutar (Play) 15 berita di Slider Beranda Utama.\n\nSilakan hentikan (Pause) salah satu berita lama terlebih dahulu untuk menggantikannya dengan berita ini.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "kabar_desa", id), {
        is_pinned: !currentStatus
      });
      ambilData();
    } catch (error) {
      console.error("Gagal update status play:", error);
    }
  };

  const bukaModalBerita = (item: any = null) => {
    if (item) {
      setEditIdBerita(item.id);
      let existingImages: string[] = [];
      if (Array.isArray(item.gambar)) {
        existingImages = item.gambar;
      } else if (typeof item.gambar === "string" && item.gambar.trim() !== "") {
        existingImages = [item.gambar];
      }

      setFormBerita({
        judul: item.judul || "",
        kategori: item.kategori || "Umum",
        isi: item.isi || "",
        tanggal_posting: toDateTimeLocal(item.tanggal_posting || new Date().toISOString()),
        link_youtube: item.link_youtube || "",
        gambar: existingImages
      });
    } else {
      setEditIdBerita(null);
      setFormBerita({
        judul: "",
        kategori: "",
        isi: "",
        tanggal_posting: toDateTimeLocal(new Date().toISOString()),
        link_youtube: "",
        gambar: []
      });
    }
    setIsModalBeritaOpen(true);
  };

  const handleUploadDaftarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingFoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFotoKeCloudinary(files[i]);
        if (url) uploadedUrls.push(url);
      }
      setFormBerita(prev => ({
        ...prev,
        gambar: [...prev.gambar, ...uploadedUrls]
      }));
    } catch (error) {
      console.error("Gagal mengunggah foto", error);
    } finally {
      setIsUploadingFoto(false);
      e.target.value = ""; 
    }
  };

  const handleHapusSatuFoto = async (urlHapus: string, indexToRemove: number) => {
    if (!confirm("Yakin ingin menghapus foto ini?")) return;
    const updatedImages = formBerita.gambar.filter((_, idx) => idx !== indexToRemove);
    setFormBerita(prev => ({ ...prev, gambar: updatedImages }));
    await hapusFotoDiCloudinary(urlHapus);
  };

  const simpanBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Berita...");
    
    try {
      const isoDate = new Date(formBerita.tanggal_posting).toISOString();
      const payload = { 
        judul: formBerita.judul,
        kategori: formBerita.kategori,
        isi: formBerita.isi,
        tanggal_posting: isoDate,
        link_youtube: formBerita.link_youtube,
        gambar: formBerita.gambar,
        penulis: userEmail,
        is_featured: false
      };

      if (editIdBerita) {
        await updateDoc(doc(db, "kabar_desa", editIdBerita), payload);
      } else {
        await addDoc(collection(db, "kabar_desa"), {
          ...payload,
          is_pinned: false
        });
      }

      setIsModalBeritaOpen(false);
      ambilData();
      setStatusProses("✅ Berita berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan berita.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusBerita = async (id: string, arrayFoto: string[] | string) => {
    if (confirm("Hapus berita ini permanen?")) {
      if (Array.isArray(arrayFoto)) {
        for (const url of arrayFoto) await hapusFotoDiCloudinary(url);
      } else if (typeof arrayFoto === "string" && arrayFoto !== "") {
        await hapusFotoDiCloudinary(arrayFoto);
      }
      await deleteDoc(doc(db, "kabar_desa", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER AGENDA (AGENDA DESA)
  // ==========================================
  const bukaModalAgenda = (item: any = null) => {
    if (item) {
      setEditIdAgenda(item.id);
      setFormAgenda({
        nama: item.nama || "",
        tanggal: toDateTimeLocal(item.tanggal || new Date().toISOString()),
        lokasi: item.lokasi || "",
        link_maps: item.link_maps || ""
      });
    } else {
      setEditIdAgenda(null);
      setFormAgenda({
        nama: "",
        tanggal: toDateTimeLocal(new Date().toISOString()),
        lokasi: "",
        link_maps: ""
      });
    }
    setIsModalAgendaOpen(true);
  };

  const simpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Agenda...");
    try {
      const isoDate = new Date(formAgenda.tanggal).toISOString();
      const payload = { 
        nama: formAgenda.nama,
        tanggal: isoDate,
        lokasi: formAgenda.lokasi,
        link_maps: formAgenda.link_maps,
        is_featured: true
      };
      
      if (editIdAgenda) {
        await updateDoc(doc(db, "agenda_desa", editIdAgenda), payload);
      } else {
        await addDoc(collection(db, "agenda_desa"), payload);
      }
      
      setIsModalAgendaOpen(false);
      ambilData();
      setStatusProses("✅ Agenda berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusAgenda = async (id: string) => {
    if (confirm("Hapus agenda ini permanen?")) {
      await deleteDoc(doc(db, "agenda_desa", id));
      ambilData();
    }
  };

  // PERBAIKAN: Fungsi Pembersihan Massal Agenda Kedaluwarsa
  const bersihkanAgendaLama = async (hariLewat: number) => {
    const batasWaktu = new Date();
    batasWaktu.setDate(batasWaktu.getDate() - hariLewat);

    const targetHapus = dataAgenda.filter(a => new Date(a.tanggal) < batasWaktu);
    
    if (targetHapus.length === 0) {
      alert(`Tidak ada agenda yang sudah kedaluwarsa lebih dari ${hariLewat} hari.`);
      return;
    }

    if (confirm(`Ditemukan ${targetHapus.length} agenda usang (melebihi ${hariLewat} hari). Yakin ingin menghapusnya secara permanen dari database?`)) {
      setIsLoading(true);
      setStatusProses("Membersihkan agenda usang...");
      try {
        for (const item of targetHapus) {
          await deleteDoc(doc(db, "agenda_desa", item.id));
        }
        ambilData();
        setStatusProses(`✅ Berhasil membersihkan ${targetHapus.length} agenda usang!`);
        setTimeout(() => setStatusProses(""), 4000);
      } catch (error) {
        setStatusProses("❌ Gagal membersihkan agenda.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ==========================================
  // FILTER & PAGINASI
  // ==========================================
  const filteredBerita = dataBerita.filter((b) => 
    b.judul?.toLowerCase().includes(searchBerita.toLowerCase()) ||
    b.kategori?.toLowerCase().includes(searchBerita.toLowerCase())
  );
  const totalPageBerita = Math.ceil(filteredBerita.length / perPageBerita);
  const paginatedBerita = filteredBerita.slice((pageBerita - 1) * perPageBerita, pageBerita * perPageBerita);

  const filteredAgenda = dataAgenda.filter((a) => 
    a.nama?.toLowerCase().includes(searchAgenda.toLowerCase())
  );
  const totalPageAgenda = Math.ceil(filteredAgenda.length / perPageAgenda);
  const paginatedAgenda = filteredAgenda.slice((pageAgenda - 1) * perPageAgenda, pageAgenda * perPageAgenda);

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
          onClick={() => setTabAktif("berita")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "berita" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📰</span> Manajemen Berita
        </button>
        <button 
          onClick={() => setTabAktif("agenda")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "agenda" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🗓️</span> Manajemen Agenda
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
            <span>🖼️</span> Pengaturan Header Kabar Desa
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
                  {/* PERBAIKAN: Judul menjadi Textarea */}
                  <textarea 
                    required 
                    rows={3}
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold whitespace-pre-wrap leading-tight text-lg" 
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
          TAB 2: MANAJEMEN BERITA (KABAR DESA)
      ========================================== */}
      {tabAktif === "berita" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>📰</span> Daftar Berita Desa
            </h3>
            <button 
              onClick={() => bukaModalBerita()} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Tulis Berita
            </button>
          </div>

          <div 
            className="flex flex-col md:flex-row gap-4 mb-6 relative"
          >
            <div 
              className="relative flex-1"
            >
              <input 
                type="text" 
                placeholder="Cari judul berita atau kategori..." 
                value={searchBerita}
                onChange={(e) => { setSearchBerita(e.target.value); setPageBerita(1); }}
                className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 shadow-sm text-sm"
              />
              <span 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
              >
                🔍
              </span>
            </div>
            
            {/* PERBAIKAN: Fitur Penampil Jumlah Data (Paginasi Fleksibel) */}
            <select 
              value={perPageBerita}
              onChange={(e) => { setPerPageBerita(Number(e.target.value)); setPageBerita(1); }}
              className="p-4 rounded-xl border border-gray-300 bg-gray-50 outline-none font-bold text-sm text-gray-700 shadow-sm shrink-0 cursor-pointer"
            >
              <option value={10}>Tampil 10 Baris</option>
              <option value={20}>Tampil 20 Baris</option>
              <option value={50}>Tampil 50 Baris</option>
            </select>
          </div>

          <div 
            className="space-y-4"
          >
            {paginatedBerita.length === 0 ? (
              <div 
                className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Tidak ada berita ditemukan.
                </p>
              </div>
            ) : (
              paginatedBerita.map((item) => {
                let imgThumb = "";
                if (Array.isArray(item.gambar) && item.gambar.length > 0) {
                  imgThumb = item.gambar[0];
                } else if (typeof item.gambar === "string") {
                  imgThumb = item.gambar;
                }

                return (
                  <div 
                    key={item.id} 
                    className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col"
                  >
                    <h4 
                      className="text-xl font-black text-gray-900 mb-3 leading-tight"
                    >
                      {item.judul}
                    </h4>
                    
                    <div 
                      className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                    >
                      <div 
                        className="flex items-center gap-4 text-xs font-bold text-gray-500"
                      >
                        {imgThumb && (
                          <div 
                            className="w-16 h-12 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0"
                          >
                            <img 
                              src={getSafeImageUrl(imgThumb)} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div 
                          className="flex flex-col gap-1"
                        >
                          <span 
                            className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded w-max"
                          >
                            {item.kategori || "Umum"}
                          </span>
                          <span>
                            {item.tanggal_posting ? new Date(item.tanggal_posting).toLocaleString("id-ID") : "-"} • Oleh: {item.penulis || "-"}
                          </span>
                        </div>
                      </div>

                      <div 
                        className="flex flex-wrap items-center gap-2 mt-2 md:mt-0"
                      >
                        {/* PERBAIKAN: Tombol Play & Pause untuk Slider */}
                        <button 
                          onClick={() => togglePlayBerita(item.id, item.is_pinned)}
                          className={`text-xs font-bold px-4 py-2 rounded-lg border shadow-sm transition-colors flex items-center gap-2 ${
                            item.is_pinned 
                            ? "bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100" 
                            : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                          }`}
                        >
                          {item.is_pinned ? "⏸️ Jeda dari Slider" : "▶️ Putar ke Slider"}
                        </button>
                        
                        <button 
                          onClick={() => bukaModalBerita(item)} 
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => hapusBerita(item.id, item.gambar)} 
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {totalPageBerita > 1 && (
            <div 
              className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200"
            >
              <button 
                onClick={() => setPageBerita(prev => Math.max(prev - 1, 1))}
                disabled={pageBerita === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                ◀ Sebelumnya
              </button>
              <span 
                className="font-bold text-gray-600 text-sm"
              >
                Halaman {pageBerita} dari {totalPageBerita}
              </span>
              <button 
                onClick={() => setPageBerita(prev => Math.min(prev + 1, totalPageBerita))}
                disabled={pageBerita === totalPageBerita}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                Selanjutnya ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: MANAJEMEN AGENDA (AGENDA DESA)
      ========================================== */}
      {tabAktif === "agenda" && (
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
                <span>🗓️</span> Jadwal Agenda Desa
              </h3>
              <p 
                className="text-gray-500 text-xs font-bold"
              >
                Agenda yang sudah lewat akan berwarna abu-abu secara otomatis.
              </p>
            </div>
            <button 
              onClick={() => bukaModalAgenda()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm w-full md:w-auto"
            >
              + Buat Agenda Baru
            </button>
          </div>

          {/* PERBAIKAN: Tombol Pembersih Otomatis (Auto-Delete) */}
          <div 
            className="flex flex-wrap gap-2 mb-6 bg-red-50 p-4 rounded-xl border border-red-100"
          >
            <span 
              className="w-full text-xs font-black text-red-800 mb-1"
            >
              🧹 Pembersihan Agenda Usang (Sekali Klik):
            </span>
            <button 
              onClick={() => bersihkanAgendaLama(1)}
              className="bg-white hover:bg-red-600 hover:text-white border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Hapus yg lewat 1 Hari
            </button>
            <button 
              onClick={() => bersihkanAgendaLama(7)}
              className="bg-white hover:bg-red-600 hover:text-white border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Hapus yg lewat 7 Hari
            </button>
            <button 
              onClick={() => bersihkanAgendaLama(30)}
              className="bg-white hover:bg-red-600 hover:text-white border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Hapus yg lewat 1 Bulan
            </button>
          </div>

          <div 
            className="flex flex-col md:flex-row gap-4 mb-6 relative"
          >
            <div 
              className="relative flex-1"
            >
              <input 
                type="text" 
                placeholder="Cari nama kegiatan agenda..." 
                value={searchAgenda}
                onChange={(e) => { setSearchAgenda(e.target.value); setPageAgenda(1); }}
                className="w-full p-4 pl-12 rounded-xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm text-sm"
              />
              <span 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
              >
                🔍
              </span>
            </div>
            
            {/* Paginasi Fleksibel */}
            <select 
              value={perPageAgenda}
              onChange={(e) => { setPerPageAgenda(Number(e.target.value)); setPageAgenda(1); }}
              className="p-4 rounded-xl border border-gray-300 bg-gray-50 outline-none font-bold text-sm text-gray-700 shadow-sm shrink-0 cursor-pointer"
            >
              <option value={10}>Tampil 10 Baris</option>
              <option value={20}>Tampil 20 Baris</option>
              <option value={50}>Tampil 50 Baris</option>
            </select>
          </div>

          <div 
            className="space-y-4"
          >
            {paginatedAgenda.length === 0 ? (
              <div 
                className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Tidak ada agenda ditemukan.
                </p>
              </div>
            ) : (
              paginatedAgenda.map((item) => {
                // PERBAIKAN: Logika Agenda Kedaluwarsa
                const isExpired = new Date(item.tanggal) < new Date();

                return (
                  <div 
                    key={item.id} 
                    className={`border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 justify-between ${
                      isExpired ? "bg-gray-100 opacity-60 grayscale" : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <h4 
                        className={`text-xl font-black mb-2 ${isExpired ? "text-gray-500 line-through" : "text-gray-900"}`}
                      >
                        {item.nama}
                      </h4>
                      <div 
                        className="text-sm font-bold text-gray-500 flex flex-col gap-1"
                      >
                        <span>
                          <span 
                            className="text-blue-600"
                          >
                            📅
                          </span> 
                          {item.tanggal ? new Date(item.tanggal).toLocaleString("id-ID") : "-"} WIB
                          {isExpired && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 not-italic uppercase tracking-widest">Selesai / Lewat</span>}
                        </span>
                        <span>
                          <span 
                            className="text-red-500"
                          >
                            📍
                          </span> 
                          {item.lokasi}
                        </span>
                      </div>
                    </div>

                    <div 
                      className="flex flex-row md:flex-col justify-end gap-2 shrink-0"
                    >
                      <button 
                        onClick={() => bukaModalAgenda(item)} 
                        className="text-xs bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300 px-4 py-2 rounded-lg font-bold transition-colors w-full"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => hapusAgenda(item.id)} 
                        className="text-xs bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 px-4 py-2 rounded-lg font-bold transition-colors w-full"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {totalPageAgenda > 1 && (
            <div 
              className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200"
            >
              <button 
                onClick={() => setPageAgenda(prev => Math.max(prev - 1, 1))}
                disabled={pageAgenda === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                ◀ Sebelumnya
              </button>
              <span 
                className="font-bold text-gray-600 text-sm"
              >
                Halaman {pageAgenda} dari {totalPageAgenda}
              </span>
              <button 
                onClick={() => setPageAgenda(prev => Math.min(prev + 1, totalPageAgenda))}
                disabled={pageAgenda === totalPageAgenda}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                Selanjutnya ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL BERITA (LEGA & SCROLLABLE)
      ========================================== */}
      {isModalBeritaOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-green-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-3xl font-black text-gray-900"
              >
                {editIdBerita ? "Edit Berita Desa" : "Tulis Berita Baru"}
              </h3>
              <button 
                onClick={() => setIsModalBeritaOpen(false)}
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={simpanBerita} 
              className="space-y-6"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Judul Berita
                </label>
                <input 
                  type="text" 
                  required 
                  value={formBerita.judul} 
                  onChange={(e) => setFormBerita({...formBerita, judul: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 font-bold text-lg" 
                  placeholder="Masukkan judul kabar..."
                />
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Kategori Berita
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formBerita.kategori} 
                    onChange={(e) => setFormBerita({...formBerita, kategori: e.target.value})} 
                    placeholder="Contoh: Pembangunan, Sosial, Pertanian..."
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 font-bold uppercase text-sm" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tanggal & Waktu Publikasi
                  </label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={formBerita.tanggal_posting} 
                    onChange={(e) => setFormBerita({...formBerita, tanggal_posting: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm" 
                  />
                </div>
              </div>

              {/* PERBAIKAN: Input Link YouTube */}
              <div 
                className="bg-red-50 p-6 rounded-2xl border border-red-100"
              >
                <label 
                  className="block text-sm font-black mb-2 text-red-900 flex items-center gap-2"
                >
                  <span className="text-xl">🎥</span> Tautkan Video YouTube (Opsional)
                </label>
                <input 
                  type="url" 
                  value={formBerita.link_youtube} 
                  onChange={(e) => setFormBerita({...formBerita, link_youtube: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-red-200 bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm text-red-600" 
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p 
                  className="text-[10px] text-red-600 mt-2 font-bold"
                >
                  *Masukkan link video YouTube di sini, maka video tersebut akan otomatis terputar di Slider Beranda dan Halaman Baca Berita.
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Isi Berita Lengkap
                </label>
                <textarea 
                  required 
                  rows={10} 
                  value={formBerita.isi} 
                  onChange={(e) => setFormBerita({...formBerita, isi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 leading-relaxed whitespace-pre-wrap text-base"
                  placeholder="Ketikkan teks berita secara lengkap di sini..."
                ></textarea>
              </div>

              <div 
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
              >
                <label 
                  className="block text-sm font-bold mb-4 text-gray-700 border-b border-gray-200 pb-2"
                >
                  Daftar Foto Dokumentasi (Galeri Mini)
                </label>
                
                {formBerita.gambar.length > 0 && (
                  <div 
                    className="flex flex-wrap gap-4 mb-6"
                  >
                    {formBerita.gambar.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 border-gray-300 shadow-sm group"
                      >
                        <img 
                          src={getSafeImageUrl(url)} 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          type="button"
                          onClick={() => handleHapusSatuFoto(url, idx)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span 
                            className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-lg"
                          >
                            ❌ Hapus
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  className="flex flex-col md:flex-row items-center gap-4"
                >
                  <label 
                    className={`cursor-pointer w-full md:w-auto text-center bg-white border border-gray-300 hover:bg-green-50 px-8 py-4 rounded-xl text-sm font-bold text-gray-700 transition-colors shadow-sm flex items-center justify-center gap-2 ${
                      isUploadingFoto ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-xl">📸</span>
                    <span>{isUploadingFoto ? "Mengunggah..." : "Tambah Foto Baru"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleUploadDaftarFoto} 
                      className="hidden" 
                    />
                  </label>
                  <p 
                    className="text-xs text-gray-500 font-bold max-w-sm text-center md:text-left"
                  >
                    *Bisa pilih banyak gambar sekaligus (Multiple Upload). Format HEIC didukung penuh.
                  </p>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalBeritaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploadingFoto} 
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Publikasikan Berita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL AGENDA (SANGAT LEGA)
      ========================================== */}
      {isModalAgendaOpen && (
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
                {editIdAgenda ? "Edit Agenda" : "Buat Agenda Baru"}
              </h3>
              <button 
                onClick={() => setIsModalAgendaOpen(false)}
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanAgenda} 
              className="space-y-6"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Nama Kegiatan
                </label>
                <input 
                  type="text" 
                  required 
                  value={formAgenda.nama} 
                  onChange={(e) => setFormAgenda({...formAgenda, nama: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" 
                  placeholder="Contoh: Rapat Koordinasi Desa..."
                />
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tanggal & Waktu Pelaksanaan
                  </label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={formAgenda.tanggal} 
                    onChange={(e) => setFormAgenda({...formAgenda, tanggal: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Lokasi Fisik
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formAgenda.lokasi} 
                    onChange={(e) => setFormAgenda({...formAgenda, lokasi: e.target.value})} 
                    placeholder="Cth: Balai Desa Kerjo"
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
                  />
                </div>
              </div>

              {/* PERBAIKAN: Input Link Google Maps */}
              <div 
                className="bg-blue-50 p-6 rounded-2xl border border-blue-100"
              >
                <label 
                  className="block text-sm font-black mb-2 text-blue-900 flex items-center gap-2"
                >
                  <span className="text-xl">📍</span> Pin Lokasi Google Maps (Opsional)
                </label>
                <input 
                  type="url" 
                  value={formAgenda.link_maps} 
                  onChange={(e) => setFormAgenda({...formAgenda, link_maps: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-blue-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-blue-600" 
                  placeholder="https://maps.app.goo.gl/..."
                />
                <p 
                  className="text-[10px] text-blue-600 mt-2 font-bold"
                >
                  *Masukkan link Google Maps, maka tombol pencarian lokasi akan otomatis muncul di Halaman Publik.
                </p>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalAgendaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}