// src/components/dashboard/LayananWarga.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, doc, query, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function LayananWarga() {
  const [daftarSurat, setDaftarSurat] = useState<any[]>([]);
  const [daftarPengaduan, setDaftarPengaduan] = useState<any[]>([]);
  
  const [editSuratId, setEditSuratId] = useState<string | null>(null);
  const [editSuratNama, setEditSuratNama] = useState("");
  const [editSuratNik, setEditSuratNik] = useState("");
  const [editSuratJenis, setEditSuratJenis] = useState("");
  const [editSuratKeperluan, setEditSuratKeperluan] = useState("");
  const [isLoadingSuratAdmin, setIsLoadingSuratAdmin] = useState(false);

  const ambilDataLayanan = async () => {
    try {
      const qSurat = query(collection(db, "layanan_surat"), orderBy("tanggal_pengajuan", "desc"));
      setDaftarSurat((await getDocs(qSurat)).docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qPengaduan = query(collection(db, "pengaduan_warga"), orderBy("tanggal_laporan", "desc"));
      setDaftarPengaduan((await getDocs(qPengaduan)).docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data layanan", error);
    }
  };

  useEffect(() => {
    ambilDataLayanan();
  }, []);

  const ubahStatusSurat = async (id: string, statusBaru: string) => {
    try {
      await updateDoc(doc(db, "layanan_surat", id), { status_berkas: statusBaru });
      ambilDataLayanan();
    } catch (error) {
      alert("Gagal merubah status surat.");
    }
  };

  const mulaiEditSurat = (item: any) => {
    setEditSuratId(item.id);
    setEditSuratNama(item.nama);
    setEditSuratNik(item.nik);
    setEditSuratJenis(item.jenis_surat);
    setEditSuratKeperluan(item.keperluan);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditSurat = () => {
    setEditSuratId(null);
    setEditSuratNama("");
    setEditSuratNik("");
    setEditSuratJenis("");
    setEditSuratKeperluan("");
  };

  const simpanEditSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSuratAdmin(true);
    try {
      if (editSuratId) {
        await updateDoc(doc(db, "layanan_surat", editSuratId), {
          nama: editSuratNama,
          nik: editSuratNik,
          jenis_surat: editSuratJenis,
          keperluan: editSuratKeperluan,
        });
        alert("✅ Data permohonan surat berhasil diperbaiki.");
        batalEditSurat();
        ambilDataLayanan();
      }
    } catch (error) {
      alert("❌ Gagal memperbaiki data surat.");
    } finally {
      setIsLoadingSuratAdmin(false);
    }
  };

  const hapusSurat = async (id: string) => {
    if (confirm("Yakin ingin menghapus berkas pengajuan ini secara permanen?")) {
      await deleteDoc(doc(db, "layanan_surat", id));
      ambilDataLayanan();
    }
  };

  const hapusPengaduan = async (id: string) => {
    if (confirm("Yakin hapus pengaduan ini?")) {
      await deleteDoc(doc(db, "pengaduan_warga", id));
      ambilDataLayanan();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500">
        <h3 className="text-2xl font-bold mb-2">📄 Antrean Surat Masuk</h3>
        <p className="text-gray-500 text-sm mb-6">
          Pantau dan proses permohonan surat warga yang masuk melalui sistem Layanan Mandiri.
        </p>

        {/* FORM EDIT SURAT ADMIN */}
        {editSuratId && (
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-yellow-900 text-lg">
                ✏️ Koreksi Data Pengajuan (Resi: {editSuratNik})
              </h4>
              <button onClick={batalEditSurat} className="bg-gray-300 hover:bg-gray-400 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Batal Koreksi
              </button>
            </div>
            <form onSubmit={simpanEditSurat} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-gray-700">Nama Pemohon</label>
                <input type="text" value={editSuratNama} onChange={(e) => setEditSuratNama(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Nomor NIK</label>
                <input type="text" value={editSuratNik} onChange={(e) => setEditSuratNik(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Jenis Surat</label>
                <input type="text" value={editSuratJenis} onChange={(e) => setEditSuratJenis(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Keperluan</label>
                <input type="text" value={editSuratKeperluan} onChange={(e) => setEditSuratKeperluan(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white" />
              </div>
              <button type="submit" disabled={isLoadingSuratAdmin} className="md:col-span-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors">
                {isLoadingSuratAdmin ? "Menyimpan Perubahan..." : "Simpan Data Koreksi"}
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-4 px-4 font-bold text-gray-600">Resi & Tanggal</th>
                <th className="py-4 px-4 font-bold text-gray-600">Identitas Pemohon</th>
                <th className="py-4 px-4 font-bold text-gray-600">Jenis Surat & Lampiran Berkas</th>
                <th className="py-4 px-4 font-bold text-gray-600 text-center">Status</th>
                <th className="py-4 px-4 font-bold text-gray-600 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody>
              {daftarSurat.map((surat) => (
                <tr key={surat.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="block font-mono font-bold text-blue-700 text-base">{surat.resi}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(surat.tanggal_pengajuan).toLocaleDateString("id-ID")}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="block font-bold text-gray-900 text-base">{surat.nama}</span>
                    <span className="text-xs text-gray-500 font-mono tracking-wide">NIK: {surat.nik}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="block font-bold text-green-700 mb-1">{surat.jenis_surat}</span>
                    <span className="text-xs text-gray-600 max-w-xs block mb-3 italic">"{surat.keperluan}"</span>
                    
                    {surat.berkas_syarat && surat.berkas_syarat.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {surat.berkas_syarat.map((url: string, i: number) => (
                          <a key={i} href={`https://wsrv.nl/?url=${url}`} target="_blank" rel="noopener noreferrer" className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 shadow-sm">
                            <span>🖼️</span> Buka Berkas {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      surat.status_berkas === "Diajukan" ? "bg-red-100 text-red-700" : surat.status_berkas === "Verifikasi" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    }`}>
                      {surat.status_berkas}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex flex-col gap-2 justify-center">
                    {surat.status_berkas === "Diajukan" && (
                      <button onClick={() => ubahStatusSurat(surat.id, "Verifikasi")} className="bg-yellow-400 font-bold px-3 py-2 rounded-lg text-xs hover:bg-yellow-500 shadow-sm">
                        Verifikasi Berkas
                      </button>
                    )}
                    {surat.status_berkas === "Verifikasi" && (
                      <button onClick={() => ubahStatusSurat(surat.id, "Selesai")} className="bg-green-500 text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-green-600 shadow-sm">
                        Tandai Selesai
                      </button>
                    )}
                    <button onClick={() => mulaiEditSurat(surat)} className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-lg text-xs shadow-sm">
                      Koreksi Teks
                    </button>
                    <button onClick={() => hapusSurat(surat.id)} className="text-red-500 font-bold text-xs mt-1 hover:underline">
                      Hapus Permanen
                    </button>
                  </td>
                </tr>
              ))}
              {daftarSurat.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 font-medium">Belum ada permohonan surat masuk.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold mt-4 mb-2">📢 Kotak Pengaduan Warga</h3>
        <p className="text-gray-500 text-sm mb-6">
          Daftar laporan dan aspirasi dari warga. Tanggapi dengan cepat untuk pelayanan prima.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {daftarPengaduan.map((lap) => (
            <div key={lap.id} className="border border-gray-200 p-6 rounded-2xl flex justify-between bg-gray-50 relative hover:shadow-md transition-shadow">
              <button onClick={() => hapusPengaduan(lap.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-lg bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center" title="Hapus Pengaduan">✖</button>
              <div className="flex gap-5">
                {lap.foto_bukti && (
                  <a href={`https://wsrv.nl/?url=${lap.foto_bukti}`} target="_blank" rel="noreferrer" className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm block hover:opacity-80 flex-shrink-0">
                    <img src={`https://wsrv.nl/?url=${lap.foto_bukti}`} alt="Bukti Laporan" className="w-full h-full object-cover" />
                  </a>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 pr-8">{lap.judul}</h4>
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                    <span>📅</span> {new Date(lap.tanggal_laporan).toLocaleDateString("id-ID")} • 
                    <span className="text-blue-600">{lap.anonim ? "👤 Pelapor Anonim" : "Terverifikasi"}</span>
                  </span>
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed border-t border-gray-200 pt-2">{lap.isi}</p>
                </div>
              </div>
            </div>
          ))}
          {daftarPengaduan.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-10 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium">Kotak pengaduan masih kosong.</div>
          )}
        </div>
      </div>
    </div>
  );
}