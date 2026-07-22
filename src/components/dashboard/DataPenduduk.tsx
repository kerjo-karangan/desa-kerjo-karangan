// src/components/dashboard/DataPenduduk.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from "xlsx";

interface DataPendudukProps {
  activeSubMenu?: string;
}

// Helper: Generator ID Acak Enkripsi
const generateIdAcak = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function DataPenduduk({ 
  activeSubMenu 
}: DataPendudukProps) {
  
  const defaultTab = activeSubMenu === "data-hero" ? "hero" 
                   : activeSubMenu === "data-input" ? "input"
                   : activeSubMenu === "data-upload" ? "upload" 
                   : "kelola";
                   
  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "data-hero") setTabAktif("hero");
    else if (activeSubMenu === "data-input") setTabAktif("input");
    else if (activeSubMenu === "data-upload") setTabAktif("upload");
    else if (activeSubMenu === "data-kelola") setTabAktif("kelola");
  }, [activeSubMenu]);

  // ==========================================
  // STATE HEADER & STATUS
  // ==========================================
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusProses, setStatusProses] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // ==========================================
  // STATE MASTER DATA (PENGATURAN INPUT)
  // ==========================================
  const defaultMasterData = {
    dusun: [{id: 1, label: "KRAJAN"}, {id: 2, label: "KRANDON"}],
    rt: [{id: 1, label: "01"}, {id: 2, label: "02"}],
    rw: [{id: 1, label: "01"}, {id: 2, label: "02"}],
    kelamin: [{id: 1, label: "LAKI-LAKI"}, {id: 2, label: "PEREMPUAN"}],
    agama: [{id: 1, label: "ISLAM"}, {id: 2, label: "KRISTEN"}],
    pendidikan: [{id: 1, label: "SD SEDERAJAT"}, {id: 2, label: "SMP SEDERAJAT"}],
    pekerjaan: [{id: 1, label: "PETANI"}, {id: 2, label: "WIRASWASTA"}],
    kawin: [{id: 1, label: "BELUM KAWIN"}, {id: 2, label: "KAWIN"}],
    hubungan: [{id: 1, label: "KEPALA KELUARGA"}, {id: 2, label: "ISTRI"}, {id: 3, label: "ANAK"}],
    warga: [{id: 1, label: "WNI"}, {id: 2, label: "WNA"}],
    darah: [{id: 1, label: "A"}, {id: 2, label: "B"}, {id: 3, label: "O"}, {id: 4, label: "AB"}]
  };
  
  const [masterData, setMasterData] = useState<any>(defaultMasterData);
  const [kategoriMasterAktif, setKategoriMasterAktif] = useState("dusun");
  const [inputMasterBaru, setInputMasterBaru] = useState("");

  // ==========================================
  // STATE KELOLA PENDUDUK & PAGINASI
  // ==========================================
  const [daftarPenduduk, setDaftarPenduduk] = useState<any[]>([]);
  const [daftarKepalaKeluarga, setDaftarKepalaKeluarga] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // STATE MODAL MANUAL
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id_keluarga: "", 
    dusun: "",
    rw: "",
    rt: "",
    nama: "", 
    jenis_kelamin: "", 
    tempat_lahir: "", 
    tanggal_lahir: "", 
    agama: "", 
    pendidikan: "", 
    pekerjaan: "", 
    status_kawin: "", 
    hubungan_keluarga: "",
    kewarganegaraan: "",
    nama_ayah: "",
    nama_ibu: "",
    golongan_darah: ""
  });

  // State Mode Upload Excel
  const [modeUpload, setModeUpload] = useState<"ganti" | "tambah">("tambah");

  // ==========================================
  // FUNGSI FETCH UTAMA
  // ==========================================
  const ambilData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Hero
      const snapHero = await getDoc(doc(db, "pengaturan_web", "datadesa_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "");
        setHeroSub(snapHero.data().sub || "");
        setHeroBgLama(snapHero.data().bg || "");
      }

      // 2. Fetch Master Data
      const snapMaster = await getDoc(doc(db, "pengaturan_web", "master_input_penduduk"));
      if (snapMaster.exists() && snapMaster.data()) {
        setMasterData(snapMaster.data());
      } else {
        await setDoc(doc(db, "pengaturan_web", "master_input_penduduk"), defaultMasterData);
      }

      // 3. Fetch Penduduk
      const snapPenduduk = await getDocs(collection(db, "data_penduduk"));
      const dataPend = snapPenduduk.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as any) 
      }));
      setDaftarPenduduk(dataPend);

      // Ekstrak khusus Kepala Keluarga untuk form manual
      const kkList = dataPend.filter(p => p.hubungan_keluarga?.toUpperCase() === "KEPALA KELUARGA");
      setDaftarKepalaKeluarga(kkList);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  // ==========================================
  // HANDLER PENGATURAN MASTER DATA
  // ==========================================
  const tambahMasterData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMasterBaru.trim()) return;

    setStatusProses("Menambahkan pengaturan...");
    const currentList = masterData[kategoriMasterAktif] || [];
    const newId = currentList.length > 0 ? Math.max(...currentList.map((m:any) => m.id)) + 1 : 1;
    
    const updatedList = [...currentList, { id: newId, label: inputMasterBaru.toUpperCase() }];
    const updatedMaster = { ...masterData, [kategoriMasterAktif]: updatedList };

    try {
      await setDoc(doc(db, "pengaturan_web", "master_input_penduduk"), updatedMaster);
      setMasterData(updatedMaster);
      setInputMasterBaru("");
      setStatusProses("✅ Berhasil ditambahkan");
      setTimeout(() => setStatusProses(""), 2000);
    } catch (error) {
      setStatusProses("❌ Gagal menambahkan");
    }
  };

  const hapusMasterData = async (kategori: string, idItem: number) => {
    if (!confirm("Yakin ingin menghapus pilihan ini?")) return;
    
    setStatusProses("Menghapus pengaturan...");
    const updatedList = masterData[kategori].filter((item: any) => item.id !== idItem);
    const updatedMaster = { ...masterData, [kategori]: updatedList };

    try {
      await setDoc(doc(db, "pengaturan_web", "master_input_penduduk"), updatedMaster);
      setMasterData(updatedMaster);
      setStatusProses("✅ Berhasil dihapus");
      setTimeout(() => setStatusProses(""), 2000);
    } catch (error) {
      setStatusProses("❌ Gagal menghapus");
    }
  };

  // ==========================================
  // HANDLER UPLOAD KE CLOUDINARY
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

  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusProses("Menyimpan Header...");
    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusProses("Mengunggah gambar...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        if (newBg) imageUrl = newBg;
      }
      await setDoc(doc(db, "pengaturan_web", "datadesa_hero"), {
        judul: heroJudul, 
        sub: heroSub, 
        bg: imageUrl, 
        terakhir_diperbarui: new Date().toISOString()
      });
      setStatusProses("✅ Pengaturan Header berhasil diperbarui!");
      setHeroBgLama(imageUrl); 
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan pengaturan.");
    }
  };

  // ==========================================
  // LOGIKA IMPOR EXCEL & ENKRIPSI
  // ==========================================
  const bersihkanTeks = (text: any) => {
    if (text === null || text === undefined || String(text).trim() === "") return "-";
    return String(text).toUpperCase().trim();
  };

  const findKey = (row: any, possibleKeys: string[]) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, ""); 
      for (const pk of possibleKeys) {
        const lowerPk = pk.toLowerCase().replace(/[^a-z0-9]/g, ""); 
        if (lowerKey.includes(lowerPk)) return row[key];
      }
    }
    return "";
  };

  const tanganiUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (modeUpload === "ganti") {
      const isConfirmed = confirm("PERINGATAN KERAS!\n\nAnda memilih 'Perbarui Data Total'. Seluruh data penduduk yang ada saat ini di sistem akan DIHAPUS PERMANEN dan digantikan sepenuhnya oleh data dari file Excel ini.\n\nApakah Anda YAKIN?");
      if (!isConfirmed) {
        e.target.value = '';
        return;
      }
    } else {
      const isConfirmed = confirm("Anda memilih 'Tambahkan Data'. Data dari Excel ini akan ditambahkan ke data yang sudah ada di sistem tanpa menghapus data lama.\n\nLanjutkan?");
      if (!isConfirmed) {
        e.target.value = '';
        return;
      }
    }

    setStatusProses("Membaca file Excel/CSV...");
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        if (sheetData.length === 0) {
          setStatusProses("❌ File Excel kosong atau salah format.");
          return;
        }

        setStatusProses("Memproses, Memetakan (Mapping), dan Mengenkripsi Data...");
        
        const kkToFamilyIdMap = new Map();
        const batchDataMurni = [];
        let skippedData = 0;

        for (const baris of sheetData as any[]) {
          const noKkAsli = findKey(baris, ["kk", "kartukeluarga"]);
          
          if (!noKkAsli || noKkAsli === "" || noKkAsli === "-") {
            skippedData++;
            continue; 
          }

          let idKeluarga = "";
          if (kkToFamilyIdMap.has(noKkAsli)) {
            idKeluarga = kkToFamilyIdMap.get(noKkAsli);
          } else {
            idKeluarga = `KEL-${generateIdAcak()}`;
            kkToFamilyIdMap.set(noKkAsli, idKeluarga);
          }

          const dataBersih = {
            id_keluarga: idKeluarga,
            id_warga: `W-${generateIdAcak()}`,
            dusun: bersihkanTeks(findKey(baris, ["dusun", "kampung"])),
            rw: bersihkanTeks(findKey(baris, ["rw", "rukunwarga"])),
            rt: bersihkanTeks(findKey(baris, ["rt", "rukuntetangga"])),
            nama: bersihkanTeks(findKey(baris, ["nama", "namalengkap"])),
            jenis_kelamin: bersihkanTeks(findKey(baris, ["kelamin", "gender"])),
            tempat_lahir: bersihkanTeks(findKey(baris, ["tempatlahir", "lahir"])),
            tanggal_lahir: bersihkanTeks(findKey(baris, ["tanggallahir", "tgl"])),
            agama: bersihkanTeks(findKey(baris, ["agama"])),
            pendidikan: bersihkanTeks(findKey(baris, ["pendidikan", "sekolah"])),
            pekerjaan: bersihkanTeks(findKey(baris, ["kerja", "profesi"])), 
            status_kawin: bersihkanTeks(findKey(baris, ["kawin", "nikah", "perkawinan"])),
            hubungan_keluarga: bersihkanTeks(findKey(baris, ["hubungan", "statuskeluarga"])),
            kewarganegaraan: bersihkanTeks(findKey(baris, ["warga", "negara"])),
            nama_ayah: bersihkanTeks(findKey(baris, ["ayah"])),
            nama_ibu: bersihkanTeks(findKey(baris, ["ibu"])),
            golongan_darah: bersihkanTeks(findKey(baris, ["darah", "gol"])),
            tanggal_input: new Date().toISOString()
          };
          batchDataMurni.push(dataBersih);
        }

        if (batchDataMurni.length === 0) {
           setStatusProses("❌ Gagal. Tidak ada data valid (No KK hilang/kosong).");
           return;
        }

        setStatusProses(`Mengunggah ${batchDataMurni.length} data ke Database...`);

        if (modeUpload === "ganti" && daftarPenduduk.length > 0) {
          setStatusProses("Membersihkan data lama (Proses ini mungkin memakan waktu)...");
          for (const p of daftarPenduduk) {
            await deleteDoc(doc(db, "data_penduduk", p.id));
          }
        }

        for (const data of batchDataMurni) {
          await addDoc(collection(db, "data_penduduk"), data);
        }

        setStatusProses("");
        alert(`✅ Proses Import Selesai!\n\nBerhasil: ${batchDataMurni.length} data\nDilewati: ${skippedData} data`);
        ambilData();
        
      } catch (error: any) {
        setStatusProses(`❌ Kesalahan: ${error.message}`);
      }
    };
    
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // ==========================================
  // HANDLER EKSPOR EXCEL
  // ==========================================
  const handleExportExcel = () => {
    if (daftarPenduduk.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }
    
    // Format ulang data agar rapi di excel, hapus field tidak perlu
    const dataEkspor = daftarPenduduk.map((p, index) => ({
      "NO": index + 1,
      "ID KELUARGA (ENKRIPSI)": p.id_keluarga,
      "ID WARGA (ENKRIPSI)": p.id_warga,
      "NAMA LENGKAP": p.nama,
      "HUBUNGAN KELUARGA": p.hubungan_keluarga,
      "DUSUN": p.dusun,
      "RT": p.rt,
      "RW": p.rw,
      "JENIS KELAMIN": p.jenis_kelamin,
      "TEMPAT LAHIR": p.tempat_lahir,
      "TANGGAL LAHIR": p.tanggal_lahir,
      "AGAMA": p.agama,
      "PENDIDIKAN": p.pendidikan,
      "PEKERJAAN": p.pekerjaan,
      "STATUS KAWIN": p.status_kawin,
      "WARGA NEGARA": p.kewarganegaraan,
      "GOL DARAH": p.golongan_darah,
      "NAMA AYAH": p.nama_ayah,
      "NAMA IBU": p.nama_ibu
    }));

    const ws = XLSX.utils.json_to_sheet(dataEkspor);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Penduduk");
    XLSX.writeFile(wb, `Data_Penduduk_Desa_${new Date().getTime()}.xlsx`);
  };

  // ==========================================
  // HANDLER MODAL MANUAL & KEPALA KELUARGA
  // ==========================================
  const bukaModalTambah = () => {
    setEditId(null);
    setFormData({
      id_keluarga: "", 
      dusun: "", rw: "", rt: "", nama: "", jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "", 
      agama: "", pendidikan: "", pekerjaan: "", status_kawin: "", hubungan_keluarga: "", 
      kewarganegaraan: "", nama_ayah: "", nama_ibu: "", golongan_darah: ""
    });
    setIsModalOpen(true);
  };

  const bukaModalEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      id_keluarga: item.id_keluarga || "",
      dusun: item.dusun || "",
      rw: item.rw || "",
      rt: item.rt || "",
      nama: item.nama || "",
      jenis_kelamin: item.jenis_kelamin || "",
      tempat_lahir: item.tempat_lahir || "",
      tanggal_lahir: item.tanggal_lahir || "",
      agama: item.agama || "",
      pendidikan: item.pendidikan || "",
      pekerjaan: item.pekerjaan || "",
      status_kawin: item.status_kawin || "",
      hubungan_keluarga: item.hubungan_keluarga || "",
      kewarganegaraan: item.kewarganegaraan || "",
      nama_ayah: item.nama_ayah || "",
      nama_ibu: item.nama_ibu || "",
      golongan_darah: item.golongan_darah || ""
    });
    setIsModalOpen(true);
  };

  const handleSimpanManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusProses("Menyimpan...");
    try {
      // LOGIKA KEPALA KELUARGA
      let finalIdKeluarga = formData.id_keluarga;
      
      // Jika dia KEPALA KELUARGA dan membuat baru, berikan ID KELUARGA BARU
      if (formData.hubungan_keluarga === "KEPALA KELUARGA" && !editId) {
        finalIdKeluarga = `KEL-${generateIdAcak()}`;
      }

      const payload = {
        ...formData,
        id_keluarga: finalIdKeluarga,
        nama: bersihkanTeks(formData.nama),
        tempat_lahir: bersihkanTeks(formData.tempat_lahir),
        nama_ayah: bersihkanTeks(formData.nama_ayah),
        nama_ibu: bersihkanTeks(formData.nama_ibu),
      };

      if (editId) {
        await updateDoc(doc(db, "data_penduduk", editId), payload);
        setStatusProses("✅ Data Diperbarui!");
      } else {
        await addDoc(collection(db, "data_penduduk"), {
          ...payload,
          id_warga: `W-${generateIdAcak()}`,
          tanggal_input: new Date().toISOString()
        });
        setStatusProses("✅ Warga Baru Ditambahkan!");
      }
      
      setIsModalOpen(false);
      ambilData();
      setTimeout(() => setStatusProses(""), 3000);
    } catch (error) {
      setStatusProses("❌ Gagal menyimpan data manual.");
    }
  };

  const hapusPenduduk = async (id: string) => {
    if (confirm("Yakin hapus data penduduk ini permanen?")) {
      await deleteDoc(doc(db, "data_penduduk", id));
      ambilData();
    }
  };

  // ==========================================
  // PAGINASI & FILTER DATA
  // ==========================================
  const dataTerfilter = daftarPenduduk.filter((p) => 
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id_keluarga?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_warga?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(dataTerfilter.length / perPage);
  const dataPaginasi = dataTerfilter.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* MENU SELALU TAMPIL */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" ? "bg-yellow-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>🖼️</span> Header Publik
        </button>
        <button 
          onClick={() => setTabAktif("input")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "input" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>⚙️</span> Pengaturan Input Data
        </button>
        <button 
          onClick={() => setTabAktif("kelola")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "kelola" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>👥</span> Data Penduduk
        </button>
        <button 
          onClick={() => setTabAktif("upload")} 
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "upload" ? "bg-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📄</span> Impor & Ekspor Excel
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
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span>🖼️</span> Pengaturan Halaman Visualisasi Publik
          </h3>
          
          <form 
            onSubmit={handleSimpanHero} 
            className="space-y-6 mt-6"
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
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
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
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg mt-4"
            >
              Simpan Header Publik
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: PENGATURAN INPUT DATA (MASTER ID)
      ========================================== */}
      {tabAktif === "input" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-600 animate-fade-in"
        >
          <div 
            className="mb-6"
          >
            <h3 
              className="text-2xl font-bold flex items-center gap-2 mb-2"
            >
              <span>⚙️</span> Manajemen Master ID Input Data
            </h3>
            <p 
              className="text-gray-500 text-sm"
            >
              Atur daftar pilihan (dropdown) yang akan muncul saat menambahkan warga secara manual. Sistem otomatis menetapkan ID berurut.
            </p>
          </div>

          <div 
            className="flex flex-col md:flex-row gap-6"
          >
            {/* Kategori Sidebar */}
            <div 
              className="w-full md:w-64 flex flex-col gap-2 border-r border-gray-100 pr-0 md:pr-4"
            >
              {Object.keys(defaultMasterData).map((kat) => (
                <button 
                  key={kat}
                  onClick={() => setKategoriMasterAktif(kat)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold text-left uppercase tracking-widest transition-all ${
                    kategoriMasterAktif === kat ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>

            {/* List Item & Tambah */}
            <div 
              className="flex-1"
            >
              <form 
                onSubmit={tambahMasterData} 
                className="flex gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200"
              >
                <input 
                  type="text" 
                  required 
                  value={inputMasterBaru}
                  onChange={(e) => setInputMasterBaru(e.target.value)}
                  placeholder={`Tambah ${kategoriMasterAktif.toUpperCase()} baru...`}
                  className="flex-1 p-3 rounded-xl border border-gray-300 outline-none uppercase font-bold text-sm"
                />
                <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-xl shadow-sm transition-colors text-sm"
                >
                  Tambah ID
                </button>
              </form>

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
                        className="py-3 px-4 font-black text-gray-500 w-24 text-center"
                      >
                        ID URUT
                      </th>
                      <th 
                        className="py-3 px-4 font-black text-gray-700"
                      >
                        NAMA / NILAI ({kategoriMasterAktif.toUpperCase()})
                      </th>
                      <th 
                        className="py-3 px-4 text-center font-black text-gray-700 w-32"
                      >
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterData[kategoriMasterAktif]?.map((item: any) => (
                      <tr 
                        key={item.id} 
                        className="border-b border-gray-100 hover:bg-purple-50/30"
                      >
                        <td 
                          className="py-3 px-4 text-center"
                        >
                          <span 
                            className="bg-gray-100 text-gray-700 font-black px-3 py-1 rounded-lg border border-gray-200"
                          >
                            {item.id}
                          </span>
                        </td>
                        <td 
                          className="py-3 px-4 font-bold text-gray-900"
                        >
                          {item.label}
                        </td>
                        <td 
                          className="py-3 px-4 text-center"
                        >
                          <button 
                            onClick={() => hapusMasterData(kategoriMasterAktif, item.id)} 
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: DATA PENDUDUK (DENGAN PAGINASI)
      ========================================== */}
      {tabAktif === "kelola" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h3 
                className="text-2xl font-bold text-gray-900"
              >
                👥 Basis Data Demografi
              </h3>
              <p 
                className="text-gray-500 text-sm mt-1"
              >
                Total Data: <span className="font-black text-blue-600">{daftarPenduduk.length} Jiwa</span>
              </p>
            </div>
            <div 
              className="flex items-center gap-3 w-full md:w-auto flex-wrap"
            >
              <select 
                value={perPage} 
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="p-2.5 rounded-xl border border-gray-300 outline-none text-sm font-bold bg-gray-50 cursor-pointer"
              >
                <option value={20}>20 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>

              <input 
                type="text" 
                placeholder="Cari Nama / ID Warga..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full md:w-56 p-2.5 rounded-xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              />
              <button 
                onClick={bukaModalTambah} 
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
              >
                <span>➕</span> Tambah Manual
              </button>
            </div>
          </div>

          <div 
            className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner bg-gray-50 p-4"
          >
            <table 
              className="min-w-full text-sm text-left bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <thead 
                className="bg-blue-50 border-b border-blue-100"
              >
                <tr>
                  <th 
                    className="py-4 px-4 font-bold text-blue-900"
                  >
                    Identitas Enkripsi
                  </th>
                  <th 
                    className="py-4 px-4 font-bold text-blue-900"
                  >
                    Demografi Pribadi
                  </th>
                  <th 
                    className="py-4 px-4 font-bold text-blue-900"
                  >
                    Status Keluarga
                  </th>
                  <th 
                    className="py-4 px-4 text-center font-bold text-blue-900"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 font-bold text-gray-400">Memuat data...</td>
                  </tr>
                ) : dataPaginasi.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 font-bold text-gray-400">Belum ada data penduduk.</td>
                  </tr>
                ) : (
                  dataPaginasi.map((p) => (
                    <tr 
                      key={p.id} 
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                    >
                      <td 
                        className="py-4 px-4 align-top"
                      >
                        <div 
                          className="font-black text-gray-900 text-base"
                        >
                          {p.nama}
                        </div>
                        <div 
                          className="text-[10px] text-gray-500 font-mono mt-1 mb-2 tracking-widest"
                        >
                          ID WARGA: {p.id_warga}
                        </div>
                        <div 
                          className="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded uppercase tracking-widest inline-block border border-blue-200"
                        >
                          ID KELUARGA: {p.id_keluarga}
                        </div>
                      </td>
                      
                      <td 
                        className="py-4 px-4 align-top"
                      >
                        <div 
                          className="text-xs text-gray-700 leading-relaxed"
                        >
                          <span className="font-bold">Alamat:</span> {p.dusun !== "-" ? `Dsn ${p.dusun}, RT ${p.rt}/RW ${p.rw}` : "-"}
                          <br/><span className="font-bold">Lahir:</span> {p.tempat_lahir}, {p.tanggal_lahir}
                          <br/><span className="font-bold">Gender:</span> {p.jenis_kelamin}
                          <br/><span className="font-bold">Agama:</span> {p.agama}
                          <br/><span className="font-bold">Pendidikan:</span> {p.pendidikan}
                        </div>
                      </td>
                      
                      <td 
                        className="py-4 px-4 align-top"
                      >
                        <div 
                          className="text-xs text-gray-700 leading-relaxed"
                        >
                          <span 
                            className="font-bold block text-green-700 mb-1"
                          >
                            {p.hubungan_keluarga}
                          </span>
                          <span className="font-bold">Status Kawin:</span> {p.status_kawin}
                          <br/><span className="font-bold">Pekerjaan:</span> {p.pekerjaan}
                          <br/><span className="font-bold">Warga:</span> {p.kewarganegaraan}
                          <br/><span className="font-bold">Darah:</span> {p.golongan_darah}
                        </div>
                      </td>
                      
                      <td 
                        className="py-4 px-4 text-center align-top"
                      >
                        <div 
                          className="flex flex-col gap-2 items-center"
                        >
                          <button 
                            onClick={() => bukaModalEdit(p)} 
                            className="w-full max-w-[80px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusPenduduk(p.id)} 
                            className="w-full max-w-[80px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
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

          {/* KONTROL PAGINASI BAWAH */}
          {totalPages > 1 && (
            <div 
              className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-2xl border border-gray-200"
            >
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                ◀ Sebelumnya
              </button>
              <span 
                className="font-bold text-gray-600 text-sm"
              >
                Halaman {currentPage} dari {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Selanjutnya ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: IMPOR EXCEL (DENGAN 2 OPSI) & EKSPOR
      ========================================== */}
      {tabAktif === "upload" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            📄 Import & Export Data Excel
          </h3>
          <p 
            className="text-gray-500 text-sm mb-8 leading-relaxed max-w-3xl"
          >
            Sistem secara otomatis akan mengganti NIK dan Nomor KK yang di-upload menjadi ID Warga dan ID Keluarga terenkripsi untuk mengamankan data rahasia warga dari akses publik.
          </p>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            {/* OPSI 1: PERBARUI TOTAL */}
            <div 
              className="bg-red-50 border-2 border-dashed border-red-300 p-8 rounded-3xl text-center hover:bg-red-100 transition-colors"
            >
              <span 
                className="text-5xl mb-4 block"
              >
                🚨
              </span>
              <h4 
                className="font-black text-red-900 mb-2"
              >
                Opsi 1: Perbarui Data Total
              </h4>
              <p 
                className="text-xs text-red-700 font-medium mb-6 leading-relaxed"
              >
                Menghapus SELURUH data lama di sistem, dan menggantinya 100% dengan data dari file Excel yang baru.
              </p>
              <label 
                className="bg-red-600 hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-1 inline-block"
              >
                Upload & Perbarui Total
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => { setModeUpload("ganti"); tanganiUploadExcel(e); }} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* OPSI 2: TAMBAH DATA */}
            <div 
              className="bg-green-50 border-2 border-dashed border-green-300 p-8 rounded-3xl text-center hover:bg-green-100 transition-colors"
            >
              <span 
                className="text-5xl mb-4 block"
              >
                ➕
              </span>
              <h4 
                className="font-black text-green-900 mb-2"
              >
                Opsi 2: Tambahkan Data Baru
              </h4>
              <p 
                className="text-xs text-green-800 font-medium mb-6 leading-relaxed"
              >
                Mempertahankan data lama yang sudah ada di sistem, dan hanya menyuntikkan tambahan data baru dari Excel.
              </p>
              <label 
                className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-6 rounded-xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-1 inline-block"
              >
                Upload & Tambahkan Data
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => { setModeUpload("tambah"); tanganiUploadExcel(e); }} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div 
            className="border-t border-gray-100 pt-8 text-center"
          >
            <h4 
              className="font-black text-gray-900 mb-4"
            >
              Opsi Ekspor Database (Backup)
            </h4>
            <button 
              onClick={handleExportExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors flex items-center gap-2 mx-auto"
            >
              <span>📥</span> Download Data ke Excel
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL TAMBAH MANUAL (LOGIKA KEPALA KELUARGA DARI MASTER DATA)
      ========================================== */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl my-8 border-t-8 border-blue-600 flex flex-col"
          >
            <div 
              className="flex justify-between items-center p-6 border-b border-gray-100"
            >
              <h3 
                className="text-2xl font-black text-gray-900"
              >
                {editId ? "✏️ Edit Data Penduduk" : "➕ Tambah Warga Baru"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-red-500 font-black text-xl"
              >
                X
              </button>
            </div>

            <form 
              onSubmit={handleSimpanManual} 
              className="p-6 space-y-6"
            >
              {/* LOGIKA KEPALA KELUARGA / KK */}
              <div 
                className="bg-blue-50 p-5 rounded-2xl border border-blue-200"
              >
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div>
                    <label 
                      className="block text-sm font-bold text-blue-900 mb-2"
                    >
                      Status Hubungan dlm Keluarga
                    </label>
                    <select 
                      required 
                      value={formData.hubungan_keluarga} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({...formData, hubungan_keluarga: val, id_keluarga: val === "KEPALA KELUARGA" ? "" : formData.id_keluarga});
                      }} 
                      className="w-full p-3 rounded-xl border border-blue-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    >
                      <option value="" disabled>Pilih Status Hubungan</option>
                      {masterData.hubungan?.map((m:any) => (
                        <option key={m.id} value={m.label}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.hubungan_keluarga !== "KEPALA KELUARGA" && (
                    <div>
                      <label 
                        className="block text-sm font-bold text-blue-900 mb-2"
                      >
                        Pilih Kepala Keluarga Induk
                      </label>
                      <select 
                        required 
                        value={formData.id_keluarga} 
                        onChange={(e) => setFormData({...formData, id_keluarga: e.target.value})} 
                        className="w-full p-3 rounded-xl border border-blue-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                      >
                        <option value="" disabled>-- Cari Kepala Keluarga --</option>
                        {daftarKepalaKeluarga.map((kk) => (
                          <option key={kk.id} value={kk.id_keluarga}>
                            {kk.nama} (Dusun {kk.dusun} RT {kk.rt})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {formData.hubungan_keluarga === "KEPALA KELUARGA" && !editId && (
                  <p 
                    className="text-[10px] text-green-700 mt-3 font-bold bg-green-100 p-2 rounded-lg inline-block border border-green-200"
                  >
                    ✅ Warga ini didaftarkan sebagai Kepala Keluarga. Sistem otomatis akan membuatkan ID Keluarga (KK) Baru.
                  </p>
                )}
                {formData.hubungan_keluarga !== "KEPALA KELUARGA" && (
                  <p 
                    className="text-[10px] text-blue-700 mt-3 font-bold"
                  >
                    Sistem memblokir input NIK/No KK demi privasi. Warga akan otomatis disatukan ke dalam ID Keluarga Induk yang dipilih.
                  </p>
                )}
              </div>

              {/* DATA DIRI LAINNYA DI AMBIL DARI MASTER DATA DROPDOWN */}
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 focus:bg-white uppercase text-sm" 
                  />
                </div>
                
                <div 
                  className="flex gap-2"
                >
                  <div 
                    className="w-1/3"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      Dusun
                    </label>
                    <select 
                      required 
                      value={formData.dusun} 
                      onChange={(e) => setFormData({...formData, dusun: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                    >
                      <option value="" disabled>Pilih</option>
                      {masterData.dusun?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                    </select>
                  </div>
                  <div 
                    className="w-1/3"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      RW
                    </label>
                    <select 
                      required 
                      value={formData.rw} 
                      onChange={(e) => setFormData({...formData, rw: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                    >
                      <option value="" disabled>Pilih</option>
                      {masterData.rw?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                    </select>
                  </div>
                  <div 
                    className="w-1/3"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      RT
                    </label>
                    <select 
                      required 
                      value={formData.rt} 
                      onChange={(e) => setFormData({...formData, rt: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                    >
                      <option value="" disabled>Pilih</option>
                      {masterData.rt?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Jenis Kelamin
                  </label>
                  <select 
                    required 
                    value={formData.jenis_kelamin} 
                    onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.kelamin?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>

                <div 
                  className="flex gap-2"
                >
                  <div 
                    className="w-1/2"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      Tempat Lahir
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.tempat_lahir} 
                      onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm uppercase" 
                    />
                  </div>
                  <div 
                    className="w-1/2"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      Tanggal Lahir
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={formData.tanggal_lahir} 
                      onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Agama
                  </label>
                  <select 
                    required 
                    value={formData.agama} 
                    onChange={(e) => setFormData({...formData, agama: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.agama?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Pendidikan Terakhir
                  </label>
                  <select 
                    required 
                    value={formData.pendidikan} 
                    onChange={(e) => setFormData({...formData, pendidikan: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.pendidikan?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Status Perkawinan
                  </label>
                  <select 
                    required 
                    value={formData.status_kawin} 
                    onChange={(e) => setFormData({...formData, status_kawin: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.kawin?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Golongan Darah
                  </label>
                  <select 
                    required 
                    value={formData.golongan_darah} 
                    onChange={(e) => setFormData({...formData, golongan_darah: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.darah?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Kewarganegaraan
                  </label>
                  <select 
                    required 
                    value={formData.kewarganegaraan} 
                    onChange={(e) => setFormData({...formData, kewarganegaraan: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih</option>
                    {masterData.warga?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Pekerjaan
                  </label>
                  <select 
                    required 
                    value={formData.pekerjaan} 
                    onChange={(e) => setFormData({...formData, pekerjaan: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm"
                  >
                    <option value="" disabled>Pilih Pekerjaan</option>
                    {masterData.pekerjaan?.map((m:any) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  </select>
                </div>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Nama Ayah
                  </label>
                  <input 
                    type="text" 
                    value={formData.nama_ayah} 
                    onChange={(e) => setFormData({...formData, nama_ayah: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm uppercase" 
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Nama Ibu
                  </label>
                  <input 
                    type="text" 
                    value={formData.nama_ibu} 
                    onChange={(e) => setFormData({...formData, nama_ibu: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm uppercase" 
                  />
                </div>
              </div>
              
              <div 
                className="flex gap-4 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-sm"
                >
                  Simpan Data Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}