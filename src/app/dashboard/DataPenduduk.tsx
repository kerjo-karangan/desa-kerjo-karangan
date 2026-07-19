// src/components/dashboard/DataPenduduk.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function DataPenduduk() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [daftarPenduduk, setDaftarPenduduk] = useState<any[]>([]);

  const ambilDataPenduduk = async () => {
    try {
      const snap = await getDocs(collection(db, "kependudukan"));
      setDaftarPenduduk(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data penduduk:", error);
    }
  };

  useEffect(() => {
    ambilDataPenduduk();
  }, []);

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        if (row.length >= 6 && row[3] && row[5]) { 
          try {
            await addDoc(collection(db, "kependudukan"), {
              dusun: row[0]?.trim() || "",
              rw: row[1]?.trim() || "",
              rt: row[2]?.trim() || "",
              nama: row[3]?.trim() || "",
              no_kk: row[4]?.trim() || "",
              nik: row[5]?.trim() || "",
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
          } catch (err) {
            console.error("Gagal import baris ke", i);
          }
        }
      }
      
      alert(`✅ Import Selesai! Berhasil memasukkan ${successCount} data penduduk.`);
      ambilDataPenduduk();
      setIsImporting(false);
      setCsvFile(null);
    };
    reader.readAsText(csvFile);
  };

  const hapusPenduduk = async (id: string) => {
    if (confirm("Yakin ingin menghapus data penduduk ini secara permanen?")) {
      await deleteDoc(doc(db, "kependudukan", id));
      ambilDataPenduduk();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-500">
        <h3 className="text-2xl font-bold mb-2">📥 Impor Data Kependudukan (CSV)</h3>
        <p className="text-gray-500 text-sm mb-6">
          Unggah file Excel (yang telah di-Save As menjadi format .csv) untuk memperbarui data penduduk desa secara otomatis ke dalam sistem.
        </p>
        
        <form onSubmit={handleImportCSV} className="flex flex-col md:flex-row gap-4 items-end bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-purple-900 mb-2">Pilih File CSV (.csv)</label>
            <input 
              type="file" 
              accept=".csv" 
              required
              onChange={(e) => {if(e.target.files) setCsvFile(e.target.files[0])}} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-purple-700 hover:file:bg-gray-100 cursor-pointer border border-purple-200 rounded-xl bg-white" 
            />
          </div>
          <button type="submit" disabled={isImporting} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md">
            {isImporting ? "Mengekstrak Data..." : "Mulai Import Data"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-gray-800">Database Penduduk Aktif</h4>
          <span className="bg-purple-100 text-purple-800 font-bold px-4 py-1 rounded-full text-sm">{daftarPenduduk.length} Jiwa Terdata</span>
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
            {daftarPenduduk.slice(0, 50).map((penduduk) => (
              <tr key={penduduk.id} className="border-b hover:bg-purple-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-900 text-base">{penduduk.nama}</div>
                  <div className="text-xs font-mono text-purple-600 font-bold tracking-wider mt-1">{penduduk.nik}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-700">{penduduk.dusun}</div>
                  <div className="text-xs text-gray-500">RW: {penduduk.rw} / RT: {penduduk.rt}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-800 font-medium">{penduduk.tempat_lahir}, {penduduk.tanggal_lahir}</div>
                  <div className="text-xs text-gray-500">{penduduk.pendidikan}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => hapusPenduduk(penduduk.id)} className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                    Hapus Data
                  </button>
                </td>
              </tr>
            ))}
            {daftarPenduduk.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500 font-medium border-2 border-dashed rounded-xl">Belum ada data penduduk yang diimpor ke sistem.</td></tr>
            )}
            {daftarPenduduk.length > 50 && (
              <tr><td colSpan={4} className="text-center py-4 text-purple-600 font-bold bg-purple-50">+ {daftarPenduduk.length - 50} data lainnya disembunyikan untuk menjaga performa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}