// src/components/dashboard/KabarAgenda.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function KabarAgenda({ userEmail }: { userEmail: string | null }) {
  // --- KABAR ---
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]);

  // --- AGENDA ---
  const [namaAgenda, setNamaAgenda] = useState("");
  const [tanggalAgenda, setTanggalAgenda] = useState("");
  const [lokasiAgenda, setLokasiAgenda] = useState("");
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [statusAgenda, setStatusAgenda] = useState("");
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);

  const ambilData = async () => {
    try {
      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      setRiwayatKabar((await getDocs(qKabar)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
      setDaftarAgenda((await getDocs(qAgenda)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const uploadFotoKeImgBB = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const apiKeyImgBB = "6755e61bb042b746d83c71595313674e";
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      try {
        const cdnUrl = `https://corsproxy.io/?https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`;
        const resCdn = await fetch(cdnUrl, { method: "POST", body: formData });
        const dataCdn = await resCdn.json();
        if (dataCdn.success) return dataCdn.data.url;
        return null;
      } catch (errCdn) { return null; }
    }
  };

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
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];
      
      if (editKabarId) {
        await updateDoc(doc(db, "kabar_desa", editKabarId), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal });
        setStatusKabar("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "kabar_desa"), {
          judul: judulKabar, isi: isiKabar, gambar: gambarFinal, tanggal_posting: new Date().toISOString(), penulis: userEmail,
        });
        setStatusKabar("✅ Dipublikasikan!");
      }
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
    setEditKabarId(item.id); setJudulKabar(item.judul); setIsiKabar(item.isi);
    setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusGambarDariDaftarLama = (indexGambar: number) => {
    setGambarLama((prev) => prev.filter((_, i) => i !== indexGambar));
  };

  const batalEditKabar = () => {
    setEditKabarId(null); setJudulKabar(""); setIsiKabar(""); setGambarLama([]); setFotoKabarList(null);
    const input = document.getElementById("inputFotoKabar") as HTMLInputElement;
    if (input) input.value = "";
  };

  const hapusKabar = async (id: string) => {
    if (confirm("Yakin hapus berita permanen?")) {
      await deleteDoc(doc(db, "kabar_desa", id));
      ambilData();
    }
  };

  const handleSimpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAgenda(true);
    setStatusAgenda("Menyimpan...");
    try {
      await addDoc(collection(db, "agenda_desa"), { nama: namaAgenda, tanggal: tanggalAgenda, lokasi: lokasiAgenda });
      setStatusAgenda("✅ Ditambahkan!");
      setNamaAgenda(""); setTanggalAgenda(""); setLokasiAgenda("");
      ambilData();
      setTimeout(() => setStatusAgenda(""), 4000);
    } catch (error) {
      setStatusAgenda("❌ Gagal menyimpan agenda.");
    } finally {
      setIsLoadingAgenda(false);
    }
  };

  const hapusAgenda = async (id: string) => {
    if (confirm("Hapus agenda ini?")) {
      await deleteDoc(doc(db, "agenda_desa", id));
      ambilData();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500">
        <div className="flex justify-between mb-2 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">{editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita Baru"}</h3>
            <p className="text-gray-500 text-sm mt-1">Tambahkan berita terbaru, kegiatan, atau pengumuman desa.</p>
          </div>
          {editKabarId && (
            <button onClick={batalEditKabar} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold transition-colors">Batal Edit</button>
          )}
        </div>
        <form onSubmit={handleSimpanKabar} className="space-y-5 mt-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Judul Berita Utama</label>
            <input type="text" required value={judulKabar} onChange={(e) => setJudulKabar(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all text-lg font-bold" />
          </div>
          
          {editKabarId && gambarLama.length > 0 && (
            <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
              <p className="text-sm font-bold text-orange-900 mb-4">Foto Tersimpan (Klik ikon 'X' merah untuk menghapus foto):</p>
              <div className="flex flex-wrap gap-4">
                {gambarLama.map((url, idx) => (
                  <div key={idx} className="relative w-32 h-32 border-2 border-white rounded-xl overflow-hidden group shadow-md">
                    <img src={`https://wsrv.nl/?url=${url}`} alt="Foto Berita Lama" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => hapusGambarDariDaftarLama(idx)} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full text-sm font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700" title="Hapus Foto Ini">X</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Tambahkan Foto Dokumentasi Baru</label>
            <label className="cursor-pointer flex flex-col items-center justify-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all group">
              <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">📸</span>
              <span className="font-bold text-gray-700">Klik di sini untuk memilih foto dari perangkat Anda</span>
              <span className="text-xs text-gray-400 mt-1">(Bisa memilih lebih dari satu foto sekaligus)</span>
              <input id="inputFotoKabar" type="file" accept="image/*" multiple onChange={(e) => setFotoKabarList(e.target.files)} className="hidden" />
            </label>
            {fotoKabarList && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3 inline-block">
                <p className="text-sm font-bold text-green-800">✅ {fotoKabarList.length} foto baru siap diunggah.</p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Isi Lengkap Berita</label>
            <textarea required rows={8} value={isiKabar} onChange={(e) => setIsiKabar(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all leading-relaxed"></textarea>
          </div>
          
          {statusKabar && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center border ${statusKabar.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-100 text-green-800 border-green-300"}`}>
              {statusKabar}
            </div>
          )}
          
          <button type="submit" disabled={isLoadingKabar} className={`w-full text-white font-bold px-6 py-4 rounded-xl shadow-md transition-all text-lg ${isLoadingKabar ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:-translate-y-1"}`}>
            {isLoadingKabar ? "Mengunggah Foto & Memproses Berita..." : editKabarId ? "Simpan Perubahan Berita" : "Publikasikan Berita Sekarang"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
        <h4 className="text-xl font-bold mb-6 text-gray-800">Riwayat Publikasi Berita</h4>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-4 px-4 font-bold text-gray-600">Tanggal</th>
              <th className="py-4 px-4 font-bold text-gray-600">Judul Berita & Penulis</th>
              <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {riwayatKabar.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-500">{new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'long', year: 'numeric'})}</td>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 text-base mb-1">{item.judul}</div>
                  <div className="text-xs text-gray-400">Oleh: {item.penulis}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <button onClick={() => mulaiEditKabar(item)} className="bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mr-2 font-bold transition-colors">Edit Berita</button>
                  <button onClick={() => hapusKabar(item.id)} className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 px-4 py-2 rounded-lg font-bold transition-colors">Hapus</button>
                </td>
              </tr>
            ))}
            {riwayatKabar.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada berita yang dipublikasikan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mt-8 border-t-4 border-yellow-500">
        <h3 className="text-2xl font-bold mb-2">📅 Agenda & Kalender Kegiatan Desa</h3>
        <p className="text-gray-500 text-sm mb-6">Atur jadwal kegiatan desa yang akan datang agar warga dapat berpartisipasi.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner">
            <h4 className="font-bold text-yellow-900 mb-4 text-lg">Tambah Jadwal Agenda Baru</h4>
            <form onSubmit={handleSimpanAgenda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Nama Kegiatan / Acara</label>
                <input type="text" required value={namaAgenda} onChange={(e) => setNamaAgenda(e.target.value)} placeholder="Misal: Posyandu Balita" className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal & Waktu Pelaksanaan</label>
                <input type="datetime-local" required value={tanggalAgenda} onChange={(e) => setTanggalAgenda(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Lokasi / Tempat</label>
                <input type="text" required value={lokasiAgenda} onChange={(e) => setLokasiAgenda(e.target.value)} placeholder="Misal: Balai Desa Kerjo" className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              {statusAgenda && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusAgenda}</div>)}
              <button type="submit" disabled={isLoadingAgenda} className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 shadow-md transition-colors">{isLoadingAgenda ? "Menyimpan..." : "Tambahkan ke Kalender"}</button>
            </form>
          </div>
          
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 font-bold text-gray-600">Jadwal Waktu</th>
                  <th className="py-3 px-4 font-bold text-gray-600">Nama Kegiatan & Lokasi</th>
                  <th className="py-3 px-4 text-center font-bold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftarAgenda.map((agenda) => (
                  <tr key={agenda.id} className="border-b hover:bg-yellow-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-700">
                      {new Date(agenda.tanggal).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 text-base">{agenda.nama}</div>
                      <div className="text-xs font-bold text-yellow-600 mt-1 flex items-center gap-1"><span>📍</span> {agenda.lokasi}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button onClick={() => hapusAgenda(agenda.id)} className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors">Hapus Agenda</button>
                    </td>
                  </tr>
                ))}
                {daftarAgenda.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada jadwal agenda desa yang didaftarkan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}