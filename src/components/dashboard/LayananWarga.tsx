// src/components/dashboard/LayananWarga.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface LayananWargaProps {
  userEmail: string | null;
  activeSubMenu?: string;
}

export default function LayananWarga({ 
  userEmail, 
  activeSubMenu 
}: LayananWargaProps) {
  
  const defaultTab = activeSubMenu === "layan-master" ? "master"
                   : activeSubMenu === "layan-antrean" ? "antrean"
                   : activeSubMenu === "layan-pengaduan" ? "pengaduan"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "layan-hero") setTabAktif("hero");
    else if (activeSubMenu === "layan-master") setTabAktif("master");
    else if (activeSubMenu === "layan-antrean") setTabAktif("antrean");
    else if (activeSubMenu === "layan-pengaduan") setTabAktif("pengaduan");
  }, [activeSubMenu]);

  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE: HERO
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: MASTER SURAT
  // ==========================================
  const [dataMaster, setDataMaster] = useState<any[]>([]);
  const [isModalMasterOpen, setIsModalMasterOpen] = useState(false);
  const [editIdMaster, setEditIdMaster] = useState<string | null>(null);
  const [formMaster, setFormMaster] = useState({
    nama_surat: "",
    keterangan: "",
    syarat: ""
  });

  // ==========================================
  // STATE: ANTREAN SURAT
  // ==========================================
  const [dataAntrean, setDataAntrean] = useState<any[]>([]);
  const [isModalStatusOpen, setIsModalStatusOpen] = useState(false);
  const [selectedAntrean, setSelectedAntrean] = useState<any>(null);
  const [formStatus, setFormStatus] = useState({
    status: "",
    keterangan_admin: ""
  });

  // ==========================================
  // STATE: KOTAK PENGADUAN
  // ==========================================
  const [dataPengaduan, setDataPengaduan] = useState<any[]>([]);

  // ==========================================
  // FUNGSI FETCH DATA
  // ==========================================
  const ambilData = async () => {
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "layanan_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      const qMaster = query(collection(db, "master_surat"));
      const snapMaster = await getDocs(qMaster);
      setDataMaster(snapMaster.docs.map(d => ({ id: d.id, ...d.data() })));

      const qAntrean = query(collection(db, "antrean_surat"), orderBy("tanggal_pengajuan", "desc"));
      const snapAntrean = await getDocs(qAntrean);
      setDataAntrean(snapAntrean.docs.map(d => ({ id: d.id, ...d.data() })));

      const qPengaduan = query(collection(db, "pengaduan_warga"), orderBy("tanggal_masuk", "desc"));
      const snapPengaduan = await getDocs(qPengaduan);
      setDataPengaduan(snapPengaduan.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    let safeUrl = url;
    if (safeUrl.includes("cloudinary.com") && safeUrl.toLowerCase().endsWith(".heic")) {
      safeUrl = safeUrl.replace(/\.heic$/i, ".jpg");
    }
    if (safeUrl.includes("cloudinary.com") || safeUrl.startsWith("http")) {
      return safeUrl;
    }
    return `https://wsrv.nl/?url=${safeUrl}`;
  };

  // ==========================================
  // CLOUDINARY UPLOADER
  // ==========================================
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.url;
      return null;
    } catch (error) {
      return null;
    }
  };

  const hapusFotoDiCloudinary = async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/cloudinary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (error) {}
  };

  // ==========================================
  // HANDLER HERO
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Header...");
    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusProses("Mengunggah gambar...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        if (newBg) {
          if (heroBgLama) await hapusFotoDiCloudinary(heroBgLama);
          imageUrl = newBg;
        }
      }
      await setDoc(doc(db, "pengaturan_web", "layanan_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });
      setHeroBgLama(imageUrl);
      setHeroBgList(null);
      setStatusProses("✅ Header berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan header.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLER MASTER SURAT
  // ==========================================
  const bukaModalMaster = (item: any = null) => {
    if (item) {
      setEditIdMaster(item.id);
      setFormMaster({
        nama_surat: item.nama_surat,
        keterangan: item.keterangan || "",
        syarat: item.syarat || ""
      });
    } else {
      setEditIdMaster(null);
      setFormMaster({
        nama_surat: "",
        keterangan: "",
        syarat: ""
      });
    }
    setIsModalMasterOpen(true);
  };

  const simpanMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Master Surat...");
    try {
      const payload = { ...formMaster };
      if (editIdMaster) {
        await updateDoc(doc(db, "master_surat", editIdMaster), payload);
      } else {
        await addDoc(collection(db, "master_surat"), payload);
      }
      setIsModalMasterOpen(false);
      ambilData();
      setStatusProses("✅ Jenis Surat berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan jenis surat.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusMaster = async (id: string) => {
    if (confirm("Hapus jenis surat ini?")) {
      await deleteDoc(doc(db, "master_surat", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER ANTREAN SURAT
  // ==========================================
  const bukaModalStatus = (item: any) => {
    setSelectedAntrean(item);
    setFormStatus({
      status: item.status || "Menunggu",
      keterangan_admin: item.keterangan_admin || ""
    });
    setIsModalStatusOpen(true);
  };

  const simpanStatusSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Mengupdate status surat...");
    try {
      await updateDoc(doc(db, "antrean_surat", selectedAntrean.id), {
        status: formStatus.status,
        keterangan_admin: formStatus.keterangan_admin,
        diupdate_oleh: userEmail,
        waktu_update: new Date().toISOString()
      });
      setIsModalStatusOpen(false);
      ambilData();
      setStatusProses("✅ Status Antrean berhasil diubah!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal mengubah status.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusAntrean = async (id: string) => {
    if (confirm("Yakin ingin menghapus antrean surat ini permanen?")) {
      await deleteDoc(doc(db, "antrean_surat", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER PENGADUAN
  // ==========================================
  const updateStatusPengaduan = async (id: string, statusBaru: string) => {
    try {
      await updateDoc(doc(db, "pengaduan_warga", id), {
        status: statusBaru
      });
      ambilData();
    } catch (error) {
      console.error("Gagal update pengaduan", error);
    }
  };

  const hapusPengaduan = async (id: string, fotoUrl: string) => {
    if (confirm("Hapus pengaduan ini permanen?")) {
      if (fotoUrl) await hapusFotoDiCloudinary(fotoUrl);
      await deleteDoc(doc(db, "pengaduan_warga", id));
      ambilData();
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* MENU SELALU TAMPIL */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Pengaturan Header
        </button>
        <button 
          onClick={() => setTabAktif("master")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "master" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📋</span> Daftar Jenis Surat
        </button>
        <button 
          onClick={() => setTabAktif("antrean")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "antrean" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>💌</span> Antrean Surat Warga
        </button>
        <button 
          onClick={() => setTabAktif("pengaduan")} 
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "pengaduan" ? "bg-red-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📢</span> Kotak Pengaduan
        </button>
      </div>

      {statusProses && (
        <div 
          className={`p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${
            statusProses.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {statusProses}
        </div>
      )}

      {/* ==========================================
          TAB 1: HEADER PUBLIK
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
          >
            <span>🖼️</span> Pengaturan Header Layanan Publik
          </h3>
          <form 
            onSubmit={handleSimpanHero} 
            className="space-y-6"
          >
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div 
                className="space-y-5"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2"
                  >
                    Judul Header
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2"
                  >
                    Teks Sub-Judul
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={heroSub} 
                    onChange={(e) => setHeroSub(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                  ></textarea>
                </div>
              </div>
              <div 
                className="space-y-4"
              >
                <label 
                  className="block text-sm font-bold mb-2"
                >
                  Gambar Background
                </label>
                {heroBgLama && (
                  <div 
                    className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200"
                  >
                    <img 
                      src={getSafeImageUrl(heroBgLama)} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <label 
                  className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm"
                >
                  <span 
                    className="text-3xl mb-2"
                  >
                    📸
                  </span>
                  <span 
                    className="font-bold text-yellow-800 text-sm"
                  >
                    Upload Background Baru
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setHeroBgList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoading ? "Menyimpan..." : "Simpan Header"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: MASTER JENIS SURAT
      ========================================== */}
      {tabAktif === "master" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>📋</span> Daftar Jenis Surat Tersedia
            </h3>
            <button 
              onClick={() => bukaModalMaster()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm"
            >
              + Tambah Jenis Surat
            </button>
          </div>

          <div 
            className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
          >
            <table 
              className="min-w-full text-sm text-left bg-white"
            >
              <thead 
                className="bg-gray-50 border-b border-gray-200"
              >
                <tr>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Nama Surat
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Persyaratan & Info
                  </th>
                  <th 
                    className="py-3 px-4 text-center font-bold text-gray-600 w-32"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataMaster.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={3} 
                      className="text-center py-8 text-gray-500 font-bold"
                    >
                      Belum ada master surat.
                    </td>
                  </tr>
                ) : (
                  dataMaster.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td 
                        className="py-3 px-4 font-black text-gray-900 align-top"
                      >
                        {item.nama_surat}
                      </td>
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <p 
                          className="text-xs text-gray-600 mb-1 leading-relaxed"
                        >
                          <span 
                            className="font-bold text-gray-800"
                          >
                            Deskripsi:
                          </span> {item.keterangan}
                        </p>
                        <p 
                          className="text-xs text-gray-600 leading-relaxed"
                        >
                          <span 
                            className="font-bold text-blue-700"
                          >
                            Syarat:
                          </span> {item.syarat}
                        </p>
                      </td>
                      <td 
                        className="py-3 px-4 text-center align-top"
                      >
                        <div 
                          className="flex flex-col gap-2 items-center"
                        >
                          <button 
                            onClick={() => bukaModalMaster(item)} 
                            className="w-[70px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusMaster(item.id)} 
                            className="w-[70px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: ANTREAN SURAT
      ========================================== */}
      {tabAktif === "antrean" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
          >
            <span>💌</span> Antrean Surat Masuk
          </h3>

          <div 
            className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
          >
            <table 
              className="min-w-full text-sm text-left bg-white"
            >
              <thead 
                className="bg-gray-50 border-b border-gray-200"
              >
                <tr>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600 w-32"
                  >
                    Waktu Masuk
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Identitas Pemohon
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Detail Surat
                  </th>
                  <th 
                    className="py-3 px-4 text-center font-bold text-gray-600 w-36"
                  >
                    Status & Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataAntrean.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={4} 
                      className="text-center py-8 text-gray-500 font-bold"
                    >
                      Tidak ada antrean surat saat ini.
                    </td>
                  </tr>
                ) : (
                  dataAntrean.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        item.status === "Menunggu" ? "bg-yellow-50/30" : ""
                      }`}
                    >
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <span 
                          className="text-[10px] font-bold text-gray-500"
                        >
                          {new Date(item.tanggal_pengajuan).toLocaleDateString("id-ID", {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <br/>
                        <span 
                          className="text-xs font-black text-gray-700"
                        >
                          {new Date(item.tanggal_pengajuan).toLocaleTimeString("id-ID", {
                            hour: '2-digit', minute: '2-digit'
                          })} WIB
                        </span>
                      </td>
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <h4 
                          className="font-black text-gray-900 text-sm uppercase mb-1"
                        >
                          {item.nama}
                        </h4>
                        <p 
                          className="text-xs font-mono text-blue-700 mb-1 bg-blue-50 inline-block px-1.5 rounded"
                        >
                          NIK: {item.nik}
                        </p>
                        <br/>
                        <a 
                          href={`https://wa.me/${item.no_wa}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-green-600 hover:underline"
                        >
                          📞 WA: {item.no_wa}
                        </a>
                      </td>
                      <td 
                        className="py-3 px-4 align-top"
                      >
                        <span 
                          className="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200 mb-1.5 inline-block"
                        >
                          {item.jenis_surat}
                        </span>
                        <p 
                          className="text-xs text-gray-600 line-clamp-2"
                        >
                          {item.keperluan}
                        </p>
                        {item.keterangan_admin && (
                          <p 
                            className="text-[10px] text-red-600 mt-2 bg-red-50 p-1.5 rounded border border-red-100 font-bold"
                          >
                            Catatan Admin: {item.keterangan_admin}
                          </p>
                        )}
                      </td>
                      <td 
                        className="py-3 px-4 align-top text-center"
                      >
                        <div 
                          className="flex flex-col gap-2 items-center"
                        >
                          <span 
                            className={`text-[10px] font-black uppercase w-[90px] py-1.5 rounded-lg border ${
                              item.status === "Selesai" ? "bg-green-100 text-green-800 border-green-300" :
                              item.status === "Ditolak" ? "bg-red-100 text-red-800 border-red-300" :
                              item.status === "Diproses" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }`}
                          >
                            {item.status}
                          </span>
                          <button 
                            onClick={() => bukaModalStatus(item)} 
                            className="w-[90px] bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition-colors"
                          >
                            Ubah Status
                          </button>
                          {/* PERBAIKAN: Tombol Hapus Permanen Dibuat Menjadi Button Merah */}
                          <button 
                            onClick={() => hapusAntrean(item.id)} 
                            className="w-[90px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors mt-1"
                          >
                            Hapus Permanen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: KOTAK PENGADUAN
      ========================================== */}
      {tabAktif === "pengaduan" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-red-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
          >
            <span>📢</span> Kotak Pengaduan Masyarakat
          </h3>

          <div 
            className="space-y-4"
          >
            {dataPengaduan.length === 0 ? (
              <div 
                className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <p 
                  className="text-gray-500 font-bold"
                >
                  Belum ada pengaduan yang masuk.
                </p>
              </div>
            ) : (
              dataPengaduan.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {item.status === "Belum Dibaca" && (
                    <div 
                      className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg shadow-sm"
                    >
                      BARU
                    </div>
                  )}
                  
                  <div 
                    className="flex flex-col md:flex-row gap-5"
                  >
                    {item.foto && (
                      <div 
                        className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                      >
                        <img 
                          src={getSafeImageUrl(item.foto)} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    
                    <div 
                      className="flex-1"
                    >
                      <div 
                        className="flex flex-col md:flex-row justify-between md:items-center mb-2 gap-2"
                      >
                        <div>
                          <h4 
                            className="font-black text-gray-900 text-lg uppercase"
                          >
                            {item.nama || "Hamba Allah (Anonim)"}
                          </h4>
                          <span 
                            className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                          >
                            {new Date(item.tanggal_masuk).toLocaleString("id-ID")}
                          </span>
                        </div>
                        {item.no_wa && (
                          <a 
                            href={`https://wa.me/${item.no_wa}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors shrink-0"
                          >
                            Hubungi via WA
                          </a>
                        )}
                      </div>
                      
                      <div 
                        className="bg-red-50/50 p-4 rounded-xl border border-red-100 mb-4"
                      >
                        <p 
                          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                        >
                          "{item.isi_laporan}"
                        </p>
                      </div>

                      <div 
                        className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"
                      >
                        <div 
                          className="flex items-center gap-2"
                        >
                          <span 
                            className="text-xs font-bold text-gray-500"
                          >
                            Status Laporan:
                          </span>
                          <select 
                            value={item.status || "Belum Dibaca"}
                            onChange={(e) => updateStatusPengaduan(item.id, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border ${
                              item.status === "Selesai" ? "bg-green-100 text-green-800 border-green-300" :
                              item.status === "Sedang Diproses" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              "bg-red-100 text-red-800 border-red-300"
                            }`}
                          >
                            <option value="Belum Dibaca">Belum Dibaca</option>
                            <option value="Sedang Diproses">Sedang Diproses</option>
                            <option value="Selesai">Selesai Ditindaklanjuti</option>
                          </select>
                        </div>

                        <button 
                          onClick={() => hapusPengaduan(item.id, item.foto)} 
                          className="text-xs bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                          Hapus Laporan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL MASTER SURAT
      ========================================== */}
      {isModalMasterOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border-t-8 border-blue-600"
          >
            <h3 
              className="text-2xl font-black mb-6"
            >
              {editIdMaster ? "Edit Jenis Surat" : "Tambah Jenis Surat"}
            </h3>
            <form 
              onSubmit={simpanMaster} 
              className="space-y-4"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Nama Surat
                </label>
                <input 
                  type="text" 
                  required 
                  value={formMaster.nama_surat} 
                  onChange={(e) => setFormMaster({...formMaster, nama_surat: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold" 
                  placeholder="Cth: SURAT KETERANGAN TIDAK MAMPU"
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea 
                  rows={2} 
                  value={formMaster.keterangan} 
                  onChange={(e) => setFormMaster({...formMaster, keterangan: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Penjelasan kegunaan surat ini..."
                ></textarea>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Persyaratan Dokumen
                </label>
                <textarea 
                  rows={3} 
                  value={formMaster.syarat} 
                  onChange={(e) => setFormMaster({...formMaster, syarat: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Cth: Fotokopi KK, KTP, dan Pengantar RT..."
                ></textarea>
              </div>
              
              <div 
                className="flex gap-4 mt-6"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalMasterOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL UBAH STATUS ANTREAN SURAT
      ========================================== */}
      {isModalStatusOpen && selectedAntrean && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border-t-8 border-gray-800"
          >
            <h3 
              className="text-2xl font-black mb-2 text-gray-900"
            >
              Update Status Surat
            </h3>
            <p 
              className="text-sm font-bold text-blue-600 mb-6"
            >
              {selectedAntrean.nama} - {selectedAntrean.jenis_surat}
            </p>

            <form 
              onSubmit={simpanStatusSurat} 
              className="space-y-4"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2"
                >
                  Pilih Status Baru
                </label>
                <select 
                  value={formStatus.status} 
                  onChange={(e) => setFormStatus({...formStatus, status: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-gray-800 font-black text-gray-700"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai (Siap Diambil)</option>
                  <option value="Ditolak">Ditolak / Syarat Kurang</option>
                </select>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-bold mb-2"
                >
                  Tinggalkan Pesan untuk Warga (Opsional)
                </label>
                <textarea 
                  rows={4} 
                  value={formStatus.keterangan_admin} 
                  onChange={(e) => setFormStatus({...formStatus, keterangan_admin: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-gray-800 text-sm leading-relaxed"
                  placeholder="Cth: Surat sudah jadi, silakan diambil di Balai Desa dengan membawa KK asli."
                ></textarea>
              </div>
              
              <div 
                className="flex gap-4 mt-6"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalStatusOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md"
                >
                  {isLoading ? "Menyimpan..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}