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

      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0);
        setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0);
        setPad(snapApbdes.data().pad || 0);
        setBanprov(snapApbdes.data().banprov || 0);
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
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); } else {
        setUserEmail(user.email);
        setIsCheckingAuth(false);
        ambilDataAwal();
      }
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
        // --- MASUKKAN KEMBALI API KEY IMGBB ANDA DI SINI ---
        const apiKeyImgBB = "6755e61bb042b746d83c71595313674e"; 
        const uploadPromises = Array.from(fotoKabarList).map(async (file) => {
          const formData = new FormData(); formData.append("image", file);
          const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
          const hasil = await tanggapan.json(); return hasil.success ? hasil.data.url : null;
        });
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter(url => url !== null);
      }
      
      // Menggabungkan sisa gambar lama dengan gambar yang baru diupload
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];
      
      if (editKabarId) {
        await updateDoc(doc(db, "kabar_desa", editKabarId), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal });
        setStatusKabar("✅ Berita diperbarui!");
      } else {
        await addDoc(collection(db, "kabar_desa"), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal, tanggal_posting: new Date().toISOString(), penulis: userEmail });
        setStatusKabar("✅ Berita dipublikasikan!");
      }
      batalEditKabar(); ambilDataAwal(); setTimeout(() => setStatusKabar(""), 4000);
    } catch (error) { setStatusKabar("❌ Terjadi kesalahan."); } finally { setIsLoadingKabar(false); }
  };

  const mulaiEditKabar = (item: any) => { 
    setEditKabarId(item.id); 
    setJudulKabar(item.judul); 
    setIsiKabar(item.isi); 
    setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };
  
  const batalEditKabar = () => { setEditKabarId(null); setJudulKabar(""); setIsiKabar(""); setGambarLama([]); setFotoKabarList(null); const fileInput = document.getElementById("inputFotoKabar") as HTMLInputElement; if (fileInput) fileInput.value = ""; };
  const hapusKabar = async (id: string) => { if (confirm("Yakin hapus permanen?")) { await deleteDoc(doc(db, "kabar_desa", id)); ambilDataAwal(); } };

  // FUNGSI BARU: MENGHAPUS GAMBAR SAAT MODE EDIT
  const copotGambarLama = (indexYangDihapus: number) => {
    // Memfilter array gambarLama, membuang gambar yang di-klik
    const gambarSisa = gambarLama.filter((_, index) => index !== indexYangDihapus);
    setGambarLama(gambarSisa);
  };

  const handleSimpanProfil = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingProfil(true); setStatusProfil("Menyimpan..."); try { await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() }); setStatusProfil("✅ Profil diperbarui!"); setTimeout(() => setStatusProfil(""), 4000); } catch (error) { setStatusProfil("❌ Gagal."); } finally { setIsLoadingProfil(false); } };
  const handleSimpanApbdes = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingApbdes(true); setStatusApbdes("Menyimpan..."); try { await setDoc(doc(db, "transparansi", "apbdes"), { dana_desa: Number(danaDesa), alokasi_dana_desa: Number(alokasiDanaDesa), pad: Number(pad), banprov: Number(banprov), terakhir_diperbarui: new Date().toISOString() }); setStatusApbdes("✅ APBDes diperbarui!"); setTimeout(() => setStatusApbdes(""), 4000); } catch (error) { setStatusApbdes("❌ Gagal."); } finally { setIsLoadingApbdes(false); } };
  const handleSimpanAkun = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingAkun(true); setStatusAkun("Menyimpan..."); try { await setDoc(doc(db, "users_role", emailAkun.toLowerCase()), { nama: namaAkun, email: emailAkun.toLowerCase(), role: roleAkun, didaftarkan_oleh: userEmail, tanggal_daftar: new Date().toISOString() }); setStatusAkun("✅ Data Hak Akses tersimpan!"); setNamaAkun(""); setEmailAkun(""); setRoleAkun("Kontributor"); } catch (error) { setStatusAkun("❌ Gagal."); } finally { setIsLoadingAkun(false); } };

  const ubahStatusSurat = async (id: string, statusBaru: string) => {
    try { await updateDoc(doc(db, "layanan_surat", id), { status_berkas: statusBaru }); alert(`Status berhasil diubah menjadi: ${statusBaru}`); ambilDataAwal(); } catch (error) { alert("Gagal merubah status."); }
  };
  const hapusPengaduan = async (id: string) => {
    if (confirm("Yakin ingin menghapus laporan pengaduan ini?")) { try { await deleteDoc(doc(db, "pengaduan_warga", id)); ambilDataAwal(); } catch (error) { alert("Gagal menghapus."); } }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800"><h2 className="text-2xl font-black mb-1">Ruang Kendali</h2><p className="text-green-400 text-xs truncate">{userEmail}</p></div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button onClick={() => setActiveMenu("welcome")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "welcome" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏠 Beranda</button>
          <button onClick={() => setActiveMenu("layanan")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "layanan" ? "bg-yellow-500 text-gray-900 translate-x-2 shadow-md" : "hover:bg-green-800"}`}><span className="text-xl">✉️</span> Layanan Warga {daftarSurat.filter(s => s.status_berkas === "Diajukan").length > 0 && (<span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">Baru</span>)}</button>
          <button onClick={() => setActiveMenu("kabar")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "kabar" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📰 Kabar Desa</button>
          <button onClick={() => setActiveMenu("profil")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "profil" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏛️ Profil Desa</button>
          <button onClick={() => setActiveMenu("transparansi")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "transparansi" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📊 Transparansi</button>
          <button onClick={() => setActiveMenu("akun")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "akun" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>👥 Manajemen Akun</button>
        </nav>
        <div className="p-4 border-t border-green-800"><button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl">🚪 Keluar</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeMenu === "welcome" && ( <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-3xl font-bold mb-4">Selamat Datang!</h3><p className="text-gray-600">Pusat komando website resmi Desa Kerjo.</p></div> )}
        
        {/* MODUL LAYANAN WARGA TETAP UTUH (DIPERSINGKAT DALAM BLOK INI) */}
        {activeMenu === "layanan" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span className="text-3xl">📄</span> Antrean Permohonan Surat</h3>
              <div className="overflow-x-auto"><table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4 font-bold text-gray-600">Resi & Tanggal</th><th className="py-4 px-4 font-bold text-gray-600">Identitas Pemohon</th><th className="py-4 px-4 font-bold text-gray-600">Jenis & Keperluan</th><th className="py-4 px-4 font-bold text-gray-600 text-center">Status</th><th className="py-4 px-4 font-bold text-gray-600 text-center">Aksi Admin</th></tr></thead><tbody>{daftarSurat.map((surat) => (<tr key={surat.id} className="border-b hover:bg-gray-50"><td className="py-4 px-4"><span className="block font-mono font-bold text-blue-700 mb-1">{surat.resi}</span><span className="text-xs text-gray-500">{new Date(surat.tanggal_pengajuan).toLocaleDateString('id-ID')}</span></td><td className="py-4 px-4"><span className="block font-bold text-gray-900">{surat.nama}</span><span className="text-xs text-gray-500">NIK: {surat.nik}</span></td><td className="py-4 px-4"><span className="block font-bold text-green-700">{surat.jenis_surat}</span><span className="text-xs text-gray-500 max-w-xs truncate block" title={surat.keperluan}>{surat.keperluan}</span></td><td className="py-4 px-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${surat.status_berkas === "Diajukan" ? "bg-red-100 text-red-700" : surat.status_berkas === "Verifikasi" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{surat.status_berkas}</span></td><td className="py-4 px-4 flex flex-col gap-2 justify-center">{surat.status_berkas === "Diajukan" && (<button onClick={() => ubahStatusSurat(surat.id, "Verifikasi")} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-2 rounded-lg shadow-sm">Proses (Verifikasi)</button>)}{surat.status_berkas === "Verifikasi" && (<button onClick={() => ubahStatusSurat(surat.id, "Selesai")} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm">Tandai Selesai</button>)}{surat.status_berkas === "Selesai" && (<span className="text-xs text-gray-400 font-bold">Tuntas ✓</span>)}</td></tr>))}{daftarSurat.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada pengajuan surat.</td></tr>}</tbody></table></div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span className="text-3xl">📢</span> Kotak Pengaduan Warga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {daftarPengaduan.map((laporan) => (
                  <div key={laporan.id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50 relative"><button onClick={() => hapusPengaduan(laporan.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">✖</button><div className="flex gap-4">{laporan.foto_bukti && (<a href={`https://wsrv.nl/?url=${laporan.foto_bukti}`} target="_blank" rel="noreferrer" className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-300 shadow-sm block hover:opacity-80"><img src={`https://wsrv.nl/?url=${laporan.foto_bukti}`} alt="Bukti" className="w-full h-full object-cover" /></a>)}<div><h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{laporan.judul}</h4><span className="text-xs text-gray-500 font-medium">{new Date(laporan.tanggal_laporan).toLocaleDateString('id-ID')} • {laporan.anonim ? "👤 Pelapor Anonim" : "Terverifikasi"}</span><p className="text-sm text-gray-700 mt-2 line-clamp-3">{laporan.isi}</p></div></div></div>
                ))}{daftarPengaduan.length === 0 && <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500 border border-dashed rounded-2xl">Kotak pengaduan kosong.</div>}
              </div>
            </div>
          </div>
        )}

        {/* MODUL KABAR DESA (DENGAN FITUR COPOT GAMBAR) */}
        {activeMenu === "kabar" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500">
              <div className="flex justify-between mb-6 border-b pb-4"><h3 className="text-2xl font-bold flex items-center gap-2">{editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita"}</h3>{editKabarId && <button type="button" onClick={batalEditKabar} className="bg-gray-200 px-4 py-2 rounded-lg font-bold">Batal Edit</button>}</div>
              <form onSubmit={handleSimpanKabar} className="space-y-5">
                <input type="text" required value={judulKabar} onChange={(e) => setJudulKabar(e.target.value)} placeholder="Judul Berita" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                
                {/* TAMPILAN GAMBAR LAMA SAAT MODE EDIT */}
                {editKabarId && gambarLama.length > 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm font-bold text-orange-800 mb-3">Foto yang terpasang saat ini (Klik untuk menghapus):</p>
                    <div className="flex flex-wrap gap-4">
                      {gambarLama.map((url, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 group cursor-pointer" onClick={() => copotGambarLama(index)}>
                          <img src={`https://wsrv.nl/?url=${url}`} alt="Preview Lama" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-red-600 bg-opacity-80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-bold text-xs">✖ Hapus</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-green-50 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-100 transition-all"><span className="text-3xl mb-2">📸</span><span className="font-bold">Klik pilih foto tambahan (Bisa banyak)</span><input id="inputFotoKabar" type="file" accept="image/*" multiple onChange={(e) => setFotoKabarList(e.target.files)} className="hidden" /></label>
                {fotoKabarList && <p className="text-sm font-bold text-blue-600">✅ {fotoKabarList.length} foto baru siap ditambahkan.</p>}
                
                <textarea required rows={6} value={isiKabar} onChange={(e) => setIsiKabar(e.target.value)} placeholder="Isi Berita" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none"></textarea>
                {statusKabar && <div className="p-3 rounded-lg text-sm font-bold text-center border bg-green-50 text-green-700">{statusKabar}</div>}
                <button type="submit" disabled={isLoadingKabar} className="bg-green-600 text-white font-bold px-8 py-3 rounded-xl">{isLoadingKabar ? "Memproses..." : (editKabarId ? "Simpan Perubahan Berita" : "Publikasikan")}</button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto">
              <h4 className="text-xl font-bold mb-4">Riwayat Berita</h4>
              <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4">Judul</th><th className="py-4 px-4 text-center">Aksi</th></tr></thead><tbody>{riwayatKabar.map((item) => (<tr key={item.id} className="border-b"><td className="py-4 px-4 font-bold">{item.judul}</td><td className="py-4 px-4 text-center"><button onClick={() => mulaiEditKabar(item)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg mr-2 font-bold">Edit</button><button onClick={() => hapusKabar(item.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold">Hapus</button></td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {/* MODUL PROFIL, TRANSPARANSI, AKUN TETAP UTUH */}
        {activeMenu === "profil" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm"><h3 className="text-2xl font-bold mb-6">🏛️ Pengaturan Profil</h3><form onSubmit={handleSimpanProfil} className="space-y-5"><textarea required rows={5} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} placeholder="Sejarah" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea><textarea required rows={5} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} placeholder="Visi Misi" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea>{statusProfil && <div className="p-3 rounded-lg font-bold text-center bg-green-50 text-green-700">{statusProfil}</div>}<button type="submit" disabled={isLoadingProfil} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl">{isLoadingProfil ? "Menyimpan..." : "Simpan Profil"}</button></form></div> )}
        {activeMenu === "transparansi" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400"><h3 className="text-2xl font-bold mb-6">📊 Kelola APBDes</h3><form onSubmit={handleSimpanApbdes} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-bold mb-2">Dana Desa (DD)</label><input type="number" required value={danaDesa} onChange={(e) => setDanaDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none" /></div><div><label className="block text-sm font-bold mb-2">Alokasi Dana Desa (ADD)</label><input type="number" required value={alokasiDanaDesa} onChange={(e) => setAlokasiDanaDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none" /></div><div><label className="block text-sm font-bold mb-2">PAD</label><input type="number" required value={pad} onChange={(e) => setPad(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none" /></div><div><label className="block text-sm font-bold mb-2">Bantuan Provinsi</label><input type="number" required value={banprov} onChange={(e) => setBanprov(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none" /></div></div>{statusApbdes && <div className={`p-3 rounded-lg text-sm font-bold text-center border bg-green-50 text-green-700`}>{statusApbdes}</div>}<button type="submit" disabled={isLoadingApbdes} className="bg-yellow-500 text-gray-900 font-extrabold py-3 px-8 rounded-xl shadow-md">Perbarui APBDes</button></form></div> )}
        {activeMenu === "akun" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-500 animate-fade-in"><h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2"><span className="text-3xl">👥</span> Hak Akses Sistem</h3><p className="text-gray-500 mb-6 text-sm">Tambahkan identitas pengguna baru.</p><form onSubmit={handleSimpanAkun} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-bold text-gray-700 mb-2">Nama Pengguna</label><input type="text" required value={namaAkun} onChange={(e) => setNamaAkun(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none" /></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Email Terdaftar</label><input type="email" required value={emailAkun} onChange={(e) => setEmailAkun(e.target.value)} placeholder="budi@kerjo.desa.id" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none" /></div></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Jabatan / Role</label><select value={roleAkun} onChange={(e) => setRoleAkun(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-white cursor-pointer font-medium text-gray-700"><option value="Kontributor">Kontributor</option><option value="Administrator">Administrator</option></select></div>{statusAkun && (<div className={`p-4 rounded-xl text-sm font-bold border ${statusAkun.includes("❌") ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{statusAkun}</div>)}<button type="submit" disabled={isLoadingAkun} className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all ${isLoadingAkun ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"}`}>{isLoadingAkun ? "Menyimpan..." : "Daftarkan Pengguna"}</button></form></div> )}
      </main>
    </div>
  );
}