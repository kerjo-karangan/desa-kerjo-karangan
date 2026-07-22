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

// ==========================================
// KAMUS MAPPING ANGKA KE TEKS (Otomatisasi Excel)
// ==========================================
const MAP_AGAMA: any = { 
  1: "ISLAM", 
  2: "KRISTEN", 
  3: "KATHOLIK", 
  4: "HINDU", 
  5: "BUDHA", 
  6: "KONGHUCU", 
  7: "KEPERCAYAAN TERHADAP TUHAN YME" 
};

const MAP_GENDER: any = { 
  1: "LAKI-LAKI", 
  2: "PEREMPUAN" 
};

const MAP_PENDIDIKAN: any = { 
  1: "TIDAK / BELUM SEKOLAH", 
  2: "BELUM TAMAT SD/SEDERAJAT", 
  3: "TAMAT SD / SEDERAJAT", 
  4: "SLTP/SEDERAJAT", 
  5: "SLTA/SEDERAJAT", 
  6: "DIPLOMA I/II", 
  7: "AKADEMI/DIPLOMA III/S.MUDA", 
  8: "DIPLOMA IV/STRATA I", 
  9: "STRATA II", 
  10: "STRATA III" 
};

const MAP_KAWIN: any = { 
  1: "BELUM KAWIN", 
  2: "KAWIN", 
  3: "CERAI HIDUP", 
  4: "CERAI MATI" 
};

const MAP_HUBUNGAN: any = { 
  1: "KEPALA KELUARGA", 
  2: "SUAMI", 
  3: "ISTRI", 
  4: "ANAK", 
  5: "MENANTU", 
  6: "CUCU", 
  7: "ORANG TUA", 
  8: "MERTUA", 
  9: "FAMILI LAIN", 
  10: "PEMBANTU", 
  11: "LAINNYA" 
};

const MAP_DARAH: any = { 
  1: "A", 
  2: "B", 
  3: "AB", 
  4: "O", 
  5: "A+", 
  6: "A-", 
  7: "B+", 
  8: "B-", 
  9: "AB+", 
  10: "AB-", 
  11: "O+", 
  12: "O-", 
  13: "TIDAK TAHU" 
};

const MAP_WARGA: any = { 
  1: "WNI", 
  2: "WNA", 
  3: "DUA KEWARGANEGARAAN" 
};

// ==========================================
// MESIN PEMBERSIH & PENCARI KOLOM (FUZZY MATCHING)
// ==========================================
const bersihkanTeks = (text: any) => {
  if (text === null || text === undefined || String(text).trim() === "") {
    return "-";
  }
  return String(text).toUpperCase().trim();
};

const mapData = (value: any, kamus: any) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }
  const numValue = Number(value);
  if (!isNaN(numValue) && kamus[numValue]) {
    return kamus[numValue];
  }
  return bersihkanTeks(value);
};

const findKey = (row: any, possibleKeys: string[]) => {
  const keys = Object.keys(row);
  for (const key of keys) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, ""); 
    for (const pk of possibleKeys) {
      const lowerPk = pk.toLowerCase().replace(/[^a-z0-9]/g, ""); 
      if (lowerKey.includes(lowerPk)) {
        return row[key];
      }
    }
  }
  return "";
};

const generateIdAcak = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ==========================================
// KOMPONEN UTAMA DATA PENDUDUK
// ==========================================
export default function DataPenduduk({ 
  activeSubMenu 
}: DataPendudukProps) {
  
  const defaultTab = activeSubMenu === "data-hero" ? "hero" 
                   : activeSubMenu === "data-upload" ? "upload" 
                   : "kelola";
                   
  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "data-hero") {
      setTabAktif("hero");
    } else if (activeSubMenu === "data-upload") {
      setTabAktif("upload");
    } else {
      setTabAktif("kelola");
    }
  }, [activeSubMenu]);

  // STATE HEADER DATA DESA
  const [heroJudul, setHeroJudul] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroBgList, setHeroBgList] = useState<FileList | null>(null);
  const [heroBgLama, setHeroBgLama] = useState("");
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  // STATE KELOLA PENDUDUK
  const [daftarPenduduk, setDaftarPenduduk] = useState<any[]>([]);
  const [daftarKeluarga, setDaftarKeluarga] = useState<any[]>([]); 
  const [loadingData, setLoadingData] = useState(true);
  const [statusProses, setStatusProses] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // STATE MODAL EDIT / TAMBAH MANUAL
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
    nama_ayah: "",
    nama_ibu: "",
    golongan_darah: ""
  });

  const ambilData = async () => {
    setLoadingData(true);
    try {
      const snapHero = await getDoc(doc(db, "pengaturan_web", "datadesa_hero"));
      if (snapHero.exists() && snapHero.data()) {
        setHeroJudul(snapHero.data().judul || "Data Demografi Desa");
        setHeroSub(snapHero.data().sub || "Visualisasi data kependudukan yang akurat dan transparan.");
        setHeroBgLama(snapHero.data().bg || "");
      }

      const snapPenduduk = await getDocs(collection(db, "data_penduduk"));
      const dataPend = snapPenduduk.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as any) 
      }));
      
      setDaftarPenduduk(dataPend);

      const unikKeluargaMap = new Map();
      dataPend.forEach((p: any) => {
        if (p.id_keluarga && p.hubungan_keluarga === "KEPALA KELUARGA") {
          unikKeluargaMap.set(p.id_keluarga, { 
            id: p.id_keluarga, 
            kepala: p.nama 
          });
        }
      });
      
      setDaftarKeluarga(Array.from(unikKeluargaMap.values()));

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    ambilData();
  }, []);

  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        return data.url;
      }
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
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingHero(true);
    setStatusHero("Menyimpan Header...");
    
    try {
      let imageUrl = heroBgLama;
      if (heroBgList && heroBgList.length > 0) {
        setStatusHero("Mengunggah gambar ke Cloudinary...");
        const newBg = await uploadFotoKeCloudinary(heroBgList[0]);
        if (newBg) {
          if (heroBgLama) {
            await hapusFotoDiCloudinary(heroBgLama);
          }
          imageUrl = newBg;
        }
      }
      
      await setDoc(doc(db, "pengaturan_web", "datadesa_hero"), {
        judul: heroJudul, 
        sub: heroSub, 
        bg: imageUrl, 
        terakhir_diperbarui: new Date().toISOString()
      });
      
      setStatusHero("✅ Pengaturan Header berhasil diperbarui!");
      setHeroBgLama(imageUrl); 
      setHeroBgList(null);
      
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menyimpan pengaturan.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  // ==========================================
  // LOGIKA IMPOR EXCEL & ENKRIPSI
  // ==========================================
  const tanganiUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

        const firstRowKeys = Object.keys(sheetData[0] as object);
        if (firstRowKeys.length === 1 && firstRowKeys[0].includes(";")) {
          const keys = firstRowKeys[0].split(";");
          sheetData = sheetData.map((row: any) => {
            const rawValue = row[firstRowKeys[0]];
            const values = rawValue !== undefined && rawValue !== null ? String(rawValue).split(";") : [];
            const newRow: any = {};
            keys.forEach((k, i) => {
              newRow[k.trim()] = values[i] !== undefined ? String(values[i]).trim() : "";
            });
            return newRow;
          });
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

          const idWarga = `W-${generateIdAcak()}`;

          const dataBersih = {
            id_keluarga: idKeluarga,
            id_warga: idWarga,
            dusun: bersihkanTeks(findKey(baris, ["dusun", "kampung"])),
            rw: bersihkanTeks(findKey(baris, ["rw", "rukunwarga"])),
            rt: bersihkanTeks(findKey(baris, ["rt", "rukuntetangga"])),
            nama: bersihkanTeks(findKey(baris, ["nama", "namalengkap"])),
            jenis_kelamin: mapData(findKey(baris, ["kelamin", "gender"]), MAP_GENDER),
            tempat_lahir: bersihkanTeks(findKey(baris, ["tempatlahir", "lahir"])),
            tanggal_lahir: bersihkanTeks(findKey(baris, ["tanggallahir", "tgl"])),
            agama: mapData(findKey(baris, ["agama"]), MAP_AGAMA),
            pendidikan: mapData(findKey(baris, ["pendidikan", "sekolah"]), MAP_PENDIDIKAN),
            pekerjaan: bersihkanTeks(findKey(baris, ["kerja", "profesi"])), 
            status_kawin: mapData(findKey(baris, ["kawin", "nikah", "perkawinan"]), MAP_KAWIN),
            hubungan_keluarga: mapData(findKey(baris, ["hubungan", "statuskeluarga"]), MAP_HUBUNGAN),
            kewarganegaraan: mapData(findKey(baris, ["warga", "negara"]), MAP_WARGA),
            nama_ayah: bersihkanTeks(findKey(baris, ["ayah"])),
            nama_ibu: bersihkanTeks(findKey(baris, ["ibu"])),
            golongan_darah: mapData(findKey(baris, ["darah", "gol"]), MAP_DARAH),
            tanggal_input: new Date().toISOString()
          };

          batchDataMurni.push(dataBersih);
        }

        if (batchDataMurni.length === 0) {
           setStatusProses("❌ Gagal. Tidak ada data valid (No KK hilang/kosong).");
           alert(`Proses Gagal!\n\nTidak ada data yang valid.\nPastikan kolom "NO_KK" (Nomor KK) tersedia di file Excel/CSV Anda.`);
           return;
        }

        setStatusProses(`Mengunggah ${batchDataMurni.length} data terenkripsi ke Database...`);

        if (daftarPenduduk.length > 0) {
          const hapusLama = confirm(`Terdapat ${daftarPenduduk.length} data lama di database. Klik "OK" jika Anda ingin MENGHAPUS data lama dan menggantinya dengan yang baru. Klik "Cancel" jika ingin MENGGABUNGKAN data.`);
          if (hapusLama) {
            setStatusProses("Membersihkan data lama...");
            for (const p of daftarPenduduk) {
              await deleteDoc(doc(db, "data_penduduk", p.id));
            }
          }
        }

        for (const data of batchDataMurni) {
          await addDoc(collection(db, "data_penduduk"), data);
        }

        setStatusProses("");
        alert(`✅ Proses Import & Enkripsi Selesai!\n\n📊 Ringkasan:\n- Berhasil diimpor: ${batchDataMurni.length} data\n- Dilewati (Baris kosong/Tanpa KK): ${skippedData} data`);
        ambilData();
        
      } catch (error: any) {
        setStatusProses(`❌ Terjadi kesalahan: ${error.message}`);
      }
    };
    
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // ==========================================
  // HANDLER MODAL MANUAL
  // ==========================================
  const bukaModalTambah = () => {
    setEditId(null);
    setFormData({
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
      nama_ayah: "", 
      nama_ibu: "", 
      golongan_darah: ""
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
      let finalIdKeluarga = formData.id_keluarga;
      if (finalIdKeluarga === "BARU" || finalIdKeluarga === "") {
        finalIdKeluarga = `KEL-${generateIdAcak()}`;
      }

      const payload = {
        ...formData,
        id_keluarga: finalIdKeluarga,
        nama: bersihkanTeks(formData.nama),
        pekerjaan: bersihkanTeks(formData.pekerjaan),
        tempat_lahir: bersihkanTeks(formData.tempat_lahir),
        dusun: bersihkanTeks(formData.dusun),
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

  const dataTerfilter = daftarPenduduk.filter((p) => 
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id_keluarga?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* Sembunyikan Tombol Internal Jika Mengakses via Sidebar */}
      {!activeSubMenu && (
        <div 
          className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100"
        >
          <button 
            onClick={() => setTabAktif("kelola")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "kelola" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span 
              className="text-xl"
            >
              👥
            </span> 
            Daftar Penduduk
          </button>
          
          <button 
            onClick={() => setTabAktif("upload")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "upload" 
              ? "bg-green-600 text-white shadow-md" 
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span 
              className="text-xl"
            >
              📄
            </span> 
            Impor Excel
          </button>
          
          <button 
            onClick={() => setTabAktif("hero")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "hero" 
              ? "bg-yellow-500 text-white shadow-md" 
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span 
              className="text-xl"
            >
              🖼️
            </span> 
            Pengaturan Publik
          </button>
        </div>
      )}

      {/* ==========================================
          TAB 1: TABEL KELOLA PENDUDUK
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
                Data NIK dan No. KK telah dienkripsi (diubah menjadi ID Warga & ID Keluarga).
              </p>
            </div>
            <div 
              className="flex items-center gap-3 w-full md:w-auto"
            >
              <input 
                type="text" 
                placeholder="Cari Nama / ID Keluarga..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 p-2.5 rounded-xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              />
              <button 
                onClick={bukaModalTambah} 
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
              >
                <span>➕</span> 
                Tambah Manual
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
                    <td 
                      colSpan={4} 
                      className="text-center py-10 font-bold text-gray-400"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : dataTerfilter.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={4} 
                      className="text-center py-10 font-bold text-gray-400"
                    >
                      Belum ada data penduduk.
                    </td>
                  </tr>
                ) : (
                  dataTerfilter.map((p) => (
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
                          <span 
                            className="font-bold"
                          >
                            Alamat:
                          </span> 
                          {p.dusun !== "-" ? `Dusun ${p.dusun}, RT ${p.rt}/RW ${p.rw}` : "-"}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Lahir:
                          </span> 
                          {p.tempat_lahir}, {p.tanggal_lahir}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Gender:
                          </span> 
                          {p.jenis_kelamin}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Agama:
                          </span> 
                          {p.agama}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Pendidikan:
                          </span> 
                          {p.pendidikan}
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
                          <span 
                            className="font-bold"
                          >
                            Status Kawin:
                          </span> 
                          {p.status_kawin}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Pekerjaan:
                          </span> 
                          {p.pekerjaan}
                          <br/>
                          <span 
                            className="font-bold"
                          >
                            Darah:
                          </span> 
                          {p.golongan_darah}
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
        </div>
      )}

      {/* ==========================================
          TAB 2: IMPOR EXCEL
      ========================================== */}
      {tabAktif === "upload" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            📄 Impor Data Demografi Massal
          </h3>
          <p 
            className="text-gray-500 text-sm mb-6 leading-relaxed max-w-3xl"
          >
            Sistem pintar ini secara otomatis akan menoleransi file <b>CSV bersimbol titik koma (;)</b>, memetakan angka menjadi teks (misal: 1 menjadi ISLAM), dan memusnahkan NIK/KK asli untuk diganti menjadi Enkripsi ID Warga demi keamanan mutlak.
          </p>

          <div 
            className="bg-green-50 border-2 border-dashed border-green-300 p-10 rounded-3xl text-center"
          >
            <span 
              className="text-6xl mb-4 block"
            >
              📊
            </span>
            <label 
              className="bg-green-600 hover:bg-green-700 text-white font-black py-4 px-8 rounded-xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-1 inline-block"
            >
              Pilih File Excel / CSV (.xlsx, .csv)
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={tanganiUploadExcel} 
                className="hidden" 
              />
            </label>
            <p 
              className="mt-4 text-xs font-bold text-green-800"
            >
              Sistem telah diperbarui dengan Fuzzy Matcher (Kebal Typo).
            </p>
          </div>

          {statusProses && (
            <div 
              className={`mt-6 p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${
                statusProses.includes("❌") 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-blue-50 text-blue-800 border-blue-300"
              }`}
            >
              {statusProses}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: HEADER PUBLIK
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2"
          >
            🖼️ Pengaturan Halaman Publik (Cloudinary)
          </h3>
          <p 
            className="text-gray-500 text-sm mb-6"
          >
            Sesuaikan gambar background dan teks sambutan di halaman Visualisasi Data Desa warga.
          </p>
          
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
                    className="block text-sm font-bold mb-2 text-gray-800"
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
                    className="block text-sm font-bold mb-2 text-gray-800"
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
                  className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2"
                >
                  Gambar Background Publik
                </label>
                {heroBgLama && (
                  <div 
                    className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner border border-gray-200 group"
                  >
                    <img 
                      src={heroBgLama.startsWith("http") ? heroBgLama : `https://wsrv.nl/?url=${heroBgLama}`} 
                      className="w-full h-full object-cover" 
                      alt="Hero"
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
            
            {statusHero && (
              <div 
                className="p-4 rounded-xl text-sm font-bold text-center bg-green-100 text-green-800 border-green-300"
              >
                {statusHero}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoadingHero} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoadingHero ? "Menyimpan Pengaturan..." : "Simpan Header Publik"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL TAMBAH & EDIT
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
              <div 
                className="bg-blue-50 p-5 rounded-2xl border border-blue-200"
              >
                <label 
                  className="block text-sm font-bold text-blue-900 mb-2"
                >
                  Keluarga Induk (Enkripsi Berlaku)
                </label>
                <select 
                  required 
                  value={formData.id_keluarga} 
                  onChange={(e) => setFormData({...formData, id_keluarga: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-blue-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800"
                >
                  <option 
                    value="" 
                    disabled
                  >
                    -- Pilih Status Keluarga --
                  </option>
                  <option 
                    value="BARU"
                  >
                    🟢 BENTUK KELUARGA BARU (KK TERPISAH)
                  </option>
                  <optgroup 
                    label="Gabung ke Keluarga yang Sudah Terdaftar:"
                  >
                    {daftarKeluarga.map((kel) => (
                      <option 
                        key={kel.id} 
                        value={kel.id}
                      >
                        Gabung: Keluarga {kel.kepala} ({kel.id})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p 
                  className="text-[10px] text-blue-600 mt-2 font-bold leading-relaxed"
                >
                  Sistem memblokir input Nomor KK demi privasi. Silakan hubungkan warga ini dengan ID Keluarga yang sudah ada, atau buat yang baru.
                </p>
              </div>

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
                    <input 
                      type="text" 
                      value={formData.dusun} 
                      onChange={(e) => setFormData({...formData, dusun: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 uppercase text-sm" 
                    />
                  </div>
                  <div 
                    className="w-1/3"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      RW
                    </label>
                    <input 
                      type="text" 
                      value={formData.rw} 
                      onChange={(e) => setFormData({...formData, rw: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 uppercase text-sm" 
                    />
                  </div>
                  <div 
                    className="w-1/3"
                  >
                    <label 
                      className="block text-xs font-bold mb-1.5 text-gray-700"
                    >
                      RT
                    </label>
                    <input 
                      type="text" 
                      value={formData.rt} 
                      onChange={(e) => setFormData({...formData, rt: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 uppercase text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Hubungan Keluarga
                  </label>
                  <select 
                    required 
                    value={formData.hubungan_keluarga} 
                    onChange={(e) => setFormData({...formData, hubungan_keluarga: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm font-bold"
                  >
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih Status Hubungan
                    </option>
                    {Object.values(MAP_HUBUNGAN).map((v:any) => (
                      <option 
                        key={v} 
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
                  </select>
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
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih
                    </option>
                    <option 
                      value="LAKI-LAKI"
                    >
                      LAKI-LAKI
                    </option>
                    <option 
                      value="PEREMPUAN"
                    >
                      PEREMPUAN
                    </option>
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
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih
                    </option>
                    {Object.values(MAP_AGAMA).map((v:any) => (
                      <option 
                        key={v} 
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
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
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih
                    </option>
                    {Object.values(MAP_PENDIDIKAN).map((v:any) => (
                      <option 
                        key={v} 
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
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
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih
                    </option>
                    {Object.values(MAP_KAWIN).map((v:any) => (
                      <option 
                        key={v} 
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
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
                    <option 
                      value="" 
                      disabled
                    >
                      Pilih
                    </option>
                    {Object.values(MAP_DARAH).map((v:any) => (
                      <option 
                        key={v} 
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div 
                  className="md:col-span-2"
                >
                  <label 
                    className="block text-xs font-bold mb-1.5 text-gray-700"
                  >
                    Pekerjaan (Ketik Manual)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.pekerjaan} 
                    onChange={(e) => setFormData({...formData, pekerjaan: e.target.value})} 
                    placeholder="Misal: PETANI / WIRASWASTA" 
                    className="w-full p-3 rounded-xl border border-gray-300 outline-none bg-gray-50 text-sm uppercase" 
                  />
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