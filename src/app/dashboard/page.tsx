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

  // --- STATE TRANSPARANSI (APBDes) --- BARU!
  const [danaDesa, setDanaDesa] = useState<number | string>(0);
  const [alokasiDanaDesa, setAlokasiDanaDesa] = useState<number | string>(0);
  const [pad, setPad] = useState<number | string>(0);
  const [banprov, setBanprov] = useState<number | string>(0);
  const [statusApbdes, setStatusApbdes] = useState("");
  const [isLoadingApbdes, setIsLoadingApbdes] = useState(false);

  // FUNGSI TARIK DATA (BERITA, PROFIL, & APBDES)
  const ambilDataAwal = async () => {
    try {
      // 1. Tarik Berita
      const q = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      const snapKabar = await getDocs(q);
      const dataSementara: any[] = [];
      snapKabar.forEach(doc => dataSementara.push({ id: doc.id, ...doc.data() }));
      setRiwayatKabar(dataSementara);

      // 2. Tarik Profil
      const snapProfil = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapProfil.exists()) {
        setSejarahDesa(snapProfil.data().sejarah || "");
        setVisiMisiDesa(snapProfil.data().visi_misi || "");
      }

      // 3. Tarik APBDes
      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0);
        setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0);
        setPad(snapApbdes.data().pad || 0);
        setBanprov(snapApbdes.data().banprov || 0);
      }
    } catch (error) { console.error("Gagal memuat data awal", error); }
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

  // --- FUNGSI SIMPAN KABAR DESA (TETAP UTUH DGN IMGBB) ---
  const handleSimpanKabar = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingKabar(true); setStatusKabar("Memproses data...");
    try {
      let tautanGambarBaru: string[] = [];
      if (fotoKabarList && fotoKabarList.length > 0) {
        setStatusKabar(`Mengunggah ${fotoKabarList.length} foto ke ImgBB...`);
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

  const mulaiEditKabar = (item: any) => { setEditKabarId(item.id); setJudulKabar(item.judul); setIsiKabar(item.isi); setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const batalEditKabar = () => { setEditKabarId(null); setJudulKabar(""); setIsiKabar(""); setGambarLama([]); setFotoKabarList(null); const fileInput = document.getElementById("inputFotoKabar") as HTMLInputElement; if (fileInput) fileInput.value = ""; };
  const hapusKabar = async (id: string) => { if (confirm("Yakin hapus permanen?")) { await deleteDoc(doc(db, "kabar_desa", id)); ambilDataAwal(); } };

  // --- FUNGSI SIMPAN PROFIL ---
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingProfil(true); setStatusProfil("Menyimpan...");
    try { await setDoc(doc(db, "profil_desa", "utama"), { sejarah: sejarahDesa, visi_misi: visiMisiDesa, terakhir_diperbarui: new Date().toISOString() }); setStatusProfil("✅ Profil diperbarui!"); setTimeout(() => setStatusProfil(""), 4000); } catch (error) { setStatusProfil("❌ Gagal menyimpan."); } finally { setIsLoadingProfil(false); }
  };

  // --- FUNGSI SIMPAN APBDES (BARU) ---
  const handleSimpanApbdes = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingApbdes(true); setStatusApbdes("Menyimpan angka anggaran...");
    try {
      await setDoc(doc(db, "transparansi", "apbdes"), {
        dana_desa: Number(danaDesa), alokasi_dana_desa: Number(alokasiDanaDesa), pad: Number(pad), banprov: Number(banprov), terakhir_diperbarui: new Date().toISOString()
      });
      setStatusApbdes("✅ Grafik APBDes berhasil diperbarui!"); setTimeout(() => setStatusApbdes(""), 4000);
    } catch (error) { setStatusApbdes("❌ Gagal menyimpan anggaran."); } finally { setIsLoadingApbdes(false); }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800"><h2 className="text-2xl font-black mb-1">Ruang Kendali</h2><p className="text-green-400 text-xs truncate">{userEmail}</p></div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button onClick={() => setActiveMenu("welcome")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "welcome" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏠 Beranda</button>
          <button onClick={() => setActiveMenu("kabar")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "kabar" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📰 Kabar Desa</button>
          <button onClick={() => setActiveMenu("profil")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "profil" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>🏛️ Profil Desa</button>
          <button onClick={() => setActiveMenu("transparansi")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "transparansi" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>📊 Transparansi</button>
          <button onClick={() => setActiveMenu("akun")} className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${activeMenu === "akun" ? "bg-green-700 text-white translate-x-2" : "hover:bg-green-800"}`}>👥 Manajemen Akun</button>
        </nav>
        <div className="p-4 border-t border-green-800"><button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl">🚪 Keluar</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeMenu === "welcome" && ( <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-3xl font-bold mb-4">Selamat Datang!</h3><p className="text-gray-600">Pusat komando website resmi Desa Kerjo.</p></div> )}
        
        {/* MODUL KABAR DESA (TETAP UTUH) */}
        {activeMenu === "kabar" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500">
              <div className="flex justify-between mb-6 border-b pb-4"><h3 className="text-2xl font-bold flex items-center gap-2">{editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita"}</h3>{editKabarId && <button onClick={batalEditKabar} className="bg-gray-200 px-4 py-2 rounded-lg font-bold">Batal Edit</button>}</div>
              <form onSubmit={handleSimpanKabar} className="space-y-5">
                <input type="text" required value={judulKabar} onChange={(e) => setJudulKabar(e.target.value)} placeholder="Judul Berita" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-green-50 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-100 transition-all"><span className="text-3xl mb-2">📸</span><span className="font-bold">Klik pilih foto (Bisa banyak)</span><input id="inputFotoKabar" type="file" accept="image/*" multiple onChange={(e) => setFotoKabarList(e.target.files)} className="hidden" /></label>
                {fotoKabarList && <p className="text-sm font-bold text-blue-600">✅ {fotoKabarList.length} foto siap.</p>}
                <textarea required rows={6} value={isiKabar} onChange={(e) => setIsiKabar(e.target.value)} placeholder="Isi Berita" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none"></textarea>
                {statusKabar && <div className="p-3 rounded-lg text-sm font-bold text-center border bg-green-50 text-green-700">{statusKabar}</div>}
                <button type="submit" disabled={isLoadingKabar} className="bg-green-600 text-white font-bold px-8 py-3 rounded-xl">{isLoadingKabar ? "Memproses..." : (editKabarId ? "Simpan Perubahan" : "Publikasikan")}</button>
              </form>
            </div>
            {/* TABEL BERITA */}
            <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto"><h4 className="text-xl font-bold mb-4">Riwayat Berita</h4>
              <table className="min-w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="py-4 px-4">Judul</th><th className="py-4 px-4 text-center">Aksi</th></tr></thead>
                <tbody>{riwayatKabar.map((item) => (<tr key={item.id} className="border-b"><td className="py-4 px-4 font-bold">{item.judul}</td><td className="py-4 px-4 text-center"><button onClick={() => mulaiEditKabar(item)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg mr-2 font-bold">Edit</button><button onClick={() => hapusKabar(item.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold">Hapus</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODUL PROFIL (TETAP UTUH) */}
        {activeMenu === "profil" && (
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm"><h3 className="text-2xl font-bold mb-6">🏛️ Pengaturan Profil</h3><form onSubmit={handleSimpanProfil} className="space-y-5"><textarea required rows={5} value={sejarahDesa} onChange={(e) => setSejarahDesa(e.target.value)} placeholder="Sejarah" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea><textarea required rows={5} value={visiMisiDesa} onChange={(e) => setVisiMisiDesa(e.target.value)} placeholder="Visi Misi" className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none"></textarea>{statusProfil && <div className="p-3 rounded-lg font-bold text-center bg-green-50 text-green-700">{statusProfil}</div>}<button type="submit" disabled={isLoadingProfil} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl">{isLoadingProfil ? "Menyimpan..." : "Simpan Profil"}</button></form></div>
        )}

        {/* MODUL TRANSPARANSI (BARU) */}
        {activeMenu === "transparansi" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2"><span className="text-3xl">📊</span> Kelola APBDes</h3>
            <p className="text-gray-500 mb-6">Masukkan angka rincian anggaran (tanpa titik/koma) untuk memperbarui grafik donat di halaman Transparansi.</p>
            
            <form onSubmit={handleSimpanApbdes} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Dana Desa (DD)</label>
                  <input type="number" required value={danaDesa} onChange={(e) => setDanaDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Alokasi Dana Desa (ADD)</label>
                  <input type="number" required value={alokasiDanaDesa} onChange={(e) => setAlokasiDanaDesa(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pendapatan Asli Desa (PAD)</label>
                  <input type="number" required value={pad} onChange={(e) => setPad(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bantuan Keuangan Provinsi</label>
                  <input type="number" required value={banprov} onChange={(e) => setBanprov(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>

              {statusApbdes && <div className={`p-3 rounded-lg text-sm font-bold text-center border ${statusApbdes.includes("❌") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{statusApbdes}</div>}

              <button type="submit" disabled={isLoadingApbdes} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-extrabold py-3 px-8 rounded-xl shadow-md transition-all">
                {isLoadingApbdes ? "Memproses Angka..." : "Perbarui Grafik APBDes"}
              </button>
            </form>
          </div>
        )}

        {activeMenu === "akun" && ( <div className="bg-white p-8 rounded-3xl shadow-sm"><h3 className="text-2xl font-bold mb-4">👥 Hak Akses</h3><div className="bg-gray-50 border-dashed rounded-xl p-10 text-center"><p>Pengembangan tahap akhir...</p></div></div> )}
      </main>
    </div>
  );
}