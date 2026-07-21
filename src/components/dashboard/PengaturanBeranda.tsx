// src/components/dashboard/PengaturanBeranda.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function PengaturanBeranda({ userEmail }: { userEmail: string | null }) {
  const [tabAktif, setTabAktif] = useState("hero"); // 'hero', 'kontak', 'berita'

  // Helper Waktu
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
  // STATE PENGATURAN KONTAK & SOSMED
  // ==========================================
  const [alamat, setAlamat] = useState("");
  const [email, setEmail] = useState("");
  const [jamKerja, setJamKerja] = useState("");
  const [noWa, setNoWa] = useState("");
  const [linkIg, setLinkIg] = useState("");
  const [linkFb, setLinkFb] = useState("");
  const [linkYt, setLinkYt] = useState("");
  const [linkTt, setLinkTt] = useState("");
  const [statusKontak, setStatusKontak] = useState("");
  const [isLoadingKontak, setIsLoadingKontak] = useState(false);

  // ==========================================
  // STATE MANAJEMEN BERITA
  // ==========================================
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [tanggalKabar, setTanggalKabar] = useState(getLocalDatetime());
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLamaKabar, setGambarLamaKabar] = useState<string[]>([]);

  // ==========================================
  // FUNGSI PENGAMBILAN DATA (FETCH)
  // ==========================================
  const ambilData = async () => {
    try {
      // 1. Data Hero Beranda
      const snapHero = await getDoc(doc(db, "pengaturan_web", "beranda"));
      if (snapHero.exists()) {
        setHeroJudul(snapHero.data().judul || "Selamat Datang di\nDesa Kerjo");
        setHeroSub(snapHero.data().sub || "Mewujudkan pelayanan masyarakat yang transparan, inovatif, dan terdigitalisasi.");
        setHeroBgLama(snapHero.data().bg || "");
      }

      // 2. Data Kontak
      const snapKontak = await getDoc(doc(db, "pengaturan_web", "kontak"));
      if (snapKontak.exists()) {
        const d = snapKontak.data();
        setAlamat(d.alamat || "");
        setEmail(d.email || "");
        setJamKerja(d.jam_kerja || "");
        setNoWa(d.wa || "");
        setLinkIg(d.ig || "");
        setLinkFb(d.fb || "");
        setLinkYt(d.yt || "");
        setLinkTt(d.tiktok || "");
      }

      // 3. Data Berita
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
  // FUNGSI CLOUDINARY (UPLOAD & DELETE API)
  // ==========================================
  
  // Konversi Gambar ke Format Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString() || '';
        resolve(encoded); 
      };
      reader.onerror = error => reject(error);
    });
  };

  // UPLOAD Ke API Route Internal Kita
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const base64Data = await fileToBase64(file);
      const res = await fetch("/api/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64Data }),
      });
      const data = await res.json();
      if (data.success) return data.url;
      throw new Error(data.error);
    } catch (error) {
      console.error("Gagal Upload ke Cloudinary:", error);
      return null;
    }
  };

  // DELETE Ke API Route Internal Kita
  const hapusFotoDiCloudinary = async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return; // Hanya jalankan jika itu URL Cloudinary
    try {
      await fetch("/api/cloudinary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url }),
      });
      console.log("Gambar dihapus dari Cloudinary:", url);
    } catch (error) {
      console.error("Gagal Hapus di Cloudinary:", error);
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
        setStatusHero("Mengunggah gambar ke Cloudinary...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        
        if (newBg) {
          // Jika gambar baru berhasil diunggah, HAPUS gambar lama dari server (agar tidak numpuk)
          if (heroBgLama) {
            await hapusFotoDiCloudinary(heroBgLama);
          }
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

  // Hapus Permanen Background Hero
  const handleHapusBackgroundHero = async () => {
    if (!confirm("Yakin ingin menghapus gambar background secara permanen?")) return;
    setIsLoadingHero(true);
    setStatusHero("Menghapus gambar dari server...");
    
    try {
      if (heroBgLama) {
        await hapusFotoDiCloudinary(heroBgLama);
      }
      await setDoc(doc(db, "pengaturan_web", "beranda"), {
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

  // ==========================================
  // FUNGSI SIMPAN KONTAK & SOSIAL MEDIA
  // ==========================================
  const handleSimpanKontak = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingKontak(true);
    setStatusKontak("Menyimpan detail kontak...");
    
    try {
      await setDoc(doc(db, "pengaturan_web", "kontak"), {
        alamat,
        email,
        jam_kerja: jamKerja,
        wa: noWa,
        ig: linkIg,
        fb: linkFb,
        yt: linkYt,
        tiktok: linkTt,
        terakhir_diperbarui: new Date().toISOString()
      });

      setStatusKontak("✅ Detail Kontak & Media Sosial berhasil diperbarui!");
      setTimeout(() => setStatusKontak(""), 4000);
    } catch (error) {
      setStatusKontak("❌ Gagal menyimpan pengaturan kontak.");
    } finally {
      setIsLoadingKontak(false);
    }
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
        setStatusKabar(`Mengunggah foto ke Cloudinary...`);
        // Upload Multi Gambar
        const uploadPromises = Array.from(fotoKabarList).map((file) => uploadFotoKeCloudinary(file));
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
        setStatusKabar("✅ Berita Diperbarui!");
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
        setStatusKabar("✅ Berita Dipublikasikan!");
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

  // MENGHAPUS SATU FOTO SPESIFIK SAAT EDIT BERITA
  const hapusGambarDariDaftarLamaKabar = async (indexGambar: number) => {
    if (!confirm("Yakin menghapus foto ini? Foto akan dihapus secara permanen dari server Cloudinary.")) return;
    
    const urlYangDihapus = gambarLamaKabar[indexGambar];
    
    // 1. Hapus dari Cloudinary
    await hapusFotoDiCloudinary(urlYangDihapus);

    // 2. Update UI & State
    const sisaGambar = gambarLamaKabar.filter((_, i) => i !== indexGambar);
    setGambarLamaKabar(sisaGambar);
    
    // 3. Update Database Firebase langsung agar sinkron
    if (editKabarId) {
      await updateDoc(doc(db, "kabar_desa", editKabarId), {
        gambar: sisaGambar
      });
    }
  };

  // MENGHAPUS SELURUH BERITA & MEMUSNAHKAN SEMUA FOTONYA DARI CLOUDINARY
  const hapusKabar = async (id: string, gambarArray: string[]) => {
    if (!confirm("Yakin hapus berita permanen? Semua foto yang terkait dengan berita ini akan dimusnahkan juga dari server Cloudinary.")) return;
    
    // 1. Loop dan hapus setiap gambar dari Cloudinary
    if (gambarArray && gambarArray.length > 0) {
      for (const url of gambarArray) {
        await hapusFotoDiCloudinary(url);
      }
    }
    
    // 2. Hapus data dari Firebase
    await deleteDoc(doc(db, "kabar_desa", id));
    ambilData();
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
  // TAMPILAN RENDER UI
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      {/* TABS NAVIGASI SISTEM UTAMA */}
      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-xl">🖼️</span> Header Beranda
        </button>
        <button 
          onClick={() => setTabAktif("kontak")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "kontak" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-xl">📞</span> Kontak & Sosmed
        </button>
        <button 
          onClick={() => setTabAktif("berita")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "berita" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-xl">📰</span> Berita Slide
        </button>
      </div>

      {/* 1. PENGATURAN TAMPILAN BERANDA (HERO) */}
      {tabAktif === "hero" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in">
          <h3 className="text-2xl font-bold mb-2">🖼️ Pengaturan Visual Beranda (Cloudinary)</h3>
          <p className="text-gray-500 text-sm mb-6">Ubah gambar latar belakang (*background*) dan teks sambutan utama di halaman depan web. Server kini terhubung dengan Cloudinary.</p>
          
          <form onSubmit={handleSimpanHero} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Judul Utama</label>
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
                        onClick={handleHapusBackgroundHero} 
                        className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 border border-red-500"
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  </div>
                )}

                <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-yellow-800 text-sm">Upload Background ke Cloudinary</span>
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
      )}

      {/* 2. PENGATURAN KONTAK & MEDIA SOSIAL */}
      {tabAktif === "kontak" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in">
          <h3 className="text-2xl font-bold mb-2">📞 Identitas Kontak & Media Sosial</h3>
          <p className="text-gray-500 text-sm mb-6">Informasi yang diisi di sini akan otomatis tampil di Footer publik dan mengaktifkan tombol WhatsApp melayang warga.</p>
          
          <form onSubmit={handleSimpanKontak} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-5 bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-2 flex items-center gap-2"><span className="text-lg">📍</span> Info Layanan Fisik</h4>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">Alamat Lengkap Balai Desa</label>
                  <textarea 
                    rows={3} 
                    value={alamat} 
                    onChange={(e) => setAlamat(e.target.value)} 
                    placeholder="Jl. Raya Kerjo No. 1, ..."
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">Email Resmi Desa</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="pemdes@kerjo.desa.id"
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">Jam Kerja / Operasional</label>
                  <input 
                    type="text" 
                    value={jamKerja} 
                    onChange={(e) => setJamKerja(e.target.value)} 
                    placeholder="Senin - Jumat (08:00 - 15:00 WIB)"
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-5 bg-green-50 p-5 rounded-2xl border border-green-100">
                <h4 className="font-bold text-green-900 border-b border-green-200 pb-2 flex items-center gap-2"><span className="text-lg">🌐</span> Kanal Digital & WA</h4>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">No. WhatsApp Admin (Gunakan 62)</label>
                  <input 
                    type="number" 
                    required
                    value={noWa} 
                    onChange={(e) => setNoWa(e.target.value)} 
                    placeholder="6281234567890"
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Nomor ini digunakan untuk Tombol Bantuan WA yang melayang di sudut layar publik.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">Link Instagram</label>
                  <input 
                    type="url" 
                    value={linkIg} 
                    onChange={(e) => setLinkIg(e.target.value)} 
                    placeholder="https://instagram.com/..."
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-700">Link Facebook</label>
                  <input 
                    type="url" 
                    value={linkFb} 
                    onChange={(e) => setLinkFb(e.target.value)} 
                    placeholder="https://facebook.com/..."
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-700">Link YouTube</label>
                    <input 
                      type="url" 
                      value={linkYt} 
                      onChange={(e) => setLinkYt(e.target.value)} 
                      className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-700">Link TikTok</label>
                    <input 
                      type="url" 
                      value={linkTt} 
                      onChange={(e) => setLinkTt(e.target.value)} 
                      className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                    />
                  </div>
                </div>
              </div>

            </div>
            
            {statusKontak && (
              <div className={`p-4 rounded-xl text-sm font-bold text-center border ${statusKontak.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
                {statusKontak}
              </div>
            )}
            <button 
              type="submit" 
              disabled={isLoadingKontak} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoadingKontak ? "Menyimpan Kontak..." : "Simpan Detail Kontak & Sosial Media"}
            </button>
          </form>
        </div>
      )}

      {/* 3. MANAJEMEN BERITA */}
      {tabAktif === "berita" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500 animate-fade-in">
          <div className="flex justify-between mb-2 border-b pb-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                {editKabarId ? "✏️ Edit Berita Beranda" : "📰 Tulis Berita Slider Utama"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">Kelola berita yang muncul berputar di halaman Beranda Utama.</p>
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
                <p className="text-sm font-bold text-orange-900 mb-3">Foto Tersimpan (Klik X untuk memusnahkan dari server Cloudinary):</p>
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
                  <p className="text-sm font-bold text-green-800">✅ {fotoKabarList.length} foto baru siap diunggah ke Cloudinary.</p>
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
      )}

      {/* 3. TABEL MANAJEMEN BERITA */}
      {tabAktif === "berita" && (
        <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100 animate-fade-in">
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
                
                // Pastikan gambar berbentuk array untuk dilempar ke fungsi hapusKabar
                const arrGambarHapus = Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : [];
                
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
                        {/* UPDATE SAKTI CLOUDINARY: Lempar array gambar untuk dibasmi */}
                        <button 
                          onClick={() => hapusKabar(item.id, arrGambarHapus)} 
                          className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg"
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
      )}

    </div>
  );
}