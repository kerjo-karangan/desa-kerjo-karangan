// src/components/dashboard/KabarAgenda.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface KabarAgendaProps {
  userEmail: string | null;
  activeSubMenu?: string;
}

export default function KabarAgenda({ userEmail, activeSubMenu }: KabarAgendaProps) {
  
  const getLocalDatetime = (d = new Date()) => {
    const tzOffset = d.getTimezoneOffset() * 60000; 
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const defaultTab = activeSubMenu === "kabar-agenda" ? "agenda" 
                   : activeSubMenu === "kabar-hero" ? "hero" 
                   : "berita";
  
  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "kabar-agenda") setTabAktif("agenda");
    else if (activeSubMenu === "kabar-hero") setTabAktif("hero");
    else setTabAktif("berita");
  }, [activeSubMenu]);

  // STATE HEADER/HERO KABAR
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  // STATE KABAR BERITA
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [tanggalKabar, setTanggalKabar] = useState(getLocalDatetime()); 
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]);

  // STATE AGENDA DESA
  const [namaAgenda, setNamaAgenda] = useState("");
  const [tanggalAgenda, setTanggalAgenda] = useState("");
  const [lokasiAgenda, setLokasiAgenda] = useState("");
  const [deskripsiAgenda, setDeskripsiAgenda] = useState(""); 
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [statusAgenda, setStatusAgenda] = useState("");
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
  const [editAgendaId, setEditAgendaId] = useState<string | null>(null); 
  const [batasHapusAgenda, setBatasHapusAgenda] = useState("30"); 
  const [isCleaning, setIsCleaning] = useState(false);

  const ambilData = async () => {
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "kabar_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "Kabar & Agenda Desa");
        setHeroSub(snapHero.data().sub || "Pusat informasi pembangunan dan kegiatan masyarakat.");
        setHeroBgLama(snapHero.data().bg || "");
      }

      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapKabar = await getDocs(qKabar);
      setRiwayatKabar(snapKabar.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));

      const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
      const snapAgenda = await getDocs(qAgenda);
      setDaftarAgenda(snapAgenda.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // METODE BARU: CLOUDINARY UPLOAD DENGAN FORMDATA
  // ==========================================
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData, 
      });
      
      const data = await res.json();
      if (data.success) return data.url;
      throw new Error(data.error);
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  // ==========================================
  // METODE BARU: HAPUS GAMBAR DARI CLOUDINARY
  // ==========================================
  const hapusFotoDiCloudinary = async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/cloudinary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ==========================================
  // MANAJEMEN HEADER/HERO KABAR
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingHero(true);
    setStatusHero("Menyimpan pengaturan Header...");
    
    try {
      let imageUrl = heroBgLama;
      
      if (heroBgList && heroBgList.length > 0) {
        setStatusHero("Mengunggah gambar ke Cloudinary...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        
        if (newBg) {
          if (heroBgLama) {
            await hapusFotoDiCloudinary(heroBgLama);
          }
          imageUrl = newBg;
        } else {
          setStatusHero("❌ Gagal mengunggah gambar.");
          setIsLoadingHero(false); 
          return; 
        }
      }
      
      await setDoc(doc(db, "pengaturan_web", "kabar_hero"), {
        judul: heroJudul, 
        sub: heroSub, 
        bg: imageUrl, 
        terakhir_diperbarui: new Date().toISOString()
      });
      
      setStatusHero("✅ Pengaturan Header Kabar berhasil diperbarui!");
      setHeroBgLama(imageUrl); 
      setHeroBgList(null);
      const input = document.getElementById("inputBgKabar") as HTMLInputElement;
      if (input) input.value = "";
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menyimpan pengaturan.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  const handleHapusBackgroundHero = async () => {
    if (!confirm("Yakin ingin menghapus gambar background secara permanen?")) return;
    setIsLoadingHero(true);
    setStatusHero("Menghapus gambar dari server Cloudinary...");
    
    try {
      if (heroBgLama) {
        await hapusFotoDiCloudinary(heroBgLama);
      }
      
      await setDoc(doc(db, "pengaturan_web", "kabar_hero"), {
        judul: heroJudul, 
        sub: heroSub, 
        bg: "", 
        terakhir_diperbarui: new Date().toISOString()
      });
      
      setHeroBgLama("");
      setStatusHero("✅ Gambar background dihapus.");
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menghapus gambar.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  const pastikanSepuluhTerbaru = async () => {
    try {
      const q = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snap = await getDocs(q);
      const semuaBerita = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const beritaDimainkan = semuaBerita.filter(b => b.is_featured !== false);

      if (beritaDimainkan.length > 10) {
        const unpinnedBeritaDimainkan = beritaDimainkan.filter(b => b.is_pinned !== true);
        const jumlahHarusOff = beritaDimainkan.length - 10;
        
        if (jumlahHarusOff > 0) {
          const beritaUntukDiOff = unpinnedBeritaDimainkan.slice(-jumlahHarusOff);
          const updatePromises = beritaUntukDiOff.map(b => 
            updateDoc(doc(db, "kabar_desa", b.id), { is_featured: false })
          );
          await Promise.all(updatePromises);
          ambilData();
        }
      }
    } catch (error) {
      console.error("Gagal melakukan otomatisasi slider", error);
    }
  };

  // ==========================================
  // MANAJEMEN KABAR BERITA
  // ==========================================
  const handleSimpanKabar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingKabar(true);
    setStatusKabar("Memproses...");
    
    try {
      let tautanGambarBaru: string[] = [];
      
      if (fotoKabarList && fotoKabarList.length > 0) {
        setStatusKabar(`Mengunggah foto ke Cloudinary...`);
        const uploadPromises = Array.from(fotoKabarList).map((file) => uploadFotoKeCloudinary(file));
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter((url) => url !== null) as string[];
      }
      
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];
      const finalTanggalPosting = new Date(tanggalKabar).toISOString();

      if (editKabarId) {
        await updateDoc(doc(db, "kabar_desa", editKabarId), { 
          judul: judulKabar, 
          isi: isiKabar, 
          gambar: gambarFinal, 
          tanggal_posting: finalTanggalPosting 
        });
        setStatusKabar("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "kabar_desa"), {
          judul: judulKabar, 
          isi: isiKabar, 
          gambar: gambarFinal, 
          tanggal_posting: finalTanggalPosting, 
          penulis: userEmail, 
          is_featured: true, 
          is_pinned: false
        });
        setStatusKabar("✅ Dipublikasikan!");
      }
      
      await pastikanSepuluhTerbaru();
      batalEditKabar();
      ambilData();
      setTimeout(() => setStatusKabar(""), 4000);
    } catch (error) {
      setStatusKabar("❌ Gagal menyimpan.");
    } finally {
      setIsLoadingKabar(false);
    }
  };

  const mulaiEditKabar = (item: any) => {
    setEditKabarId(item.id); 
    setJudulKabar(item.judul); 
    setIsiKabar(item.isi);
    setTanggalKabar(item.tanggal_posting ? getLocalDatetime(new Date(item.tanggal_posting)) : getLocalDatetime());
    setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusGambarDariDaftarLama = async (indexGambar: number) => {
    if (!confirm("Yakin menghapus foto ini secara permanen dari server Cloudinary?")) return;
    
    const urlYangDihapus = gambarLama[indexGambar];
    await hapusFotoDiCloudinary(urlYangDihapus);

    const sisaGambar = gambarLama.filter((_, i) => i !== indexGambar);
    setGambarLama(sisaGambar);
    
    if (editKabarId) {
      await updateDoc(doc(db, "kabar_desa", editKabarId), { 
        gambar: sisaGambar 
      });
    }
  };

  const hapusKabar = async (id: string, gambarArray: string[]) => {
    if (!confirm("Yakin hapus berita permanen? Semua foto terkait akan dimusnahkan dari server Cloudinary.")) return;
    
    if (gambarArray && gambarArray.length > 0) {
      for (const url of gambarArray) {
        await hapusFotoDiCloudinary(url);
      }
    }
    
    await deleteDoc(doc(db, "kabar_desa", id));
    ambilData();
  };

  const batalEditKabar = () => {
    setEditKabarId(null); 
    setJudulKabar(""); 
    setIsiKabar(""); 
    setTanggalKabar(getLocalDatetime()); 
    setGambarLama([]); 
    setFotoKabarList(null);
    const input = document.getElementById("inputFotoKabar") as HTMLInputElement;
    if (input) input.value = "";
  };

  const toggleTampilBerita = async (id: string, currentStatus: boolean) => {
    try { 
      await updateDoc(doc(db, "kabar_desa", id), { is_featured: !currentStatus }); 
      await pastikanSepuluhTerbaru(); 
      ambilData(); 
    } catch (error) { 
      alert("Gagal merubah status tampil berita."); 
    }
  };

  const togglePinBerita = async (id: string, currentPinStatus: boolean) => {
    try { 
      await updateDoc(doc(db, "kabar_desa", id), { is_pinned: !currentPinStatus, is_featured: true }); 
      await pastikanSepuluhTerbaru(); 
      ambilData(); 
    } catch (error) { 
      alert("Gagal mengunci berita."); 
    }
  };

  // ==========================================
  // MANAJEMEN AGENDA DESA
  // ==========================================
  const handleSimpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAgenda(true);
    setStatusAgenda("Menyimpan...");
    
    try {
      const dataAgenda = { 
        nama: namaAgenda, 
        tanggal: tanggalAgenda, 
        lokasi: lokasiAgenda, 
        deskripsi: deskripsiAgenda, 
        is_featured: true 
      };
      
      if (editAgendaId) {
        await updateDoc(doc(db, "agenda_desa", editAgendaId), dataAgenda);
        setStatusAgenda("✅ Agenda Diperbarui!");
      } else {
        await addDoc(collection(db, "agenda_desa"), dataAgenda);
        setStatusAgenda("✅ Ditambahkan!");
      }
      
      batalEditAgenda(); 
      ambilData(); 
      setTimeout(() => setStatusAgenda(""), 4000);
    } catch (error) { 
      setStatusAgenda("❌ Gagal menyimpan agenda."); 
    } finally { 
      setIsLoadingAgenda(false); 
    }
  };

  const mulaiEditAgenda = (item: any) => {
    setEditAgendaId(item.id); 
    setNamaAgenda(item.nama); 
    setTanggalAgenda(item.tanggal); 
    setLokasiAgenda(item.lokasi); 
    setDeskripsiAgenda(item.deskripsi || ""); 
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditAgenda = () => {
    setEditAgendaId(null); 
    setNamaAgenda(""); 
    setTanggalAgenda(""); 
    setLokasiAgenda(""); 
    setDeskripsiAgenda("");
  };

  const hapusAgenda = async (id: string) => {
    if (confirm("Hapus agenda ini?")) { 
      await deleteDoc(doc(db, "agenda_desa", id)); 
      ambilData(); 
    }
  };

  const toggleTampilAgenda = async (id: string, currentStatus: boolean) => {
    try { 
      await updateDoc(doc(db, "agenda_desa", id), { is_featured: !currentStatus }); 
      ambilData(); 
    } catch (error) { 
      alert("Gagal merubah status tampil agenda."); 
    }
  };

  const handlePembersihanAgenda = async () => {
    if (!confirm(`Tindakan ini akan menghapus permanen semua agenda yang sudah lewat dari ${batasHapusAgenda} hari. Lanjutkan?`)) return;
    setIsCleaning(true);
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - parseInt(batasHapusAgenda));
      
      let countDeleted = 0;
      const deletePromises = [];
      
      for (const agenda of daftarAgenda) {
        const tglAgenda = new Date(agenda.tanggal);
        if (tglAgenda < limitDate) { 
          deletePromises.push(deleteDoc(doc(db, "agenda_desa", agenda.id))); 
          countDeleted++; 
        }
      }
      
      await Promise.all(deletePromises);
      alert(`✅ Pembersihan Selesai. Berhasil menghapus ${countDeleted} agenda usang.`);
      ambilData();
    } catch (error) { 
      alert("❌ Gagal melakukan pembersihan otomatis."); 
    } finally { 
      setIsCleaning(false); 
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      {!activeSubMenu && (
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setTabAktif("berita")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "berita" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📰</span> Berita
          </button>
          <button 
            onClick={() => setTabAktif("agenda")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "agenda" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📅</span> Agenda
          </button>
        </div>
      )}

      {/* ==========================================
          TAMPILAN HERO
      ========================================== */}
      {tabAktif === "hero" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-gray-800 animate-fade-in">
          <h3 className="text-2xl font-bold mb-2">🖼️ Pengaturan Header Kabar Desa</h3>
          <p className="text-gray-500 text-sm mb-6">Sesuaikan gambar background dan teks sambutan khusus di halaman Kabar Publik.</p>
          
          <form onSubmit={handleSimpanHero} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Judul Header</label>
                  <input 
                    type="text" 
                    required 
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 bg-gray-50 focus:bg-white transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Teks Sub-Judul</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={heroSub} 
                    onChange={(e) => setHeroSub(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Gambar Background Header</label>
                
                {heroBgLama && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                    <img 
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                      className="w-full h-full object-cover" 
                      alt="Hero Cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={handleHapusBackgroundHero} 
                        className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 border border-red-500"
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  </div>
                )}
                
                <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-gray-800 text-sm">Upload Background Baru</span>
                  <input 
                    id="inputBgKabar" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setHeroBgList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
                
                {heroBgList && (
                  <div className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200">
                    ✅ Gambar baru siap diunggah.
                  </div>
                )}
              </div>
            </div>
            
            {statusHero && (
              <div className={`p-4 rounded-xl text-sm font-bold text-center border ${statusHero.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
                {statusHero}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoadingHero} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoadingHero ? "Menyimpan..." : "Simpan Header Kabar"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAMPILAN BERITA
      ========================================== */}
      {tabAktif === "berita" && (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500 animate-fade-in">
            <div className="flex justify-between mb-2 border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita Baru"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">Tambahkan berita terbaru, kegiatan, atau pengumuman desa.</p>
              </div>
              {editKabarId && (
                <button 
                  onClick={batalEditKabar} 
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSimpanKabar} className="space-y-5 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-gray-800">Judul Berita Utama</label>
                  <input 
                    type="text" 
                    required 
                    value={judulKabar} 
                    onChange={(e) => setJudulKabar(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all text-lg font-bold" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-gray-800">Tanggal & Waktu Berita</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={tanggalKabar} 
                    onChange={(e) => setTanggalKabar(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all font-bold text-gray-700" 
                  />
                </div>
              </div>
              
              {editKabarId && gambarLama.length > 0 && (
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                  <p className="text-sm font-bold text-orange-900 mb-4">Foto Tersimpan (Klik ikon 'X' merah untuk menghapus permanen):</p>
                  <div className="flex flex-wrap gap-4">
                    {gambarLama.map((url, idx) => (
                      <div key={idx} className="relative w-32 h-32 border-2 border-white rounded-xl overflow-hidden group shadow-md">
                        <img 
                          src={url.startsWith("http") ? url : `https://wsrv.nl/?url=${url}`} 
                          alt="Foto Berita" 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          type="button" 
                          onClick={() => hapusGambarDariDaftarLama(idx)} 
                          className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full text-sm font-black flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800">Tambahkan Foto Baru (Cloudinary)</label>
                <label className="cursor-pointer flex flex-col items-center justify-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all group">
                  <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">📸</span>
                  <span className="font-bold text-gray-700">Klik di sini untuk memilih foto dari perangkat Anda</span>
                  <input 
                    id="inputFotoKabar" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => setFotoKabarList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
                {fotoKabarList && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3 inline-block">
                    <p className="text-sm font-bold text-green-800">✅ {fotoKabarList.length} foto baru siap diunggah.</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800">Isi Lengkap Berita</label>
                <textarea 
                  required 
                  rows={8} 
                  value={isiKabar} 
                  onChange={(e) => setIsiKabar(e.target.value)} 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all leading-relaxed"
                ></textarea>
              </div>
              
              {statusKabar && (
                <div className={`p-4 rounded-xl text-sm font-bold text-center border ${statusKabar.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
                  {statusKabar}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isLoadingKabar} 
                className={`w-full text-white font-bold px-6 py-4 rounded-xl shadow-md transition-all text-lg ${isLoadingKabar ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:-translate-y-1"}`}
              >
                {isLoadingKabar ? "Mengunggah..." : editKabarId ? "Simpan Perubahan" : "Publikasikan Berita Sekarang"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-gray-800">Riwayat Publikasi Berita</h4>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-green-200">Max 10 Berita di Beranda</span>
            </div>
            
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-4 px-4 font-bold text-gray-600">Tanggal Posting</th>
                  <th className="py-4 px-4 font-bold text-gray-600">Judul Berita & Penulis</th>
                  <th className="py-4 px-4 text-center font-bold text-gray-600">Tampil di Beranda?</th>
                  <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayatKabar.map((item) => {
                  const isTampil = item.is_featured !== false; 
                  const isPinned = item.is_pinned === true;
                  const arrGambarHapus = Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : [];
                  
                  return (
                    <tr key={item.id} className={`border-b transition-colors ${isPinned ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-4 px-4 font-medium text-gray-500 whitespace-nowrap">
                        {new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 text-base mb-1">
                          {isPinned && <span className="text-yellow-600 mr-2" title="Selalu Tampil">🔒</span>}
                          {item.judul}
                        </div>
                        <div className="text-xs text-gray-400">Oleh: {item.penulis}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col gap-2 items-center">
                          <button 
                            onClick={() => toggleTampilBerita(item.id, isTampil)} 
                            className={`px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1 w-32 ${isTampil ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"}`}
                          >
                            {isTampil ? "▶️ Dimainkan" : "⏸️ Di-Pause"}
                          </button>
                          <button 
                            onClick={() => togglePinBerita(item.id, isPinned)} 
                            className={`px-4 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition-all w-32 border ${isPinned ? "bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600" : "bg-white text-gray-500 border-gray-300 hover:bg-gray-100"}`}
                          >
                            {isPinned ? "🔒 Tergembok" : "🔓 Gembok Normal"}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col gap-2 items-center">
                          <button 
                            onClick={() => mulaiEditKabar(item)} 
                            className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusKabar(item.id, arrGambarHapus)} 
                            className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Hapus Permanen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {riwayatKabar.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Belum ada berita yang dipublikasikan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==========================================
          TAMPILAN AGENDA
      ========================================== */}
      {tabAktif === "agenda" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-yellow-500 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">📅 Agenda & Kalender Kegiatan Desa</h3>
              <p className="text-gray-500 text-sm">Atur jadwal kegiatan desa yang akan datang agar warga dapat berpartisipasi.</p>
            </div>
            
            <div className="hidden lg:flex items-center gap-3 bg-red-50 p-2.5 rounded-xl border border-red-200 shadow-inner">
              <span className="text-xs font-bold text-red-800">🧹 Auto-Clean Agenda Lewat:</span>
              <select 
                value={batasHapusAgenda} 
                onChange={(e) => setBatasHapusAgenda(e.target.value)} 
                className="text-xs font-bold p-2 rounded-lg outline-none border border-red-300 focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="1">1 Hari</option>
                <option value="7">7 Hari</option>
                <option value="14">14 Hari</option>
                <option value="30">1 Bulan</option>
              </select>
              <button 
                onClick={handlePembersihanAgenda} 
                disabled={isCleaning} 
                className={`text-xs font-bold text-white px-4 py-2 rounded-lg shadow-sm transition-colors ${isCleaning ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
              >
                {isCleaning ? "Membersihkan..." : "Bersihkan Sekarang"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner h-fit">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-yellow-900 text-lg">{editAgendaId ? "✏️ Edit Agenda" : "Tambah Jadwal Baru"}</h4>
                {editAgendaId && (
                  <button 
                    onClick={batalEditAgenda} 
                    className="bg-gray-300 hover:bg-gray-400 text-xs px-3 py-1.5 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                )}
              </div>
              <form onSubmit={handleSimpanAgenda} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Nama Kegiatan / Acara</label>
                  <input 
                    type="text" 
                    required 
                    value={namaAgenda} 
                    onChange={(e) => setNamaAgenda(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal & Waktu Pelaksanaan</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={tanggalAgenda} 
                    onChange={(e) => setTanggalAgenda(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800 font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Lokasi / Tempat</label>
                  <input 
                    type="text" 
                    required 
                    value={lokasiAgenda} 
                    onChange={(e) => setLokasiAgenda(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Deskripsi Singkat (Opsional)</label>
                  <textarea 
                    rows={3} 
                    value={deskripsiAgenda} 
                    onChange={(e) => setDeskripsiAgenda(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 leading-relaxed text-sm"
                  ></textarea>
                </div>
                
                {statusAgenda && (
                  <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">
                    {statusAgenda}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isLoadingAgenda} 
                  className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 shadow-md transition-colors"
                >
                  {isLoadingAgenda ? "Menyimpan..." : editAgendaId ? "Simpan Perubahan Agenda" : "Tambahkan ke Kalender"}
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-2 overflow-x-auto bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4 font-bold text-gray-600">Jadwal Waktu</th>
                    <th className="py-3 px-4 font-bold text-gray-600">Kegiatan, Lokasi & Deskripsi</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-600">Beranda?</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarAgenda.map((agenda) => {
                    const isTampil = agenda.is_featured !== false;
                    const tgl = new Date(agenda.tanggal);
                    const isLewat = tgl < new Date();
                    return (
                      <tr key={agenda.id} className={`border-b transition-colors ${isLewat ? 'bg-gray-100/50' : 'hover:bg-yellow-50'}`}>
                        <td className="py-4 px-4 font-bold text-gray-700 whitespace-nowrap align-top">
                          <span className={isLewat ? 'line-through text-gray-400' : ''}>
                            {tgl.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                          {isLewat && <span className="block text-[10px] text-red-500 font-bold mt-1 uppercase tracking-widest">Telah Lewat</span>}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className={`font-bold text-base ${isLewat ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {agenda.nama}
                          </div>
                          <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${isLewat ? 'text-gray-400' : 'text-yellow-600'}`}>
                            <span>📍</span> {agenda.lokasi}
                          </div>
                          {agenda.deskripsi && (
                            <p className="text-xs text-gray-500 mt-2 italic leading-relaxed border-t border-gray-100 pt-1 line-clamp-2 hover:line-clamp-none">
                              "{agenda.deskripsi}"
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <button 
                            onClick={() => toggleTampilAgenda(agenda.id, isTampil)} 
                            className={`px-3 py-1.5 rounded-md font-bold text-[10px] shadow-sm transition-all flex items-center justify-center gap-1 mx-auto w-24 ${isTampil ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"}`}
                          >
                            {isTampil ? "▶️ Play" : "⏸️ Pause"}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <div className="flex flex-col gap-2 items-center">
                            <button 
                              onClick={() => mulaiEditAgenda(agenda)} 
                              className="w-full max-w-[80px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => hapusAgenda(agenda.id)} 
                              className="w-full max-w-[80px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {daftarAgenda.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        Belum ada jadwal agenda desa yang didaftarkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}