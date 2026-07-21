// src/app/transparansi/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Komponen Pembungkus Suspense agar bebas Error Vercel
export default function TransparansiPublik() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <TransparansiContent />
    </Suspense>
  );
}

function TransparansiContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  const [daftarDokumen, setDaftarDokumen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE PENCARIAN & PAGINATION DINAMIS
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  useEffect(() => {
    const ambilData = async () => {
      try {
        const qDokumen = query(collection(db, "transparansi_desa"), orderBy("tanggal_posting", "desc"));
        const snapDokumen = await getDocs(qDokumen);
        const dataDokumen: any[] = [];
        snapDokumen.forEach((doc) => { 
          dataDokumen.push({ id: doc.id, ...doc.data() }); 
        });
        setDaftarDokumen(dataDokumen);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  // Format Tanggal
  const formatTanggal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // LOGIKA FILTER DAN SORTING
  const dokumenTerfilter = daftarDokumen.filter((d) => 
    d.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.deskripsi && d.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const indexOfLastDokumen = currentPage * itemsPerPage;
  const indexOfFirstDokumen = indexOfLastDokumen - itemsPerPage;
  const currentDokumen = dokumenTerfilter.slice(indexOfFirstDokumen, indexOfLastDokumen);
  const totalPages = Math.ceil(dokumenTerfilter.length / itemsPerPage);

  // Reset pagination ke halaman 1 jika user melakukan pencarian baru atau ubah jumlah baris
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-blue-900 text-white py-16 md:py-24 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-blue-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">
            Akses Informasi Terbuka
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Transparansi Desa
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Dokumen resmi APBDes, Peraturan Desa (Perdes), Laporan, dan Keputusan Kepala Desa yang dapat diakses oleh seluruh warga.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl flex-grow">
        
        {/* KOTAK PENCARIAN PINTAR */}
        <div className="mb-10 max-w-2xl mx-auto relative z-20">
          <input 
            type="text" 
            placeholder="Cari nama dokumen, tahun, atau kategori..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-blue-200 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-800 shadow-md"
          />
          <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl opacity-60">🔍</span>
        </div>

        <div className="animate-fade-in">
          
          {/* FITUR DROPDOWN TAMPILKAN BARIS */}
          {!loading && dokumenTerfilter.length > 0 && (
            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                <span className="text-sm font-bold text-gray-600">Tampilkan:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block p-1.5 font-bold outline-none cursor-pointer"
                >
                  <option value={10}>10 Dokumen</option>
                  <option value={20}>20 Dokumen</option>
                  <option value={50}>50 Dokumen</option>
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center my-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : dokumenTerfilter.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-3xl mx-auto">
              <span className="text-6xl mb-4 block opacity-50">📂</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm ? "Dokumen Tidak Ditemukan" : "Belum Ada Dokumen Transparansi"}
              </h3>
              <p className="text-gray-500 font-medium">
                {searchTerm ? `Tidak ada dokumen yang cocok dengan pencarian "${searchTerm}".` : "Pemerintah desa belum mengunggah dokumen APBDes atau Peraturan Desa."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentDokumen.map((dok) => (
                <article key={dok.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col md:flex-row gap-6">
                  
                  {/* GAMBAR DOKUMEN DI KIRI */}
                  <div className="w-full md:w-48 lg:w-56 h-48 md:h-auto bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-inner flex items-center justify-center relative">
                    {dok.gambar ? (
                      <img 
                        src={dok.gambar.startsWith("http") ? dok.gambar : `https://wsrv.nl/?url=${dok.gambar}`} 
                        alt="Sampul Dokumen" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl opacity-50">📄</span>
                    )}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-md">
                      {dok.kategori}
                    </div>
                  </div>
                  
                  {/* DETAIL TEKS DAN TOMBOL DI KANAN */}
                  <div className="flex flex-col flex-grow py-2">
                    <div className="flex flex-wrap items-center gap-3 mb-2 text-xs font-bold text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                        📅 {formatTanggal(dok.tanggal_posting)}
                      </span>
                      <span className="flex items-center gap-1">👤 Oleh: {dok.penulis}</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors">
                      {dok.judul}
                    </h2>
                    
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-5 flex-grow">
                      {dok.deskripsi || "Tidak ada deskripsi detail untuk dokumen ini."}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                      <a 
                        href={dok.link_dokumen} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 md:flex-none text-center bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
                      >
                        ⬇️ Download File
                      </a>
                      <Link 
                        href={`/transparansi/${dok.id}`} 
                        className="flex-1 md:flex-none text-center bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                      >
                        Selengkapnya →
                      </Link>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}

          {/* KOMPONEN PAGINATION DOKUMEN */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 mb-8 flex-wrap">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                &laquo; Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  className={`w-10 h-10 rounded-xl font-bold shadow-sm transition-colors ${
                    currentPage === i + 1 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Next &raquo;
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}