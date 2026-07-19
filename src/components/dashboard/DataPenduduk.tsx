// src/components/dashboard/DataPenduduk.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function DataPenduduk() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [daftarPenduduk, setDaftarPenduduk] = useState<any[]>([]);

  // ==========================================
  // FUNGSI PENGAMBILAN DATA
  // ==========================================
  const ambilDataPenduduk = async () => {
    try {
      const snap = await getDocs(collection(db, "kependudukan"));
      // Mengambil data dan menyimpan ke state
      setDaftarPenduduk(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data penduduk:", error);
    }
  };

  useEffect(() => {
    ambilDataPenduduk();
  }, []);

  // ==========================================
  // FUNGSI IMPORT EXCEL (DENGAN DETEKSI NIK GANDA)
  // ==========================================
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setIsImporting(true);
    
    // 1. Ambil NIK yang sudah ada di database untuk mencegah duplikat
    const existingNiks = new Set(daftarPenduduk.map(p => p.nik));
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      
      let successCount = 0;
      let skipCount = 0;

      // 2. Melewati baris pertama (Header / Judul Kolom Excel)
      for (let i = 1; i < lines.length; i++) {
        // Memisahkan berdasarkan koma (Standar CSV)
        const row = lines[i].split(",");
        
        // Memastikan baris tersebut memiliki data yang cukup dan kolom NIK (index 5) tidak kosong
        if (row.length >= 6 && row[3] && row[5]) { 
          const nikBaru = row[5]?.trim();
          
          // 3. CEK DUPLIKAT: Jika NIK sudah ada, lewati dan catat sebagai 'skip'
          if (existingNiks.has(nikBaru)) {
            skipCount++;
            continue; 
          }

          try {
            await addDoc(collection(db, "kependudukan"), {
              dusun: row[0]?.trim() || "",
              rw: row[1]?.trim() || "",
              rt: row[2]?.trim() || "",
              nama: row[3]?.trim() || "",
              no_kk: row[4]?.trim() || "",
              nik: nikBaru,
              jk: row[6]?.trim() || "",
              tempat_lahir: row[7]?.trim() || "",
              tanggal_lahir: row[8]?.trim() || "",
              agama: row[9]?.trim() || "",
              pendidikan: row[10]?.trim() || "",
              pekerjaan: row[11]?.trim() || "",
              status_kawin: row[12]?.trim() || "",
              hub_keluarga: row[13]?.trim() || "",
              tanggal_input: new Date().toISOString()
            });
            successCount++;
            // Tambahkan NIK baru ke memori agar tidak duplikat jika ada 2 NIK sama di file Excel yang sama
            existingNiks.add(nikBaru); 
          } catch (err) {
            console.error("Gagal import baris ke", i);
          }
        }
      }
      
      // Laporan Hasil Import
      alert(`✅ Proses Import Selesai!\n\n📊 Ringkasan:\n- Berhasil diimpor: ${successCount} data\n- Dilewati (NIK sudah terdaftar): ${skipCount} data`);
      
      ambilDataPenduduk();
      setIsImporting(false);
      setCsvFile(null);
      
      // Reset input file di HTML
      const fileInput = document.getElementById("csvFileInput") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    };
    reader.readAsText(csvFile);
  };

  // ==========================================
  // FUNGSI EXPORT DATABASE KE CSV (MENGUNDUH EXCEL)
  // ==========================================
  const handleExportCSV = () => {
    if (daftarPenduduk.length === 0) {
      alert("Tidak ada data penduduk untuk diekspor.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // 1. Buat Header Kolom
      const headers = ["Dusun", "RW", "RT", "Nama_Lengkap", "No_KK", "NIK", "Jenis_Kelamin", "Tempat_Lahir", "Tanggal_Lahir", "Agama", "Pendidikan", "Pekerjaan", "Status_Kawin", "Hubungan_Keluarga"];
      
      // 2. Petakan Data Database ke format CSV
      const csvData = daftarPenduduk.map(p => {
        return [
          `"${p.dusun || ""}"`,
          `"${p.rw || ""}"`,
          `"${p.rt || ""}"`,
          `"${p.nama || ""}"`,
          `"${p.no_kk || ""}"`,
          `"${p.nik || ""}"`,
          `"${p.jk || ""}"`,
          `"${p.tempat_lahir || ""}"`,
          `"${p.tanggal_lahir || ""}"`,
          `"${p.agama || ""}"`,
          `"${p.pendidikan || ""}"`,
          `"${p.pekerjaan || ""}"`,
          `"${p.status_kawin || ""}"`,
          `"${p.hub_keluarga || ""}"`
        ].join(","); // Pisahkan tiap kolom dengan koma
      });

      // 3. Gabungkan Header dan Data
      const csvContent = [headers.join(","), ...csvData].join("\n");
      
      // 4. Buat file virtual untuk di-download browser
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // 5. Beri nama file yang diunduh (otomatis ada tanggal hari ini)
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `Data_Penduduk_Desa_${dateStr}.csv`);
      
      // 6. Jalankan klik otomatis
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      alert("❌ Terjadi kesalahan saat membuat file ekspor.");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // FUNGSI HAPUS SATUAN
  // ==========================================
  const hapusPenduduk = async (id: string) => {
    if (confirm("Yakin ingin menghapus data penduduk ini secara permanen dari database?")) {
      await deleteDoc(doc(db, "kependudukan", id));
      ambilDataPenduduk();
    }
  };

  // ==========================================
  // TAMPILAN ANTARMUKA (UI)
  // ==========================================
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* BAGIAN HEADER & IMPORT */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-500 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">📥 Impor & Ekspor Data Kependudukan</h3>
            <p className="text-gray-500 text-sm">
              Sistem akan otomatis mendeteksi dan mengabaikan NIK yang sudah ada untuk mencegah duplikasi data.
            </p>
          </div>
          
          {/* TOMBOL EXPORT DOWNLOAD */}
          <button 
            onClick={handleExportCSV} 
            disabled={isExporting || daftarPenduduk.length === 0}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-green-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Download seluruh data ke komputer Anda"
          >
            <span className="text-xl">📊</span> 
            {isExporting ? "Membuat File..." : "Unduh Data (CSV)"}
          </button>
        </div>
        
        {/* FORM UPLOAD */}
        <form onSubmit={handleImportCSV} className="flex flex-col md:flex-row gap-4 items-end bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-inner">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
              <span>📄</span> Pilih File Excel (.csv)
            </label>
            <input 
              id="csvFileInput"
              type="file" 
              accept=".csv" 
              required
              onChange={(e) => {if(e.target.files) setCsvFile(e.target.files[0])}} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-purple-700 hover:file:bg-gray-100 cursor-pointer border border-purple-200 rounded-xl bg-white shadow-sm transition-all" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isImporting} 
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none"
          >
            {isImporting ? "⏳ Memproses Data..." : "Mulai Import Data"}
          </button>
        </form>
      </div>

      {/* BAGIAN TABEL DATA PENDUDUK */}
      <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🗄️</span> Database Penduduk Aktif
          </h4>
          <span className="bg-purple-100 text-purple-800 border border-purple-200 font-bold px-4 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2">
            <span>👥</span> {new Intl.NumberFormat("id-ID").format(daftarPenduduk.length)} Jiwa Terdata
          </span>
        </div>
        
        <table className="min-w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-4 px-4 font-bold text-gray-600">Nama Lengkap & NIK</th>
              <th className="py-4 px-4 font-bold text-gray-600">Alamat (Dusun/RW/RT)</th>
              <th className="py-4 px-4 font-bold text-gray-600">Lahir & Pendidikan</th>
              <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {/* MEMBATASI TAMPILAN TABEL KE 50 AGAR LAPTOP/BROWSER TIDAK BERAT SAAT RIBUAN DATA */}
            {daftarPenduduk.slice(0, 50).map((penduduk) => (
              <tr key={penduduk.id} className="border-b hover:bg-purple-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-900 text-base">{penduduk.nama}</div>
                  <div className="text-xs font-mono text-purple-700 bg-purple-100 font-bold tracking-wider mt-1.5 px-2 py-0.5 rounded border border-purple-200 inline-block">
                    {penduduk.nik}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-700">{penduduk.dusun}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">RW: {penduduk.rw} / RT: {penduduk.rt}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-800 font-medium">{penduduk.tempat_lahir}, {penduduk.tanggal_lahir}</div>
                  <div className="text-xs text-gray-500 mt-1">{penduduk.pendidikan} • {penduduk.pekerjaan}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => hapusPenduduk(penduduk.id)} className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
                    Hapus Data
                  </button>
                </td>
              </tr>
            ))}
            
            {daftarPenduduk.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <span className="text-4xl block mb-3 opacity-50">📂</span>
                  Belum ada data penduduk yang diimpor ke sistem.
                </td>
              </tr>
            )}
            
            {/* Indikator Jika Data Lebih Dari 50 */}
            {daftarPenduduk.length > 50 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-purple-700 font-bold bg-purple-50 border-t border-purple-100">
                  <span className="animate-pulse flex justify-center items-center gap-2">
                    <span>⬇️</span> + {new Intl.NumberFormat("id-ID").format(daftarPenduduk.length - 50)} data lainnya disembunyikan untuk menjaga performa browser. 
                    Gunakan tombol "Unduh Data" di atas untuk melihat seluruh data.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}