// src/components/dashboard/ProfilUmkm.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, setDoc, getDoc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ProfilUmkm() {
  const [sejarahDesa, setSejarahDesa] = useState("");
  const [visiMisiDesa, setVisiMisiDesa] = useState("");
  const [statusProfil, setStatusProfil] = useState("");
  const [isLoadingProfil, setIsLoadingProfil] = useState(false);
  
  const [namaAparatur, setNamaAparatur] = useState("");
  const [jabatanAparatur, setJabatanAparatur] = useState("");
  const [urutanAparatur, setUrutanAparatur] = useState<number>(1);
  const [fotoAparatur, setFotoAparatur] = useState<File | null>(null);
  const [daftarAparatur, setDaftarAparatur] = useState<any[]>([]);
  const [statusAparatur, setStatusAparatur] = useState("");
  const [isLoadingAparatur, setIsLoadingAparatur] = useState(false);
  const [editAparaturId, setEditAparaturId] = useState<string | null>(null);
  const [fotoLamaAparatur, setFotoLamaAparatur] = useState("");

  const [namaLembaga, setNamaLembaga] = useState("");
  const [singkatanLembaga, setSingkatanLembaga] = useState("");
  const [deskripsiLembaga, setDeskripsiLembaga] = useState("");
  const [fotoLembaga, setFotoLembaga] = useState<File | null>(null);
  const [daftarLembaga, setDaftarLembaga] = useState<any[]>([]);
  const [statusLembaga, setStatusLembaga] = useState("");
  const [isLoadingLembaga, setIsLoadingLembaga] = useState(false);
  const [editLembagaId, setEditLembagaId] = useState<string | null>(null);
  const [fotoLamaLembaga, setFotoLamaLembaga] = useState("");

  const [namaProduk, setNamaProduk] = useState("");
  const [pemilikUmkm, setPemilikUmkm] = useState("");
  const [hargaProduk, setHargaProduk] = useState("");
  const [waUmkm, setWaUmkm] = useState("");
  const [deskripsiProduk, setDeskripsiProduk] = useState("");
  const [fotoProduk, setFotoProduk] = useState<File | null>(null);
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [statusUmkm, setStatusUmkm] = useState("");
  const [isLoadingUmkm, setIsLoadingUmkm] = useState(false);
  const [editUmkmId, setEditUmkmId] = useState<string | null>(null);
  const [fotoLamaUmkm, setFotoLamaUmkm] = useState("");

  const ambilData = async () => {
    try {
      const snapProfil = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapProfil.exists()) {
        setSejarahDesa(snapProfil.data().sejarah || "");
        setVisiMisiDesa(snapProfil.data().visi_misi || "");
      }
      setDaftarAparatur((await getDocs(query(collection(db, "aparatur_desa"), orderBy("urutan", "asc")))).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setDaftarLembaga((await getDocs(collection(db, "lembaga_desa"))).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setDaftarUmkm((await getDocs(query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc")))).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
      throw new Error("Gagal utama");
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

  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfil(true);
    setStatusProfil("Menyimpan...");
    try {
      await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() });
      setStatusProfil("✅ Diperbarui!");
      setTimeout(() => setStatusProfil(""), 4000);
    } catch (error) {
      setStatusProfil("❌ Gagal.");
    } finally {
      setIsLoadingProfil(false);
    }
  };

  const handleSimpanAparatur = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingAparatur(true); setStatusAparatur("Memproses...");
    try {
      let imageUrl = fotoLamaAparatur;
      if (fotoAparatur) { setStatusAparatur("Upload foto..."); imageUrl = (await uploadFotoKeImgBB(fotoAparatur)) || ""; }
      if (editAparaturId) {
        await updateDoc(doc(db, "aparatur_desa", editAparaturId), { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), foto: imageUrl });
        setStatusAparatur("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "aparatur_desa"), { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), foto: imageUrl });
        setStatusAparatur("✅ Ditambahkan!");
      }
      batalEditAparatur(); ambilData(); setTimeout(() => setStatusAparatur(""), 4000);
    } catch (error) { setStatusAparatur("❌ Gagal."); } finally { setIsLoadingAparatur(false); }
  };

  const mulaiEditAparatur = (item: any) => {
    setEditAparaturId(item.id); setNamaAparatur(item.nama); setJabatanAparatur(item.jabatan); setUrutanAparatur(item.urutan); setFotoLamaAparatur(item.foto || ""); setFotoAparatur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const batalEditAparatur = () => {
    setEditAparaturId(null); setNamaAparatur(""); setJabatanAparatur(""); setUrutanAparatur(daftarAparatur.length + 2); setFotoLamaAparatur(""); setFotoAparatur(null);
  };
  const hapusAparatur = async (id: string) => {
    if (confirm("Yakin hapus anggota aparatur ini?")) { await deleteDoc(doc(db, "aparatur_desa", id)); ambilData(); }
  };

  const handleSimpanLembaga = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingLembaga(true); setStatusLembaga("Memproses...");
    try {
      let imageUrl = fotoLamaLembaga;
      if (fotoLembaga) { setStatusLembaga("Upload foto..."); imageUrl = (await uploadFotoKeImgBB(fotoLembaga)) || ""; }
      if (editLembagaId) {
        await updateDoc(doc(db, "lembaga_desa", editLembagaId), { nama: namaLembaga, singkatan: singkatanLembaga, deskripsi: deskripsiLembaga, foto: imageUrl });
        setStatusLembaga("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "lembaga_desa"), { nama: namaLembaga, singkatan: singkatanLembaga, deskripsi: deskripsiLembaga, foto: imageUrl });
        setStatusLembaga("✅ Ditambahkan!");
      }
      batalEditLembaga(); ambilData(); setTimeout(() => setStatusLembaga(""), 4000);
    } catch (error) { setStatusLembaga("❌ Gagal."); } finally { setIsLoadingLembaga(false); }
  };

  const mulaiEditLembaga = (item: any) => {
    setEditLembagaId(item.id); setNamaLembaga(item.nama); setSingkatanLembaga(item.singkatan); setDeskripsiLembaga(item.deskripsi); setFotoLamaLembaga(item.foto || ""); setFotoLembaga(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const batalEditLembaga = () => {
    setEditLembagaId(null); setNamaLembaga(""); setSingkatanLembaga(""); setDeskripsiLembaga(""); setFotoLamaLembaga(""); setFotoLembaga(null);
  };
  const hapusLembaga = async (id: string) => {
    if (confirm("Yakin menghapus lembaga ini?")) { await deleteDoc(doc(db, "lembaga_desa", id)); ambilData(); }
  };

  const handleSimpanUmkm = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingUmkm(true); setStatusUmkm("Memproses...");
    try {
      let imageUrl = fotoLamaUmkm;
      if (fotoProduk) { setStatusUmkm("Upload..."); imageUrl = (await uploadFotoKeImgBB(fotoProduk)) || ""; }
      if (editUmkmId) {
        await updateDoc(doc(db, "potensi_desa", editUmkmId), { nama_produk: namaProduk, pemilik: pemilikUmkm, harga: Number(hargaProduk), wa: waUmkm, deskripsi: deskripsiProduk, foto: imageUrl });
        setStatusUmkm("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "potensi_desa"), { nama_produk: namaProduk, pemilik: pemilikUmkm, harga: Number(hargaProduk), wa: waUmkm, deskripsi: deskripsiProduk, foto: imageUrl, tanggal_input: new Date().toISOString() });
        setStatusUmkm("✅ Ditambahkan!");
      }
      batalEditUmkm(); ambilData(); setTimeout(() => setStatusUmkm(""), 4000);
    } catch (error) { setStatusUmkm("❌ Gagal."); } finally { setIsLoadingUmkm(false); }
  };

  const mulaiEditUmkm = (item: any) => {
    setEditUmkmId(item.id); setNamaProduk(item.nama_produk); setPemilikUmkm(item.pemilik); setHargaProduk(item.harga.toString()); setWaUmkm(item.wa); setDeskripsiProduk(item.deskripsi); setFotoLamaUmkm(item.foto || ""); setFotoProduk(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const batalEditUmkm = () => {
    setEditUmkmId(null); setNamaProduk(""); setPemilikUmkm(""); setHargaProduk(""); setWaUmkm(""); setDeskripsiProduk(""); setFotoLamaUmkm(""); setFotoProduk(null);
  };
  const hapusUmkm = async (id: string) => {
    if (confirm("Yakin hapus produk UMKM ini?")) { await deleteDoc(doc(db, "potensi_desa", id)); ambilData(); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600">
        <h3 className="text-2xl font-bold mb-2">🏛️ Pengaturan Teks Profil</h3>
        <p className="text-gray-500 text-sm mb-6">Sesuaikan teks Sejarah dan Visi Misi yang akan menjadi wajah desa di halaman publik.</p>
        <form onSubmit={handleSimpanProfil} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Sejarah Desa</label>
            <textarea required rows={6} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Visi & Misi</label>
            <textarea required rows={6} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"></textarea>
          </div>
          {statusProfil && (<div className="p-4 rounded-xl font-bold text-center bg-green-100 text-green-800 border border-green-300">{statusProfil}</div>)}
          <button type="submit" disabled={isLoadingProfil} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-xl shadow-md transition-colors text-lg">{isLoadingProfil ? "Menyimpan Perubahan..." : "Simpan Profil Utama"}</button>
        </form>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-blue-600">
        <h3 className="text-2xl font-bold mb-2">👔 Susunan Perangkat Desa (SOTK)</h3>
        <p className="text-gray-500 text-sm mb-6">Kelola hierarki susunan perangkat desa beserta foto formal.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-3">
              <h4 className="font-bold text-blue-900 text-lg">{editAparaturId ? "✏️ Mode Edit SOTK" : "Tambah Anggota SOTK"}</h4>
              {editAparaturId && <button onClick={batalEditAparatur} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>}
            </div>
            <form onSubmit={handleSimpanAparatur} className="space-y-5">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Lengkap & Gelar</label><input type="text" required value={namaAparatur} onChange={(e) => setNamaAparatur(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Jabatan</label><input type="text" required value={jabatanAparatur} onChange={(e) => setJabatanAparatur(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">No. Urut (Hierarki)</label><input type="number" required value={urutanAparatur} onChange={(e) => setUrutanAparatur(Number(e.target.value))} className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-center font-black text-xl text-blue-900" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Foto Wajah</label><label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-blue-300 rounded-xl hover:bg-blue-100 transition-all overflow-hidden shadow-sm"><span className="font-bold text-blue-800 text-xs flex items-center gap-2"><span className="text-xl">📸</span> {fotoAparatur ? "Siap" : "Pilih File"}</span><input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setFotoAparatur(e.target.files[0]); }} className="hidden" /></label></div>
              </div>
              {editAparaturId && fotoLamaAparatur && (<div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-blue-200 shadow-sm"><img src={`https://wsrv.nl/?url=${fotoLamaAparatur}`} className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" /><div><span className="text-xs font-bold text-blue-800 block">Foto Tersimpan</span></div></div>)}
              {statusAparatur && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusAparatur}</div>)}
              <button type="submit" disabled={isLoadingAparatur} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition-colors text-lg">{isLoadingAparatur ? "Memproses..." : editAparaturId ? "Simpan Perubahan SOTK" : "Tambahkan ke SOTK"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600 text-center">No</th><th className="py-4 px-4 font-bold text-gray-600">Identitas & Jabatan</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarAparatur.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4"><div className="w-10 h-10 mx-auto bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-blue-200">{org.urutan}</div></td>
                    <td className="py-4 px-4 flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">{org.foto ? <img src={`https://wsrv.nl/?url=${org.foto}`} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center w-full h-full text-2xl text-gray-400">👤</span>}</div><div><div className="font-bold text-gray-900 text-base">{org.nama}</div><div className="text-xs text-blue-700 uppercase font-black tracking-widest mt-1 bg-blue-50 inline-block px-2 py-1 rounded">{org.jabatan}</div></div></td>
                    <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditAparatur(org)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button><button onClick={() => hapusAparatur(org.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-indigo-500">
        <h3 className="text-2xl font-bold mb-2">🤝 Lembaga Kemasyarakatan Desa</h3>
        <p className="text-gray-500 text-sm mb-6">Kelola data Lembaga Masyarakat seperti PKK, Karang Taruna, LPMD, dll.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-indigo-200 pb-3"><h4 className="font-bold text-indigo-900 text-lg">{editLembagaId ? "✏️ Edit Lembaga" : "Daftarkan Lembaga"}</h4>{editLembagaId && <button onClick={batalEditLembaga} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal Edit</button>}</div>
            <form onSubmit={handleSimpanLembaga} className="space-y-5">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Organisasi Lengkap</label><input type="text" required value={namaLembaga} onChange={(e)=>setNamaLembaga(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Singkatan</label><input type="text" required value={singkatanLembaga} onChange={(e)=>setSingkatanLembaga(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-center text-indigo-900 text-xl tracking-widest" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Logo Organisasi</label><label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-indigo-300 rounded-xl hover:bg-indigo-100 transition-all overflow-hidden shadow-sm"><span className="font-bold text-indigo-800 text-xs flex items-center gap-2"><span className="text-xl">📸</span> {fotoLembaga ? "Siap" : "Upload Logo"}</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFotoLembaga(e.target.files[0])}} className="hidden" /></label></div>
              </div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi Singkat</label><textarea required rows={4} value={deskripsiLembaga} onChange={(e)=>setDeskripsiLembaga(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea></div>
              {editLembagaId && fotoLamaLembaga && (<div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-indigo-200 shadow-sm"><img src={`https://wsrv.nl/?url=${fotoLamaLembaga}`} className="w-12 h-12 rounded-md object-contain" /><div><span className="text-xs font-bold text-indigo-800 block">Logo Tersimpan</span></div></div>)}
              {statusLembaga && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusLembaga}</div>)}
              <button type="submit" disabled={isLoadingLembaga} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-md transition-colors text-lg">{isLoadingLembaga ? "Memproses..." : editLembagaId ? "Simpan Perubahan" : "Tambahkan Lembaga"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Lembaga</th><th className="py-4 px-4 font-bold text-gray-600">Deskripsi</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarLembaga.map((lem) => (
                  <tr key={lem.id} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="py-4 px-4 flex items-start gap-4"><div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md p-1">{lem.foto ? <img src={`https://wsrv.nl/?url=${lem.foto}`} className="w-full h-full object-contain"/> : <span className="flex items-center justify-center h-full text-3xl">🤝</span>}</div><div><div className="font-black text-indigo-900 text-lg tracking-wide">{lem.singkatan}</div><div className="text-xs font-bold text-gray-500 uppercase mt-1 leading-snug w-40 line-clamp-2">{lem.nama}</div></div></td>
                    <td className="py-4 px-4"><div className="text-xs text-gray-600 leading-relaxed max-w-xs line-clamp-3">{lem.deskripsi}</div></td>
                    <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditLembaga(lem)} className="w-full max-w-[100px] bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit Data</button><button onClick={() => hapusLembaga(lem.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-yellow-600">
        <h3 className="text-2xl font-bold mb-2">🛍️ Katalog Potensi / UMKM Desa</h3>
        <p className="text-gray-500 text-sm mb-6">Daftarkan produk UMKM atau potensi perekonomian desa.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-yellow-300 pb-3"><h4 className="font-bold text-yellow-900 text-lg">{editUmkmId ? "✏️ Edit Produk" : "Daftarkan Baru"}</h4>{editUmkmId && <button onClick={batalEditUmkm} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>}</div>
            <form onSubmit={handleSimpanUmkm} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Produk</label><input type="text" required value={namaProduk} onChange={(e)=>setNamaProduk(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" /></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Pemilik</label><input type="text" required value={pemilikUmkm} onChange={(e)=>setPemilikUmkm(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Harga (Rp)</label><input type="number" required value={hargaProduk} onChange={(e)=>setHargaProduk(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-yellow-900" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">No. WhatsApp</label><input type="number" required value={waUmkm} onChange={(e)=>setWaUmkm(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi Singkat</label><textarea required rows={3} value={deskripsiProduk} onChange={(e)=>setDeskripsiProduk(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 leading-relaxed"></textarea></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">{editUmkmId ? "Ubah Foto" : "Foto Produk"}</label><label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all overflow-hidden shadow-sm"><span className="font-bold text-yellow-800 text-xs flex items-center gap-2"><span className="text-xl">📸</span> {fotoProduk ? "Siap" : "Upload Gambar"}</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFotoProduk(e.target.files[0])}} className="hidden" /></label></div>
              {editUmkmId && fotoLamaUmkm && (<div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-yellow-200 shadow-sm"><img src={`https://wsrv.nl/?url=${fotoLamaUmkm}`} className="w-12 h-12 rounded-lg object-cover border border-gray-200" /><div><span className="text-xs font-bold text-yellow-800 block">Gambar Tersimpan</span></div></div>)}
              {statusUmkm && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusUmkm}</div>)}
              <button type="submit" disabled={isLoadingUmkm} className="w-full bg-yellow-600 text-white font-bold py-3.5 rounded-xl hover:bg-yellow-700 shadow-md transition-colors text-lg">{isLoadingUmkm ? "Memproses Data..." : editUmkmId ? "Simpan Perubahan" : "Tambahkan"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Produk</th><th className="py-4 px-4 font-bold text-gray-600">Kontak</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarUmkm.map((umkm) => (
                  <tr key={umkm.id} className="border-b hover:bg-yellow-50 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-4"><div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">{umkm.foto ? <img src={`https://wsrv.nl/?url=${umkm.foto}`} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl text-gray-400">📦</span>}</div><div><div className="font-bold text-gray-900 text-base">{umkm.nama_produk}</div><div className="text-sm text-green-700 font-black mt-1 bg-green-50 inline-block px-2 py-0.5 rounded">Rp {new Intl.NumberFormat("id-ID").format(umkm.harga)}</div></div></td>
                    <td className="py-4 px-4"><div className="font-bold text-gray-800">{umkm.pemilik}</div><div className="text-xs font-mono font-bold text-blue-600 mt-1">WA: {umkm.wa}</div></td>
                    <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditUmkm(umkm)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button><button onClick={() => hapusUmkm(umkm.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
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