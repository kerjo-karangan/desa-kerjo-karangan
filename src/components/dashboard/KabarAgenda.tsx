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

  // ==========================================
  // STATE: HERO
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: BERITA
  // ==========================================
  const [dataBerita, setDataBerita] = useState<any[]>([]);
  const [searchBerita, setSearchBerita] = useState("");
  const [pageBerita, setPageBerita] = useState(1);
  const perPageBerita = 10;
  
  const [isModalBeritaOpen, setIsModalBeritaOpen] = useState(false);
  const [editIdBerita, setEditIdBerita] = useState<string | null>(null);
  const [formBerita, setFormBerita] = useState({
    judul: "",
    kategori: "",
    isi_berita: "",
    tanggal: ""
  });
  const [fotoBerita, setFotoBerita] = useState<FileList | null>(null);
  const [fotoBeritaLama, setFotoBeritaLama] = useState("");

  // ==========================================
  // STATE: AGENDA
  // ==========================================
  const [dataAgenda, setDataAgenda] = useState<any[]>([]);
  const [searchAgenda, setSearchAgenda] = useState("");
  const [pageAgenda, setPageAgenda] = useState(1);
  const perPageAgenda = 10;

  const [isModalAgendaOpen, setIsModalAgendaOpen] = useState(false);
  const [editIdAgenda, setEditIdAgenda] = useState<string | null>(null);
  const [formAgenda, setFormAgenda] = useState({
    nama_kegiatan: "",
    tanggal: "",
    waktu: "",
    lokasi: "",
    deskripsi: ""
  });

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

      const qBerita = query(collection(db, "kabar_berita"), orderBy("tanggal", "desc"));
      const snapBerita = await getDocs(qBerita);
      setDataBerita(snapBerita.docs.map(d => ({ id: d.id, ...d.data() })));

      const qAgenda = query(collection(db, "kabar_agenda"), orderBy("tanggal", "desc"));
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
  // HANDLER BERITA & PROTEKSI PIN 10 SLIDE
  // ==========================================
  const togglePinBeranda = async (id: string, currentStatus: boolean) => {
    // PROTEKSI: Cek jumlah pin jika mencoba menambah Pin baru
    if (!currentStatus) {
      const jumlahDiPin = dataBerita.filter(b => b.pin_beranda === true).length;
      if (jumlahDiPin >= 10) {
        alert("⚠️ BATAS MAKSIMAL TERCAPAI!\n\nAnda sudah menyematkan (Pin) 10 berita di Beranda Utama.\n\nSilakan lepas (Unpin) salah satu berita lama terlebih dahulu untuk menggantikannya dengan berita ini.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "kabar_berita", id), {
        pin_beranda: !currentStatus
      });
      ambilData();
    } catch (error) {
      console.error("Gagal pin:", error);
    }
  };

  const bukaModalBerita = (item: any = null) => {
    if (item) {
      setEditIdBerita(item.id);
      setFormBerita({
        judul: item.judul,
        kategori: item.kategori,
        isi_berita: item.isi_berita,
        tanggal: item.tanggal
      });
      setFotoBeritaLama(item.gambar || "");
    } else {
      setEditIdBerita(null);
      setFormBerita({
        judul: "",
        kategori: "",
        isi_berita: "",
        tanggal: new Date().toISOString().split('T')[0]
      });
      setFotoBeritaLama("");
    }
    setFotoBerita(null);
    setIsModalBeritaOpen(true);
  };

  const simpanBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Berita...");
    try {
      let imageUrl = fotoBeritaLama;
      if (fotoBerita && fotoBerita.length > 0) {
        const newImg = await uploadFotoKeCloudinary(fotoBerita[0]);
        if (newImg) {
          if (fotoBeritaLama) await hapusFotoDiCloudinary(fotoBeritaLama);
          imageUrl = newImg;
        }
      }

      const payload = { 
        ...formBerita, 
        gambar: imageUrl,
        penulis: userEmail 
      };

      if (editIdBerita) {
        await updateDoc(doc(db, "kabar_berita", editIdBerita), payload);
      } else {
        await addDoc(collection(db, "kabar_berita"), {
          ...payload,
          pin_beranda: false
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

  const hapusBerita = async (id: string, urlFoto: string) => {
    if (confirm("Hapus berita ini permanen?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "kabar_berita", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER AGENDA
  // ==========================================
  const bukaModalAgenda = (item: any = null) => {
    if (item) {
      setEditIdAgenda(item.id);
      setFormAgenda({
        nama_kegiatan: item.nama_kegiatan,
        tanggal: item.tanggal,
        waktu: item.waktu,
        lokasi: item.lokasi,
        deskripsi: item.deskripsi
      });
    } else {
      setEditIdAgenda(null);
      setFormAgenda({
        nama_kegiatan: "",
        tanggal: new Date().toISOString().split('T')[0],
        waktu: "",
        lokasi: "",
        deskripsi: ""
      });
    }
    setIsModalAgendaOpen(true);
  };

  const simpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Agenda...");
    try {
      const payload = { ...formAgenda, pembuat: userEmail };
      if (editIdAgenda) {
        await updateDoc(doc(db, "kabar_agenda", editIdAgenda), payload);
      } else {
        await addDoc(collection(db, "kabar_agenda"), payload);
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
      await deleteDoc(doc(db, "kabar_agenda", id));
      ambilData();
    }
  };

  // ==========================================
  // FILTER & PAGINASI BERITA
  // ==========================================
  const filteredBerita = dataBerita.filter((b) => 
    b.judul?.toLowerCase().includes(searchBerita.toLowerCase()) ||
    b.kategori?.toLowerCase().includes(searchBerita.toLowerCase())
  );
  const totalPageBerita = Math.ceil(filteredBerita.length / perPageBerita);
  const paginatedBerita = filteredBerita.slice((pageBerita - 1) * perPageBerita, pageBerita * perPageBerita);

  // ==========================================
  // FILTER & PAGINASI AGENDA
  // ==========================================
  const filteredAgenda = dataAgenda.filter((a) => 
    a.nama_kegiatan?.toLowerCase().includes(searchAgenda.toLowerCase())
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
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
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
          TAB 2: MANAJEMEN BERITA
      ========================================== */}
      {tabAktif === "berita" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <div 
            className="flex justify-between items-center mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>📰</span> Daftar Berita Desa
            </h3>
            <button 
              onClick={() => bukaModalBerita()} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm"
            >
              + Tulis Berita
            </button>
          </div>

          <div 
            className="mb-6 relative"
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
              paginatedBerita.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col"
                >
                  {/* Judul Memanjang Bebas di Atas */}
                  <h4 
                    className="text-xl font-black text-gray-900 mb-3 leading-tight"
                  >
                    {item.judul}
                  </h4>
                  
                  <div 
                    className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  >
                    {/* Meta Info (Kiri) */}
                    <div 
                      className="flex items-center gap-4 text-xs font-bold text-gray-500"
                    >
                      {item.gambar && (
                        <div 
                          className="w-16 h-12 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0"
                        >
                          <img 
                            src={item.gambar.startsWith("http") ? item.gambar : `https://wsrv.nl/?url=${item.gambar}`} 
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
                          {item.kategori}
                        </span>
                        <span>
                          {new Date(item.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} • Oleh: {item.penulis}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi (Kanan) */}
                    <div 
                      className="flex items-center gap-2 mt-2 md:mt-0"
                    >
                      <button 
                        onClick={() => togglePinBeranda(item.id, item.pin_beranda)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                          item.pin_beranda ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {item.pin_beranda ? "⭐ Lepas Pin" : "📌 Pin Beranda"}
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
              ))
            )}
          </div>

          {/* Kontrol Paginasi Berita */}
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
          TAB 3: MANAJEMEN AGENDA
      ========================================== */}
      {tabAktif === "agenda" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <div 
            className="flex justify-between items-center mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>🗓️</span> Jadwal Agenda Desa
            </h3>
            <button 
              onClick={() => bukaModalAgenda()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm"
            >
              + Buat Agenda
            </button>
          </div>

          <div 
            className="mb-6 relative"
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
              paginatedAgenda.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 justify-between"
                >
                  <div>
                    <h4 
                      className="text-xl font-black text-gray-900 mb-2"
                    >
                      {item.nama_kegiatan}
                    </h4>
                    <div 
                      className="text-sm font-bold text-gray-500 flex flex-col gap-1"
                    >
                      <span>
                        <span className="text-blue-600">📅</span> {new Date(item.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} • {item.waktu} WIB
                      </span>
                      <span>
                        <span className="text-red-500">📍</span> {item.lokasi}
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
              ))
            )}
          </div>

          {/* Kontrol Paginasi Agenda */}
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
          MODAL BERITA
      ========================================== */}
      {isModalBeritaOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl p-6 md:p-8 my-8 border-t-8 border-green-600"
          >
            <h3 
              className="text-2xl font-black mb-6 text-gray-900"
            >
              {editIdBerita ? "Edit Berita" : "Tulis Berita Baru"}
            </h3>
            <form 
              onSubmit={simpanBerita} 
              className="space-y-5"
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
                />
              </div>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Kategori
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formBerita.kategori} 
                    onChange={(e) => setFormBerita({...formBerita, kategori: e.target.value})} 
                    placeholder="Contoh: Pembangunan, Sosial..."
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 uppercase" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tanggal Publikasi
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={formBerita.tanggal} 
                    onChange={(e) => setFormBerita({...formBerita, tanggal: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 font-bold" 
                  />
                </div>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Isi Berita Lengkap
                </label>
                <textarea 
                  required 
                  rows={8} 
                  value={formBerita.isi_berita} 
                  onChange={(e) => setFormBerita({...formBerita, isi_berita: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500 leading-relaxed whitespace-pre-wrap"
                ></textarea>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Foto Dokumentasi Berita
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFotoBerita(e.target.files)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50" 
                />
                {fotoBeritaLama && (
                  <p 
                    className="text-xs text-green-600 mt-2 font-bold"
                  >
                    ✅ Gambar sudah terpasang. Biarkan kosong jika tidak ingin mengubahnya.
                  </p>
                )}
              </div>
              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalBeritaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {isLoading ? "Menyimpan..." : "Publikasikan Berita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL AGENDA
      ========================================== */}
      {isModalAgendaOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8 border-t-8 border-blue-600"
          >
            <h3 
              className="text-2xl font-black mb-6 text-gray-900"
            >
              {editIdAgenda ? "Edit Agenda" : "Buat Agenda Baru"}
            </h3>
            <form 
              onSubmit={simpanAgenda} 
              className="space-y-5"
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
                  value={formAgenda.nama_kegiatan} 
                  onChange={(e) => setFormAgenda({...formAgenda, nama_kegiatan: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                />
              </div>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Tanggal Pelaksanaan
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={formAgenda.tanggal} 
                    onChange={(e) => setFormAgenda({...formAgenda, tanggal: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Waktu (Jam)
                  </label>
                  <input 
                    type="time" 
                    required 
                    value={formAgenda.waktu} 
                    onChange={(e) => setFormAgenda({...formAgenda, waktu: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                  />
                </div>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Lokasi
                </label>
                <input 
                  type="text" 
                  required 
                  value={formAgenda.lokasi} 
                  onChange={(e) => setFormAgenda({...formAgenda, lokasi: e.target.value})} 
                  placeholder="Cth: Balai Desa Kerjo"
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi / Info Tambahan
                </label>
                <textarea 
                  required 
                  rows={4} 
                  value={formAgenda.deskripsi} 
                  onChange={(e) => setFormAgenda({...formAgenda, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed whitespace-pre-wrap"
                ></textarea>
              </div>
              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalAgendaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
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