// src/components/dashboard/PengaturanBeranda.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, setDoc, getDoc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function PengaturanBeranda({ userEmail }: { userEmail: string | null }) {
  const getLocalDatetime = (d = new Date()) => {
    const tzOffset = d.getTimezoneOffset() * 60000; 
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // ==========================================
  // STATE PENGATURAN TAMPILAN BERANDA (HERO)
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  // ==========================================
  // STATE MANAJEMEN BERITA
  // ==========================================
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [tanggalKabar, setTanggalKabar] = useState(getLocalDatetime()); // State Tanggal Berita
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLamaKabar, setGambarLamaKabar] = useState<string[]>([]);

  // ==========================================
  // FUNGSI PENGAMBILAN DATA
  // ==========================================
  const ambilData = async () => {
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "beranda"));
      if (snapHero.exists()) {
        setHeroJudul(snapHero.data().judul || "Selamat Datang di\nDesa Kerjo");
        setHeroSub(snapHero.data().sub || "Mewujudkan pelayanan masyarakat yang transparan, inovatif, dan terdigitalisasi.");
        setHeroBgLama(snapHero.data().bg || "https://i.ibb.co.com/YFJVHD07/2239715431.webp");
      }

      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapKabar = await getDocs(qKabar);
      setRiwayatKabar(snapKabar.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // FUNGSI UPLOAD GAMBAR API IMGBB
  // ==========================================
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
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
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { 
        method: "POST", 
        body: formData 
      });
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

  // ==========================================
  // FUNGSI SIMPAN PENGATURAN BERANDA (HERO)
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingHero(true);
    setStatusHero("Menyimpan pengaturan...");
    
    try {
      let imageUrl = heroBgLama;
      
      if (heroBgList && heroBgList.length > 0) {
        setStatusHero("Mengunggah gambar background ke Server ImgBB...");
        const newBg = await uploadFotoKeImgBB(heroBgList[0]);
        if (newBg) {
          imageUrl = newBg;
        } else {
          setStatusHero("❌ Gagal mengunggah gambar. Pastikan internet stabil.");
          setIsLoadingHero(false);
          return; 
        }
      }

      await setDoc(doc(db, "pengaturan_web", "beranda"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });

      setStatusHero("✅ Pengaturan Beranda berhasil diperbarui!");
      setHeroBgLama(imageUrl);
      setHeroBgList(null);
      const input = document.getElementById("inputBgBeranda") as HTMLInputElement;
      if (input) input.value = "";
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menyimpan pengaturan ke Database.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  const hapusGambarBgLama = () => {
    setHeroBgLama("");
  };

  // ==========================================
  // LOGIKA OTOMATIS: MATIKAN BERITA LAMA (MAX 10)
  // ==========================================
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
        setStatusKabar(`Mengunggah foto...`);
        const uploadPromises = Array.from(fotoKabarList).map((file) => uploadFotoKeImgBB(file));
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter((url) => url !== null) as string[];
      }
      const gambarFinal = [...gambarLamaKabar, ...tautanGambarBaru];
      
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
    setGambarLamaKabar(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusGambarDariDaftarLamaKabar = (indexGambar: number) => {
    setGambarLamaKabar((prev) => prev.filter((_, i) => i !== indexGambar));
  };

  const batalEditKabar = () => {
    setEditKabarId(null); 
    setJudulKabar(""); 
    setIsiKabar(""); 
    setTanggalKabar(getLocalDatetime());
    setGambarLamaKabar([]); 
    setFotoKabarList(null);
    const input = document.getElementById("inputFotoKabarBeranda") as HTMLInputElement;
    if (input) input.value = "";
  };

  const hapusKabar = async (id: string) => {
    if (confirm("Yakin hapus berita permanen?")) {
      await deleteDoc(doc(db, "kabar_desa", id));
      ambilData();
    }
  };

  const toggleTampilBerita = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "kabar_desa", id), { is_featured: !currentStatus });
      await pastikanSepuluhTerbaru();
      ambilData();
    } catch (error) { 
      alert("Gagal merubah status tampil."); 
    }
  };

  const togglePinBerita = async (id: string, currentPinStatus: boolean) => {
    try {
      await updateDoc(doc(db, "kabar_desa", id), { 
        is_pinned: !currentPinStatus, 
        is_featured: true 
      });
      await pastikanSepuluhTerbaru();
      ambilData();
    } catch (error) { 
      alert("Gagal mengunci (Pin) berita."); 
    }
  };

  // ==========================================
  // TAMPILAN UI
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* 1. PENGATURAN TAMPILAN BERANDA (HERO) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500">
        <h3 className="text-2xl font-bold mb-2">🖼️ Pengaturan Visual Beranda</h3>
        <p className="text-gray-500 text-sm mb-6">Ubah gambar latar belakang (*background*) dan teks sambutan utama di halaman depan web.</p>
        
        <form onSubmit={handleSimpanHero} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800">Judul Utama (Mendukung baris baru/Enter)</label>
                <textarea 
                  required 
                  rows={3} 
                  value={heroJudul} 
                  onChange={(e) => setHeroJudul(e.target.value)} 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-lg font-black"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800">Teks Sub-Judul (Deskripsi Singkat)</label>
                <textarea 
                  required 
                  rows={4} 
                  value={heroSub} 
                  onChange={(e) => setHeroSub(e.target.value)} 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Gambar Background Beranda</label>
              
              {heroBgLama && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                  <img 
                    src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                    alt="Background Beranda" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button" 
                      onClick={hapusGambarBgLama} 
                      className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 border border-red-500"
                    >
                      Hapus Background
                    </button>
                  </div>
                </div>
              )}

              <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm">
                <span className="text-3xl mb-2">📸</span>
                <span className="font-bold text-yellow-800 text-sm">Ganti Gambar Background Baru</span>
                <input 
                  id="inputBgBeranda" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setHeroBgList(e.target.files)} 
                  className="hidden" 
                />
              </label>
              {heroBgList && (
                <div className="text-xs font-bold text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
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
            {isLoadingHero ? "Menyimpan Pengaturan..." : "Terapkan Perubahan ke Beranda"}
          </button>
        </form>
      </div>

      {/* 2. MANAJEMEN BERITA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500">
        <div className="flex justify-between mb-2 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {editKabarId ? "✏️ Edit Berita" : "📰 Tulis Berita Baru (Tampil di Beranda)"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Anda juga bisa menambahkan berita dari halaman ini secara langsung.</p>
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
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all font-bold" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2 text-gray-800">Tanggal Publikasi</label>
              <input 
                type="datetime-local" 
                required 
                value={tanggalKabar} 
                onChange={(e) => setTanggalKabar(e.target.value)} 
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all font-bold text-gray-700" 
              />
            </div>
          </div>
          
          {editKabarId && gambarLamaKabar.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <p className="text-sm font-bold text-orange-900 mb-3">Foto Tersimpan (Klik X untuk menghapus):</p>
              <div className="flex flex-wrap gap-3">
                {gambarLamaKabar.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 border-2 border-white rounded-xl overflow-hidden group shadow-md">
                    <img 
                      src={url.startsWith("http") ? url : `https://wsrv.nl/?url=${url}`} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => hapusGambarDariDaftarLamaKabar(idx)} 
                      className="absolute top-1 right-1 bg-red-600 text-white w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity border border-red-800"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Tambahkan Foto Baru</label>
            <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all">
              <span className="text-3xl mb-2">📸</span>
              <span className="font-bold text-gray-700 text-sm">Pilih Gambar</span>
              <input 
                id="inputFotoKabarBeranda" 
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
            <label className="block text-sm font-bold mb-2 text-gray-800">Isi Berita</label>
            <textarea 
              required 
              rows={6} 
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
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
          >
            {isLoadingKabar ? "Memproses..." : editKabarId ? "Simpan Perubahan Berita" : "Publikasikan Berita Sekarang"}
          </button>
        </form>
      </div>

      {/* 3. TABEL MANAJEMEN BERITA */}
      <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-gray-800">Riwayat Berita</h4>
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-green-200">
            Max 10 Berita di Slide
          </span>
        </div>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-4 px-4 font-bold text-gray-600">Tanggal</th>
              <th className="py-4 px-4 font-bold text-gray-600">Judul Berita</th>
              <th className="py-4 px-4 text-center font-bold text-gray-600">Status Beranda</th>
              <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {riwayatKabar.map((item) => {
              const isTampil = item.is_featured !== false; 
              const isPinned = item.is_pinned === true;
              return (
                <tr key={item.id} className={`border-b transition-colors ${isPinned ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-4 px-4 font-medium text-gray-500 whitespace-nowrap">
                    {item.tanggal_posting ? new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric'}) : "-"}
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
                        className={`px-4 py-2 rounded-lg font-bold text-xs shadow-sm w-32 ${isTampil ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-300"}`}
                      >
                        {isTampil ? "▶️ Dimainkan" : "⏸️ Di-Pause"}
                      </button>
                      <button 
                        onClick={() => togglePinBerita(item.id, isPinned)} 
                        className={`px-4 py-1.5 rounded-lg font-bold text-[10px] shadow-sm w-32 border ${isPinned ? "bg-yellow-500 text-white border-yellow-600" : "bg-white text-gray-500 border-gray-300"}`}
                      >
                        {isPinned ? "🔒 Tergembok" : "🔓 Gembok Normal"}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={() => mulaiEditKabar(item)} 
                        className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => hapusKabar(item.id)} 
                        className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Hapus
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

    </div>
  );
}