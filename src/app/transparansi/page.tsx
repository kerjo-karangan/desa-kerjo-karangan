"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useSearchParams } from "next/navigation";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TransparansiData() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <TransparansiContent />
    </Suspense>
  );
}

function TransparansiContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [tabAktif, setTabAktif] = useState("apbdes");

  const [apbdesData, setApbdesData] = useState([0, 0, 0, 0]);
  const [daftarRegulasi, setDaftarRegulasi] = useState<any[]>([]);
  const [daftarRealisasi, setDaftarRealisasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabQuery === "apbdes" || tabQuery === "realisasi" || tabQuery === "regulasi") {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "transparansi", "apbdes"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setApbdesData([ data.dana_desa || 0, data.alokasi_dana_desa || 0, data.pad || 0, data.banprov || 0 ]);
        }
        setDaftarRegulasi((await getDocs(query(collection(db, "regulasi_desa"), orderBy("tahun", "desc")))).docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDaftarRealisasi((await getDocs(query(collection(db, "realisasi_desa"), orderBy("tanggal_input", "desc")))).docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error", error); } finally { setLoading(false); }
    };
    ambilData();
  }, []);

  const totalAnggaran = apbdesData.reduce((a, b) => a + b, 0);
  const dataPendapatan = {
    labels: ['Dana Desa (DD)', 'Alokasi Dana Desa (ADD)', 'Pendapatan Asli Desa', 'Bantuan Provinsi'],
    datasets: [{ data: apbdesData, backgroundColor: ['#16a34a', '#2563eb', '#eab308', '#ec4899'], borderWidth: 0 }],
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
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
          <span className="text-green-300 font-extrabold uppercase text-sm mb-2 block">Keterbukaan Informasi Publik</span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Transparansi Desa</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Wujud komitmen Pemerintah Desa Kerjo dalam pengelolaan anggaran yang bersih.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* TABS NAVIGASI TRANSPARANSI */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button onClick={() => setTabAktif("apbdes")} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${tabAktif === "apbdes" || !tabAktif ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-green-50"}`}>Grafik APBDes</button>
          <button onClick={() => setTabAktif("realisasi")} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${tabAktif === "realisasi" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-green-50"}`}>Realisasi Anggaran</button>
          <button onClick={() => setTabAktif("regulasi")} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${tabAktif === "regulasi" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-green-50"}`}>Dokumen Perdes</button>
        </div>

        {/* KONTEN ISOLASI: HANYA MUNCUL JIKA TAB COCOK */}
        {(tabAktif === "apbdes" || !tabAktif) && (
          <section className="animate-fade-in">
            <div className="text-center mb-10"><h2 className="text-3xl font-extrabold text-gray-900 mb-3">Postur APBDes Tahun Berjalan</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-center relative">
                <div className="w-64 h-64 md:w-80 md:h-80">
                  {loading ? <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div> : <Doughnut data={dataPendapatan} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
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
                {dataPendapatan.labels.map((label, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: dataPendapatan.datasets[0].backgroundColor[index] }}></span><span className="text-gray-700 font-semibold">{label}</span></div>
                    <span className="font-bold text-gray-900">{formatRupiah(dataPendapatan.datasets[0].data[index])}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tabAktif === "realisasi" && (
          <section className="animate-fade-in">
            <div className="mb-8 border-b-2 border-green-600 pb-4"><h2 className="text-3xl font-extrabold text-gray-900 mb-2">Realisasi Dana Desa</h2></div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
              {loading ? <p>Memuat...</p> : daftarRealisasi.map((item) => {
                  const persen = Math.round((item.terealisasi / item.pagu) * 100);
                  // PERBAIKAN BUG: Mencegah bar hijau tembus/melebihi box jika persentase > 100%
                  const persenVisual = persen > 100 ? 100 : persen;

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div><h4 className="font-bold text-gray-900">{item.nama_proyek}</h4><p className="text-xs text-gray-500">Pagu: {formatRupiah(item.pagu)}</p></div>
                        <div className="text-right"><span className="text-lg font-black text-green-700">{persen}%</span><p className="text-xs text-gray-500">Terealisasi: {formatRupiah(item.terealisasi)}</p></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-green-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${persenVisual}%` }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {tabAktif === "regulasi" && (
          <section className="animate-fade-in">
            <div className="mb-8 border-b-2 border-green-600 pb-4"><h2 className="text-3xl font-extrabold text-gray-900 mb-2">Produk Hukum & Dokumen</h2></div>
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="min-w-full text-left text-sm"><thead className="bg-green-50"><tr><th className="py-4 px-6">Tahun/Jenis</th><th className="py-4 px-6">Judul Dokumen</th><th className="py-4 px-6 text-center">Tautan</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={3} className="text-center py-10"><div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></td></tr> : daftarRegulasi.map((dok) => (
                    <tr key={dok.id} className="border-b">
                      <td className="py-4 px-6"><span className="font-black text-gray-800 block">{dok.tahun}</span><span className="text-xs bg-gray-200 px-2 rounded font-bold">{dok.jenis}</span></td>
                      <td className="py-4 px-6 font-bold text-gray-700">{dok.judul}</td>
                      <td className="py-4 px-6 text-center"><a href={dok.link} target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold">Unduh</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}