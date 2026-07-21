// src/components/dashboard/Transparansi.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function Transparansi({ activeSubMenu, userEmail }: { activeSubMenu?: string; userEmail?: string | null }) {
  
  // Fungsi Helper untuk Waktu Lokal
  const getLocalDatetime = (d = new Date()) => {
    const tzOffset = d.getTimezoneOffset() * 60000; 
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // ==========================================
  // STATE DOKUMEN TRANSPARANSI (GABUNGAN APBDES & REGULASI)
  // ==========================================
  const [kategoriDokumen, setKategoriDokumen] = useState("APBDes"); // APBDes, Perdes, SK Kades, Laporan
  const [judulDokumen, setJudulDokumen] = useState("");
  const [deskripsiDokumen, setDeskripsiDokumen] = useState("");
  const [linkDownload, setLinkDownload] = useState("");
  const [tanggalDokumen, setTanggalDokumen] = useState(getLocalDatetime());
  
  const [fotoDokumenList, setFotoDokumenList] = useState<FileList | null>(null);
  const [gambarLama, setGambarLama] = useState(""); // Hanya butuh 1 gambar sampul
  
  const [daftarDokumen, setDaftarDokumen] = useState<any[]>([]);
  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editDokumenId, setEditDokumenId] = useState<string | null>(null);

  // ==========================================
  // FUNGSI PENGAMBILAN DATA
  // ==========================================
  const ambilData = async () => {
    try {
      const qDokumen = query(collection(db, "transparansi_desa"), orderBy("tanggal_posting", "desc"));
      const snapDokumen = await getDocs(qDokumen);
      setDaftarDokumen(snapDokumen.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // FUNGSI UPLOAD GAMBAR BASE64 IMGBB
  // ==========================================
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if ((encoded.length % 4) > 0) { encoded += '='.repeat(4 - (encoded.length % 4)); }
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
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      try {
        const base64Data = await fileToBase64(file);
        const formData = new FormData(); formData.append("image", base64Data);
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
  // MANAJEMEN SIMPAN DOKUMEN
  // ==========================================
  const handleSimpanDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Memproses...");
    
    try {
      let urlGambarAkhir = gambarLama;
      
      if (fotoDokumenList && fotoDokumenList.length > 0) {
        setStatusProses(`Mengunggah foto sampul dokumen...`);
        const hasilUpload = await uploadFotoKeImgBB(fotoDokumenList[0]);
        if (hasilUpload) {
          urlGambarAkhir = hasilUpload;
        } else {
          setStatusProses("❌ Gagal unggah gambar. Coba lagi.");
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

  const batalEditDokumen = () => {
    setEditDokumenId(null); 
    setKategoriDokumen("APBDes");
    setJudulDokumen(""); 
    setDeskripsiDokumen(""); 
    setLinkDownload("");
    setTanggalDokumen(getLocalDatetime());
    setGambarLama(""); 
    setFotoDokumenList(null);
    const input = document.getElementById("inputFotoDok") as HTMLInputElement;
    if (input) input.value = "";
  };

  const hapusDokumen = async (id: string) => {
    if (confirm("Yakin hapus dokumen ini dari transparansi publik?")) {
      await deleteDoc(doc(db, "transparansi_desa", id));
      ambilData();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600">
        <div className="flex justify-between mb-2 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {editDokumenId ? "✏️ Edit Transparansi" : "📢 Publikasi Dokumen Transparansi"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Unggah foto sampul APBDes, Perdes, atau dokumen resmi lainnya beserta link download.</p>
          </div>
          {editDokumenId && (
            <button onClick={batalEditDokumen} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold transition-colors">
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
                <option value="Perdes">Peraturan Desa (Perdes)</option>
                <option value="SK Kades">SK Kepala Desa</option>
                <option value="Laporan">Laporan Pertanggungjawaban</option>
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
                  <img src={gambarLama.startsWith("http") ? gambarLama : `https://wsrv.nl/?url=${gambarLama}`} className="w-auto h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => setGambarLama("")} className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700">Hapus Sampul</button>
                  </div>
                </div>
              )}

              <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-100 transition-all shadow-sm">
                <span className="text-3xl mb-2">📸</span>
                <span className="font-bold text-blue-800 text-sm">{gambarLama ? "Ganti Foto Baru" : "Upload Foto Banner/Dokumen"}</span>
                <input id="inputFotoDok" type="file" accept="image/*" onChange={(e) => setFotoDokumenList(e.target.files)} className="hidden" />
              </label>
              {fotoDokumenList && (<div className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200">✅ Foto siap diunggah.</div>)}
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

      {/* TABEL MANAJEMEN DOKUMEN */}
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
            {daftarDokumen.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-medium text-gray-500 whitespace-nowrap">
                  {item.tanggal_posting ? new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : "-"}
                </td>
                <td className="py-4 px-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1 border border-blue-200">{item.kategori}</div>
                  <div className="font-bold text-gray-900 text-base">{item.judul}</div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 w-64">{item.deskripsi}</p>
                </td>
                <td className="py-4 px-4 text-center">
                  <a href={item.link_dokumen} target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg shadow-sm">Buka Link</a>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col gap-2 items-center">
                    <button onClick={() => mulaiEditDokumen(item)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => hapusDokumen(item.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {daftarDokumen.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Belum ada dokumen yang diunggah.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}