// src/components/dashboard/LayananWarga.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, addDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// ==========================================
// SOLUSI ERROR TYPESCRIPT (INTRINSIC ATTRIBUTES)
// ==========================================
interface LayananWargaProps {
  activeSubMenu?: string;
}

export default function LayananWarga({ activeSubMenu }: LayananWargaProps) {
  // Set default tab berdasarkan activeSubMenu dari sidebar
  const defaultTab = activeSubMenu === "layan-master" ? "master" 
                   : activeSubMenu === "layan-pengaduan" ? "pengaduan" 
                   : activeSubMenu === "layan-hero" ? "hero"
                   : "antrean";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "layan-master") setTabAktif("master");
    else if (activeSubMenu === "layan-pengaduan") setTabAktif("pengaduan");
    else if (activeSubMenu === "layan-hero") setTabAktif("hero");
    else setTabAktif("antrean");
  }, [activeSubMenu]);

  // ==========================================
  // STATE PENGATURAN HEADER/HERO LAYANAN
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  // ==========================================
  // STATE MASTER SURAT (JENIS SURAT)
  // ==========================================
  const [masterSuratList, setMasterSuratList] = useState<any[]>([]);
  const [editMasterId, setEditMasterId] = useState<string | null>(null);
  const [namaSurat, setNamaSurat] = useState("");
  const [harusDatang, setHarusDatang] = useState(false);
  const [persyaratan, setPersyaratan] = useState<string[]>([""]); 
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  // ==========================================
  // STATE ANTREAN SURAT
  // ==========================================
  const [antreanSurat, setAntreanSurat] = useState<any[]>([]);
  const [batasHapusSurat, setBatasHapusSurat] = useState("30");
  const [isCleaningSurat, setIsCleaningSurat] = useState(false);
  
  // Modal Penolakan Surat
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [suratToReject, setSuratToReject] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState("");

  // ==========================================
  // STATE PENGADUAN
  // ==========================================
  const [daftarPengaduan, setDaftarPengaduan] = useState<any[]>([]);
  const [pengaduanTerpilih, setPengaduanTerpilih] = useState<any | null>(null);

  const [loadingData, setLoadingData] = useState(true);

  // ==========================================
  // FUNGSI FETCH DATA
  // ==========================================
  const ambilSemuaData = async () => {
    setLoadingData(true);
    try {
      // Fetch Header Layanan
      const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "Layanan Surat Mandiri");
        setHeroSub(snapHero.data().sub || "Ajukan surat administrasi langsung dari HP Anda.");
        setHeroBgLama(snapHero.data().bg || "");
      }

      // Fetch Master Surat
      const qMaster = query(collection(db, "master_surat"));
      const snapMaster = await getDocs(qMaster);
      setMasterSuratList(snapMaster.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Antrean Surat
      const qSurat = query(collection(db, "layanan_surat"), orderBy("tanggal_pengajuan", "desc"));
      const snapSurat = await getDocs(qSurat);
      setAntreanSurat(snapSurat.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Pengaduan
      const qAduan = query(collection(db, "pengaduan_masyarakat"), orderBy("tanggal", "desc"));
      const snapAduan = await getDocs(qAduan);
      setDaftarPengaduan(snapAduan.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    ambilSemuaData();
  }, []);

  const formatWA = (no: string) => {
    if (!no) return "";
    let formatted = no.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.substring(1);
    return formatted;
  };

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("id-ID", {
      day: "numeric", 
      month: "short", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit"
    }) + " WIB";
  };

  // ==========================================
  // FUNGSI UPLOAD GAMBAR API IMGBB
  // ==========================================
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if ((encoded.length % 4) > 0) { 
          encoded += '='.repeat(4 - (encoded.length % 4)); 
        }
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
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { 
        method: "POST", 
        body: formData 
      });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      try {
        const base64Data = await fileToBase64(file);
        const formData = new FormData();
        formData.append("image", base64Data);
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
  // MANAJEMEN PENGATURAN HEADER/HERO LAYANAN
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingHero(true);
    setStatusHero("Menyimpan pengaturan Header...");
    
    try {
      let imageUrl = heroBgLama;
      
      if (heroBgList && heroBgList.length > 0) {
        setStatusHero("Mengunggah gambar background...");
        const newBg = await uploadFotoKeImgBB(heroBgList[0]);
        if (newBg) {
          imageUrl = newBg;
        } else {
          setStatusHero("❌ Gagal mengunggah gambar. Pastikan internet stabil.");
          setIsLoadingHero(false); 
          return; 
        }
      }

      await setDoc(doc(db, "pengaturan_web", "layanan_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });

      setStatusHero("✅ Pengaturan Header Layanan berhasil diperbarui!");
      setHeroBgLama(imageUrl); 
      setHeroBgList(null);
      const input = document.getElementById("inputBgLayanan") as HTMLInputElement;
      if (input) input.value = "";
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menyimpan pengaturan.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  // ==========================================
  // LOGIKA MASTER SURAT (JENIS SURAT)
  // ==========================================
  const handlePersyaratanChange = (index: number, value: string) => {
    const newPersyaratan = [...persyaratan];
    newPersyaratan[index] = value;
    setPersyaratan(newPersyaratan);
  };

  const tambahPersyaratanField = () => {
    setPersyaratan([...persyaratan, ""]);
  };

  const hapusPersyaratanField = (index: number) => {
    const newPersyaratan = persyaratan.filter((_, i) => i !== index);
    setPersyaratan(newPersyaratan.length ? newPersyaratan : [""]);
  };

  const simpanMasterSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingMaster(true);
    try {
      const cleanPersyaratan = persyaratan.filter(p => p.trim() !== "");
      const payload = { 
        nama_surat: namaSurat, 
        harus_datang: harusDatang, 
        persyaratan: cleanPersyaratan 
      };

      if (editMasterId) {
        await updateDoc(doc(db, "master_surat", editMasterId), payload);
        alert("✅ Jenis Surat diperbarui!");
      } else {
        await addDoc(collection(db, "master_surat"), payload);
        alert("✅ Jenis Surat ditambahkan!");
      }
      batalEditMaster();
      ambilSemuaData();
    } catch (error) {
      alert("❌ Gagal menyimpan Jenis Surat.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  const mulaiEditMaster = (item: any) => {
    setEditMasterId(item.id);
    setNamaSurat(item.nama_surat);
    setHarusDatang(item.harus_datang || false);
    setPersyaratan(item.persyaratan && item.persyaratan.length > 0 ? item.persyaratan : [""]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditMaster = () => {
    setEditMasterId(null); 
    setNamaSurat(""); 
    setHarusDatang(false); 
    setPersyaratan([""]);
  };

  const hapusMasterSurat = async (id: string) => {
    if (confirm("Yakin menghapus Jenis Surat ini? Ini tidak akan menghapus riwayat surat warga yang sudah dibuat.")) {
      await deleteDoc(doc(db, "master_surat", id));
      ambilSemuaData();
    }
  };

  // ==========================================
  // LOGIKA ANTREAN SURAT
  // ==========================================
  const hapusSurat = async (id: string) => {
    if (confirm("Yakin hapus data antrean surat ini permanen?")) {
      await deleteDoc(doc(db, "layanan_surat", id));
      ambilSemuaData();
    }
  };

  const ubahStatusSurat = async (id: string, statusBaru: string) => {
    if (statusBaru === "Ditolak") {
      setSuratToReject(id); 
      setAlasanTolak(""); 
      setRejectModalOpen(true);
      return; 
    }
    try {
      await updateDoc(doc(db, "layanan_surat", id), { 
        status: statusBaru, 
        alasan_penolakan: "" 
      });
      ambilSemuaData();
    } catch (error) { 
      alert("Gagal merubah status."); 
    }
  };

  const konfirmasiPenolakan = async () => {
    if (!suratToReject) return;
    if (!alasanTolak.trim()) { 
      alert("Alasan penolakan wajib diisi agar warga tahu kesalahannya!"); 
      return; 
    }
    try {
      await updateDoc(doc(db, "layanan_surat", suratToReject), { 
        status: "Ditolak", 
        alasan_penolakan: alasanTolak 
      });
      setRejectModalOpen(false); 
      setSuratToReject(null); 
      setAlasanTolak(""); 
      ambilSemuaData();
    } catch (error) { 
      alert("Gagal menyimpan penolakan."); 
    }
  };

  const pembersihanSuratOtomatis = async () => {
    if (!confirm(`Tindakan ini akan menghapus riwayat surat yang usianya melebihi ${batasHapusSurat} hari. Lanjutkan?`)) return;
    setIsCleaningSurat(true);
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - parseInt(batasHapusSurat));
      
      let countDeleted = 0;
      const deletePromises = [];
      
      for (const surat of antreanSurat) {
        const tglSurat = new Date(surat.tanggal_pengajuan);
        if (tglSurat < limitDate) {
          deletePromises.push(deleteDoc(doc(db, "layanan_surat", surat.id)));
          countDeleted++;
        }
      }
      await Promise.all(deletePromises);
      alert(`✅ Berhasil menghapus ${countDeleted} data antrean surat usang.`);
      ambilSemuaData();
    } catch (error) { 
      alert("❌ Gagal melakukan pembersihan otomatis."); 
    } finally { 
      setIsCleaningSurat(false); 
    }
  };

  // ==========================================
  // LOGIKA KOTAK PENGADUAN
  // ==========================================
  const hapusPengaduan = async (id: string) => {
    if (confirm("Hapus laporan pengaduan ini?")) {
      await deleteDoc(doc(db, "pengaduan_masyarakat", id));
      ambilSemuaData();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      {/* TABS NAVIGASI (Hanya tampil jika tidak ada submenu spesifik yang dipilih) */}
      {!activeSubMenu && (
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setTabAktif("antrean")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "antrean" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📄</span> Antrean Surat
          </button>
          
          <button 
            onClick={() => setTabAktif("master")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "master" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">⚙️</span> Daftar Jenis Surat
          </button>
          
          <button 
            onClick={() => setTabAktif("pengaduan")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "pengaduan" ? "bg-red-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📥</span> Kotak Pengaduan
          </button>
        </div>
      )}

      {loadingData ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* ==========================================
              TAB 0: PENGATURAN HEADER LAYANAN
          ========================================== */}
          {tabAktif === "hero" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-500 animate-fade-in">
              <h3 className="text-2xl font-bold mb-2">🖼️ Pengaturan Header Layanan Mandiri</h3>
              <p className="text-gray-500 text-sm mb-6">Sesuaikan gambar background dan teks sambutan khusus di halaman Layanan Surat Warga.</p>
              
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
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-800">Teks Sub-Judul (Deskripsi Singkat)</label>
                      <textarea 
                        required 
                        rows={4} 
                        value={heroSub} 
                        onChange={(e) => setHeroSub(e.target.value)} 
                        className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Gambar Background Header</label>
                    
                    {heroBgLama && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group">
                        <img 
                          src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                          alt="Hero Background"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button" 
                            onClick={() => setHeroBgLama("")} 
                            className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 border border-red-500"
                          >
                            Hapus Background
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <label className="cursor-pointer flex flex-col items-center justify-center py-6 bg-purple-50 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-100 transition-all shadow-sm">
                      <span className="text-3xl mb-2">📸</span>
                      <span className="font-bold text-purple-800 text-sm">Upload Background Baru</span>
                      <input 
                        id="inputBgLayanan" 
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
                  {isLoadingHero ? "Menyimpan Pengaturan..." : "Simpan Header Layanan"}
                </button>
              </form>
            </div>
          )}

          {/* ==========================================
              TAB 1: ANTREAN SURAT
          ========================================== */}
          {tabAktif === "antrean" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">📄 Antrean Layanan Surat</h3>
                  <p className="text-sm text-gray-500 mt-1">Periksa berkas, ubah status, dan hubungi warga terkait.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-200 w-full md:w-auto">
                  <span className="text-xs font-bold text-red-800 ml-2">🧹 Auto-Clean:</span>
                  <select 
                    value={batasHapusSurat} 
                    onChange={(e) => setBatasHapusSurat(e.target.value)} 
                    className="text-xs font-bold p-1.5 rounded-lg outline-none border border-red-300"
                  >
                    <option value="7">7 Hari</option>
                    <option value="14">14 Hari</option>
                    <option value="30">1 Bulan</option>
                    <option value="90">3 Bulan</option>
                  </select>
                  <button 
                    onClick={pembersihanSuratOtomatis} 
                    disabled={isCleaningSurat} 
                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {isCleaningSurat ? "Memproses..." : "Bersihkan"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-4 px-4 font-bold text-gray-600">Waktu & Data Diri</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Keperluan & Jenis Surat</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Berkas Lampiran</th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600">Status & Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {antreanSurat.map((surat) => (
                      <tr key={surat.id} className="border-b hover:bg-yellow-50/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="text-xs font-bold text-gray-400 mb-1">
                            {formatTanggal(surat.tanggal_pengajuan)}
                          </div>
                          <div className="font-black text-gray-900 text-lg uppercase leading-tight">
                            {surat.nama}
                          </div>
                          <div className="text-sm font-mono text-gray-600 mb-2">
                            NIK: {surat.nik}
                          </div>
                          <a 
                            href={`https://wa.me/${formatWA(surat.wa)}?text=Halo%20Sdr/i%20${surat.nama},%20ini%20dari%20Admin%20Layanan%20Desa%20Kerjo%20terkait%20pengajuan%20surat%20Anda.`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 font-bold px-3 py-1 rounded-lg text-xs transition-colors"
                          >
                            <span className="text-base">💬</span> Chat Warga
                          </a>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="bg-yellow-100 text-yellow-800 font-black text-xs px-2 py-1 rounded inline-block mb-2 uppercase tracking-widest border border-yellow-200">
                            {surat.jenis_surat}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed max-w-xs line-clamp-3 hover:line-clamp-none">
                            <strong>Keperluan:</strong> {surat.keperluan}
                          </p>
                        </td>
                        <td className="py-4 px-4 align-top">
                          {surat.berkas && Object.keys(surat.berkas).length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {Object.keys(surat.berkas).map((key, idx) => (
                                <a 
                                  key={idx} 
                                  href={surat.berkas[key]} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-2 py-1 rounded flex justify-between items-center transition-colors" 
                                  title="Lihat Berkas"
                                >
                                  <span className="truncate w-32">{key}</span> 
                                  <span>👁️</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 text-center">
                              Mode Datang Langsung / Tanpa Berkas Digital
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <div className="flex flex-col gap-2 items-center">
                            <select 
                              value={surat.status || "Menunggu"} 
                              onChange={(e) => ubahStatusSurat(surat.id, e.target.value)} 
                              className={`text-xs font-bold px-3 py-2 rounded-lg outline-none w-32 border-2 cursor-pointer shadow-sm ${
                                surat.status === "Selesai" ? "bg-green-50 text-green-700 border-green-500" : 
                                surat.status === "Diproses" ? "bg-blue-50 text-blue-700 border-blue-500" : 
                                surat.status === "Ditolak" ? "bg-red-50 text-red-700 border-red-500" : 
                                "bg-yellow-50 text-yellow-700 border-yellow-500"
                              }`}
                            >
                              <option value="Menunggu">🟠 Menunggu</option>
                              <option value="Diproses">🔵 Diproses</option>
                              <option value="Selesai">🟢 Selesai</option>
                              <option value="Ditolak">🔴 Ditolak</option>
                            </select>
                            
                            {surat.status === "Ditolak" && surat.alasan_penolakan && (
                              <div className="text-[10px] text-red-600 font-medium italic w-32 leading-tight bg-red-50 p-1.5 rounded border border-red-100">
                                "{surat.alasan_penolakan}"
                              </div>
                            )}
                            
                            <button 
                              onClick={() => hapusSurat(surat.id)} 
                              className="mt-2 text-[10px] text-red-500 hover:text-red-700 font-bold underline"
                            >
                              Hapus Data
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {antreanSurat.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                          Belum ada antrean surat masuk.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: MASTER SURAT
          ========================================== */}
          {tabAktif === "master" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">⚙️ Master Daftar Surat</h3>
                  <p className="text-sm text-gray-500 mt-1">Buat jenis surat, atur persyaratan wajib, dan tentukan opsi "Datang Langsung".</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-inner h-fit">
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="font-bold text-blue-900">{editMasterId ? "✏️ Edit Surat" : "Buat Jenis Surat Baru"}</h4>
                    {editMasterId && (
                      <button 
                        onClick={batalEditMaster} 
                        className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded font-bold transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                  <form onSubmit={simpanMasterSurat} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama/Jenis Surat</label>
                      <input 
                        type="text" 
                        required 
                        value={namaSurat} 
                        onChange={(e) => setNamaSurat(e.target.value)} 
                        placeholder="Misal: Surat Keterangan Usaha" 
                        className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                      />
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="pt-0.5">
                          <input 
                            type="checkbox" 
                            checked={harusDatang} 
                            onChange={(e) => setHarusDatang(e.target.checked)} 
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            Harus Datang Langsung
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5 leading-snug">
                            Jika dicentang, warga tidak perlu mengunggah foto berkas.
                          </span>
                        </div>
                      </label>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                      <label className="block text-xs font-bold mb-3 text-gray-800 border-b border-gray-100 pb-2">
                        Daftar Persyaratan Berkas
                      </label>
                      <div className="space-y-3">
                        {persyaratan.map((syarat, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-gray-400 w-4">{index + 1}.</span>
                            <input 
                              type="text" 
                              required 
                              value={syarat} 
                              onChange={(e) => handlePersyaratanChange(index, e.target.value)} 
                              placeholder="Misal: Foto KTP Asli" 
                              className="w-full p-2.5 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" 
                            />
                            <button 
                              type="button" 
                              onClick={() => hapusPersyaratanField(index)} 
                              className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg border border-red-200 transition-colors font-black" 
                              title="Hapus Syarat"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button" 
                        onClick={tambahPersyaratanField} 
                        className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-lg border border-blue-200 border-dashed text-xs transition-colors"
                      >
                        + Tambah Kolom Persyaratan Baru
                      </button>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isLoadingMaster} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
                    >
                      {isLoadingMaster ? "Menyimpan..." : editMasterId ? "Simpan Perubahan Master" : "Tambahkan ke Daftar"}
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white p-4">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-4 font-bold text-gray-600 w-1/3">Jenis Surat</th>
                        <th className="py-3 px-4 font-bold text-gray-600">Ketentuan Persyaratan</th>
                        <th className="py-3 px-4 font-bold text-gray-600 text-center">Tipe Proses</th>
                        <th className="py-3 px-4 text-center font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterSuratList.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-blue-50/50 transition-colors">
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-gray-900 text-base leading-tight">{item.nama_surat}</div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            {item.persyaratan && item.persyaratan.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                                {item.persyaratan.map((p: string, idx: number) => (
                                  <li key={idx}>{p}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Tidak ada syarat khusus</span>
                            )}
                          </td>
                          <td className="py-4 px-4 align-top text-center">
                            {item.harus_datang ? (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest block shadow-sm">
                                🏢 Wajib Datang
                              </span>
                            ) : (
                              <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest block shadow-sm">
                                📱 Full Online
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center align-top">
                            <div className="flex flex-col gap-2 items-center">
                              <button 
                                onClick={() => mulaiEditMaster(item)} 
                                className="w-full max-w-[80px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => hapusMasterSurat(item.id)} 
                                className="w-full max-w-[80px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {masterSuratList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                            Belum ada Jenis Surat yang didaftarkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: KOTAK PENGADUAN
          ========================================== */}
          {tabAktif === "pengaduan" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-red-600 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">📥 Kotak Pengaduan Masyarakat</h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-4 px-4 font-bold text-gray-600">Pelapor & Waktu</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Judul Pengaduan</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Isi Laporan Singkat</th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarPengaduan.map((aduan) => (
                      <tr key={aduan.id} className="border-b hover:bg-red-50/50 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-gray-900 text-base">{aduan.nama}</div>
                          <div className="text-xs text-gray-500 mb-1">{formatTanggal(aduan.tanggal)}</div>
                          <a 
                            href={`https://wa.me/${formatWA(aduan.wa)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max hover:bg-green-600 hover:text-white transition-colors"
                          >
                            <span>💬</span> WA Pelapor
                          </a>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-red-800 text-sm uppercase tracking-wide bg-red-50 px-2 py-1 rounded inline-block border border-red-100">
                            {aduan.kategori}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-sm italic mb-2">"{aduan.pesan}"</p>
                          <button 
                            onClick={() => setPengaduanTerpilih(aduan)} 
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            📖 Baca Laporan Lengkap
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <button 
                            onClick={() => hapusPengaduan(aduan.id)} 
                            className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            Hapus Aduan
                          </button>
                        </td>
                      </tr>
                    ))}
                    {daftarPengaduan.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                          Kotak pengaduan kosong.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          MODAL: BACA PENGADUAN LENGKAP
      ========================================== */}
      {pengaduanTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-red-600 text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><span>📥</span> Detail Pengaduan</h3>
              <button 
                onClick={() => setPengaduanTerpilih(null)} 
                className="text-white hover:bg-red-700 bg-red-500 w-8 h-8 rounded-full font-black flex items-center justify-center transition-colors"
              >
                X
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <span className="block text-xs text-gray-500 font-bold mb-0.5">Nama Pelapor:</span>
                  <span className="font-black text-gray-900 text-lg">{pengaduanTerpilih.nama}</span>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <span className="block text-xs text-gray-500 font-bold mb-0.5">Waktu Laporan:</span>
                  <span className="font-bold text-gray-700">{formatTanggal(pengaduanTerpilih.tanggal)}</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                  <span className="block text-xs text-red-500 font-bold mb-0.5">Kategori:</span>
                  <span className="font-black text-red-800 uppercase">{pengaduanTerpilih.kategori}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
                <span className="absolute top-4 left-4 text-4xl opacity-10">📝</span>
                <p className="text-gray-800 text-base leading-loose whitespace-pre-wrap relative z-10 font-medium">
                  {pengaduanTerpilih.pesan}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <a 
                  href={`https://wa.me/${formatWA(pengaduanTerpilih.wa)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">💬</span> Hubungi Pelapor via WA
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ALASAN PENOLAKAN SURAT
      ========================================== */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border-t-8 border-red-600">
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">🔴 Tolak Pengajuan Surat</h3>
              <p className="text-sm text-gray-500 mb-6">Berikan alasan mengapa permohonan surat ini ditolak (misal: Foto KTP buram, NIK tidak sesuai, dll) agar warga dapat memperbaikinya.</p>
              
              <textarea 
                rows={4} 
                required 
                value={alasanTolak} 
                onChange={(e) => setAlasanTolak(e.target.value)} 
                placeholder="Tuliskan alasan penolakan secara jelas disini..." 
                className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed mb-6"
              ></textarea>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setRejectModalOpen(false); setSuratToReject(null); setAlasanTolak(""); }} 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={konfirmasiPenolakan} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
                >
                  Kirim Penolakan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}