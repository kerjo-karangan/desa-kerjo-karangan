"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TransparansiData() {
  const [apbdesData, setApbdesData] = useState([0, 0, 0, 0]);
  const [daftarRegulasi, setDaftarRegulasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data APBDes dan Regulasi dari Firestore
  useEffect(() => {
    const ambilData = async () => {
      try {
        // 1. Ambil Angka APBDes
        const docRef = doc(db, "transparansi", "apbdes");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setApbdesData([ data.dana_desa || 0, data.alokasi_dana_desa || 0, data.pad || 0, data.banprov || 0 ]);
        }

        // 2. Ambil Daftar Dokumen Regulasi
        const qRegulasi = query(collection(db, "regulasi_desa"), orderBy("tahun", "desc"));
        const snapRegulasi = await getDocs(qRegulasi);
        const dataReg: any[] = [];
        snapRegulasi.forEach(doc => dataReg.push({ id: doc.id, ...doc.data() }));
        setDaftarRegulasi(dataReg);

      } catch (error) {
        console.error("Gagal mengambil data transparansi:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  const totalAnggaran = apbdesData.reduce((a, b) => a + b, 0);

  const dataPendapatan = {
    labels: ['Dana Desa (DD)', 'Alokasi Dana Desa (ADD)', 'Pendapatan Asli Desa', 'Bantuan Provinsi'],
    datasets: [{
        data: apbdesData,
        backgroundColor: ['#16a34a', '#2563eb', '#eab308', '#ec4899'],
        hoverBackgroundColor: ['#15803d', '#1d4ed8', '#ca8a04', '#be185d'],
        borderWidth: 0,
    }],
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  };

  const formatMiliar = (angka: number) => {
    if (angka >= 1000000000) return `Rp ${(angka / 1000000000).toFixed(2)} M`;
    if (angka >= 1000000) return `Rp ${(angka / 1000000).toFixed(0)} Jt`;
    return "Rp 0";
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold uppercase text-sm mb-2 block">Keterbukaan Informasi</span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Transparansi Desa</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Wujud komitmen Pemerintah Desa Kerjo dalam pengelolaan anggaran yang bersih.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-16">
        
        {/* BAGIAN GRAFIK APBDES UTUH */}
        <section>
          <div className="text-center mb-10"><h2 className="text-3xl font-extrabold text-gray-900 mb-3">Postur APBDes Tahun Berjalan</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-center relative">
              <div className="w-64 h-64 md:w-80 md:h-80">
                {loading ? (<div className="w-full h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>) : (
                  <Doughnut data={dataPendapatan} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                )}
              </div>
              {!loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-gray-400 uppercase">Total Pendapatan</span>
                  <span className="text-xl font-black text-gray-800">{formatMiliar(totalAnggaran)}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Rincian Sumber Dana</h3>
              {loading ? (<div className="animate-pulse space-y-3"><div className="h-8 bg-gray-200 rounded"></div><div className="h-8 bg-gray-200 rounded"></div></div>) : (
                dataPendapatan.labels.map((label, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: dataPendapatan.datasets[0].backgroundColor[index] }}></span>
                      <span className="text-gray-700 font-semibold text-sm md:text-base">{label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatRupiah(dataPendapatan.datasets[0].data[index])}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* BAGIAN REGULASI (SUDAH DINAMIS) */}
        <section>
          <div className="mb-8 border-b-2 border-green-600 pb-4">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Produk Hukum & Dokumen</h2>
            <p className="text-gray-500 text-sm">Arsip peraturan desa (Perdes), laporan penyelenggaraan, dan SK Kades yang dapat diunduh bebas oleh publik.</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="py-4 px-6 font-bold">Tahun</th>
                    <th className="py-4 px-6 font-bold">Jenis</th>
                    <th className="py-4 px-6 font-bold">Judul Dokumen</th>
                    <th className="py-4 px-6 font-bold text-center">Tautan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-10"><div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></td></tr>
                  ) : daftarRegulasi.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-500">Belum ada dokumen yang dipublikasikan.</td></tr>
                  ) : (
                    daftarRegulasi.map((dok) => (
                      <tr key={dok.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-black text-gray-800 text-lg">{dok.tahun}</td>
                        <td className="py-4 px-6"><span className="bg-gray-200 px-3 py-1 rounded-md text-xs font-bold">{dok.jenis}</span></td>
                        <td className="py-4 px-6 font-bold text-gray-700">{dok.judul}</td>
                        <td className="py-4 px-6 text-center">
                          <a href={dok.link} target="_blank" rel="noreferrer" className="inline-block bg-green-100 hover:bg-green-600 hover:text-white text-green-700 px-4 py-2 rounded-xl font-bold transition-colors">
                            📥 Unduh Berkas
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}