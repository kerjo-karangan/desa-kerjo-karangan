// src/components/dashboard/ProfilUmkm.tsx
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
  deleteDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface ProfilUmkmProps {
  activeSubMenu?: string;
}

export default function ProfilUmkm({ 
  activeSubMenu 
}: ProfilUmkmProps) {
  
  const defaultTab = activeSubMenu === "profil-teks" ? "teks"
                   : activeSubMenu === "profil-sotk" ? "sotk"
                   : activeSubMenu === "profil-lembaga" ? "lembaga"
                   : activeSubMenu === "profil-umkm" ? "umkm"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "profil-teks") setTabAktif("teks");
    else if (activeSubMenu === "profil-sotk") setTabAktif("sotk");
    else if (activeSubMenu === "profil-lembaga") setTabAktif("lembaga");
    else if (activeSubMenu === "profil-umkm") setTabAktif("umkm");
    else if (activeSubMenu === "profil-hero") setTabAktif("hero");
  }, [activeSubMenu]);

  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE: HERO PROFIL
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: TEKS SEJARAH & VISI MISI
  // ==========================================
  const [teksProfil, setTeksProfil] = useState({
    sejarah: "",
    visi: "",
    misi: ""
  });

  // ==========================================
  // STATE: DATA LIST (SOTK, LEMBAGA, UMKM)
  // ==========================================
  const [dataSotk, setDataSotk] = useState<any[]>([]);
  const [dataLembaga, setDataLembaga] = useState<any[]>([]);
  const [dataUmkm, setDataUmkm] = useState<any[]>([]);

  // ==========================================
  // STATE MODAL: SOTK
  // ==========================================
  const [isModalSotkOpen, setIsModalSotkOpen] = useState(false);
  const [editIdSotk, setEditIdSotk] = useState<string | null>(null);
  const [formSotk, setFormSotk] = useState({
    nama: "",
    jabatan: "",
    keterangan: ""
  });
  const [fotoSotk, setFotoSotk] = useState<FileList | null>(null);
  const [fotoSotkLama, setFotoSotkLama] = useState("");

  // ==========================================
  // STATE MODAL: LEMBAGA
  // ==========================================
  const [isModalLembagaOpen, setIsModalLembagaOpen] = useState(false);
  const [editIdLembaga, setEditIdLembaga] = useState<string | null>(null);
  const [formLembaga, setFormLembaga] = useState({
    nama_lembaga: "",
    ketua: "",
    deskripsi: ""
  });
  const [logoLembaga, setLogoLembaga] = useState<FileList | null>(null);
  const [logoLembagaLama, setLogoLembagaLama] = useState("");

  // ==========================================
  // STATE MODAL: UMKM
  // ==========================================
  const [isModalUmkmOpen, setIsModalUmkmOpen] = useState(false);
  const [editIdUmkm, setEditIdUmkm] = useState<string | null>(null);
  const [formUmkm, setFormUmkm] = useState({
    nama_toko: "",
    pemilik: "",
    kategori: "",
    deskripsi_produk: "",
    alamat: "",
    jam_operasional: "",
    no_wa: ""
  });
  const [fotoUmkm, setFotoUmkm] = useState<FileList | null>(null);
  const [fotoUmkmLama, setFotoUmkmLama] = useState("");

  // ==========================================
  // FUNGSI FETCH DATA
  // ==========================================
  const ambilData = async () => {
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "profil_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      const snapTeks = await getDoc(doc(db, "pengaturan_web", "profil_teks"));
      if (snapTeks.exists() && snapTeks.data()) {
        setTeksProfil({
          sejarah: snapTeks.data().sejarah || "",
          visi: snapTeks.data().visi || "",
          misi: snapTeks.data().misi || ""
        });
      }

      const snapSotk = await getDocs(collection(db, "profil_sotk"));
      setDataSotk(snapSotk.docs.map(d => ({ id: d.id, ...d.data() })));

      const snapLembaga = await getDocs(collection(db, "profil_lembaga"));
      setDataLembaga(snapLembaga.docs.map(d => ({ id: d.id, ...d.data() })));

      const snapUmkm = await getDocs(collection(db, "katalog_umkm"));
      setDataUmkm(snapUmkm.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // CLOUDINARY UPLOADER
  // ==========================================
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary", { 
        method: "POST", 
        body: formData 
      });
      const data = await res.json();
      if (data.success) return data.url;
      throw new Error(data.error);
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
  // HANDLERS (HERO & TEKS)
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Header Profil...");

    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusProses("Mengunggah Background...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        if (newBg) {
          if (heroBgLama) await hapusFotoDiCloudinary(heroBgLama);
          imageUrl = newBg;
        }
      }

      await setDoc(doc(db, "pengaturan_web", "profil_hero"), {
        judul: heroJudul,
        sub: heroSub,
        bg: imageUrl,
        terakhir_diperbarui: new Date().toISOString()
      });

      setHeroBgLama(imageUrl);
      setHeroBgList(null);
      setStatusProses("✅ Header Profil berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 4000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan header.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpanTeks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Teks Sejarah & Visi Misi...");

    try {
      await setDoc(doc(db, "pengaturan_web", "profil_teks"), {
        ...teksProfil,
        terakhir_diperbarui: new Date().toISOString()
      });
      setStatusProses("✅ Teks berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 4000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan teks.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLERS MODAL SOTK
  // ==========================================
  const bukaModalSotk = (item: any = null) => {
    if (item) {
      setEditIdSotk(item.id);
      setFormSotk({ nama: item.nama, jabatan: item.jabatan, keterangan: item.keterangan || "" });
      setFotoSotkLama(item.foto || "");
    } else {
      setEditIdSotk(null);
      setFormSotk({ nama: "", jabatan: "", keterangan: "" });
      setFotoSotkLama("");
    }
    setFotoSotk(null);
    setIsModalSotkOpen(true);
  };

  const simpanSotk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Data Aparatur...");
    try {
      let imageUrl = fotoSotkLama;
      if (fotoSotk && fotoSotk.length > 0) {
        const newImg = await uploadFotoKeCloudinary(fotoSotk[0]);
        if (newImg) {
          if (fotoSotkLama) await hapusFotoDiCloudinary(fotoSotkLama);
          imageUrl = newImg;
        }
      }

      const payload = { ...formSotk, foto: imageUrl };

      if (editIdSotk) {
        await updateDoc(doc(db, "profil_sotk", editIdSotk), payload);
      } else {
        await addDoc(collection(db, "profil_sotk"), payload);
      }

      setIsModalSotkOpen(false);
      ambilData();
      setStatusProses("");
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan SOTK.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusSotk = async (id: string, urlFoto: string) => {
    if (confirm("Hapus Aparatur ini?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "profil_sotk", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLERS MODAL LEMBAGA
  // ==========================================
  const bukaModalLembaga = (item: any = null) => {
    if (item) {
      setEditIdLembaga(item.id);
      setFormLembaga({ nama_lembaga: item.nama_lembaga, ketua: item.ketua, deskripsi: item.deskripsi || "" });
      setLogoLembagaLama(item.logo || "");
    } else {
      setEditIdLembaga(null);
      setFormLembaga({ nama_lembaga: "", ketua: "", deskripsi: "" });
      setLogoLembagaLama("");
    }
    setLogoLembaga(null);
    setIsModalLembagaOpen(true);
  };

  const simpanLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Data Lembaga...");
    try {
      let imageUrl = logoLembagaLama;
      if (logoLembaga && logoLembaga.length > 0) {
        const newImg = await uploadFotoKeCloudinary(logoLembaga[0]);
        if (newImg) {
          if (logoLembagaLama) await hapusFotoDiCloudinary(logoLembagaLama);
          imageUrl = newImg;
        }
      }

      const payload = { ...formLembaga, logo: imageUrl };

      if (editIdLembaga) {
        await updateDoc(doc(db, "profil_lembaga", editIdLembaga), payload);
      } else {
        await addDoc(collection(db, "profil_lembaga"), payload);
      }

      setIsModalLembagaOpen(false);
      ambilData();
      setStatusProses("");
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan Lembaga.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusLembaga = async (id: string, urlLogo: string) => {
    if (confirm("Hapus Lembaga ini?")) {
      if (urlLogo) await hapusFotoDiCloudinary(urlLogo);
      await deleteDoc(doc(db, "profil_lembaga", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLERS MODAL UMKM
  // ==========================================
  const bukaModalUmkm = (item: any = null) => {
    if (item) {
      setEditIdUmkm(item.id);
      setFormUmkm({ 
        nama_toko: item.nama_toko, 
        pemilik: item.pemilik, 
        kategori: item.kategori,
        deskripsi_produk: item.deskripsi_produk,
        alamat: item.alamat,
        jam_operasional: item.jam_operasional || "",
        no_wa: item.no_wa
      });
      setFotoUmkmLama(item.foto_produk || "");
    } else {
      setEditIdUmkm(null);
      setFormUmkm({ 
        nama_toko: "", pemilik: "", kategori: "", deskripsi_produk: "", alamat: "", jam_operasional: "", no_wa: "" 
      });
      setFotoUmkmLama("");
    }
    setFotoUmkm(null);
    setIsModalUmkmOpen(true);
  };

  const simpanUmkm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Katalog UMKM...");
    try {
      let imageUrl = fotoUmkmLama;
      if (fotoUmkm && fotoUmkm.length > 0) {
        const newImg = await uploadFotoKeCloudinary(fotoUmkm[0]);
        if (newImg) {
          if (fotoUmkmLama) await hapusFotoDiCloudinary(fotoUmkmLama);
          imageUrl = newImg;
        }
      }

      const payload = { ...formUmkm, foto_produk: imageUrl };

      if (editIdUmkm) {
        await updateDoc(doc(db, "katalog_umkm", editIdUmkm), payload);
      } else {
        await addDoc(collection(db, "katalog_umkm"), payload);
      }

      setIsModalUmkmOpen(false);
      ambilData();
      setStatusProses("");
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan UMKM.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusUmkm = async (id: string, urlFoto: string) => {
    if (confirm("Hapus Katalog UMKM ini?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "katalog_umkm", id));
      ambilData();
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* 
        PERBAIKAN: Tombol Tab ini sekarang SELALU TAMPIL di panel Admin, 
        sehingga memudahkan navigasi dan tidak membingungkan.
      */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Header Profil
        </button>
        <button 
          onClick={() => setTabAktif("teks")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "teks" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📖</span> Sejarah & Visi
        </button>
        <button 
          onClick={() => setTabAktif("sotk")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "sotk" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🏛️</span> Aparatur (SOTK)
        </button>
        <button 
          onClick={() => setTabAktif("lembaga")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "lembaga" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🤝</span> Lembaga Desa
        </button>
        <button 
          onClick={() => setTabAktif("umkm")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "umkm" ? "bg-red-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🛍️</span> Katalog UMKM
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
          TAB 1: HEADER PROFIL (DENGAN EDIT TEKS)
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span>🖼️</span> Pengaturan Header Profil Desa (Cloudinary)
          </h3>
          <p 
            className="text-gray-500 text-sm mb-8"
          >
            Sesuaikan teks sambutan dan gambar background di halaman Profil Publik.
          </p>
          
          <form 
            onSubmit={handleSimpanHero} 
            className="space-y-6"
          >
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              
              <div 
                className="space-y-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-800"
                  >
                    Judul Utama Header
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold text-lg"
                    placeholder="Contoh: Profil Desa Kerjo"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-800"
                  >
                    Teks Sub-Judul (Deskripsi Singkat)
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={heroSub} 
                    onChange={(e) => setHeroSub(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                    placeholder="Mengenal lebih dekat sejarah, visi misi..."
                  ></textarea>
                </div>
              </div>

              <div 
                className="space-y-4"
              >
                <label 
                  className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2"
                >
                  Gambar Background Profil
                </label>
                {heroBgLama && (
                  <div 
                    className="relative w-full h-40 md:h-48 rounded-xl overflow-hidden shadow-inner border border-gray-200 group"
                  >
                    <img 
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                      alt="Hero Profil"
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
                    {heroBgLama ? "Ganti Gambar Baru" : "Upload Background"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setHeroBgList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
                {heroBgList && (
                  <div 
                    className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    ✅ Gambar siap diunggah.
                  </div>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg mt-4"
            >
              {isLoading ? "Menyimpan..." : "Simpan Header Profil"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: SEJARAH & VISI MISI
      ========================================== */}
      {tabAktif === "teks" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
          >
            <span>📖</span> Pengaturan Teks Sejarah & Visi Misi
          </h3>
          <form 
            onSubmit={handleSimpanTeks} 
            className="space-y-6"
          >
            <div>
              <label 
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Sejarah Desa
              </label>
              <textarea 
                required 
                rows={8} 
                value={teksProfil.sejarah} 
                onChange={(e) => setTeksProfil({...teksProfil, sejarah: e.target.value})} 
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
              ></textarea>
            </div>
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-800"
                >
                  Visi Desa
                </label>
                <textarea 
                  required 
                  rows={5} 
                  value={teksProfil.visi} 
                  onChange={(e) => setTeksProfil({...teksProfil, visi: e.target.value})} 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                ></textarea>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-800"
                >
                  Misi Desa
                </label>
                <textarea 
                  required 
                  rows={5} 
                  value={teksProfil.misi} 
                  onChange={(e) => setTeksProfil({...teksProfil, misi: e.target.value})} 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed"
                ></textarea>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoading ? "Menyimpan..." : "Simpan Teks Profil"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 3: APARATUR / SOTK
      ========================================== */}
      {tabAktif === "sotk" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-600 animate-fade-in"
        >
          <div 
            className="flex justify-between items-center mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>🏛️</span> Aparatur (SOTK)
            </h3>
            <button 
              onClick={() => bukaModalSotk()} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
            >
              + Tambah Aparatur
            </button>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {dataSotk.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-2xl p-5 flex items-center gap-4 bg-gray-50 hover:shadow-md transition-all"
              >
                <div 
                  className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-purple-100 flex-shrink-0"
                >
                  {item.foto ? (
                    <img 
                      src={item.foto.startsWith("http") ? item.foto : `https://wsrv.nl/?url=${item.foto}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-400 text-2xl"
                    >
                      👤
                    </div>
                  )}
                </div>
                <div 
                  className="flex-1"
                >
                  <h4 
                    className="font-bold text-gray-900 line-clamp-1"
                  >
                    {item.nama}
                  </h4>
                  <p 
                    className="text-xs text-purple-600 font-bold bg-purple-100 inline-block px-2 py-0.5 rounded mt-1 mb-2"
                  >
                    {item.jabatan}
                  </p>
                  <div 
                    className="flex gap-2"
                  >
                    <button 
                      onClick={() => bukaModalSotk(item)} 
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => hapusSotk(item.id, item.foto)} 
                      className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: LEMBAGA DESA
      ========================================== */}
      {tabAktif === "lembaga" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <div 
            className="flex justify-between items-center mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>🤝</span> Lembaga Desa
            </h3>
            <button 
              onClick={() => bukaModalLembaga()} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
            >
              + Tambah Lembaga
            </button>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {dataLembaga.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-2xl p-5 flex gap-4 bg-gray-50 hover:shadow-md transition-all"
              >
                <div 
                  className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 p-2"
                >
                  {item.logo ? (
                    <img 
                      src={item.logo.startsWith("http") ? item.logo : `https://wsrv.nl/?url=${item.logo}`} 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-400 text-3xl"
                    >
                      🏛️
                    </div>
                  )}
                </div>
                <div 
                  className="flex-1"
                >
                  <h4 
                    className="font-bold text-gray-900"
                  >
                    {item.nama_lembaga}
                  </h4>
                  <p 
                    className="text-xs text-gray-600 font-medium mb-3 line-clamp-2"
                  >
                    <span 
                      className="font-bold"
                    >
                      Ketua:
                    </span> {item.ketua}
                  </p>
                  <div 
                    className="flex gap-2"
                  >
                    <button 
                      onClick={() => bukaModalLembaga(item)} 
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-4 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => hapusLembaga(item.id, item.logo)} 
                      className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-4 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: KATALOG UMKM
      ========================================== */}
      {tabAktif === "umkm" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-red-500 animate-fade-in"
        >
          <div 
            className="flex justify-between items-center mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2"
            >
              <span>🛍️</span> Katalog UMKM
            </h3>
            <button 
              onClick={() => bukaModalUmkm()} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
            >
              + Tambah UMKM
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
                    Toko / Pemilik
                  </th>
                  <th 
                    className="py-3 px-4 font-bold text-gray-600"
                  >
                    Kategori & Deskripsi
                  </th>
                  {/* PERBAIKAN: Lebar Kolom Jam Operasional ditambah & gunakan pre-wrap di <tbody> */}
                  <th 
                    className="py-3 px-4 font-bold text-gray-600 min-w-[200px]"
                  >
                    Info Kontak & Jam Operasional
                  </th>
                  <th 
                    className="py-3 px-4 text-center font-bold text-gray-600"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataUmkm.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td 
                      className="py-3 px-4 align-top"
                    >
                      <div 
                        className="flex items-center gap-3"
                      >
                        <div 
                          className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                        >
                          {item.foto_produk ? (
                            <img 
                              src={item.foto_produk.startsWith("http") ? item.foto_produk : `https://wsrv.nl/?url=${item.foto_produk}`} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-gray-400"
                            >
                              🏪
                            </div>
                          )}
                        </div>
                        <div>
                          <p 
                            className="font-black text-gray-900"
                          >
                            {item.nama_toko}
                          </p>
                          <p 
                            className="text-xs text-gray-500 font-bold"
                          >
                            Bpk/Ibu {item.pemilik}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="py-3 px-4 align-top"
                    >
                      <span 
                        className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 mb-1 inline-block"
                      >
                        {item.kategori}
                      </span>
                      <p 
                        className="text-xs text-gray-600 line-clamp-2"
                      >
                        {item.deskripsi_produk}
                      </p>
                    </td>
                    <td 
                      className="py-3 px-4 align-top"
                    >
                      <div 
                        className="text-xs text-gray-600"
                      >
                        <p 
                          className="mb-1"
                        >
                          <span 
                            className="font-bold text-green-700"
                          >
                            WA:
                          </span> {item.no_wa}
                        </p>
                        <p 
                          className="mb-1 line-clamp-1"
                        >
                          <span 
                            className="font-bold"
                          >
                            Alamat:
                          </span> {item.alamat}
                        </p>
                        {/* PERBAIKAN: Menggunakan whitespace-pre-wrap agar text format baris baru terbaca */}
                        <div 
                          className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-100 whitespace-pre-wrap font-mono text-[11px] text-gray-700"
                        >
                          {item.jam_operasional}
                        </div>
                      </div>
                    </td>
                    <td 
                      className="py-3 px-4 align-top text-center"
                    >
                      <div 
                        className="flex flex-col gap-2 items-center"
                      >
                        <button 
                          onClick={() => bukaModalUmkm(item)} 
                          className="w-[70px] bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold px-2 py-1.5 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => hapusUmkm(item.id, item.foto_produk)} 
                          className="w-[70px] bg-red-100 text-red-600 hover:bg-red-200 text-[11px] font-bold px-2 py-1.5 rounded transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL SOTK
      ========================================== */}
      {isModalSotkOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8"
          >
            <h3 
              className="text-2xl font-black mb-6"
            >
              {editIdSotk ? "Edit Aparatur" : "Tambah Aparatur"}
            </h3>
            <form 
              onSubmit={simpanSotk} 
              className="space-y-4"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  required 
                  value={formSotk.nama} 
                  onChange={(e) => setFormSotk({...formSotk, nama: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Jabatan
                </label>
                <input 
                  type="text" 
                  required 
                  value={formSotk.jabatan} 
                  onChange={(e) => setFormSotk({...formSotk, jabatan: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Keterangan Singkat
                </label>
                <input 
                  type="text" 
                  value={formSotk.keterangan} 
                  onChange={(e) => setFormSotk({...formSotk, keterangan: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Foto Pegawai
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFotoSotk(e.target.files)} 
                  className="w-full p-3 rounded-xl border bg-gray-50" 
                />
                {fotoSotkLama && (
                  <p 
                    className="text-xs text-blue-600 mt-1 font-bold"
                  >
                    Foto sudah ada, biarkan kosong jika tidak ingin mengganti.
                  </p>
                )}
              </div>
              <div 
                className="flex gap-4 mt-6"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalSotkOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL LEMBAGA
      ========================================== */}
      {isModalLembagaOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8"
          >
            <h3 
              className="text-2xl font-black mb-6"
            >
              {editIdLembaga ? "Edit Lembaga" : "Tambah Lembaga"}
            </h3>
            <form 
              onSubmit={simpanLembaga} 
              className="space-y-4"
            >
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Nama Lembaga
                </label>
                <input 
                  type="text" 
                  required 
                  value={formLembaga.nama_lembaga} 
                  onChange={(e) => setFormLembaga({...formLembaga, nama_lembaga: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Nama Ketua
                </label>
                <input 
                  type="text" 
                  required 
                  value={formLembaga.ketua} 
                  onChange={(e) => setFormLembaga({...formLembaga, ketua: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Deskripsi / Tugas
                </label>
                <textarea 
                  rows={3} 
                  value={formLembaga.deskripsi} 
                  onChange={(e) => setFormLembaga({...formLembaga, deskripsi: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none"
                ></textarea>
              </div>
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Logo Lembaga
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setLogoLembaga(e.target.files)} 
                  className="w-full p-3 rounded-xl border bg-gray-50" 
                />
                {logoLembagaLama && (
                  <p 
                    className="text-xs text-blue-600 mt-1 font-bold"
                  >
                    Logo sudah ada, biarkan kosong jika tidak ingin mengganti.
                  </p>
                )}
              </div>
              <div 
                className="flex gap-4 mt-6"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalLembagaOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL UMKM (PERBAIKAN TEXTAREA JAM OPERASIONAL)
      ========================================== */}
      {isModalUmkmOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8"
          >
            <h3 
              className="text-2xl font-black mb-6"
            >
              {editIdUmkm ? "Edit Katalog UMKM" : "Tambah Katalog UMKM"}
            </h3>
            <form 
              onSubmit={simpanUmkm} 
              className="space-y-4"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-1"
                  >
                    Nama Toko / Usaha
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formUmkm.nama_toko} 
                    onChange={(e) => setFormUmkm({...formUmkm, nama_toko: e.target.value})} 
                    className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-1"
                  >
                    Nama Pemilik
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formUmkm.pemilik} 
                    onChange={(e) => setFormUmkm({...formUmkm, pemilik: e.target.value})} 
                    className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                  />
                </div>
              </div>
              
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-1"
                  >
                    Kategori (Cth: Kuliner)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formUmkm.kategori} 
                    onChange={(e) => setFormUmkm({...formUmkm, kategori: e.target.value})} 
                    className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-1"
                  >
                    Nomor WhatsApp
                  </label>
                  <input 
                    type="number" 
                    value={formUmkm.no_wa} 
                    onChange={(e) => setFormUmkm({...formUmkm, no_wa: e.target.value})} 
                    placeholder="62812..."
                    className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono" 
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Deskripsi Produk
                </label>
                <textarea 
                  rows={2} 
                  required 
                  value={formUmkm.deskripsi_produk} 
                  onChange={(e) => setFormUmkm({...formUmkm, deskripsi_produk: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none"
                ></textarea>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Alamat Lengkap
                </label>
                <input 
                  type="text" 
                  required 
                  value={formUmkm.alamat} 
                  onChange={(e) => setFormUmkm({...formUmkm, alamat: e.target.value})} 
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none" 
                />
              </div>

              <div>
                {/* PERBAIKAN: Menggunakan TEXTAREA agar bisa tekan 'Enter' (Multibaris) */}
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Hari & Jam Operasional
                </label>
                <textarea 
                  rows={2} 
                  value={formUmkm.jam_operasional} 
                  onChange={(e) => setFormUmkm({...formUmkm, jam_operasional: e.target.value})} 
                  placeholder="Baris 1: Senin - Sabtu&#10;Baris 2: 08:00 - 17:00"
                  className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono text-sm leading-relaxed"
                ></textarea>
                <p 
                  className="text-[10px] text-gray-500 mt-1 font-bold"
                >
                  Tekan 'Enter' untuk memisahkan Hari dan Jam agar tidak terpotong saat ditampilkan di layar laptop.
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-1"
                >
                  Foto Produk Utama
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFotoUmkm(e.target.files)} 
                  className="w-full p-3 rounded-xl border bg-gray-50" 
                />
                {fotoUmkmLama && (
                  <p 
                    className="text-xs text-blue-600 mt-1 font-bold"
                  >
                    Foto sudah ada, biarkan kosong jika tidak ingin mengganti.
                  </p>
                )}
              </div>

              <div 
                className="flex gap-4 mt-6 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalUmkmOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
                >
                  {isLoading ? "Menyimpan..." : "Simpan UMKM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}