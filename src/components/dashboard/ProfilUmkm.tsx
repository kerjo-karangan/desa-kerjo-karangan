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
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // STATE: HERO PROFIL
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgLama, setHeroBgLama] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: TEKS PROFIL (profil_desa -> utama)
  // ==========================================
  const [teksProfil, setTeksProfil] = useState({
    sejarah: "",
    visi_misi: ""
  });

  // ==========================================
  // STATE: APARATUR DESA (aparatur_desa)
  // ==========================================
  const [dataAparatur, setDataAparatur] = useState<any[]>([]);
  const [isModalSotkOpen, setIsModalSotkOpen] = useState(false);
  const [editIdSotk, setEditIdSotk] = useState<string | null>(null);
  const [formSotk, setFormSotk] = useState({
    nama: "",
    jabatan: "",
    urutan: 1,
    jalurAtas: "",
    jenisGaris: "Instruksi"
  });
  const [fotoSotk, setFotoSotk] = useState("");

  // ==========================================
  // STATE: LEMBAGA DESA (lembaga_desa)
  // ==========================================
  const [dataLembaga, setDataLembaga] = useState<any[]>([]);
  const [selectedLembagaEdit, setSelectedLembagaEdit] = useState<any | null>(null);
  const [isModalLembagaOpen, setIsModalLembagaOpen] = useState(false);
  const [editIdLembaga, setEditIdLembaga] = useState<string | null>(null);
  const [formLembaga, setFormLembaga] = useState({
    nama: "",
    singkatan: "",
    deskripsi: "",
    foto: ""
  });

  // State khusus sub-menu Kelola Anggota Lembaga
  const [isModalAnggotaOpen, setIsModalAnggotaOpen] = useState(false);
  const [editIndexAnggota, setEditIndexAnggota] = useState<number | null>(null);
  const [formAnggota, setFormAnggota] = useState({
    nama: "",
    jabatan: "",
    foto: "",
    jalurAtas: "",
    jenisGaris: "Instruksi"
  });

  // ==========================================
  // STATE: POTENSI / UMKM (potensi_desa)
  // ==========================================
  const [dataPotensi, setDataPotensi] = useState<any[]>([]);
  const [isModalPotensiOpen, setIsModalPotensiOpen] = useState(false);
  const [editIdPotensi, setEditIdPotensi] = useState<string | null>(null);
  const [formPotensi, setFormPotensi] = useState({
    nama_produk: "",
    pemilik: "",
    kategori: "",
    deskripsi: "",
    harga_mulai: 0,
    harga_sampai: 0,
    wa: "",
    link_maps: "",
    gambar: [] as string[]
  });
  
  // Format jam operasional per hari
  const defaultJamOp = {
    Senin: { buka: "08:00", tutup: "16:00", libur: false },
    Selasa: { buka: "08:00", tutup: "16:00", libur: false },
    Rabu: { buka: "08:00", tutup: "16:00", libur: false },
    Kamis: { buka: "08:00", tutup: "16:00", libur: false },
    Jumat: { buka: "08:00", tutup: "16:00", libur: false },
    Sabtu: { buka: "08:00", tutup: "16:00", libur: false },
    Minggu: { buka: "08:00", tutup: "16:00", libur: true },
  };
  const [jamOperasional, setJamOperasional] = useState<any>(defaultJamOp);

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

      // Fetch Sejarah & Visi Misi
      const snapTeks = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapTeks.exists() && snapTeks.data()) {
        setTeksProfil({
          sejarah: snapTeks.data().sejarah || "",
          visi_misi: snapTeks.data().visi_misi || ""
        });
      }

      // Fetch Aparatur SOTK
      const snapAparatur = await getDocs(collection(db, "aparatur_desa"));
      setDataAparatur(snapAparatur.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Lembaga Desa
      const snapLembaga = await getDocs(collection(db, "lembaga_desa"));
      setDataLembaga(snapLembaga.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Potensi & UMKM
      const snapPotensi = await getDocs(collection(db, "potensi_desa"));
      setDataPotensi(snapPotensi.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data profil:", error);
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
  // CLOUDINARY UPLOADER & DELETER
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
  // HANDLER: HERO & TEKS PROFIL
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Header Profil...");

    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusProses("Mengunggah background...");
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
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan header.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpanTeks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Sejarah & Visi Misi...");

    try {
      await setDoc(doc(db, "profil_desa", "utama"), {
        sejarah: teksProfil.sejarah,
        visi_misi: teksProfil.visi_misi,
        terakhir_diperbarui: new Date().toISOString()
      });
      setStatusProses("✅ Sejarah & Visi Misi berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan teks.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLER: SOTK (aparatur_desa)
  // ==========================================
  const bukaModalSotk = (item: any = null) => {
    if (item) {
      setEditIdSotk(item.id);
      setFormSotk({
        nama: item.nama || "",
        jabatan: item.jabatan || "",
        urutan: item.urutan || 1,
        jalurAtas: item.jalurAtas || "",
        jenisGaris: item.jenisGaris || "Instruksi"
      });
      setFotoSotk(item.foto || "");
    } else {
      setEditIdSotk(null);
      setFormSotk({
        nama: "",
        jabatan: "",
        urutan: dataAparatur.length + 1,
        jalurAtas: "",
        jenisGaris: "Instruksi"
      });
      setFotoSotk("");
    }
    setIsModalSotkOpen(true);
  };

  const handleUploadFotoSotk = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFotoKeCloudinary(file);
    if (url) {
      if (fotoSotk) await hapusFotoDiCloudinary(fotoSotk);
      setFotoSotk(url);
    }
    setIsUploading(false);
  };

  const simpanSotk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Aparatur...");
    try {
      const payload = {
        ...formSotk,
        foto: fotoSotk,
        urutan: Number(formSotk.urutan)
      };

      if (editIdSotk) {
        await updateDoc(doc(db, "aparatur_desa", editIdSotk), payload);
      } else {
        await addDoc(collection(db, "aparatur_desa"), payload);
      }

      setIsModalSotkOpen(false);
      ambilData();
      setStatusProses("✅ Aparatur berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan aparatur.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusSotk = async (id: string, urlFoto: string) => {
    if (confirm("Hapus aparatur ini permanen?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "aparatur_desa", id));
      ambilData();
    }
  };

  // ==========================================
  // HANDLER: LEMBAGA DESA (lembaga_desa)
  // ==========================================
  const bukaModalLembaga = (item: any = null) => {
    if (item) {
      setEditIdLembaga(item.id);
      setFormLembaga({
        nama: item.nama || item.nama_lembaga || "",
        singkatan: item.singkatan || "",
        deskripsi: item.deskripsi || "",
        foto: item.foto || ""
      });
    } else {
      setEditIdLembaga(null);
      setFormLembaga({
        nama: "",
        singkatan: "",
        deskripsi: "",
        foto: ""
      });
    }
    setIsModalLembagaOpen(true);
  };

  const handleUploadFotoLembaga = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFotoKeCloudinary(file);
    if (url) {
      if (formLembaga.foto) await hapusFotoDiCloudinary(formLembaga.foto);
      setFormLembaga(prev => ({ ...prev, foto: url }));
    }
    setIsUploading(false);
  };

  const simpanLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Lembaga...");
    try {
      const payload = { ...formLembaga };
      if (editIdLembaga) {
        await updateDoc(doc(db, "lembaga_desa", editIdLembaga), payload);
      } else {
        await addDoc(collection(db, "lembaga_desa"), {
          ...payload,
          anggota_sotk: []
        });
      }
      setIsModalLembagaOpen(false);
      ambilData();
      setStatusProses("✅ Lembaga berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan lembaga.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusLembaga = async (id: string, urlFoto: string) => {
    if (confirm("Hapus lembaga ini beserta anggotanya?")) {
      if (urlFoto) await hapusFotoDiCloudinary(urlFoto);
      await deleteDoc(doc(db, "lembaga_desa", id));
      ambilData();
    }
  };

  // Handler Keanggotaan di dalam Lembaga (Memiliki Jalur Atas layaknya SOTK)
  const bukaModalAnggota = (anggota: any = null, index: number | null = null) => {
    if (anggota && index !== null) {
      setEditIndexAnggota(index);
      setFormAnggota({
        nama: anggota.nama || "",
        jabatan: anggota.jabatan || "",
        foto: anggota.foto || "",
        jalurAtas: anggota.jalurAtas || "",
        jenisGaris: anggota.jenisGaris || "Instruksi"
      });
    } else {
      setEditIndexAnggota(null);
      setFormAnggota({
        nama: "",
        jabatan: "",
        foto: "",
        jalurAtas: "",
        jenisGaris: "Instruksi"
      });
    }
    setIsModalAnggotaOpen(true);
  };

  const handleUploadFotoAnggota = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFotoKeCloudinary(file);
    if (url) {
      if (formAnggota.foto) await hapusFotoDiCloudinary(formAnggota.foto);
      setFormAnggota(prev => ({ ...prev, foto: url }));
    }
    setIsUploading(false);
  };

  const simpanAnggotaLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLembagaEdit) return;
    setIsLoading(true);

    try {
      let currentList = selectedLembagaEdit.anggota_sotk || selectedLembagaEdit.anggota || [];
      
      if (editIndexAnggota !== null) {
        // Mengamankan ID bawaan agar tidak tertimpa saat diedit
        const oldId = currentList[editIndexAnggota].id;
        currentList[editIndexAnggota] = { ...formAnggota, id: oldId };
      } else {
        currentList.push({
          ...formAnggota,
          id: Math.random().toString(36).substring(2, 10)
        });
      }

      await updateDoc(doc(db, "lembaga_desa", selectedLembagaEdit.id), {
        anggota_sotk: currentList
      });

      // Update state lokal seketika
      const updated = { ...selectedLembagaEdit, anggota_sotk: currentList };
      setSelectedLembagaEdit(updated);
      setIsModalAnggotaOpen(false);
      ambilData();
      setStatusProses("✅ Anggota lembaga diperbarui!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan anggota.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusAnggotaLembaga = async (indexToRemove: number) => {
    if (!confirm("Hapus anggota ini?")) return;
    try {
      const currentList = selectedLembagaEdit.anggota_sotk || selectedLembagaEdit.anggota || [];
      const target = currentList[indexToRemove];
      if (target?.foto) await hapusFotoDiCloudinary(target.foto);

      const newList = currentList.filter((_: any, idx: number) => idx !== indexToRemove);

      await updateDoc(doc(db, "lembaga_desa", selectedLembagaEdit.id), {
        anggota_sotk: newList
      });

      const updated = { ...selectedLembagaEdit, anggota_sotk: newList };
      setSelectedLembagaEdit(updated);
      ambilData();
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // HANDLER: POTENSI / UMKM (potensi_desa)
  // ==========================================
  const bukaModalPotensi = (item: any = null) => {
    if (item) {
      setEditIdPotensi(item.id);
      setFormPotensi({
        nama_produk: item.nama_produk || "",
        pemilik: item.pemilik || "",
        kategori: item.kategori || "",
        deskripsi: item.deskripsi || "",
        harga_mulai: item.harga_mulai || 0,
        harga_sampai: item.harga_sampai || 0,
        wa: item.wa || "",
        link_maps: item.link_maps || "",
        gambar: Array.isArray(item.gambar) ? item.gambar : (item.foto ? [item.foto] : [])
      });
      setJamOperasional(item.jam_operasional || defaultJamOp);
    } else {
      setEditIdPotensi(null);
      setFormPotensi({
        nama_produk: "",
        pemilik: "",
        kategori: "",
        deskripsi: "",
        harga_mulai: 0,
        harga_sampai: 0,
        wa: "",
        link_maps: "",
        gambar: []
      });
      setJamOperasional(defaultJamOp);
    }
    setIsModalPotensiOpen(true);
  };

  const handleUploadMultiPotensi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFotoKeCloudinary(files[i]);
        if (url) newUrls.push(url);
      }
      setFormPotensi(prev => ({
        ...prev,
        gambar: [...prev.gambar, ...newUrls]
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleHapusSatuPotensiFoto = async (urlHapus: string, indexToRemove: number) => {
    if (!confirm("Hapus foto ini?")) return;
    const filtered = formPotensi.gambar.filter((_, idx) => idx !== indexToRemove);
    setFormPotensi(prev => ({ ...prev, gambar: filtered }));
    await hapusFotoDiCloudinary(urlHapus);
  };

  const simpanPotensi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan Potensi UMKM...");
    try {
      const payload = {
        ...formPotensi,
        harga_mulai: Number(formPotensi.harga_mulai),
        harga_sampai: Number(formPotensi.harga_sampai),
        jam_operasional: jamOperasional,
        tanggal_input: new Date().toISOString()
      };

      if (editIdPotensi) {
        await updateDoc(doc(db, "potensi_desa", editIdPotensi), payload);
      } else {
        await addDoc(collection(db, "potensi_desa"), payload);
      }

      setIsModalPotensiOpen(false);
      ambilData();
      setStatusProses("✅ Potensi UMKM berhasil disimpan!");
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan UMKM.");
    } finally {
      setIsLoading(false);
    }
  };

  const hapusPotensi = async (id: string, arrayFoto: string[] | string) => {
    if (confirm("Hapus UMKM ini permanen?")) {
      if (Array.isArray(arrayFoto)) {
        for (const u of arrayFoto) await hapusFotoDiCloudinary(u);
      } else if (typeof arrayFoto === "string" && arrayFoto !== "") {
        await hapusFotoDiCloudinary(arrayFoto);
      }
      await deleteDoc(doc(db, "potensi_desa", id));
      ambilData();
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* MENU TAB UTAMA ADMIN */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => { setTabAktif("hero"); setSelectedLembagaEdit(null); }} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Header Profil
        </button>
        <button 
          onClick={() => { setTabAktif("teks"); setSelectedLembagaEdit(null); }} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "teks" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📖</span> Sejarah & Visi
        </button>
        <button 
          onClick={() => { setTabAktif("sotk"); setSelectedLembagaEdit(null); }} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "sotk" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🏛️</span> Aparatur (SOTK)
        </button>
        <button 
          onClick={() => { setTabAktif("lembaga"); setSelectedLembagaEdit(null); }} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "lembaga" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🤝</span> Lembaga Desa
        </button>
        <button 
          onClick={() => { setTabAktif("umkm"); setSelectedLembagaEdit(null); }} 
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
          TAB 1: HEADER PROFIL
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span>🖼️</span> Pengaturan Header Profil Desa
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
                    Judul Utama Header (Paragraf)
                  </label>
                  {/* PERBAIKAN: Judul menjadi TEXTAREA */}
                  <textarea 
                    required 
                    rows={3}
                    value={heroJudul} 
                    onChange={(e) => setHeroJudul(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white font-bold text-lg whitespace-pre-wrap leading-snug" 
                  ></textarea>
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
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white text-sm leading-relaxed"
                  ></textarea>
                </div>
              </div>

              <div 
                className="space-y-4"
              >
                <label 
                  className="block text-sm font-bold mb-2 text-gray-800"
                >
                  Gambar Background
                </label>
                {heroBgLama && (
                  <div 
                    className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(heroBgLama)} 
                      className="w-full h-full object-cover" 
                    />
                    {/* TOMBOL X HAPUS (Selalu muncul di HP, Hover di Laptop) */}
                    <button 
                      type="button" 
                      onClick={() => { if(confirm("Hapus background?")) setHeroBgLama(""); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <span>❌</span> Hapus Gambar
                      </span>
                    </button>
                  </div>
                )}
                <label 
                  className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm"
                >
                  <span className="text-3xl mb-2">📸</span>
                  <span className="font-bold text-yellow-800 text-sm">Upload Background Baru</span>
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
            <span>📖</span> Pengaturan Sejarah & Visi Misi Desa
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
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-sm leading-relaxed"
              ></textarea>
            </div>
            <div>
              <label 
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Visi & Misi Desa
              </label>
              <textarea 
                required 
                rows={6} 
                value={teksProfil.visi_misi} 
                onChange={(e) => setTeksProfil({...teksProfil, visi_misi: e.target.value})} 
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-sm leading-relaxed"
              ></textarea>
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
          TAB 3: APARATUR / SOTK (aparatur_desa)
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
              <span>🏛️</span> Manajemen Aparatur Desa (SOTK)
            </h3>
            <button 
              onClick={() => bukaModalSotk()} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              + Tambah Aparatur
            </button>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {dataAparatur.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-2xl p-5 flex items-center gap-4 bg-gray-50 hover:shadow-md transition-all"
              >
                <div 
                  className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-purple-100 flex-shrink-0"
                >
                  {item.foto ? (
                    <img 
                      src={getSafeImageUrl(item.foto)} 
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
          TAB 4: LEMBAGA DESA (lembaga_desa)
      ========================================== */}
      {tabAktif === "lembaga" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          {selectedLembagaEdit ? (
            // KELOLA ANGGOTA SPESIFIK LEMBAGA
            <div 
              className="animate-fade-in"
            >
              <button 
                onClick={() => setSelectedLembagaEdit(null)}
                className="mb-6 flex items-center gap-2 text-green-600 font-bold hover:text-green-800 transition-colors"
              >
                <span>◀</span> Kembali ke Daftar Lembaga
              </button>

              <div 
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-green-50 p-6 rounded-2xl border border-green-100"
              >
                <div>
                  <h3 
                    className="text-2xl font-black text-gray-900 mb-1"
                  >
                    Keanggotaan: {selectedLembagaEdit.nama || selectedLembagaEdit.nama_lembaga}
                  </h3>
                  <p 
                    className="text-gray-600 text-sm"
                  >
                    {selectedLembagaEdit.deskripsi}
                  </p>
                </div>
                <button 
                  onClick={() => bukaModalAnggota()} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm shrink-0"
                >
                  + Tambah Anggota
                </button>
              </div>

              <div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {(!selectedLembagaEdit.anggota_sotk && !selectedLembagaEdit.anggota) || 
                 (selectedLembagaEdit.anggota_sotk || selectedLembagaEdit.anggota).length === 0 ? (
                  <div 
                    className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 font-bold"
                  >
                    Belum ada anggota yang terdaftar di lembaga ini.
                  </div>
                ) : (
                  (selectedLembagaEdit.anggota_sotk || selectedLembagaEdit.anggota).map((ang: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm hover:shadow-md transition-all relative group"
                    >
                      <div 
                        className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 mb-3"
                      >
                        {ang.foto ? (
                          <img 
                            src={getSafeImageUrl(ang.foto)} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-3xl text-gray-400"
                          >
                            👤
                          </div>
                        )}
                      </div>
                      <h4 
                        className="font-bold text-gray-900 mb-1"
                      >
                        {ang.nama}
                      </h4>
                      <span 
                        className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 inline-block mb-4"
                      >
                        {ang.jabatan}
                      </span>
                      <div 
                        className="flex gap-2 justify-center"
                      >
                        <button 
                          onClick={() => bukaModalAnggota(ang, idx)} 
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-bold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => hapusAnggotaLembaga(idx)} 
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // DAFTAR LEMBAGA UTAMA
            <div 
              className="animate-fade-in"
            >
              <div 
                className="flex justify-between items-center mb-6"
              >
                <h3 
                  className="text-2xl font-bold flex items-center gap-2"
                >
                  <span>🤝</span> Daftar Lembaga Desa
                </h3>
                <button 
                  onClick={() => bukaModalLembaga()} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm"
                >
                  + Tambah Lembaga Baru
                </button>
              </div>
              
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {dataLembaga.map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-gray-200 rounded-3xl p-6 bg-gray-50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 
                        className="text-2xl font-black text-gray-900 mb-2"
                      >
                        {item.nama || item.nama_lembaga}
                      </h4>
                      <p 
                        className="text-xs text-gray-600 leading-relaxed mb-6 line-clamp-3"
                      >
                        {item.deskripsi}
                      </p>
                    </div>

                    <div 
                      className="flex gap-3 pt-4 border-t border-gray-200"
                    >
                      <button 
                        onClick={() => setSelectedLembagaEdit(item)} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                      >
                        Kelola Anggota
                      </button>
                      <button 
                        onClick={() => bukaModalLembaga(item)} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => hapusLembaga(item.id, item.foto)} 
                        className="bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 5: KATALOG UMKM / POTENSI (potensi_desa)
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
              <span>🛍️</span> Katalog Potensi & UMKM
            </h3>
            <button 
              onClick={() => bukaModalPotensi()} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              + Tambah UMKM
            </button>
          </div>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {dataPotensi.map((item) => {
              let imgThumb = "";
              if (Array.isArray(item.gambar) && item.gambar.length > 0) {
                imgThumb = item.gambar[0];
              } else if (typeof item.foto === "string") {
                imgThumb = item.foto;
              }

              return (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-3xl p-5 bg-gray-50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div 
                      className="h-40 rounded-2xl overflow-hidden bg-gray-200 mb-4 relative"
                    >
                      {imgThumb ? (
                        <img 
                          src={getSafeImageUrl(imgThumb)} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-4xl text-gray-400"
                        >
                          🏪
                        </div>
                      )}
                    </div>
                    <span 
                      className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block mb-1"
                    >
                      {item.kategori || "UMKM"}
                    </span>
                    <h4 
                      className="text-xl font-black text-gray-900 mb-1"
                    >
                      {item.nama_produk}
                    </h4>
                    <p 
                      className="text-xs text-gray-500 font-bold mb-3"
                    >
                      Pemilik: {item.pemilik}
                    </p>
                    <p 
                      className="text-xs text-gray-600 line-clamp-2 mb-4"
                    >
                      {item.deskripsi}
                    </p>
                  </div>

                  <div 
                    className="flex gap-2 pt-4 border-t border-gray-200"
                  >
                    <button 
                      onClick={() => bukaModalPotensi(item)} 
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => hapusPotensi(item.id, item.gambar || item.foto)} 
                      className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL SOTK APARATUR (LEGA & LUAS)
      ========================================== */}
      {isModalSotkOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          {/* PERBAIKAN MODAL LEGA: max-w-4xl & my-12 */}
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-purple-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                {editIdSotk ? "Edit Aparatur Desa" : "Tambah Aparatur Desa"}
              </h3>
              <button 
                onClick={() => setIsModalSotkOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanSotk} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formSotk.nama} 
                    onChange={(e) => setFormSotk({...formSotk, nama: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base" 
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Jabatan
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formSotk.jabatan} 
                    onChange={(e) => setFormSotk({...formSotk, jabatan: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base" 
                  />
                </div>
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Atasan Langsung (Jalur Atas SOTK)
                  </label>
                  <select 
                    value={formSotk.jalurAtas} 
                    onChange={(e) => setFormSotk({...formSotk, jalurAtas: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm font-bold"
                  >
                    <option value="">-- Root (Puncak Pimpinan Tertinggi) --</option>
                    {dataAparatur.filter(d => d.id !== editIdSotk).map(d => (
                      <option key={d.id} value={d.id}>{d.nama} ({d.jabatan})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Jenis Garis Hubung
                  </label>
                  <select 
                    value={formSotk.jenisGaris} 
                    onChange={(e) => setFormSotk({...formSotk, jenisGaris: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm font-bold uppercase"
                  >
                    <option value="Instruksi">Garis Instruksi (Lurus)</option>
                    <option value="Koordinasi">Garis Koordinasi (Putus-Putus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-3 text-gray-700"
                >
                  Foto Profil Aparatur
                </label>
                {fotoSotk && (
                  <div 
                    className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300 mb-4 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(fotoSotk)} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => { hapusFotoDiCloudinary(fotoSotk); setFotoSotk(""); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus</span>
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadFotoSotk} 
                  className="w-full p-4 rounded-xl border bg-gray-50 text-sm" 
                />
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalSotkOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Aparatur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL LEMBAGA DESA UTAMA (LEGA & LUAS)
      ========================================== */}
      {isModalLembagaOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-green-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                {editIdLembaga ? "Edit Lembaga Desa" : "Tambah Lembaga Baru"}
              </h3>
              <button 
                onClick={() => setIsModalLembagaOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanLembaga} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Nama Lembaga
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formLembaga.nama} 
                    onChange={(e) => setFormLembaga({...formLembaga, nama: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base" 
                    placeholder="Cth: Karang Taruna Desa"
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Singkatan / Akronim
                  </label>
                  <input 
                    type="text" 
                    value={formLembaga.singkatan} 
                    onChange={(e) => setFormLembaga({...formLembaga, singkatan: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base uppercase" 
                    placeholder="Cth: KARTAR"
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi / Tugas Lembaga
                </label>
                <textarea 
                  rows={5} 
                  required 
                  value={formLembaga.deskripsi} 
                  onChange={(e) => setFormLembaga({...formLembaga, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm leading-relaxed whitespace-pre-wrap"
                ></textarea>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-3 text-gray-700"
                >
                  Logo Lembaga
                </label>
                {formLembaga.foto && (
                  <div 
                    className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-300 mb-4 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(formLembaga.foto)} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => { hapusFotoDiCloudinary(formLembaga.foto); setFormLembaga(prev => ({...prev, foto: ""})); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus Logo</span>
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadFotoLembaga} 
                  className="w-full p-4 rounded-xl border bg-gray-50 text-sm" 
                />
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalLembagaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Lembaga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL TAMBAH ANGGOTA LEMBAGA (SOTK-STYLE)
      ========================================== */}
      {isModalAnggotaOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          {/* PERBAIKAN MODAL: max-w-4xl & my-12 */}
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-green-600 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                {editIndexAnggota !== null ? "Edit Anggota Lembaga" : "Tambah Anggota Lembaga"}
              </h3>
              <button 
                onClick={() => setIsModalAnggotaOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanAnggotaLembaga} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Nama Anggota
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formAnggota.nama} 
                    onChange={(e) => setFormAnggota({...formAnggota, nama: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base" 
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Jabatan di Lembaga
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formAnggota.jabatan} 
                    onChange={(e) => setFormAnggota({...formAnggota, jabatan: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-base" 
                    placeholder="Cth: Ketua, Sekretaris, Anggota..."
                  />
                </div>
              </div>

              {/* FITUR BARU: STRUKTUR SOTK UNTUK LEMBAGA */}
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50 p-6 rounded-2xl border border-green-100"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-green-900"
                  >
                    Atasan Langsung (Struktur Organisasi Lembaga)
                  </label>
                  <select 
                    value={formAnggota.jalurAtas} 
                    onChange={(e) => setFormAnggota({...formAnggota, jalurAtas: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-green-200 bg-white outline-none text-sm font-bold"
                  >
                    <option value="">-- Root (Puncak Pimpinan Lembaga) --</option>
                    {(selectedLembagaEdit?.anggota_sotk || selectedLembagaEdit?.anggota || []).map((ang: any, idx: number) => {
                      if (editIndexAnggota === idx) return null; // Tidak bisa pilih diri sendiri
                      return (
                        <option key={ang.id || idx} value={ang.id || idx}>{ang.nama} ({ang.jabatan})</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-green-900"
                  >
                    Jenis Garis Hubung
                  </label>
                  <select 
                    value={formAnggota.jenisGaris} 
                    onChange={(e) => setFormAnggota({...formAnggota, jenisGaris: e.target.value})} 
                    className="w-full p-4 rounded-xl border border-green-200 bg-white outline-none text-sm font-bold uppercase"
                  >
                    <option value="Instruksi">Garis Instruksi (Lurus)</option>
                    <option value="Koordinasi">Garis Koordinasi (Putus-Putus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-3 text-gray-700"
                >
                  Foto Anggota
                </label>
                {formAnggota.foto && (
                  <div 
                    className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300 mb-4 group shadow-sm"
                  >
                    <img 
                      src={getSafeImageUrl(formAnggota.foto)} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => { hapusFotoDiCloudinary(formAnggota.foto); setFormAnggota(prev => ({...prev, foto: ""})); }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                    >
                      <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus</span>
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadFotoAnggota} 
                  className="w-full p-4 rounded-xl border bg-gray-50 text-sm" 
                />
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalAnggotaOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Anggota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL POTENSI / UMKM (SANGAT LEGA & RESPONSIF)
      ========================================== */}
      {isModalPotensiOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          {/* PERBAIKAN MODAL UMKM: max-w-5xl & my-12 */}
          <div 
            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl p-6 sm:p-10 my-12 border-t-8 border-red-500 h-fit"
          >
            <div 
              className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                {editIdPotensi ? "Edit Potensi & UMKM" : "Tambah Potensi & UMKM Baru"}
              </h3>
              <button 
                onClick={() => setIsModalPotensiOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-2xl px-2"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={simpanPotensi} 
              className="space-y-6"
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Nama Produk / Usaha
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formPotensi.nama_produk} 
                    onChange={(e) => setFormPotensi({...formPotensi, nama_produk: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-lg" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Nama Pemilik
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formPotensi.pemilik} 
                    onChange={(e) => setFormPotensi({...formPotensi, pemilik: e.target.value})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-bold text-lg" 
                  />
                </div>
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Kategori
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formPotensi.kategori} 
                    onChange={(e) => setFormPotensi({...formPotensi, kategori: e.target.value})} 
                    placeholder="Cth: Kuliner, Kerajinan"
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm uppercase font-bold" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Harga Mulai (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={formPotensi.harga_mulai} 
                    onChange={(e) => setFormPotensi({...formPotensi, harga_mulai: Number(e.target.value)})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono text-sm" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Harga Sampai (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={formPotensi.harga_sampai} 
                    onChange={(e) => setFormPotensi({...formPotensi, harga_sampai: Number(e.target.value)})} 
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono text-sm" 
                  />
                </div>
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    No. WhatsApp (Gunakan awalan 62)
                  </label>
                  <input 
                    type="number" 
                    value={formPotensi.wa} 
                    onChange={(e) => setFormPotensi({...formPotensi, wa: e.target.value})} 
                    placeholder="62812345678"
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono text-sm font-bold text-green-700" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-700"
                  >
                    Link Google Maps Lokasi
                  </label>
                  <input 
                    type="url" 
                    value={formPotensi.link_maps} 
                    onChange={(e) => setFormPotensi({...formPotensi, link_maps: e.target.value})} 
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none font-mono text-sm text-blue-600" 
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block text-sm font-bold mb-2 text-gray-700"
                >
                  Deskripsi Lengkap Produk & Usaha
                </label>
                <textarea 
                  rows={6} 
                  required 
                  value={formPotensi.deskripsi} 
                  onChange={(e) => setFormPotensi({...formPotensi, deskripsi: e.target.value})} 
                  className="w-full p-4 rounded-xl border bg-gray-50 focus:bg-white outline-none text-base leading-relaxed whitespace-pre-wrap"
                ></textarea>
              </div>

              {/* PERBAIKAN: JADWAL OPERASIONAL LEBIH RAPI DI HP */}
              <div 
                className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200"
              >
                <h4 
                  className="font-black text-gray-900 mb-6 text-lg border-b border-gray-200 pb-3"
                >
                  Pengaturan Jam Operasional Per Hari
                </h4>
                <div 
                  className="space-y-3"
                >
                  {Object.keys(jamOperasional).map((hari) => (
                    <div 
                      key={hari} 
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div 
                        className="flex items-center justify-between md:justify-start md:w-48"
                      >
                        <span 
                          className="font-black text-gray-800"
                        >
                          {hari}:
                        </span>
                        <label 
                          className="flex items-center gap-2 font-bold text-red-600 cursor-pointer bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                        >
                          <input 
                            type="checkbox" 
                            checked={jamOperasional[hari].libur}
                            onChange={(e) => {
                              const updated = { ...jamOperasional };
                              updated[hari].libur = e.target.checked;
                              setJamOperasional(updated);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          /> Libur
                        </label>
                      </div>

                      {!jamOperasional[hari].libur && (
                        <div 
                          className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0"
                        >
                          <input 
                            type="time" 
                            value={jamOperasional[hari].buka}
                            onChange={(e) => {
                              const updated = { ...jamOperasional };
                              updated[hari].buka = e.target.value;
                              setJamOperasional(updated);
                            }}
                            className="flex-1 md:flex-none p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span 
                            className="font-bold text-gray-400"
                          >
                            s/d
                          </span>
                          <input 
                            type="time" 
                            value={jamOperasional[hari].tutup}
                            onChange={(e) => {
                              const updated = { ...jamOperasional };
                              updated[hari].tutup = e.target.value;
                              setJamOperasional(updated);
                            }}
                            className="flex-1 md:flex-none p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* GALERI FOTO MULTI-UPLOAD DENGAN TOMBOL X (RESPONSIF) */}
              <div 
                className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200"
              >
                <label 
                  className="block text-lg font-black mb-4 text-gray-900 border-b border-gray-200 pb-3"
                >
                  Galeri Foto Produk (Multiple Upload)
                </label>
                
                {formPotensi.gambar.length > 0 && (
                  <div 
                    className="flex flex-wrap gap-4 mb-6"
                  >
                    {formPotensi.gambar.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-gray-300 group shadow-md"
                      >
                        <img 
                          src={getSafeImageUrl(url)} 
                          className="w-full h-full object-cover" 
                        />
                        {/* Tombol X Hapus: Selalu tampil di HP, Hover di Laptop */}
                        <button 
                          type="button" 
                          onClick={() => handleHapusSatuPotensiFoto(url, idx)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                        >
                          <span className="bg-red-600 px-3 py-1.5 rounded-full shadow-lg">❌ Hapus</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  className="flex flex-col md:flex-row items-start md:items-center gap-4"
                >
                  <label 
                    className={`cursor-pointer w-full md:w-auto text-center bg-white border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 px-8 py-4 rounded-xl text-sm font-black text-gray-700 hover:text-red-600 transition-colors shadow-sm flex items-center justify-center gap-2 ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="text-xl">{isUploading ? "⏳" : "📸"}</span>
                    <span>{isUploading ? "Mengunggah Foto..." : "Tambah Foto Baru"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleUploadMultiPotensi} 
                      className="hidden" 
                    />
                  </label>
                  <p 
                    className="text-xs text-gray-500 font-bold max-w-sm"
                  >
                    *Anda bisa menyorot lebih dari satu gambar sekaligus di galeri HP/Laptop Anda. Format HEIC otomatis didukung.
                  </p>
                </div>
              </div>

              <div 
                className="flex gap-4 pt-6 border-t border-gray-100 mt-8"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalPotensiOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 text-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading} 
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Potensi UMKM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}