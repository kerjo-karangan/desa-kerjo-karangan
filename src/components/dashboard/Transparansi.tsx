// src/components/dashboard/Transparansi.tsx
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
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface TransparansiProps {
  activeSubMenu?: string;
  userEmail?: string | null;
}

export default function Transparansi({ activeSubMenu, userEmail }: TransparansiProps) {
  
  const getLocalDatetime = (d = new Date()) => {
    const tzOffset = d.getTimezoneOffset() * 60000; 
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  const defaultKategori = activeSubMenu === "trans-regulasi" ? "Regulasi & Perdes" : "APBDes";
  
  const [kategoriDokumen, setKategoriDokumen] = useState(defaultKategori); 
  const [judulDokumen, setJudulDokumen] = useState("");
  const [deskripsiDokumen, setDeskripsiDokumen] = useState("");
  const [linkDownload, setLinkDownload] = useState("");
  const [tanggalDokumen, setTanggalDokumen] = useState(getLocalDatetime());
  
  const [fotoDokumenList, setFotoDokumenList] = useState<FileList | null>(null);
  const [gambarLama, setGambarLama] = useState(""); 
  
  const [daftarDokumen, setDaftarDokumen] = useState<any[]>([]);
  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editDokumenId, setEditDokumenId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubMenu === "trans-regulasi") {
      setKategoriDokumen("Regulasi & Perdes");
    } else if (activeSubMenu === "trans-apbdes") {
      setKategoriDokumen("APBDes");
    }
  }, [activeSubMenu]);

  const ambilData = async () => {
    try {
      const qDokumen = query(collection(db, "transparansi_desa"), orderBy("tanggal_posting", "desc"));
      const snapDokumen = await getDocs(qDokumen);
      setDaftarDokumen(snapDokumen.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));

      const snapHero = await getDoc(doc(db, "pengaturan_web", "transparansi_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "Transparansi Desa");
        setHeroSub(snapHero.data().sub || "Akses terbuka dokumen resmi pemerintahan.");
        setHeroBgLama(snapHero.data().bg || "");
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString() || '');
      reader.onerror = error => reject(error);
    });
  };

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
      console.error("Upload error:", error);
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
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
          if (heroBgLama) await hapusFotoDiCloudinary(heroBgLama);
          imageUrl = newBg;
        } else {
          setStatusHero("❌ Gagal mengunggah gambar.");
          setIsLoadingHero(false); 
          return; 
        }
      }

      await setDoc(doc(db, "pengaturan_web", "transparansi_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });

      setStatusHero("✅ Pengaturan Header Transparansi berhasil diperbarui!");
      setHeroBgLama(imageUrl); 
      setHeroBgList(null);
      const input = document.getElementById("inputBgTransparansi") as HTMLInputElement;
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
    setStatusHero("Menghapus gambar...");
    try {
      if (heroBgLama) await hapusFotoDiCloudinary(heroBgLama);
      await setDoc(doc(db, "pengaturan_web", "transparansi_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: "",
        terakhir_diperbarui: new Date().toISOString()
      });
      setHeroBgLama("");
      setStatusHero("✅ Background dihapus.");
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menghapus background.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  const handleSimpanDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Memproses...");
    
    try {
      let urlGambarAkhir = gambarLama;
      
      if (fotoDokumenList && fotoDokumenList.length > 0) {
        setStatusProses(`Mengunggah foto sampul ke Cloudinary...`);
        const hasilUpload = await uploadFotoKeCloudinary(fotoDokumenList[0]);
        if (hasilUpload) {
          if (gambarLama) await hapusFotoDiCloudinary(gambarLama);
          urlGambarAkhir = hasilUpload;
        } else {
          setStatusProses("❌ Gagal unggah gambar.");
          setIsLoading(false);
          return;
        }
      }
      
      const finalTanggalPosting = new Date(tanggalDokumen).toISOString();
      const payload = {
        kategori: kategoriDokumen,
        judul: judulDokumen,
        deskripsi: deskripsiDokumen,
        link_dokumen: linkDownload,
        gambar: urlGambarAkhir,
        tanggal_posting: finalTanggalPosting,
        penulis: userEmail || "Admin Desa"
      };

      if (editDokumenId) {
        await updateDoc(doc(db, "transparansi_desa", editDokumenId), payload);
        setStatusProses("✅ Dokumen Diperbarui!");
      } else {
        await addDoc(collection(db, "transparansi_desa"), payload);
        setStatusProses("✅ Dokumen Dipublikasikan!");
      }
      
      batalEditDokumen();
      ambilData();
      setTimeout(() => setStatusProses(""), 4000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan dokumen.");
    } finally {
      setIsLoading(false);
    }
  };

  const mulaiEditDokumen = (item: any) => {
    setEditDokumenId(item.id); 
    setKategoriDokumen(item.kategori || "APBDes");
    setJudulDokumen(item.judul || ""); 
    setDeskripsiDokumen(item.deskripsi || "");
    setLinkDownload(item.link_dokumen || "");
    setTanggalDokumen(item.tanggal_posting ? getLocalDatetime(new Date(item.tanggal_posting)) : getLocalDatetime());
    setGambarLama(item.gambar || "");
    setFotoDokumenList(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHapusSampulLama = async () => {
    if (!confirm("Yakin hapus foto sampul ini dari Cloudinary?")) return;
    if (gambarLama) await hapusFotoDiCloudinary(gambarLama);
    setGambarLama("");
    if (editDokumenId) {
      await updateDoc(doc(db, "transparansi_desa", editDokumenId), { gambar: "" });
    }
  };

  const batalEditDokumen = () => {
    setEditDokumenId(null); 
    setKategoriDokumen(activeSubMenu === "trans-regulasi" ? "Regulasi & Perdes" : "APBDes");
    setJudulDokumen(""); 
    setDeskripsiDokumen(""); 
    setLinkDownload("");
    setTanggalDokumen(getLocalDatetime());
    setGambarLama(""); 
    setFotoDokumenList(null);
    const input = document.getElementById("inputFotoDok") as HTMLInputElement;
    if (input) input.value = "";
  };

  const hapusDokumen = async (item: any) => {
    if (confirm("Yakin hapus dokumen ini? Foto sampul juga akan dihapus dari Cloudinary.")) {
      if (item.gambar) await hapusFotoDiCloudinary(item.gambar);
      await deleteDoc(doc(db, "transparansi_desa", item.id));
      ambilData();
    }
  };

  const dataDokumenTampil = daftarDokumen.filter(doc => {
    if (activeSubMenu === "trans-apbdes") return doc.kategori === "APBDes";
    if (activeSubMenu === "trans-regulasi") return doc.kategori === "Regulasi & Perdes";
    return true; 
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      {(!activeSubMenu || activeSubMenu === "trans-hero") && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 mb-8">
          <h3 className="text-2xl font-bold mb-2">🖼️ Pengaturan Header Transparansi (Cloudinary)</h3>
          <p className="text-gray-500 text-sm mb-6">Sesuaikan gambar background dan teks sambutan khusus di halaman publik Transparansi Desa.</p>
          
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
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Teks Sub-Judul</label>
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
                <label className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Gambar Background Header</label>
                
                {heroBgLama && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                    <img 
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                      className="w-full h-full object-cover" 
                      alt="Hero Background"
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
                  <span className="font-bold text-yellow-800 text-sm">Upload Background Baru</span>
                  <input 
                    id="inputBgTransparansi" 
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
              {isLoadingHero ? "Menyimpan Pengaturan..." : "Simpan Header Transparansi"}
            </button>
          </form>
        </div>
      )}

      {(!activeSubMenu || activeSubMenu === "trans-apbdes" || activeSubMenu === "trans-regulasi") && (
        <>
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600">
            <div className="flex justify-between mb-2 border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {editDokumenId ? "✏️ Edit Transparansi" : "📢 Publikasi Dokumen Transparansi"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Unggah foto sampul dokumen ({activeSubMenu === "trans-regulasi" ? "Regulasi/Perdes" : "APBDes"}) beserta link download.
                </p>
              </div>
              {editDokumenId && (
                <button 
                  onClick={batalEditDokumen} 
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSimpanDokumen} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Kategori Dokumen</label>
                  <select 
                    value={kategoriDokumen} 
                    onChange={(e) => setKategoriDokumen(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all font-bold"
                  >
                    <option value="APBDes">Info Grafis APBDes</option>
                    <option value="Regulasi & Perdes">Regulasi & Peraturan Desa (Perdes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Tanggal Publikasi</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={tanggalDokumen} 
                    onChange={(e) => setTanggalDokumen(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all font-bold text-gray-700" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-gray-800">Judul Dokumen Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={judulDokumen} 
                    onChange={(e) => setJudulDokumen(e.target.value)} 
                    placeholder="Misal: Info Grafis APBDes Kerjo Tahun 2026..."
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all font-bold" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-800">Deskripsi Penjelasan (Opsional)</label>
                    <textarea 
                      rows={5} 
                      value={deskripsiDokumen} 
                      onChange={(e) => setDeskripsiDokumen(e.target.value)} 
                      placeholder="Tambahkan penjelasan singkat mengenai rincian dokumen ini..."
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all leading-relaxed"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-800">Link Download Asli (G-Drive / PDF)</label>
                    <input 
                      type="url" 
                      required 
                      value={linkDownload} 
                      onChange={(e) => setLinkDownload(e.target.value)} 
                      placeholder="https://drive.google.com/..."
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm font-mono text-blue-600" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Foto Sampul Dokumen (Wajib)</label>
                  
                  {gambarLama && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group bg-gray-100 flex items-center justify-center">
                      <img 
                        src={gambarLama.startsWith("http") ? gambarLama : `https://wsrv.nl/?url=${gambarLama}`} 
                        className="w-auto h-full object-contain" 
                        alt="Sampul Dokumen"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={handleHapusSampulLama} 
                          className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700"
                        >
                          Hapus Sampul Permanen
                        </button>
                      </div>
                    </div>
                  )}

                  <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-100 transition-all shadow-sm">
                    <span className="text-3xl mb-2">📸</span>
                    <span className="font-bold text-blue-800 text-sm">
                      {gambarLama ? "Ganti Foto Baru" : "Upload Foto Banner/Dokumen"}
                    </span>
                    <input 
                      id="inputFotoDok" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setFotoDokumenList(e.target.files)} 
                      className="hidden" 
                    />
                  </label>
                  
                  {fotoDokumenList && (
                    <div className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200">
                      ✅ Foto siap diunggah ke Cloudinary.
                    </div>
                  )}
                </div>
              </div>
              
              {statusProses && (
                <div className={`p-4 rounded-xl text-sm font-bold text-center border ${statusProses.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
                  {statusProses}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isLoading} 
                className={`w-full text-white font-bold px-6 py-4 rounded-xl shadow-md transition-all text-lg ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"}`}
              >
                {isLoading ? "Memproses Data..." : editDokumenId ? "Simpan Perubahan Dokumen" : "Publikasikan ke Transparansi"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-gray-800">Daftar Dokumen Publik</h4>
            </div>
            
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-4 px-4 font-bold text-gray-600">Tanggal Posting</th>
                  <th className="py-4 px-4 font-bold text-gray-600">Judul & Kategori</th>
                  <th className="py-4 px-4 font-bold text-gray-600 text-center">Tautan</th>
                  <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dataDokumenTampil.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-500 whitespace-nowrap">
                      {item.tanggal_posting ? new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1 border border-blue-200">
                        {item.kategori}
                      </div>
                      <div className="font-bold text-gray-900 text-base">{item.judul}</div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 w-48 md:w-64">{item.deskripsi}</p>
                    </td>
                    <td className="py-4 px-4 text-center align-middle">
                      <a 
                        href={item.link_dokumen} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-block text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm whitespace-nowrap"
                      >
                        Buka Link
                      </a>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <button 
                          onClick={() => mulaiEditDokumen(item)} 
                          className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => hapusDokumen(item)} 
                          className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Hapus Permanen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dataDokumenTampil.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Belum ada dokumen di kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}