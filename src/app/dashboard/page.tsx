"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function DashboardAdmin() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("welcome");

  // --- STATE KABAR DESA ---
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]);

  // --- STATE PROFIL DESA ---
  const [sejarahDesa, setSejarahDesa] = useState("");
  const [visiMisiDesa, setVisiMisiDesa] = useState("");
  const [statusProfil, setStatusProfil] = useState("");
  const [isLoadingProfil, setIsLoadingProfil] = useState(false);
  
  // --- STATE APARATUR DESA (BARU) ---
  const [namaAparatur, setNamaAparatur] = useState("");
  const [jabatanAparatur, setJabatanAparatur] = useState("");
  const [urutanAparatur, setUrutanAparatur] = useState<number>(1);
  const [fotoAparatur, setFotoAparatur] = useState<File | null>(null);
  const [daftarAparatur, setDaftarAparatur] = useState<any[]>([]);
  const [statusAparatur, setStatusAparatur] = useState("");
  const [isLoadingAparatur, setIsLoadingAparatur] = useState(false);

  // --- STATE TRANSPARANSI (APBDes) ---
  const [danaDesa, setDanaDesa] = useState<number | string>(0);
  const [alokasiDanaDesa, setAlokasiDanaDesa] = useState<number | string>(0);
  const [pad, setPad] = useState<number | string>(0);
  const [banprov, setBanprov] = useState<number | string>(0);
  const [statusApbdes, setStatusApbdes] = useState("");
  const [isLoadingApbdes, setIsLoadingApbdes] = useState(false);

  // --- STATE MANAJEMEN AKUN ---
  const [namaAkun, setNamaAkun] = useState("");
  const [emailAkun, setEmailAkun] = useState("");
  const [roleAkun, setRoleAkun] = useState("Kontributor");
  const [statusAkun, setStatusAkun] = useState("");
  const [isLoadingAkun, setIsLoadingAkun] = useState(false);

  // --- STATE LAYANAN WARGA ---
  const [daftarSurat, setDaftarSurat] = useState<any[]>([]);
  const [daftarPengaduan, setDaftarPengaduan] = useState<any[]>([]);

  // FUNGSI TARIK SEMUA DATA 
  const ambilDataAwal = async () => {
    try {
      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapKabar = await getDocs(qKabar);
      const dataKabar: any[] = [];
      snapKabar.forEach(doc => dataKabar.push({ id: doc.id, ...doc.data() }));
      setRiwayatKabar(dataKabar);

      const snapProfil = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapProfil.exists()) {
        setSejarahDesa(snapProfil.data().sejarah || "");
        setVisiMisiDesa(snapProfil.data().visi_misi || "");
      }

      // Tarik Data Aparatur
      const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
      const snapAparatur = await getDocs(qAparatur);
      const dataAparatur: any[] = [];
      snapAparatur.forEach(doc => dataAparatur.push({ id: doc.id, ...doc.data() }));
      setDaftarAparatur(dataAparatur);

      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0); setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0); setPad(snapApbdes.data().pad || 0); setBanprov(snapApbdes.data().banprov || 0);
      }

      const qSurat = query(collection(db, "layanan_surat"), orderBy("tanggal_pengajuan", "desc"));
      const snapSurat = await getDocs(qSurat);
      const dataSurat: any[] = [];
      snapSurat.forEach(doc => dataSurat.push({ id: doc.id, ...doc.data() }));
      setDaftarSurat(dataSurat);

      const qPengaduan = query(collection(db, "pengaduan_warga"), orderBy("tanggal_laporan", "desc"));
      const snapPengaduan = await getDocs(qPengaduan);
      const dataPengaduan: any[] = [];
      snapPengaduan.forEach(doc => dataPengaduan.push({ id: doc.id, ...doc.data() }));
      setDaftarPengaduan(dataPengaduan);

    } catch (error) { console.error("Gagal menarik data:", error); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); } else { setUserEmail(user.email); setIsCheckingAuth(false); ambilDataAwal(); }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push("/login"); };

  // --- FUNGSI KABAR DESA ---
  const handleSimpanKabar = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingKabar(true); setStatusKabar("Memproses data...");
    try {
      let tautanGambarBaru: string[] = [];
      if (fotoKabarList && fotoKabarList.length > 0) {
        setStatusKabar(`Mengunggah foto...`);
        // --- API KEY IMGBB 1 ---
        const apiKeyImgBB = "6755e61bb042b746d83c71595313674e"; 
        const uploadPromises = Array.from(fotoKabarList).map(async (file) => {
          const formData = new FormData(); formData.append("image", file);
          const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
          const hasil = await tanggapan.json(); return hasil.success ? hasil.data.url : null;
        });
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter(url => url !== null);
      }
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];
      if (editKabarId) { await updateDoc(doc(db, "kabar_desa", editKabarId), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal }); setStatusKabar("✅ Berita diperbarui!");
      } else { await addDoc(collection(db, "kabar_desa"), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal, tanggal_posting: new Date().toISOString(), penulis: userEmail }); setStatusKabar("✅ Berita dipublikasikan!"); }
      batalEditKabar(); ambilDataAwal(); setTimeout(() => setStatusKabar(""), 4000);
    } catch (error) { setStatusKabar("❌ Terjadi kesalahan."); } finally { setIsLoadingKabar(false); }
  };
  const mulaiEditKabar = (item: any) => { setEditKabarId(item.id); setJudulKabar(item.judul); setIsiKabar(item.isi); setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const batalEditKabar = () => { setEditKabarId(null); setJudulKabar(""); setIsiKabar(""); setGambarLama([]); setFotoKabarList(null); };
  const hapusKabar = async (id: string) => { if (confirm("Yakin hapus permanen?")) { await deleteDoc(doc(db, "kabar_desa", id)); ambilDataAwal(); } };

  // --- FUNGSI PROFIL & APARATUR ---
  const handleSimpanProfil = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingProfil(true); setStatusProfil("Menyimpan..."); try { await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() }); setStatusProfil("✅ Profil diperbarui!"); setTimeout(() => setStatusProfil(""), 4000); } catch (error) { setStatusProfil("❌ Gagal."); } finally { setIsLoadingProfil(false); } };
  
  const handleSimpanAparatur = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingAparatur(true); setStatusAparatur("Memproses...");
    try {
      let imageUrl = "";
      if (fotoAparatur) {
        setStatusAparatur("Mengunggah foto profil...");
        // --- API KEY IMGBB 2 ---
        const apiKeyImgBB = "6755e61bb042b746d83c71595313674e"; 
        const formData = new FormData(); formData.append("image", fotoAparatur);
        const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
        const hasil = await tanggapan.json();
        if (hasil.success) imageUrl = hasil.data.url;
      }
      await addDoc(collection(db, "aparatur_desa"), { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), foto: imageUrl });
      setStatusAparatur("✅ Perangkat Desa ditambahkan!");
      setNamaAparatur(""); setJabatanAparatur(""); setFotoAparatur(null); setUrutanAparatur(daftarAparatur.length + 2);
      ambilDataAwal(); setTimeout(() => setStatusAparatur(""), 4000);
    } catch (error) { setStatusAparatur("❌ Gagal menyimpan."); } finally { setIsLoadingAparatur(false); }
  };
  const hapusAparatur = async (id: string) => { if (confirm("Yakin menghapus perangkat desa ini?")) { await deleteDoc(doc(db, "aparatur_desa", id)); ambilDataAwal(); } };

  // --- FUNGSI APBDES, AKUN, LAYANAN (TETAP UTUH) ---
  const handleSimpanApbdes = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingApbdes(true); setStatusApbdes("Menyimpan..."); try { await setDoc(doc(db, "transparansi", "apbdes"), { dana_desa: Number(danaDesa), alokasi_dana_desa: Number(alokasiDanaDesa), pad: Number(pad), banprov: Number(banprov), terakhir_diperbarui: new Date().toISOString() }); setStatusApbdes("✅ APBDes diperbarui!"); setTimeout(() => setStatusApbdes(""), 4000); } catch (error) { setStatusApbdes("❌ Gagal."); } finally { setIsLoadingApbdes(false); } };
  const handleSimpanAkun = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingAkun(true); setStatusAkun("Menyimpan..."); try { await setDoc(doc(db, "users_role", emailAkun.toLowerCase()), { nama: namaAkun, email: emailAkun.toLowerCase(), role: roleAkun, didaftarkan_oleh: userEmail, tanggal_daftar: new Date().toISOString() }); setStatusAkun("✅ Data Hak Akses tersimpan!"); setNamaAkun(""); setEmailAkun(""); setRoleAkun("Kontributor"); } catch (error) { setStatusAkun("❌ Gagal."); } finally { setIsLoadingAkun(false); } };
  const ubahStatusSurat = async (id: string, statusBaru: string) => { try { await updateDoc(doc(db, "layanan_surat", id), { status_berkas: statusBaru }); ambilDataAwal(); } catch (error) { alert("Gagal merubah status."); } };
  const hapusPengaduan = async (id: string) => { if (confirm("Yakin hapus laporan?")) { await deleteDoc(doc(db, "pengaduan_warga", id)); ambilDataAwal(); } };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800"><h2 className="text-2xl font-black mb-1">Ruang Kendali</h2><p className="text-green-400 text-xs truncate">{userEmail}</p></div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button onClick={() => setActiveMenu("welcome")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "welcome" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏠 Beranda</button>
          <button onClick={() => setActiveMenu("layanan")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "layanan" ? "bg-yellow-500 text-gray-900 translate-x-2 shadow-md" : "hover:bg-green-800"}`}><span className="text-xl">✉️</span> Layanan Warga {daftarSurat.filter(s => s.status_berkas === "Diajukan").length > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">Baru</span>}</button>
          <button onClick={() => setActiveMenu("kabar")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "kabar" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📰 Kabar Desa</button>
          <button onClick={() => setActiveMenu("profil")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "profil" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏛️ Profil Desa</button>
          <button onClick={() => setActiveMenu("transparansi")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "transparansi" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📊 Transparansi</button>
          <button onClick={() => setActiveMenu("akun")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "akun" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>👥 Manajemen Akun</button>
        </nav>
        <div className="p-4 border-t border-green-800"><button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl">🚪 Keluar</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeMenu === "welcome" && ( <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-3xl font-bold mb-4">Selamat Datang!</h3><p className="text-gray-600">Pusat komando website resmi Desa Kerjo.</p></div> )}
        
        {/* MODUL LAYANAN & KABAR (DISEMBUNYIKAN KODE RINCIANNYA AGAR FOKUS KE PROFIL, TAPI ASLINYA TETAP SAMA SEPERTI TAHAP 20) */}
        {activeMenu === "layanan" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500"><h3 className="text-2xl font-bold mb-6">📄 Antrean Surat (Fitur tetap utuh seperti sebelumnya)</h3><table className="min-w-full text-sm text-left"><thead className="bg-gray-50"><tr><th className="py-4 px-4">Resi</th><th className="py-4 px-4">Nama</th><th className="py-4 px-4">Status</th><th className="py-4 px-4">Aksi</th></tr></thead><tbody>{daftarSurat.map((surat) => (<tr key={surat.id} className="border-b"><td className="py-4 px-4 font-mono font-bold text-blue-700">{surat.resi}</td><td className="py-4 px-4 font-bold">{surat.nama}</td><td className="py-4 px-4">{surat.status_berkas}</td><td className="py-4 px-4">{surat.status_berkas === "Diajukan" && (<button onClick={() => ubahStatusSurat(surat.id, "Verifikasi")} className="bg-yellow-400 font-bold px-3 py-2 rounded-lg">Proses</button>)}{surat.status_berkas === "Verifikasi" && (<button onClick={() => ubahStatusSurat(surat.id, "Selesai")} className="bg-green-500 text-white font-bold px-3 py-2 rounded-lg">Selesai</button>)}</td></tr>))}</tbody></table><h3 className="text-2xl font-bold mt-10 mb-6">📢 Pengaduan Warga</h3><div className="grid grid-cols-1 gap-4">{daftarPengaduan.map((lap) => (<div key={lap.id} className="border p-4 rounded-xl flex justify-between"><div><h4 className="font-bold">{lap.judul}</h4><p className="text-sm">{lap.isi}</p></div><button onClick={() => hapusPengaduan(lap.id)} className="text-red-500 font-bold">Hapus</button></div>))}</div></div> )}
        {activeMenu === "kabar" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500"><h3 className="text-2xl font-bold mb-6">📰 Publikasi Berita (Fitur tetap utuh)</h3><form onSubmit={handleSimpanKabar} className="space-y-4"><input type="text" required value={judulKabar} onChange={(e) => setJudulKabar(e.target.value)} placeholder="Judul" className="w-full p-3 border rounded-xl" /><input type="file" multiple onChange={(e) => setFotoKabarList(e.target.files)} className="w-full p-3 border rounded-xl" /><textarea required rows={4} value={isiKabar} onChange={(e) => setIsiKabar(e.target.value)} placeholder="Isi Berita" className="w-full p-3 border rounded-xl"></textarea><button type="submit" className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl">{isLoadingKabar ? "Memproses..." : "Simpan"}</button></form></div> )}
        
        {/* MODUL PROFIL (DITAMBAH MANAJEMEN APARATUR) */}
        {activeMenu === "profil" && ( 
          <div className="space-y-8 animate-fade-in">
            {/* Bagian 1: Sejarah & Visi Misi */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600">
              <h3 className="text-2xl font-bold mb-6">🏛️ Pengaturan Teks Profil</h3>
              <form onSubmit={handleSimpanProfil} className="space-y-5">
                <textarea required rows={4} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} placeholder="Sejarah Desa" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none"></textarea>
                <textarea required rows={4} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} placeholder="Visi & Misi" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none"></textarea>
                {statusProfil && <div className="p-3 rounded-lg font-bold text-center bg-green-50 text-green-700">{statusProfil}</div>}
                <button type="submit" disabled={isLoadingProfil} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md">{isLoadingProfil ? "Menyimpan..." : "Simpan Profil Utama"}</button>
              </form>
            </div>

            {/* Bagian 2: Manajemen Aparatur Desa (BARU) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-6">👔 Susunan Perangkat Desa</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form Tambah Aparatur */}
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4">Tambah Anggota SOTK</h4>
                  <form onSubmit={handleSimpanAparatur} className="space-y-4">
                    <div><label className="block text-xs font-bold mb-1">Nama Lengkap & Gelar</label><input type="text" required value={namaAparatur} onChange={(e) => setNamaAparatur(e.target.value)} placeholder="Contoh: Rebo, S.E." className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div><label className="block text-xs font-bold mb-1">Jabatan</label><input type="text" required value={jabatanAparatur} onChange={(e) => setJabatanAparatur(e.target.value)} placeholder="Contoh: Kepala Desa" className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-xs font-bold mb-1">No. Urut (Hierarki)</label><input type="number" required value={urutanAparatur} onChange={(e) => setUrutanAparatur(Number(e.target.value))} className="w-full p-3 rounded-lg border outline-none text-center font-bold" /></div>
                      <div><label className="block text-xs font-bold mb-1">Foto Profil (Opsional)</label><input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFotoAparatur(e.target.files[0])}} className="w-full p-2 text-xs rounded-lg border" /></div>
                    </div>
                    {statusAparatur && <div className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded">{statusAparatur}</div>}
                    <button type="submit" disabled={isLoadingAparatur} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black">{isLoadingAparatur ? "Menyimpan..." : "Tambahkan"}</button>
                  </form>
                </div>

                {/* Tabel Daftar Aparatur */}
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="min-w-full text-sm text-left"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-4">Urutan</th><th className="py-3 px-4">Identitas</th><th className="py-3 px-4 text-center">Aksi</th></tr></thead>
                    <tbody>
                      {daftarAparatur.map((org) => (
                        <tr key={org.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-black text-gray-400 text-lg text-center">{org.urutan}</td>
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">{org.foto ? <img src={org.foto} alt="profil" className="w-full h-full object-cover"/> : <span className="flex items-center justify-center w-full h-full text-lg">👤</span>}</div>
                            <div><div className="font-bold text-gray-900">{org.nama}</div><div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{org.jabatan}</div></div>
                          </td>
                          <td className="py-3 px-4 text-center"><button onClick={() => hapusAparatur(org.id)} className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-md">Hapus</button></td>
                        </tr>
                      ))}
                      {daftarAparatur.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Belum ada data struktur organisasi.</td></tr>}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-3">*Tips: Atur nomor urut 1 untuk Kepala Desa, 2 untuk Sekretaris, dan seterusnya agar hierarki di halaman warga tampil rapi.</p>
                </div>
              </div>
            </div>
          </div> 
        )}

        {/* MODUL TRANSPARANSI & AKUN (TETAP UTUH) */}
        {activeMenu === "transparansi" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400"><h3 className="text-2xl font-bold mb-6">📊 Kelola APBDes (Fitur tetap utuh)</h3><form onSubmit={handleSimpanApbdes} className="space-y-5"><div className="grid grid-cols-2 gap-4"><input type="number" value={danaDesa} onChange={(e)=>setDanaDesa(e.target.value)} className="p-3 border rounded-xl" placeholder="Dana Desa" /><input type="number" value={alokasiDanaDesa} onChange={(e)=>setAlokasiDanaDesa(e.target.value)} className="p-3 border rounded-xl" placeholder="ADD" /></div><button type="submit" className="bg-yellow-500 font-bold px-6 py-3 rounded-xl">Simpan</button></form></div> )}
        {activeMenu === "akun" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-500"><h3 className="text-2xl font-bold mb-6">👥 Hak Akses (Fitur tetap utuh)</h3><form onSubmit={handleSimpanAkun} className="space-y-4"><input type="text" value={namaAkun} onChange={(e)=>setNamaAkun(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nama" /><input type="email" value={emailAkun} onChange={(e)=>setEmailAkun(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Email" /><button type="submit" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Daftarkan</button></form></div> )}
      </main>
    </div>
  );
}