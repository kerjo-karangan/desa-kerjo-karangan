// src/components/dashboard/ProfilUmkm.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, setDoc, getDoc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Default Jam Operasional
const DEFAULT_JAM = {
  Senin: { buka: "08:00", tutup: "16:00", libur: false },
  Selasa: { buka: "08:00", tutup: "16:00", libur: false },
  Rabu: { buka: "08:00", tutup: "16:00", libur: false },
  Kamis: { buka: "08:00", tutup: "16:00", libur: false },
  Jumat: { buka: "08:00", tutup: "16:00", libur: false },
  Sabtu: { buka: "08:00", tutup: "16:00", libur: false },
  Minggu: { buka: "08:00", tutup: "16:00", libur: true },
};

export default function ProfilUmkm() {
  // ==========================================
  // STATE PROFIL DESA
  // ==========================================
  const [sejarahDesa, setSejarahDesa] = useState("");
  const [visiMisiDesa, setVisiMisiDesa] = useState("");
  const [statusProfil, setStatusProfil] = useState("");
  const [isLoadingProfil, setIsLoadingProfil] = useState(false);
  
  // ==========================================
  // STATE APARATUR (SOTK)
  // ==========================================
  const [namaAparatur, setNamaAparatur] = useState("");
  const [jabatanAparatur, setJabatanAparatur] = useState("");
  const [urutanAparatur, setUrutanAparatur] = useState<number>(1);
  const [jalurAtas, setJalurAtas] = useState("");
  const [jenisGaris, setJenisGaris] = useState("Instruksi");
  const [fotoAparatur, setFotoAparatur] = useState<File | null>(null);
  const [daftarAparatur, setDaftarAparatur] = useState<any[]>([]);
  const [statusAparatur, setStatusAparatur] = useState("");
  const [isLoadingAparatur, setIsLoadingAparatur] = useState(false);
  const [editAparaturId, setEditAparaturId] = useState<string | null>(null);
  const [fotoLamaAparatur, setFotoLamaAparatur] = useState("");

  // ==========================================
  // STATE UMKM & WISATA (MEGA UPDATE)
  // ==========================================
  const [kategoriPotensi, setKategoriPotensi] = useState("UMKM"); // UMKM atau Wisata
  const [namaPotensi, setNamaPotensi] = useState("");
  const [pengelola, setPengelola] = useState("");
  const [hargaMulai, setHargaMulai] = useState<number | string>("");
  const [hargaSampai, setHargaSampai] = useState<number | string>("");
  const [kontak, setKontak] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [deskripsiPotensi, setDeskripsiPotensi] = useState("");
  const [jamOperasional, setJamOperasional] = useState<any>(DEFAULT_JAM);
  
  const [fotoPotensiList, setFotoPotensiList] = useState<FileList | null>(null);
  const [gambarLamaPotensi, setGambarLamaPotensi] = useState<string[]>([]);
  
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [statusUmkm, setStatusUmkm] = useState("");
  const [isLoadingUmkm, setIsLoadingUmkm] = useState(false);
  const [editUmkmId, setEditUmkmId] = useState<string | null>(null);

  // ==========================================
  // STATE LEMBAGA MASYARAKAT (DENGAN ANGGOTA PENGURUS)
  // ==========================================
  const [namaLembaga, setNamaLembaga] = useState("");
  const [singkatanLembaga, setSingkatanLembaga] = useState("");
  const [deskripsiLembaga, setDeskripsiLembaga] = useState("");
  const [anggotaLembaga, setAnggotaLembaga] = useState<{nama: string, jabatan: string}[]>([]);
  const [fotoLembaga, setFotoLembaga] = useState<File | null>(null);
  const [daftarLembaga, setDaftarLembaga] = useState<any[]>([]);
  const [statusLembaga, setStatusLembaga] = useState("");
  const [isLoadingLembaga, setIsLoadingLembaga] = useState(false);
  const [editLembagaId, setEditLembagaId] = useState<string | null>(null);
  const [fotoLamaLembaga, setFotoLamaLembaga] = useState("");

  // ==========================================
  // FUNGSI PENGAMBILAN DATA
  // ==========================================
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

  useEffect(() => { ambilData(); }, []);

  // ==========================================
  // FUNGSI UPLOAD FOTO (IMGBB + API KEY ANDA)
  // ==========================================
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

  // ==========================================
  // MANAJEMEN PROFIL (SEJARAH & VISI MISI)
  // ==========================================
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoadingProfil(true); setStatusProfil("Menyimpan...");
    try {
      await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() });
      setStatusProfil("✅ Profil Desa berhasil diperbarui!"); setTimeout(() => setStatusProfil(""), 4000);
    } catch (error) { setStatusProfil("❌ Gagal menyimpan profil."); } finally { setIsLoadingProfil(false); }
  };

  // ==========================================
  // MANAJEMEN APARATUR & SOTK
  // ==========================================
  const handleSimpanAparatur = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingAparatur(true); setStatusAparatur("Memproses...");
    try {
      let imageUrl = fotoLamaAparatur;
      if (fotoAparatur) { setStatusAparatur("Upload foto wajah..."); imageUrl = (await uploadFotoKeImgBB(fotoAparatur)) || ""; }
      const dataAparatur = { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), jalurAtas, jenisGaris, foto: imageUrl };
      
      if (editAparaturId) { await updateDoc(doc(db, "aparatur_desa", editAparaturId), dataAparatur); setStatusAparatur("✅ Perangkat Desa diperbarui!");
      } else { await addDoc(collection(db, "aparatur_desa"), dataAparatur); setStatusAparatur("✅ Perangkat Desa ditambahkan!"); }
      batalEditAparatur(); ambilData(); setTimeout(() => setStatusAparatur(""), 4000);
    } catch (error) { setStatusAparatur("❌ Gagal memproses data SOTK."); } finally { setIsLoadingAparatur(false); }
  };

  const mulaiEditAparatur = (item: any) => {
    setEditAparaturId(item.id); setNamaAparatur(item.nama); setJabatanAparatur(item.jabatan); setUrutanAparatur(item.urutan); 
    setJalurAtas(item.jalurAtas || ""); setJenisGaris(item.jenisGaris || "Instruksi"); setFotoLamaAparatur(item.foto || "");
    // Dihapus agar tidak scroll ke atas
  };

  const batalEditAparatur = () => { 
    setEditAparaturId(null); setNamaAparatur(""); setJabatanAparatur(""); setUrutanAparatur(daftarAparatur.length + 2); 
    setJalurAtas(""); setJenisGaris("Instruksi"); setFotoLamaAparatur(""); setFotoAparatur(null);
  };
  const hapusAparatur = async (id: string) => { if (confirm("Yakin menghapus anggota aparatur ini?")) { await deleteDoc(doc(db, "aparatur_desa", id)); ambilData(); } };
  const daftarAtasan = daftarAparatur.filter(org => org.id !== editAparaturId && org.urutan < urutanAparatur);

  // ==========================================
  // MANAJEMEN UMKM & WISATA (POTENSI DESA)
  // ==========================================
  const handleJamChange = (hari: string, field: string, value: any) => {
    setJamOperasional((prev: any) => ({ ...prev, [hari]: { ...prev[hari], [field]: value } }));
  };

  const handleSimpanUmkm = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingUmkm(true); setStatusUmkm("Memproses...");
    try {
      let tautanGambarBaru: string[] = [];
      if (fotoPotensiList && fotoPotensiList.length > 0) {
        setStatusUmkm(`Mengunggah foto...`);
        const uploadPromises = Array.from(fotoPotensiList).map(file => uploadFotoKeImgBB(file));
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter(url => url !== null) as string[];
      }
      const gambarFinal = [...gambarLamaPotensi, ...tautanGambarBaru];

      const dataUmkm = { 
        kategori: kategoriPotensi,
        nama_produk: namaPotensi, 
        pemilik: pengelola, 
        harga_mulai: Number(hargaMulai), 
        harga_sampai: Number(hargaSampai), 
        wa: kontak, 
        link_maps: linkMaps,
        deskripsi: deskripsiPotensi, 
        jam_operasional: jamOperasional,
        gambar: gambarFinal,
        tanggal_input: new Date().toISOString()
      };

      if (editUmkmId) { 
        await updateDoc(doc(db, "potensi_desa", editUmkmId), dataUmkm); 
        setStatusUmkm(`✅ ${kategoriPotensi} diperbarui!`);
      } else { 
        await addDoc(collection(db, "potensi_desa"), dataUmkm); 
        setStatusUmkm(`✅ ${kategoriPotensi} ditambahkan!`); 
      }
      
      batalEditUmkm(); ambilData(); setTimeout(() => setStatusUmkm(""), 4000);
    } catch (error) { setStatusUmkm("❌ Gagal menyimpan data."); } finally { setIsLoadingUmkm(false); }
  };

  const mulaiEditUmkm = (item: any) => { 
    setEditUmkmId(item.id); 
    setKategoriPotensi(item.kategori || "UMKM");
    setNamaPotensi(item.nama_produk || ""); 
    setPengelola(item.pemilik || ""); 
    setHargaMulai(item.harga_mulai || item.harga || ""); 
    setHargaSampai(item.harga_sampai || ""); 
    setKontak(item.wa || ""); 
    setLinkMaps(item.link_maps || "");
    setDeskripsiPotensi(item.deskripsi || ""); 
    setJamOperasional(item.jam_operasional || DEFAULT_JAM);
    
    // Support backward compatibility (jika dulu cuma 1 foto string, jadikan array)
    const gbLama = Array.isArray(item.gambar) ? item.gambar : (item.foto ? [item.foto] : []);
    setGambarLamaPotensi(gbLama);
    setFotoPotensiList(null);
    // Dihapus agar tidak scroll ke atas
  };

  const hapusGambarLamaPotensi = (index: number) => {
    setGambarLamaPotensi(prev => prev.filter((_, i) => i !== index));
  };

  const batalEditUmkm = () => { 
    setEditUmkmId(null); setKategoriPotensi("UMKM"); setNamaPotensi(""); setPengelola(""); 
    setHargaMulai(""); setHargaSampai(""); setKontak(""); setLinkMaps(""); setDeskripsiPotensi(""); 
    setJamOperasional(DEFAULT_JAM); setGambarLamaPotensi([]); setFotoPotensiList(null);
    const input = document.getElementById('inputFotoPotensi') as HTMLInputElement; if(input) input.value = '';
  };

  const hapusUmkm = async (id: string) => { if (confirm("Yakin menghapus data Potensi ini?")) { await deleteDoc(doc(db, "potensi_desa", id)); ambilData(); } };

  // ==========================================
  // MANAJEMEN LEMBAGA MASYARAKAT (DENGAN ANGGOTA PENGURUS)
  // ==========================================
  const handleSimpanLembaga = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingLembaga(true); setStatusLembaga("Memproses...");
    try {
      let imageUrl = fotoLamaLembaga;
      if (fotoLembaga) { setStatusLembaga("Upload logo lembaga..."); imageUrl = (await uploadFotoKeImgBB(fotoLembaga)) || ""; }
      
      const dataLembaga = { nama: namaLembaga, singkatan: singkatanLembaga, deskripsi: deskripsiLembaga, anggota: anggotaLembaga, foto: imageUrl };

      if (editLembagaId) { await updateDoc(doc(db, "lembaga_desa", editLembagaId), dataLembaga); setStatusLembaga("✅ Lembaga diperbarui!");
      } else { await addDoc(collection(db, "lembaga_desa"), dataLembaga); setStatusLembaga("✅ Lembaga ditambahkan!"); }
      
      batalEditLembaga(); ambilData(); setTimeout(() => setStatusLembaga(""), 4000);
    } catch (error) { setStatusLembaga("❌ Gagal menyimpan Lembaga."); } finally { setIsLoadingLembaga(false); }
  };

  const mulaiEditLembaga = (item: any) => { 
    setEditLembagaId(item.id); setNamaLembaga(item.nama); setSingkatanLembaga(item.singkatan); setDeskripsiLembaga(item.deskripsi); 
    setAnggotaLembaga(item.anggota || []); setFotoLamaLembaga(item.foto || ""); setFotoLembaga(null);
    // Dihapus agar tidak scroll ke atas
  };

  const batalEditLembaga = () => { 
    setEditLembagaId(null); setNamaLembaga(""); setSingkatanLembaga(""); setDeskripsiLembaga(""); setAnggotaLembaga([]); setFotoLamaLembaga(""); setFotoLembaga(null);
  };

  const hapusLembaga = async (id: string) => { if (confirm("Yakin menghapus lembaga kemasyarakatan ini?")) { await deleteDoc(doc(db, "lembaga_desa", id)); ambilData(); } };

  // FUNGSI ANGGOTA LEMBAGA
  const tambahAnggotaLembaga = () => setAnggotaLembaga([...anggotaLembaga, { nama: "", jabatan: "" }]);
  const ubahAnggotaLembaga = (index: number, field: string, value: string) => {
    const newData = [...anggotaLembaga];
    newData[index] = { ...newData[index], [field]: value };
    setAnggotaLembaga(newData);
  };
  const hapusAnggotaLembaga = (index: number) => setAnggotaLembaga(anggotaLembaga.filter((_, i) => i !== index));

  // ==========================================
  // TAMPILAN RENDER (HTML/JSX)
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* 1. MODUL SEJARAH & VISI MISI */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600">
        <h3 className="text-2xl font-bold mb-2">🏛️ Pengaturan Teks Profil</h3>
        <p className="text-gray-500 text-sm mb-6">Sesuaikan teks Sejarah dan Visi Misi yang akan menjadi wajah desa di halaman publik.</p>
        <form onSubmit={handleSimpanProfil} className="space-y-5">
          <div><label className="block text-sm font-bold mb-2 text-gray-800">Sejarah Desa</label><textarea required rows={6} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"></textarea></div>
          <div><label className="block text-sm font-bold mb-2 text-gray-800">Visi & Misi</label><textarea required rows={6} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"></textarea></div>
          {statusProfil && (<div className="p-4 rounded-xl font-bold text-center bg-green-100 text-green-800 border border-green-300">{statusProfil}</div>)}
          <button type="submit" disabled={isLoadingProfil} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-xl shadow-md transition-colors text-lg">{isLoadingProfil ? "Menyimpan Perubahan..." : "Simpan Profil Utama"}</button>
        </form>
      </div>

      {/* 2. MODUL SOTK APARATUR (DENGAN HIERARKI) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-blue-600">
        <h3 className="text-2xl font-bold mb-2">👔 Susunan Perangkat Desa (SOTK)</h3>
        <p className="text-gray-500 text-sm mb-6">Kelola hierarki susunan perangkat desa beserta foto formal dan garis komando koordinasi mereka.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-3"><h4 className="font-bold text-blue-900 text-lg">{editAparaturId ? "✏️ Edit SOTK" : "Tambah Anggota"}</h4>{editAparaturId && (<button onClick={batalEditAparatur} type="button" className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>)}</div>
            <form onSubmit={handleSimpanAparatur} className="space-y-5">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Lengkap & Gelar</label><input type="text" required value={namaAparatur} onChange={(e) => setNamaAparatur(e.target.value)} placeholder="Misal: Drs. Budi Santoso" className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" /></div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Jabatan</label><input type="text" required value={jabatanAparatur} onChange={(e) => setJabatanAparatur(e.target.value)} placeholder="Misal: Kepala Desa" className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">No. Urut Hierarki</label><input type="number" required value={urutanAparatur} onChange={(e) => setUrutanAparatur(Number(e.target.value))} className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center font-black text-xl text-blue-900" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Foto Wajah</label><label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-blue-300 rounded-xl hover:bg-blue-100 transition-all overflow-hidden shadow-sm"><span className="font-bold text-blue-800 text-xs flex items-center gap-2"><span className="text-xl">📸</span> {fotoAparatur ? "Siap" : "Pilih File"}</span><input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setFotoAparatur(e.target.files[0]); }} className="hidden" /></label></div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-4">
                <div className="flex gap-2 items-center mb-1"><span className="text-xl">🔗</span><h5 className="font-bold text-gray-800 text-sm">Garis Komando</h5></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Jalur Atas (Atasan)</label><select value={jalurAtas} onChange={(e) => setJalurAtas(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none bg-gray-50 text-sm"><option value="">-- Puncak (Tanpa Atasan) --</option>{daftarAtasan.map(atasan => (<option key={atasan.id} value={atasan.id}>{atasan.jabatan} - {atasan.nama}</option>))}</select></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Sifat Hubungan</label><select value={jenisGaris} onChange={(e) => setJenisGaris(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none bg-gray-50 text-sm"><option value="Instruksi">Garis Instruksi (Tegak)</option><option value="Koordinasi">Garis Koordinasi (Putus-putus)</option></select></div>
              </div>
              {editAparaturId && fotoLamaAparatur && (<div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-blue-200 shadow-sm"><img src={`https://wsrv.nl/?url=${fotoLamaAparatur}`} className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" /><div><span className="text-xs font-bold text-blue-800 block">Foto Tersimpan</span></div></div>)}
              {statusAparatur && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusAparatur}</div>)}
              <button type="submit" disabled={isLoadingAparatur} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition-colors text-lg">{isLoadingAparatur ? "Memproses..." : editAparaturId ? "Simpan Perubahan SOTK" : "Tambahkan ke SOTK"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600 text-center">No</th><th className="py-4 px-4 font-bold text-gray-600">Identitas & Jabatan</th><th className="py-4 px-4 font-bold text-gray-600">Koordinasi</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarAparatur.map((org) => {
                  const atasan = daftarAparatur.find(a => a.id === org.jalurAtas);
                  return (
                    <tr key={org.id} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4"><div className="w-10 h-10 mx-auto bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-blue-200">{org.urutan}</div></td>
                      <td className="py-4 px-4 flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">{org.foto ? (<img src={`https://wsrv.nl/?url=${org.foto}`} alt="profil" className="w-full h-full object-cover"/>) : (<span className="flex items-center justify-center w-full h-full text-2xl text-gray-400">👤</span>)}</div><div><div className="font-bold text-gray-900 text-base">{org.nama}</div><div className="text-xs text-blue-700 uppercase font-black tracking-widest mt-1 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">{org.jabatan}</div></div></td>
                      <td className="py-4 px-4">{org.jalurAtas ? (<div className="text-xs"><span className="text-gray-500 block mb-0.5">Lapor Ke:</span><span className="font-bold text-gray-800">{atasan ? atasan.jabatan : "Atasan Dihapus"}</span><div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${org.jenisGaris === "Instruksi" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{org.jenisGaris}</div></div>) : (<span className="text-xs text-gray-400 italic">Puncak Hierarki</span>)}</td>
                      <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditAparatur(org)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button><button onClick={() => hapusAparatur(org.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. MODUL LEMBAGA MASYARAKAT (DENGAN ANGGOTA) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-indigo-500">
        <h3 className="text-2xl font-bold mb-2">🤝 Lembaga Kemasyarakatan Desa</h3>
        <p className="text-gray-500 text-sm mb-6">Kelola data Lembaga Masyarakat (PKK, Karang Taruna, LPMD) beserta daftar pengurusnya.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-indigo-200 pb-3"><h4 className="font-bold text-indigo-900 text-lg">{editLembagaId ? "✏️ Edit Lembaga" : "Daftarkan Lembaga"}</h4>{editLembagaId && (<button type="button" onClick={batalEditLembaga} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>)}</div>
            <form onSubmit={handleSimpanLembaga} className="space-y-5">
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Organisasi</label><input type="text" required value={namaLembaga} onChange={(e)=>setNamaLembaga(e.target.value)} placeholder="Misal: Karang Taruna" className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Singkatan</label><input type="text" required value={singkatanLembaga} onChange={(e)=>setSingkatanLembaga(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-black text-center text-indigo-900 text-xl tracking-widest" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Logo</label><label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-indigo-300 rounded-xl hover:bg-indigo-100 transition-all overflow-hidden shadow-sm"><span className="font-bold text-indigo-800 text-xs flex items-center gap-2"><span className="text-xl">📸</span> {fotoLembaga ? "Siap" : "Upload"}</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFotoLembaga(e.target.files[0])}} className="hidden" /></label></div>
              </div>
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi / Tupoksi</label><textarea required rows={3} value={deskripsiLembaga} onChange={(e)=>setDeskripsiLembaga(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white leading-relaxed"></textarea></div>
              
              {/* DAFTAR ANGGOTA LEMBAGA */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h5 className="font-bold text-gray-800 text-sm">Daftar Pengurus (Opsional)</h5>
                  <button type="button" onClick={tambahAnggotaLembaga} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] px-2 py-1 font-bold rounded">+ Tambah Pengurus</button>
                </div>
                {anggotaLembaga.map((anggota, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <input type="text" placeholder="Nama" value={anggota.nama} onChange={(e) => ubahAnggotaLembaga(idx, 'nama', e.target.value)} className="w-full text-xs p-2 border rounded outline-none" />
                    <input type="text" placeholder="Jabatan" value={anggota.jabatan} onChange={(e) => ubahAnggotaLembaga(idx, 'jabatan', e.target.value)} className="w-full text-xs p-2 border rounded outline-none" />
                    <button type="button" onClick={() => hapusAnggotaLembaga(idx)} className="bg-red-100 text-red-600 px-2 py-1.5 rounded font-bold text-xs hover:bg-red-200">X</button>
                  </div>
                ))}
                {anggotaLembaga.length === 0 && <p className="text-xs text-gray-400 italic text-center">Belum ada pengurus ditambahkan.</p>}
              </div>

              {editLembagaId && fotoLamaLembaga && (<div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-indigo-200 shadow-sm"><img src={`https://wsrv.nl/?url=${fotoLamaLembaga}`} className="w-10 h-10 rounded-md object-contain" /><div><span className="text-xs font-bold text-indigo-800 block">Logo Tersimpan</span></div></div>)}
              {statusLembaga && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusLembaga}</div>)}
              <button type="submit" disabled={isLoadingLembaga} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-md transition-colors text-lg">{isLoadingLembaga ? "Memproses..." : editLembagaId ? "Simpan Perubahan Lembaga" : "Tambahkan Lembaga"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Lembaga & Pengurus</th><th className="py-4 px-4 font-bold text-gray-600">Deskripsi</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarLembaga.map((lem) => (
                  <tr key={lem.id} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="py-4 px-4 flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md p-1">{lem.foto ? (<img src={`https://wsrv.nl/?url=${lem.foto}`} className="w-full h-full object-contain" />) : (<span className="flex items-center justify-center h-full text-3xl">🤝</span>)}</div>
                      <div>
                        <div className="font-black text-indigo-900 text-lg tracking-wide">{lem.singkatan}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase mt-1 leading-snug w-40">{lem.nama}</div>
                        <div className="mt-2 space-y-1">
                          {(lem.anggota || []).slice(0,2).map((a:any, i:number) => (
                            <div key={i} className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded flex justify-between"><span className="font-bold">{a.jabatan}</span><span>{a.nama}</span></div>
                          ))}
                          {(lem.anggota || []).length > 2 && <div className="text-[10px] text-gray-400 italic">+{lem.anggota.length - 2} anggota lainnya</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="text-xs text-gray-600 leading-relaxed max-w-xs line-clamp-4">{lem.deskripsi}</div></td>
                    <td className="py-4 px-4"><div className="flex flex-col gap-2 items-center"><button onClick={() => mulaiEditLembaga(lem)} className="w-full max-w-[100px] bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Edit</button><button onClick={() => hapusLembaga(lem.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. MODUL KATALOG UMKM & WISATA DESA (MEGA UPDATE: HARGA RENTANG, JAM, MAPS, SLIDE) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-yellow-600">
        <h3 className="text-2xl font-bold mb-2">🛍️ Katalog Potensi, Wisata & UMKM</h3>
        <p className="text-gray-500 text-sm mb-6">Kelola promosi pariwisata, produk UMKM, fasilitas, beserta jam operasional dan lokasi (Maps).</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b border-yellow-300 pb-3"><h4 className="font-bold text-yellow-900 text-lg">{editUmkmId ? "✏️ Edit Potensi" : "Tambah Potensi Baru"}</h4>{editUmkmId && (<button type="button" onClick={batalEditUmkm} className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors">Batal</button>)}</div>
            
            <form onSubmit={handleSimpanUmkm} className="space-y-4">
              {/* KATEGORI */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">Kategori</label>
                <select value={kategoriPotensi} onChange={(e) => setKategoriPotensi(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white font-bold">
                  <option value="UMKM">Produk UMKM / Jasa Warga</option>
                  <option value="Wisata">Pariwisata / Potensi Desa</option>
                  <option value="Fasilitas">Fasilitas Publik Desa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">{kategoriPotensi === "UMKM" ? "Nama Produk / Usaha" : "Nama Tempat Wisata/Potensi"}</label>
                <input type="text" required value={namaPotensi} onChange={(e)=>setNamaPotensi(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">{kategoriPotensi === "UMKM" ? "Pemilik" : "Pengelola (Opsional)"}</label><input type="text" value={pengelola} onChange={(e)=>setPengelola(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white" /></div>
                <div><label className="block text-xs font-bold mb-1.5 text-gray-700">No. Kontak / WA</label><input type="number" value={kontak} onChange={(e)=>setKontak(e.target.value)} placeholder="62812..." className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white" /></div>
              </div>
              
              <div className="bg-white p-3 rounded-xl border border-yellow-300 shadow-sm">
                <label className="block text-xs font-bold mb-2 text-yellow-900 border-b border-yellow-100 pb-1">Estimasi Harga (Rp) - Isi 0 jika Gratis</label>
                <div className="flex items-center gap-2">
                  <input type="number" required value={hargaMulai} onChange={(e)=>setHargaMulai(e.target.value)} placeholder="Mulai" className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-yellow-400" />
                  <span className="font-bold text-gray-400">-</span>
                  <input type="number" required value={hargaSampai} onChange={(e)=>setHargaSampai(e.target.value)} placeholder="Sampai" className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-yellow-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">Tautan Google Maps</label>
                <input type="url" value={linkMaps} onChange={(e)=>setLinkMaps(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-xs text-blue-600 font-mono" />
              </div>

              {/* JAM OPERASIONAL MATRIX */}
              <div className="bg-white p-3 rounded-xl border border-yellow-300 shadow-sm">
                <label className="block text-xs font-bold mb-3 text-yellow-900 border-b border-yellow-100 pb-1">Jadwal Operasional (Per Hari)</label>
                <div className="space-y-3">
                  {Object.keys(jamOperasional).map((hari) => (
                    <div key={hari} className="flex items-center gap-2 justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                      <span className="w-12 font-bold text-[10px] text-gray-700">{hari}</span>
                      <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <input type="checkbox" checked={jamOperasional[hari].libur} onChange={(e) => handleJamChange(hari, 'libur', e.target.checked)} className="w-3 h-3 text-red-500 rounded border-gray-300 focus:ring-red-500" />
                        <span className={jamOperasional[hari].libur ? "text-red-600 font-bold" : "text-gray-500"}>Libur</span>
                      </label>
                      {!jamOperasional[hari].libur ? (
                        <div className="flex items-center gap-1">
                          <input type="time" value={jamOperasional[hari].buka} onChange={(e) => handleJamChange(hari, 'buka', e.target.value)} className="border border-gray-300 p-1 text-[10px] rounded outline-none focus:border-yellow-500 bg-white" />
                          <span className="text-gray-400">-</span>
                          <input type="time" value={jamOperasional[hari].tutup} onChange={(e) => handleJamChange(hari, 'tutup', e.target.value)} className="border border-gray-300 p-1 text-[10px] rounded outline-none focus:border-yellow-500 bg-white" />
                        </div>
                      ) : (
                         <div className="flex-1 text-center text-[10px] font-bold text-red-500 bg-red-50 rounded py-1">TUTUP</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div><label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi Daya Tarik</label><textarea required rows={3} value={deskripsiPotensi} onChange={(e)=>setDeskripsiPotensi(e.target.value)} className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 bg-white leading-relaxed"></textarea></div>
              
              {/* UPLOAD BANYAK GAMBAR */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">Galeri Foto (Bisa lebih dari 1)</label>
                <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-white border-2 border-dashed border-yellow-400 rounded-xl hover:bg-yellow-100 transition-all shadow-sm">
                  <span className="font-bold text-yellow-800 text-xs flex flex-col items-center gap-2"><span className="text-3xl transform hover:scale-110 transition-transform">📸</span> Klik Pilih File</span>
                  <input id="inputFotoPotensi" type="file" accept="image/*" multiple onChange={(e) => { if(e.target.files) setFotoPotensiList(e.target.files)}} className="hidden" />
                </label>
                {fotoPotensiList && (<div className="text-xs font-bold text-green-700 bg-green-50 p-2 mt-2 rounded border border-green-200">✅ {fotoPotensiList.length} foto siap upload</div>)}
              </div>

              {editUmkmId && gambarLamaPotensi.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-900 mb-2">Foto Tersimpan (Klik X menghapus):</p>
                  <div className="flex flex-wrap gap-2">
                    {gambarLamaPotensi.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 border-2 border-white rounded-lg overflow-hidden group shadow-md">
                        <img src={`https://wsrv.nl/?url=${url}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => hapusGambarLamaPotensi(idx)} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">X</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {statusUmkm && (<div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">{statusUmkm}</div>)}
              <button type="submit" disabled={isLoadingUmkm} className="w-full bg-yellow-600 text-white font-bold py-3.5 rounded-xl hover:bg-yellow-700 shadow-md transition-colors text-lg">{isLoadingUmkm ? "Memproses Data..." : editUmkmId ? "Simpan Perubahan Potensi" : "Tambahkan ke Katalog"}</button>
            </form>
          </div>
          
          <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Info & Gambar</th><th className="py-4 px-4 font-bold text-gray-600">Harga & Jam</th><th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th></tr></thead>
              <tbody>
                {daftarUmkm.map((umkm) => {
                  const fotonya = Array.isArray(umkm.gambar) && umkm.gambar.length > 0 ? umkm.gambar[0] : (umkm.foto || "");
                  return (
                  <tr key={umkm.id} className="border-b hover:bg-yellow-50 transition-colors">
                    <td className="py-4 px-4 flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md relative">
                        {fotonya ? (<img src={`https://wsrv.nl/?url=${fotonya}`} className="w-full h-full object-cover"/>) : (<span className="flex items-center justify-center h-full text-3xl text-gray-400">🏞️</span>)}
                        {Array.isArray(umkm.gambar) && umkm.gambar.length > 1 && (<div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">+{umkm.gambar.length - 1}</div>)}
                      </div>
                      <div>
                        <div className="text-[9px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-black uppercase tracking-widest inline-block mb-1 border border-yellow-200">{umkm.kategori || "UMKM"}</div>
                        <div className="font-bold text-gray-900 text-base leading-tight">{umkm.nama_produk}</div>
                        <div className="text-xs text-gray-500 mt-1">Oleh: <span className="font-bold text-gray-700">{umkm.pemilik || "-"}</span></div>
                        <div className="text-[10px] text-blue-600 font-mono mt-1 font-bold">WA: {umkm.wa || "-"}</div>
                        {umkm.link_maps && (<a href={umkm.link_maps} target="_blank" className="text-[10px] text-red-500 font-bold hover:underline mt-1 block">📍 Buka Maps</a>)}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-bold inline-block mb-2">
                        {umkm.harga_mulai === 0 && umkm.harga_sampai === 0 ? "GRATIS" : `Rp ${new Intl.NumberFormat("id-ID").format(umkm.harga_mulai || umkm.harga)} - Rp ${new Intl.NumberFormat("id-ID").format(umkm.harga_sampai || 0)}`}
                      </div>
                      {/* Ringkasan Jam Buka Hari Ini */}
                      <div className="text-[10px] bg-gray-50 border border-gray-200 p-2 rounded-lg text-gray-600">
                        <span className="font-bold block mb-1">Jam Operasional:</span>
                        {umkm.jam_operasional ? (
                           Object.keys(umkm.jam_operasional).slice(0, 3).map(h => (
                             <div key={h} className="flex justify-between w-32 border-b border-gray-100 last:border-0 pb-0.5 mb-0.5"><span>{h}:</span> {umkm.jam_operasional[h].libur ? <span className="text-red-500 font-bold">Libur</span> : <span>{umkm.jam_operasional[h].buka} - {umkm.jam_operasional[h].tutup}</span>}</div>
                           ))
                        ) : "Belum diatur"}
                        {umkm.jam_operasional && <div className="text-gray-400 italic mt-0.5">...lihat selengkapnya di edit</div>}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => mulaiEditUmkm(umkm)} className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">Edit Data</button>
                        <button onClick={() => hapusUmkm(umkm.id)} className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                )})}
                {daftarUmkm.length === 0 && (<tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada potensi atau produk UMKM yang didaftarkan.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}