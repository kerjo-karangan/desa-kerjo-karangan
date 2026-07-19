// src/components/dashboard/Transparansi.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, setDoc, getDoc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function Transparansi() {
  const [danaDesa, setDanaDesa] = useState<number | string>(0);
  const [alokasiDanaDesa, setAlokasiDanaDesa] = useState<number | string>(0);
  const [pad, setPad] = useState<number | string>(0);
  const [banprov, setBanprov] = useState<number | string>(0);
  const [statusApbdes, setStatusApbdes] = useState("");
  const [isLoadingApbdes, setIsLoadingApbdes] = useState(false);

  const [daftarRegulasi, setDaftarRegulasi] = useState<any[]>([]);
  const [tahunRegulasi, setTahunRegulasi] = useState("");
  const [jenisRegulasi, setJenisRegulasi] = useState("Perdes");
  const [judulRegulasi, setJudulRegulasi] = useState("");
  const [linkRegulasi, setLinkRegulasi] = useState("");
  const [statusRegulasi, setStatusRegulasi] = useState("");
  const [isLoadingRegulasi, setIsLoadingRegulasi] = useState(false);
  const [editRegulasiId, setEditRegulasiId] = useState<string | null>(null);

  const [namaProyek, setNamaProyek] = useState("");
  const [paguAnggaran, setPaguAnggaran] = useState<number | string>("");
  const [danaTerealisasi, setDanaTerealisasi] = useState<number | string>("");
  const [daftarRealisasi, setDaftarRealisasi] = useState<any[]>([]);
  const [statusRealisasi, setStatusRealisasi] = useState("");
  const [isLoadingRealisasi, setIsLoadingRealisasi] = useState(false);

  const ambilData = async () => {
    try {
      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0);
        setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0);
        setPad(snapApbdes.data().pad || 0);
        setBanprov(snapApbdes.data().banprov || 0);
      }

      const qRegulasi = query(collection(db, "regulasi_desa"), orderBy("tahun", "desc"));
      setDaftarRegulasi((await getDocs(qRegulasi)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qRealisasi = query(collection(db, "realisasi_desa"), orderBy("tanggal_input", "desc"));
      setDaftarRealisasi((await getDocs(qRealisasi)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const handleSimpanApbdes = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingApbdes(true); setStatusApbdes("Menyimpan...");
    try {
      await setDoc(doc(db, "transparansi", "apbdes"), {
        dana_desa: Number(danaDesa), alokasi_dana_desa: Number(alokasiDanaDesa), pad: Number(pad), banprov: Number(banprov), terakhir_diperbarui: new Date().toISOString(),
      });
      setStatusApbdes("✅ Diperbarui!"); setTimeout(() => setStatusApbdes(""), 4000);
    } catch (error) { setStatusApbdes("❌ Gagal."); } finally { setIsLoadingApbdes(false); }
  };

  const handleSimpanRealisasi = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingRealisasi(true); setStatusRealisasi("Memproses...");
    try {
      await addDoc(collection(db, "realisasi_desa"), {
        nama_proyek: namaProyek, pagu: Number(paguAnggaran), terealisasi: Number(danaTerealisasi), tanggal_input: new Date().toISOString(),
      });
      setStatusRealisasi("✅ Ditambahkan!"); setNamaProyek(""); setPaguAnggaran(""); setDanaTerealisasi(""); ambilData(); setTimeout(() => setStatusRealisasi(""), 4000);
    } catch (error) { setStatusRealisasi("❌ Gagal."); } finally { setIsLoadingRealisasi(false); }
  };

  const hapusRealisasi = async (id: string) => {
    if (confirm("Yakin menghapus data realisasi ini?")) { await deleteDoc(doc(db, "realisasi_desa", id)); ambilData(); }
  };

  const handleSimpanRegulasi = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingRegulasi(true); setStatusRegulasi("Menyimpan...");
    try {
      if (editRegulasiId) {
        await updateDoc(doc(db, "regulasi_desa", editRegulasiId), { tahun: tahunRegulasi, jenis: jenisRegulasi, judul: judulRegulasi, link: linkRegulasi });
        setStatusRegulasi("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "regulasi_desa"), { tahun: tahunRegulasi, jenis: jenisRegulasi, judul: judulRegulasi, link: linkRegulasi, tanggal_upload: new Date().toISOString() });
        setStatusRegulasi("✅ Ditambahkan!");
      }
      batalEditRegulasi(); ambilData(); setTimeout(() => setStatusRegulasi(""), 4000);
    } catch (error) { setStatusRegulasi("❌ Gagal."); } finally { setIsLoadingRegulasi(false); }
  };

  const mulaiEditRegulasi = (item: any) => {
    setEditRegulasiId(item.id); setTahunRegulasi(item.tahun); setJenisRegulasi(item.jenis); setJudulRegulasi(item.judul); setLinkRegulasi(item.link); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const batalEditRegulasi = () => {
    setEditRegulasiId(null); setTahunRegulasi(""); setJenisRegulasi("Perdes"); setJudulRegulasi(""); setLinkRegulasi("");
  };
  const hapusRegulasi = async (id: string) => {
    if (confirm("Yakin menghapus dokumen regulasi ini?")) { await deleteDoc(doc(db, "regulasi_desa", id)); ambilData(); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400">
        <h3 className="text-2xl font-bold mb-2">📊 Kelola Grafik APBDes</h3>
        <p className="text-gray-500 text-sm mb-6">Perbarui angka anggaran untuk ditampilkan pada grafik donat secara otomatis.</p>
        <form onSubmit={handleSimpanApbdes} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-bold mb-2 text-gray-700">Dana Desa (DD)</label><input type="number" required value={danaDesa} onChange={(e)=>setDanaDesa(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg" /></div>
            <div><label className="block text-sm font-bold mb-2 text-gray-700">Alokasi Dana Desa (ADD)</label><input type="number" required value={alokasiDanaDesa} onChange={(e)=>setAlokasiDanaDesa(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg" /></div>
            <div><label className="block text-sm font-bold mb-2 text-gray-700">Pendapatan Asli Desa (PAD)</label><input type="number" required value={pad} onChange={(e)=>setPad(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg" /></div>
            <div><label className="block text-sm font-bold mb-2 text-gray-700">Bantuan Keuangan Provinsi</label><input type="number" required value={banprov} onChange={(e)=>setBanprov(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg" /></div>
          </div>
          {statusApbdes && (<div className="p-4 rounded-xl font-bold text-center bg-green-100 text-green-800 border border-green-300">{statusApbdes}</div>)}
          <button type="submit" disabled={isLoadingApbdes} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black px-10 py-4 rounded-xl shadow-md transition-colors text-lg">{isLoadingApbdes ? "Memproses..." : "Simpan Grafik Anggaran"}</button>
        </form>
      </div>
      
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-green-600">
        <h3 className="text-2xl font-bold mb-2">📈 Realisasi Dana Desa</h3>
        <p className="text-gray-500 text-sm mb-6">Masukkan data penyerapan dana pada proyek desa yang sedang berjalan.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-green-50 p-6 rounded-2xl border border-green-200 shadow-inner">
            <h4 className="font-bold text-green-900 mb-6 text-lg border-b border-green-300 pb-2">Catat Realisasi Baru</h4>
            <form onSubmit={handleSimpanRealisasi} className="space-y-5">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Proyek / Bidang</label><input type="text" required value={namaProyek} onChange={(e)=>setNamaProyek(e.target.value)} className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white" /></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Pagu Anggaran (Rp)</label><input type="number" required value={paguAnggaran} onChange={(e)=>setPaguAnggaran(e.target.value)} className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white font-mono font-bold" /></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Dana Terealisasi (Rp)</label><input type="number" required value={danaTerealisasi} onChange={(e)=>setDanaTerealisasi(e.target.value)} className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white font-mono font-bold text-green-800" /></div>
              {statusRealisasi && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-400 p-3 rounded-lg text-center">{statusRealisasi}</div>)}
              <button type="submit" disabled={isLoadingRealisasi} className="w-full bg-green-700 text-white font-bold py-3.5 rounded-xl hover:bg-green-800 shadow-md transition-colors text-lg">{isLoadingRealisasi ? "Menyimpan..." : "Tambahkan"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Proyek & Nilai</th><th className="py-4 px-4 text-center font-bold text-gray-600">Ketercapaian</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarRealisasi.map((real) => {
                  const persen = Math.round((real.terealisasi / real.pagu) * 100);
                  return (
                    <tr key={real.id} className="border-b hover:bg-green-50 transition-colors">
                      <td className="py-4 px-4"><div className="font-bold text-gray-900 text-base mb-1">{real.nama_proyek}</div><div className="text-xs font-medium text-gray-600 bg-gray-100 inline-block px-3 py-1 rounded-md border border-gray-200">Terealisasi: <span className="font-bold text-green-700">Rp {new Intl.NumberFormat("id-ID").format(real.terealisasi)}</span> dari Rp {new Intl.NumberFormat("id-ID").format(real.pagu)}</div></td>
                      <td className="py-4 px-4 text-center"><div className={`mx-auto w-16 py-1.5 rounded-lg font-black text-sm border-2 ${persen >= 100 ? "bg-green-100 text-green-700 border-green-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}>{persen}%</div></td>
                      <td className="py-4 px-4 text-center"><button onClick={() => hapusRealisasi(real.id)} className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors">Hapus</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-blue-600">
        <h3 className="text-2xl font-bold mb-2">📂 Manajemen Dokumen & Regulasi</h3>
        <p className="text-gray-500 text-sm mb-6">Unggah tautan dokumen Peraturan Desa (Perdes), Laporan, atau SK Kades.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-blue-300 pb-3"><h4 className="font-bold text-blue-900 text-lg">{editRegulasiId ? "✏️ Edit Dokumen" : "Tambah Dokumen"}</h4>{editRegulasiId && <button onClick={batalEditRegulasi} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>}</div>
            <form onSubmit={handleSimpanRegulasi} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Tahun</label><input type="number" required value={tahunRegulasi} onChange={(e)=>setTahunRegulasi(e.target.value)} className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-center bg-white" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Jenis Dokumen</label><select value={jenisRegulasi} onChange={(e)=>setJenisRegulasi(e.target.value)} className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white"><option value="Perdes">Perdes</option><option value="SK Kades">SK Kades</option><option value="Laporan">Laporan</option></select></div>
              </div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Judul Dokumen Lengkap</label><textarea required rows={3} value={judulRegulasi} onChange={(e)=>setJudulRegulasi(e.target.value)} className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed"></textarea></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Tautan Cloud (G-Drive / Dropbox)</label><input type="url" required value={linkRegulasi} onChange={(e)=>setLinkRegulasi(e.target.value)} className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 bg-white font-mono text-xs" /></div>
              {statusRegulasi && (<div className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 p-3 rounded-lg text-center">{statusRegulasi}</div>)}
              <button type="submit" disabled={isLoadingRegulasi} className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-xl hover:bg-blue-800 shadow-md transition-colors text-lg">{isLoadingRegulasi ? "Menyimpan..." : editRegulasiId ? "Simpan Perubahan" : "Publikasikan Dokumen"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Tahun & Jenis</th><th className="py-4 px-4 font-bold text-gray-600">Judul Dokumen</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarRegulasi.map((docItem) => (
                  <tr key={docItem.id} className="border-b hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4"><span className="font-black text-gray-900 text-xl block mb-1">{docItem.tahun}</span><span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-md font-black uppercase tracking-widest inline-block">{docItem.jenis}</span></td>
                    <td className="py-4 px-4"><div className="font-bold text-gray-800 text-base leading-snug mb-2">{docItem.judul}</div><a href={docItem.link} target="_blank" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"><span>🔗</span> Tes Unduhan</a></td>
                    <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditRegulasi(docItem)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button><button onClick={() => hapusRegulasi(docItem.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}