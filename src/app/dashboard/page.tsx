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

  // --- STATE LAYANAN WARGA ---
  const [daftarSurat, setDaftarSurat] = useState<any[]>([]);
  const [daftarPengaduan, setDaftarPengaduan] = useState<any[]>([]);

  // --- STATE KABAR DESA ---
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]);

  // --- STATE PROFIL & APARATUR DESA ---
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

  // --- STATE UMKM / POTENSI DESA (BARU) ---
  const [namaProduk, setNamaProduk] = useState("");
  const [pemilikUmkm, setPemilikUmkm] = useState("");
  const [hargaProduk, setHargaProduk] = useState("");
  const [waUmkm, setWaUmkm] = useState("");
  const [deskripsiProduk, setDeskripsiProduk] = useState("");
  const [fotoProduk, setFotoProduk] = useState<File | null>(null);
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [statusUmkm, setStatusUmkm] = useState("");
  const [isLoadingUmkm, setIsLoadingUmkm] = useState(false);

  // --- STATE TRANSPARANSI (APBDes & REGULASI) ---
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

  // --- STATE MANAJEMEN AKUN ---
  const [namaAkun, setNamaAkun] = useState("");
  const [emailAkun, setEmailAkun] = useState("");
  const [roleAkun, setRoleAkun] = useState("Kontributor");
  const [statusAkun, setStatusAkun] = useState("");
  const [isLoadingAkun, setIsLoadingAkun] = useState(false);

  // ==========================================
  // FUNGSI PENARIK SEMUA DATA DARI FIREBASE
  // ==========================================
  const ambilDataAwal = async () => {
    try {
      const qSurat = query(collection(db, "layanan_surat"), orderBy("tanggal_pengajuan", "desc"));
      const snapSurat = await getDocs(qSurat);
      setDaftarSurat(snapSurat.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qPengaduan = query(collection(db, "pengaduan_warga"), orderBy("tanggal_laporan", "desc"));
      const snapPengaduan = await getDocs(qPengaduan);
      setDaftarPengaduan(snapPengaduan.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapKabar = await getDocs(qKabar);
      setRiwayatKabar(snapKabar.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const snapProfil = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapProfil.exists()) {
        setSejarahDesa(snapProfil.data().sejarah || "");
        setVisiMisiDesa(snapProfil.data().visi_misi || "");
      }

      const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
      const snapAparatur = await getDocs(qAparatur);
      setDaftarAparatur(snapAparatur.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Data UMKM (BARU)
      const qUmkm = query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc"));
      const snapUmkm = await getDocs(qUmkm);
      setDaftarUmkm(snapUmkm.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0); setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0); setPad(snapApbdes.data().pad || 0); setBanprov(snapApbdes.data().banprov || 0);
      }

      const qRegulasi = query(collection(db, "regulasi_desa"), orderBy("tahun", "desc"));
      const snapRegulasi = await getDocs(qRegulasi);
      setDaftarRegulasi(snapRegulasi.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) { console.error("Gagal menarik data:", error); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); } else { setUserEmail(user.email); setIsCheckingAuth(false); ambilDataAwal(); }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push("/login"); };

  // ==========================================
  // FUNGSI UPLOAD FOTO DGN JALUR CDN
  // ==========================================
  const uploadFotoKeImgBB = async (file: File) => {
    const formData = new FormData(); 
    formData.append("image", file);
    // --- API KEY IMGBB DI SINI ---
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
  // MODUL KABAR DESA
  // ==========================================
  const handleSimpanKabar = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingKabar(true); setStatusKabar("Memproses unggahan...");
    try {
      let tautanGambarBaru: string[] = [];
      if (fotoKabarList && fotoKabarList.length > 0) {
        setStatusKabar(`Mengunggah ${fotoKabarList.length} foto melalui CDN...`);
        const uploadPromises = Array.from(fotoKabarList).map(file => uploadFotoKeImgBB(file));
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter(url => url !== null) as string[];
      }
      const gambarFinal = [...gambarLama, ...tautanGambarBaru]; 
      if (editKabarId) { 
        await updateDoc(doc(db, "kabar_desa", editKabarId), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal }); setStatusKabar("✅ Berita diperbarui!");
      } else { 
        await addDoc(collection(db, "kabar_desa"), { judul: judulKabar, isi: isiKabar, gambar: gambarFinal, tanggal_posting: new Date().toISOString(), penulis: userEmail }); setStatusKabar("✅ Berita dipublikasikan!"); 
      }
      batalEditKabar(); ambilDataAwal(); setTimeout(() => setStatusKabar(""), 4000);
    } catch (error) { setStatusKabar("❌ Terjadi kesalahan."); } finally { setIsLoadingKabar(false); }
  };
  const mulaiEditKabar = (item: any) => { setEditKabarId(item.id); setJudulKabar(item.judul); setIsiKabar(item.isi); setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const hapusGambarDariDaftarLama = (indexGambar: number) => { setGambarLama(prev => prev.filter((_, i) => i !== indexGambar)); };
  const batalEditKabar = () => { setEditKabarId(null); setJudulKabar(""); setIsiKabar(""); setGambarLama([]); setFotoKabarList(null); const input = document.getElementById('inputFotoKabar') as HTMLInputElement; if(input) input.value = '';};
  const hapusKabar = async (id: string) => { if (confirm("Yakin hapus permanen?")) { await deleteDoc(doc(db, "kabar_desa", id)); ambilDataAwal(); } };

  // ==========================================
  // MODUL LAYANAN WARGA
  // ==========================================
  const ubahStatusSurat = async (id: string, statusBaru: string) => { try { await updateDoc(doc(db, "layanan_surat", id), { status_berkas: statusBaru }); ambilDataAwal(); } catch (error) { alert("Gagal merubah status."); } };
  const hapusPengaduan = async (id: string) => { if (confirm("Yakin hapus laporan?")) { await deleteDoc(doc(db, "pengaduan_warga", id)); ambilDataAwal(); } };
  
  // ==========================================
  // MODUL PROFIL, APARATUR, DAN UMKM (BARU)
  // ==========================================
  const handleSimpanProfil = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingProfil(true); setStatusProfil("Menyimpan..."); try { await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() }); setStatusProfil("✅ Profil diperbarui!"); setTimeout(() => setStatusProfil(""), 4000); } catch (error) { setStatusProfil("❌ Gagal."); } finally { setIsLoadingProfil(false); } };
  
  const handleSimpanAparatur = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingAparatur(true); setStatusAparatur("Memproses...");
    try {
      let imageUrl = fotoLamaAparatur;
      if (fotoAparatur) { setStatusAparatur("Mengunggah foto..."); imageUrl = await uploadFotoKeImgBB(fotoAparatur) || ""; }
      if (editAparaturId) {
        await updateDoc(doc(db, "aparatur_desa", editAparaturId), { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), foto: imageUrl });
        setStatusAparatur("✅ Perangkat diperbarui!");
      } else {
        await addDoc(collection(db, "aparatur_desa"), { nama: namaAparatur, jabatan: jabatanAparatur, urutan: Number(urutanAparatur), foto: imageUrl });
        setStatusAparatur("✅ Perangkat ditambahkan!");
      }
      batalEditAparatur(); ambilDataAwal(); setTimeout(() => setStatusAparatur(""), 4000);
    } catch (error) { setStatusAparatur("❌ Gagal."); } finally { setIsLoadingAparatur(false); }
  };
  const mulaiEditAparatur = (item: any) => { setEditAparaturId(item.id); setNamaAparatur(item.nama); setJabatanAparatur(item.jabatan); setUrutanAparatur(item.urutan); setFotoLamaAparatur(item.foto || ""); setFotoAparatur(null); };
  const batalEditAparatur = () => { setEditAparaturId(null); setNamaAparatur(""); setJabatanAparatur(""); setUrutanAparatur(daftarAparatur.length + 2); setFotoLamaAparatur(""); setFotoAparatur(null); };
  const hapusAparatur = async (id: string) => { if (confirm("Yakin hapus?")) { await deleteDoc(doc(db, "aparatur_desa", id)); ambilDataAwal(); } };

  // FUNGSI SIMPAN UMKM
  const handleSimpanUmkm = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingUmkm(true); setStatusUmkm("Memproses...");
    try {
      let imageUrl = "";
      if (fotoProduk) { setStatusUmkm("Mengunggah foto produk..."); imageUrl = await uploadFotoKeImgBB(fotoProduk) || ""; }
      await addDoc(collection(db, "potensi_desa"), { nama_produk: namaProduk, pemilik: pemilikUmkm, harga: Number(hargaProduk), wa: waUmkm, deskripsi: deskripsiProduk, foto: imageUrl, tanggal_input: new Date().toISOString() });
      setStatusUmkm("✅ UMKM ditambahkan!"); setNamaProduk(""); setPemilikUmkm(""); setHargaProduk(""); setWaUmkm(""); setDeskripsiProduk(""); setFotoProduk(null); ambilDataAwal(); setTimeout(() => setStatusUmkm(""), 4000);
    } catch (error) { setStatusUmkm("❌ Gagal."); } finally { setIsLoadingUmkm(false); }
  };
  const hapusUmkm = async (id: string) => { if (confirm("Yakin hapus produk ini?")) { await deleteDoc(doc(db, "potensi_desa", id)); ambilDataAwal(); } };

  // ==========================================
  // MODUL TRANSPARANSI & REGULASI
  // ==========================================
  const handleSimpanApbdes = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingApbdes(true); setStatusApbdes("Menyimpan..."); try { await setDoc(doc(db, "transparansi", "apbdes"), { dana_desa: Number(danaDesa), alokasi_dana_desa: Number(alokasiDanaDesa), pad: Number(pad), banprov: Number(banprov), terakhir_diperbarui: new Date().toISOString() }); setStatusApbdes("✅ APBDes diperbarui!"); setTimeout(() => setStatusApbdes(""), 4000); } catch (error) { setStatusApbdes("❌ Gagal."); } finally { setIsLoadingApbdes(false); } };
  
  const handleSimpanRegulasi = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingRegulasi(true); setStatusRegulasi("Menyimpan dokumen...");
    try {
      if (editRegulasiId) { await updateDoc(doc(db, "regulasi_desa", editRegulasiId), { tahun: tahunRegulasi, jenis: jenisRegulasi, judul: judulRegulasi, link: linkRegulasi }); setStatusRegulasi("✅ Dokumen diperbarui!");
      } else { await addDoc(collection(db, "regulasi_desa"), { tahun: tahunRegulasi, jenis: jenisRegulasi, judul: judulRegulasi, link: linkRegulasi, tanggal_upload: new Date().toISOString() }); setStatusRegulasi("✅ Dokumen ditambahkan!"); }
      batalEditRegulasi(); ambilDataAwal(); setTimeout(() => setStatusRegulasi(""), 4000);
    } catch (error) { setStatusRegulasi("❌ Gagal menyimpan."); } finally { setIsLoadingRegulasi(false); }
  };
  const mulaiEditRegulasi = (item: any) => { setEditRegulasiId(item.id); setTahunRegulasi(item.tahun); setJenisRegulasi(item.jenis); setJudulRegulasi(item.judul); setLinkRegulasi(item.link); };
  const batalEditRegulasi = () => { setEditRegulasiId(null); setTahunRegulasi(""); setJenisRegulasi("Perdes"); setJudulRegulasi(""); setLinkRegulasi(""); };
  const hapusRegulasi = async (id: string) => { if (confirm("Yakin menghapus dokumen ini?")) { await deleteDoc(doc(db, "regulasi_desa", id)); ambilDataAwal(); } };

  // ==========================================
  // MODUL AKUN
  // ==========================================
  const handleSimpanAkun = async (e: React.FormEvent) => { e.preventDefault(); setIsLoadingAkun(true); setStatusAkun("Menyimpan..."); try { await setDoc(doc(db, "users_role", emailAkun.toLowerCase()), { nama: namaAkun, email: emailAkun.toLowerCase(), role: roleAkun, didaftarkan_oleh: userEmail, tanggal_daftar: new Date().toISOString() }); setStatusAkun("✅ Data Hak Akses tersimpan!"); setNamaAkun(""); setEmailAkun(""); setRoleAkun("Kontributor"); } catch (error) { setStatusAkun("❌ Gagal."); } finally { setIsLoadingAkun(false); } };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800"><h2 className="text-2xl font-black mb-1">Ruang Kendali</h2><p className="text-green-400 text-xs truncate">{userEmail}</p></div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button onClick={() => setActiveMenu("welcome")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "welcome" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏠 Ringkasan Sistem</button>
          <button onClick={() => setActiveMenu("layanan")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "layanan" ? "bg-yellow-500 text-gray-900 translate-x-2 shadow-md" : "hover:bg-green-800"}`}>✉️ Layanan Warga {daftarSurat.filter(s => s.status_berkas === "Diajukan").length > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">Baru</span>}</button>
          <button onClick={() => setActiveMenu("kabar")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "kabar" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📰 Kabar Desa</button>
          <button onClick={() => setActiveMenu("profil")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "profil" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏛️ Profil & UMKM</button>
          <button onClick={() => setActiveMenu("transparansi")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "transparansi" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📊 Transparansi</button>
          <button onClick={() => setActiveMenu("akun")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "akun" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>👥 Manajemen Akun</button>
        </nav>
        <div className="p-4 border-t border-green-800"><button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">🚪 Keluar</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* MODUL BERANDA */}
        {activeMenu === "welcome" && ( 
          <div className="animate-fade-in space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 bg-gradient-to-r from-white to-green-50"><h3 className="text-3xl font-extrabold text-green-900 mb-2">Selamat Datang, Admin!</h3><p className="text-gray-600 font-medium">Sistem Informasi Desa Kerjo berjalan normal.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-yellow-500 flex flex-col justify-center items-center"><span className="text-4xl mb-3">✉️</span><h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Permohonan Surat</h4><p className="text-4xl font-black text-gray-900 mt-2">{daftarSurat.length}</p></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-green-500 flex flex-col justify-center items-center"><span className="text-4xl mb-3">📰</span><h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Berita Dipublikasi</h4><p className="text-4xl font-black text-gray-900 mt-2">{riwayatKabar.length}</p></div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-blue-500 flex flex-col justify-center items-center"><span className="text-4xl mb-3">📢</span><h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Pengaduan Masuk</h4><p className="text-4xl font-black text-gray-900 mt-2">{daftarPengaduan.length}</p></div>
            </div>
          </div> 
        )}

        {/* MODUL LAYANAN WARGA */}
        {activeMenu === "layanan" && ( 
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500"><h3 className="text-2xl font-bold mb-6">📄 Antrean Surat Masuk</h3><div className="overflow-x-auto"><table className="min-w-full text-sm text-left"><thead className="bg-gray-50"><tr><th className="py-4 px-4">Resi & Tgl</th><th className="py-4 px-4">Identitas</th><th className="py-4 px-4">Jenis & Keperluan</th><th className="py-4 px-4">Status</th><th className="py-4 px-4 text-center">Aksi</th></tr></thead><tbody>{daftarSurat.map((surat) => (<tr key={surat.id} className="border-b hover:bg-gray-50"><td className="py-4 px-4"><span className="block font-mono font-bold text-blue-700">{surat.resi}</span><span className="text-xs text-gray-500">{new Date(surat.tanggal_pengajuan).toLocaleDateString('id-ID')}</span></td><td className="py-4 px-4"><span className="block font-bold">{surat.nama}</span><span className="text-xs text-gray-500">NIK: {surat.nik}</span></td><td className="py-4 px-4"><span className="block font-bold text-green-700">{surat.jenis_surat}</span><span className="text-xs text-gray-500 max-w-xs truncate block">{surat.keperluan}</span></td><td className="py-4 px-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${surat.status_berkas === "Diajukan" ? "bg-red-100 text-red-700" : surat.status_berkas === "Verifikasi" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{surat.status_berkas}</span></td><td className="py-4 px-4 flex flex-col gap-2 justify-center">{surat.status_berkas === "Diajukan" && (<button onClick={() => ubahStatusSurat(surat.id, "Verifikasi")} className="bg-yellow-400 font-bold px-3 py-2 rounded-lg text-xs">Proses</button>)}{surat.status_berkas === "Verifikasi" && (<button onClick={() => ubahStatusSurat(surat.id, "Selesai")} className="bg-green-500 text-white font-bold px-3 py-2 rounded-lg text-xs">Selesai</button>)}</td></tr>))}</tbody></table></div></div>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mt-4 mb-6">📢 Kotak Pengaduan Warga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {daftarPengaduan.map((lap) => (
                  <div key={lap.id} className="border p-5 rounded-2xl flex justify-between bg-gray-50 relative">
                    <button onClick={() => hapusPengaduan(lap.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">✖</button>
                    <div className="flex gap-4">
                      {lap.foto_bukti && ( <a href={`https://wsrv.nl/?url=${lap.foto_bukti}`} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-gray-300 block hover:opacity-80"><img src={`https://wsrv.nl/?url=${lap.foto_bukti}`} alt="Bukti" className="w-full h-full object-cover" /></a> )}
                      <div><h4 className="font-bold text-gray-900 leading-tight">{lap.judul}</h4><span className="text-xs text-gray-500">{new Date(lap.tanggal_laporan).toLocaleDateString('id-ID')} • {lap.anonim ? "👤 Anonim" : "Terverifikasi"}</span><p className="text-sm text-gray-700 mt-2">{lap.isi}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> 
        )}

        {/* MODUL KABAR DESA */}
        {activeMenu === "kabar" && ( 
          <div className="space-y-8 animate-fade-in"><div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500"><div className="flex justify-between mb-6 border-b pb-4"><h3 className="text-2xl font-bold flex items-center gap-2">{editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita Baru"}</h3>{editKabarId && <button onClick={batalEditKabar} className="bg-gray-200 px-4 py-2 rounded-lg font-bold">Batal Edit</button>}</div><form onSubmit={handleSimpanKabar} className="space-y-5"><div><label className="block text-sm font-bold mb-2">Judul</label><input type="text" required value={judulKabar} onChange={(e) => setJudulKabar(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2" /></div>{editKabarId && gambarLama.length > 0 && (<div className="bg-orange-50 p-4 rounded-xl border border-orange-200"><p className="text-sm font-bold text-orange-800 mb-3">Foto tersimpan (Klik 'X' hapus):</p><div className="flex flex-wrap gap-3">{gambarLama.map((url, idx) => (<div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden group shadow-sm"><img src={`https://wsrv.nl/?url=${url}`} alt="lama" className="w-full h-full object-cover" /><button type="button" onClick={() => hapusGambarDariDaftarLama(idx)} className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">X</button></div>))}</div></div>)}<div><label className="block text-sm font-bold mb-2">Tambahkan Foto Baru</label><label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 transition-all"><span className="text-3xl mb-2">📸</span><span className="font-bold text-gray-600">Pilih foto</span><input id="inputFotoKabar" type="file" accept="image/*" multiple onChange={(e) => setFotoKabarList(e.target.files)} className="hidden" /></label>{fotoKabarList && <p className="text-sm font-bold text-blue-600 mt-2">✅ {fotoKabarList.length} foto siap.</p>}</div><div><label className="block text-sm font-bold mb-2">Isi Berita</label><textarea required rows={6} value={isiKabar} onChange={(e) => setIsiKabar(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2"></textarea></div>{statusKabar && <div className={`p-3 rounded-lg text-sm font-bold text-center border ${statusKabar.includes("❌") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{statusKabar}</div>}<button type="submit" disabled={isLoadingKabar} className={`w-full text-white font-bold px-6 py-4 rounded-xl shadow-md ${isLoadingKabar ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}>{isLoadingKabar ? "Memproses..." : (editKabarId ? "Simpan Perubahan" : "Publikasikan")}</button></form></div><div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto"><h4 className="text-xl font-bold mb-4">Riwayat Berita</h4><table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4">Tanggal</th><th className="py-4 px-4">Judul</th><th className="py-4 px-4 text-center">Aksi</th></tr></thead><tbody>{riwayatKabar.map((item) => (<tr key={item.id} className="border-b"><td className="py-4 px-4 font-medium text-gray-500">{new Date(item.tanggal_posting).toLocaleDateString('id-ID')}</td><td className="py-4 px-4 font-bold">{item.judul}</td><td className="py-4 px-4 text-center"><button onClick={() => mulaiEditKabar(item)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg mr-2 font-bold">Edit</button><button onClick={() => hapusKabar(item.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold">Hapus</button></td></tr>))}</tbody></table></div></div>
        )}
        
        {/* MODUL PROFIL, APARATUR, & UMKM DESA */}
        {activeMenu === "profil" && ( 
          <div className="space-y-8 animate-fade-in">
            {/* Teks Profil */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600"><h3 className="text-2xl font-bold mb-6">🏛️ Pengaturan Teks Profil</h3><form onSubmit={handleSimpanProfil} className="space-y-5"><textarea required rows={4} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} placeholder="Sejarah Desa" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea><textarea required rows={4} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} placeholder="Visi & Misi" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea>{statusProfil && <div className="p-3 rounded-lg font-bold text-center bg-green-50 text-green-700">{statusProfil}</div>}<button type="submit" disabled={isLoadingProfil} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md">{isLoadingProfil ? "Menyimpan..." : "Simpan Profil Utama"}</button></form></div>
            
            {/* MANAJEMEN APARATUR */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-6">👔 Susunan Perangkat Desa</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-800">{editAparaturId ? "✏️ Edit SOTK" : "Tambah SOTK"}</h4>{editAparaturId && <button onClick={batalEditAparatur} className="text-xs bg-gray-300 px-2 py-1 rounded-md font-bold">Batal</button>}</div>
                  <form onSubmit={handleSimpanAparatur} className="space-y-4">
                    <div><label className="block text-xs font-bold mb-1">Nama & Gelar</label><input type="text" required value={namaAparatur} onChange={(e) => setNamaAparatur(e.target.value)} placeholder="Misal: Rebo, S.E." className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div><label className="block text-xs font-bold mb-1">Jabatan</label><input type="text" required value={jabatanAparatur} onChange={(e) => setJabatanAparatur(e.target.value)} placeholder="Misal: Kepala Desa" className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-xs font-bold mb-1">No. Urut</label><input type="number" required value={urutanAparatur} onChange={(e) => setUrutanAparatur(Number(e.target.value))} className="w-full p-3 rounded-lg border text-center font-bold" /></div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Foto Baru</label>
                        <label className="cursor-pointer flex flex-col items-center justify-center py-2 h-[46px] bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all overflow-hidden"><span className="font-bold text-gray-600 text-xs flex items-center gap-1">📸 {fotoAparatur ? 'Siap' : 'Pilih File'}</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFotoAparatur(e.target.files[0])}} className="hidden" /></label>
                      </div>
                    </div>
                    {editAparaturId && fotoLamaAparatur && (<div className="flex items-center gap-3 p-2 bg-white rounded-lg border"><img src={`https://wsrv.nl/?url=${fotoLamaAparatur}`} className="w-8 h-8 rounded-full object-cover" /><span className="text-xs text-gray-500">Foto tersimpan</span></div>)}
                    {statusAparatur && <div className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded text-center">{statusAparatur}</div>}
                    <button type="submit" disabled={isLoadingAparatur} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black">{isLoadingAparatur ? "Memproses..." : (editAparaturId ? "Simpan Perubahan" : "Tambahkan")}</button>
                  </form>
                </div>
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="min-w-full text-sm text-left"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-4">No</th><th className="py-3 px-4">Identitas</th><th className="py-3 px-4 text-center">Aksi</th></tr></thead>
                    <tbody>{daftarAparatur.map((org) => (
                      <tr key={org.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-black text-gray-400 text-lg text-center">{org.urutan}</td>
                        <td className="py-3 px-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">{org.foto ? <img src={`https://wsrv.nl/?url=${org.foto}`} alt="profil" className="w-full h-full object-cover"/> : <span className="flex items-center justify-center w-full h-full text-lg">👤</span>}</div><div><div className="font-bold text-gray-900">{org.nama}</div><div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{org.jabatan}</div></div></td>
                        <td className="py-3 px-4 text-center"><button onClick={() => mulaiEditAparatur(org)} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-md mr-2">Edit</button><button onClick={() => hapusAparatur(org.id)} className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-md">Hapus</button></td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MANAJEMEN UMKM (BARU) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-6">🛍️ Katalog Potensi / UMKM Desa</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4">Daftarkan Produk UMKM</h4>
                  <form onSubmit={handleSimpanUmkm} className="space-y-4">
                    <div><label className="block text-xs font-bold mb-1">Nama Produk/Usaha</label><input type="text" required value={namaProduk} onChange={(e)=>setNamaProduk(e.target.value)} placeholder="Misal: Kripik Singkong" className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div><label className="block text-xs font-bold mb-1">Pemilik</label><input type="text" required value={pemilikUmkm} onChange={(e)=>setPemilikUmkm(e.target.value)} placeholder="Misal: Bu Tejo" className="w-full p-3 rounded-lg border outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-xs font-bold mb-1">Harga (Rp)</label><input type="number" required value={hargaProduk} onChange={(e)=>setHargaProduk(e.target.value)} placeholder="15000" className="w-full p-3 rounded-lg border outline-none font-bold" /></div>
                      <div><label className="block text-xs font-bold mb-1">No. WhatsApp</label><input type="number" required value={waUmkm} onChange={(e)=>setWaUmkm(e.target.value)} placeholder="62812..." className="w-full p-3 rounded-lg border outline-none" /></div>
                    </div>
                    <div><label className="block text-xs font-bold mb-1">Deskripsi Singkat</label><textarea required rows={2} value={deskripsiProduk} onChange={(e)=>setDeskripsiProduk(e.target.value)} className="w-full p-3 rounded-lg border outline-none"></textarea></div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Foto Produk</label>
                      <label className="cursor-pointer flex flex-col items-center justify-center py-2 h-[46px] bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all overflow-hidden"><span className="font-bold text-gray-600 text-xs flex items-center gap-1">📸 {fotoProduk ? 'Siap' : 'Pilih File'}</span><input type="file" required accept="image/*" onChange={(e) => { if(e.target.files) setFotoProduk(e.target.files[0])}} className="hidden" /></label>
                    </div>
                    {statusUmkm && <div className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded text-center">{statusUmkm}</div>}
                    <button type="submit" disabled={isLoadingUmkm} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">{isLoadingUmkm ? "Memproses..." : "Tambahkan UMKM"}</button>
                  </form>
                </div>
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="min-w-full text-sm text-left"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-4">Produk</th><th className="py-3 px-4">Pemilik & Kontak</th><th className="py-3 px-4 text-center">Aksi</th></tr></thead>
                    <tbody>{daftarUmkm.map((umkm) => (
                      <tr key={umkm.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">{umkm.foto ? <img src={`https://wsrv.nl/?url=${umkm.foto}`} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full">📦</span>}</div><div><div className="font-bold text-gray-900">{umkm.nama_produk}</div><div className="text-xs text-green-600 font-bold">Rp {umkm.harga}</div></div></td>
                        <td className="py-3 px-4"><div className="font-bold">{umkm.pemilik}</div><div className="text-xs text-gray-500">WA: {umkm.wa}</div></td>
                        <td className="py-3 px-4 text-center"><button onClick={() => hapusUmkm(umkm.id)} className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-md">Hapus</button></td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div> 
        )}

        {/* MODUL TRANSPARANSI & REGULASI */}
        {activeMenu === "transparansi" && ( 
          <div className="space-y-8 animate-fade-in"><div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400"><h3 className="text-2xl font-bold mb-6">📊 Kelola Grafik APBDes</h3><form onSubmit={handleSimpanApbdes} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-bold mb-2">Dana Desa (DD)</label><input type="number" required value={danaDesa} onChange={(e)=>setDanaDesa(e.target.value)} className="w-full p-3 border rounded-xl" /></div><div><label className="block text-sm font-bold mb-2">Alokasi Dana Desa (ADD)</label><input type="number" required value={alokasiDanaDesa} onChange={(e)=>setAlokasiDanaDesa(e.target.value)} className="w-full p-3 border rounded-xl" /></div><div><label className="block text-sm font-bold mb-2">Pendapatan Asli Desa (PAD)</label><input type="number" required value={pad} onChange={(e)=>setPad(e.target.value)} className="w-full p-3 border rounded-xl" /></div><div><label className="block text-sm font-bold mb-2">Bantuan Keuangan Provinsi</label><input type="number" required value={banprov} onChange={(e)=>setBanprov(e.target.value)} className="w-full p-3 border rounded-xl" /></div></div>{statusApbdes && <div className="p-3 bg-green-50 text-green-700 font-bold rounded-lg text-center">{statusApbdes}</div>}<button type="submit" disabled={isLoadingApbdes} className="bg-yellow-500 text-gray-900 font-extrabold px-8 py-3 rounded-xl shadow-md">{isLoadingApbdes ? "Menyimpan..." : "Perbarui Grafik Anggaran"}</button></form></div><div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-2xl font-bold mb-6">📂 Manajemen Dokumen & Regulasi</h3><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-200"><div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-800">{editRegulasiId ? "✏️ Edit Dokumen" : "Tambah Dokumen"}</h4>{editRegulasiId && <button onClick={batalEditRegulasi} className="text-xs bg-gray-300 px-2 py-1 rounded-md font-bold">Batal</button>}</div><form onSubmit={handleSimpanRegulasi} className="space-y-4"><div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold mb-1">Tahun</label><input type="number" required value={tahunRegulasi} onChange={(e)=>setTahunRegulasi(e.target.value)} placeholder="Misal: 2024" className="w-full p-3 rounded-lg border outline-none" /></div><div><label className="block text-xs font-bold mb-1">Jenis</label><select value={jenisRegulasi} onChange={(e)=>setJenisRegulasi(e.target.value)} className="w-full p-3 rounded-lg border outline-none bg-white"><option value="Perdes">Perdes</option><option value="SK Kades">SK Kades</option><option value="Laporan">Laporan</option></select></div></div><div><label className="block text-xs font-bold mb-1">Judul Dokumen</label><textarea required rows={3} value={judulRegulasi} onChange={(e)=>setJudulRegulasi(e.target.value)} placeholder="Misal: Peraturan Desa tentang APBDes" className="w-full p-3 rounded-lg border outline-none"></textarea></div><div><label className="block text-xs font-bold mb-1">Tautan / Link File (G-Drive dll)</label><input type="url" required value={linkRegulasi} onChange={(e)=>setLinkRegulasi(e.target.value)} placeholder="https://drive.google.com/..." className="w-full p-3 rounded-lg border outline-none" /></div>{statusRegulasi && <div className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded text-center">{statusRegulasi}</div>}<button type="submit" disabled={isLoadingRegulasi} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black">{isLoadingRegulasi ? "Menyimpan..." : (editRegulasiId ? "Simpan Perubahan" : "Upload Dokumen")}</button></form></div><div className="lg:col-span-2 overflow-x-auto"><table className="min-w-full text-sm text-left"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-4">Thn/Jenis</th><th className="py-3 px-4">Judul Dokumen</th><th className="py-3 px-4 text-center">Aksi</th></tr></thead><tbody>{daftarRegulasi.map((docItem) => (<tr key={docItem.id} className="border-b hover:bg-gray-50"><td className="py-3 px-4"><span className="font-black text-gray-800 block">{docItem.tahun}</span><span className="text-xs bg-gray-200 px-2 py-1 rounded font-bold">{docItem.jenis}</span></td><td className="py-3 px-4"><div className="font-bold text-gray-900 line-clamp-2">{docItem.judul}</div><a href={docItem.link} target="_blank" className="text-xs text-blue-500 hover:underline">Tes Link Berkas</a></td><td className="py-3 px-4 text-center flex flex-col gap-1"><button onClick={() => mulaiEditRegulasi(docItem)} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-md">Edit</button><button onClick={() => hapusRegulasi(docItem.id)} className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-md">Hapus</button></td></tr>))}{daftarRegulasi.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-500">Belum ada dokumen regulasi yang diupload.</td></tr>}</tbody></table></div></div></div></div> 
        )}
        
        {/* MODUL MANAJEMEN AKUN */}
        {activeMenu === "akun" && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-500 animate-fade-in"><h3 className="text-2xl font-bold mb-6">👥 Registrasi Hak Akses Sistem</h3><form onSubmit={handleSimpanAkun} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-bold mb-2">Nama Pengguna</label><input type="text" required value={namaAkun} onChange={(e)=>setNamaAkun(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Budi Santoso" /></div><div><label className="block text-sm font-bold mb-2">Email</label><input type="email" required value={emailAkun} onChange={(e)=>setEmailAkun(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="budi@kerjo.desa.id" /></div></div><div><label className="block text-sm font-bold mb-2">Peran (Role)</label><select value={roleAkun} onChange={(e)=>setRoleAkun(e.target.value)} className="w-full p-3 border rounded-xl font-medium"><option value="Kontributor">Kontributor</option><option value="Administrator">Administrator</option></select></div>{statusAkun && <div className="p-3 bg-blue-50 text-blue-700 font-bold rounded-lg">{statusAkun}</div>}<button type="submit" disabled={isLoadingAkun} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-md">{isLoadingAkun ? "Menyimpan..." : "Daftarkan Akun Baru"}</button></form></div> )}

      </main>
    </div>
  );
}