"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";

// KOMPONEN PEMBUNGKUS UTAMA MENGHINDARI ERROR LAYOUT
export default function ProfilDesa() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfilContent />
    </Suspense>
  );
}

// KOMPONEN ISI HALAMAN
function ProfilContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  
  const [tabAktif, setTabAktif] = useState("sejarah");

  const [profil, setProfil] = useState({ sejarah: "", visi_misi: "" });
  const [aparaturDesa, setAparaturDesa] = useState<any[]>([]);
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [daftarLembaga, setDaftarLembaga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Menerima perintah perubahan tab dari URL Navbar
  useEffect(() => {
    if (tabQuery === "sejarah" || tabQuery === "sotk" || tabQuery === "lembaga" || tabQuery === "umkm") {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const docRef = doc(db, "profil_desa", "utama");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { setProfil({ sejarah: docSnap.data().sejarah || "", visi_misi: docSnap.data().visi_misi || "" }); }

        const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
        const dataAparatur = (await getDocs(qAparatur)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAparaturDesa(dataAparatur.length === 0 ? [{ nama: "Belum Ada Data", jabatan: "Kepala Desa", foto: "" }] : dataAparatur);

        const qLembaga = query(collection(db, "lembaga_desa"));
        setDaftarLembaga((await getDocs(qLembaga)).docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const qUmkm = query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc"));
        setDaftarUmkm((await getDocs(qUmkm)).docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
    };
    ambilData();
  }, []);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">Mengenal Lebih Dekat</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Profil & Kelembagaan</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">Sejarah, susunan aparatur, pilar masyarakat, serta produk unggulan Desa Kerjo.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl flex-grow">
        
        {/* TABS NAVIGASI */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          <button onClick={() => setTabAktif("sejarah")} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${tabAktif === "sejarah" || !tabAktif ? "bg-green-600 text-white transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50"}`}><span>📖</span> Sejarah & Visi Misi</button>
          <button onClick={() => setTabAktif("sotk")} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${tabAktif === "sotk" ? "bg-green-600 text-white transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50"}`}><span>👔</span> Pemerintah Desa</button>
          <button onClick={() => setTabAktif("lembaga")} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${tabAktif === "lembaga" ? "bg-green-600 text-white transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50"}`}><span>🤝</span> Lembaga Masyarakat</button>
          <button onClick={() => setTabAktif("umkm")} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${tabAktif === "umkm" ? "bg-green-600 text-white transform -translate-y-1" : "bg-white text-gray-600 hover:bg-green-50"}`}><span>🛍️</span> Potensi & UMKM</button>
        </div>

        {/* KONTEN ISOLASI 1: SEJARAH & VISI MISI */}
        {(tabAktif === "sejarah" || !tabAktif) && (
          <div className="grid grid-cols-1 gap-8 animate-fade-in">
            <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h2 className="text-3xl font-extrabold text-green-800 mb-6 flex items-center gap-3"><span className="text-4xl">📖</span> Sejarah Desa</h2>
              {loading ? (<div className="animate-pulse space-y-3"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div>) : (<p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-justify">{profil.sejarah || "Sejarah desa belum dipublikasikan."}</p>)}
            </section>
            <section className="bg-gradient-to-br from-green-800 to-green-900 p-8 md:p-12 rounded-3xl shadow-lg text-white transform hover:-translate-y-1 transition-transform">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-green-50"><span className="text-4xl">🎯</span> Visi & Misi</h2>
              {loading ? (<div className="animate-pulse space-y-3"><div className="h-4 bg-green-700 rounded w-full"></div></div>) : (<p className="text-green-50 text-lg leading-relaxed whitespace-pre-wrap text-justify font-medium">{profil.visi_misi || "Visi dan Misi desa belum dipublikasikan."}</p>)}
            </section>
          </div>
        )}

        {/* KONTEN ISOLASI 2: STRUKTUR PEMERINTAH DESA */}
        {tabAktif === "sotk" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <span className="text-green-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Struktur Organisasi</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Aparatur Pemerintah Desa</h2>
            </div>
            {!loading && aparaturDesa.length > 0 && (
              <>
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-50 p-6 md:p-8 rounded-3xl shadow-md border-b-4 border-yellow-400 text-center w-full max-w-sm transform transition-transform hover:scale-105">
                    <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center mb-4 border-4 border-green-500 shadow-inner overflow-hidden relative">
                      {aparaturDesa[0].foto ? (<img src={`https://wsrv.nl/?url=${aparaturDesa[0].foto}`} className="w-full h-full object-cover" />) : (<span className="text-6xl absolute mt-2 text-gray-300">👤</span>)}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">{aparaturDesa[0].nama}</h3>
                    <p className="text-green-700 font-extrabold text-sm uppercase tracking-widest mt-1">{aparaturDesa[0].jabatan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {aparaturDesa.slice(1).map((aparatur, index) => (
                    <div key={index} className="bg-gray-50 p-5 rounded-2xl shadow-sm border border-gray-200 text-center hover:border-green-400 hover:shadow-md transition-all group">
                      <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-sm border border-gray-200 group-hover:border-green-300">
                        {aparatur.foto ? (<img src={`https://wsrv.nl/?url=${aparatur.foto}`} className="w-full h-full object-cover" />) : (<span className="text-3xl text-gray-300">👔</span>)}
                      </div>
                      <h4 className="font-bold text-gray-800 line-clamp-1">{aparatur.nama}</h4>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{aparatur.jabatan}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* KONTEN ISOLASI 3: LEMBAGA MASYARAKAT */}
        {tabAktif === "lembaga" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <span className="text-blue-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Pilar Masyarakat</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Lembaga Kemasyarakatan</h2>
            </div>
            {loading ? (<div className="flex justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : daftarLembaga.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300">
                <span className="text-4xl block mb-3">🤝</span><p className="text-gray-500 font-medium">Belum ada lembaga yang terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {daftarLembaga.map((lem) => (
                  <div key={lem.id} className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-200 flex items-start gap-5 hover:shadow-md hover:border-blue-300 transition-all">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-200 p-2 shadow-sm">
                      {lem.foto ? <img src={`https://wsrv.nl/?url=${lem.foto}`} className="w-full h-full object-contain" /> : <span className="text-4xl">🏛️</span>}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">{lem.singkatan}</h3>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 mt-1">{lem.nama}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{lem.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* KONTEN ISOLASI 4: KATALOG UMKM / POTENSI DESA */}
        {tabAktif === "umkm" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <span className="text-yellow-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Pemberdayaan Ekonomi</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Katalog UMKM & Potensi</h2>
            </div>
            {loading ? (<div className="flex justify-center"><div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : daftarUmkm.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300"><span className="text-4xl block mb-3">🛍️</span><p className="text-gray-500 font-medium">Belum ada produk UMKM.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {daftarUmkm.map((umkm) => (
                  <div key={umkm.id} className="bg-gray-50 rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-yellow-400 transition-all">
                    <div className="h-56 bg-gray-200 relative overflow-hidden">
                      {umkm.foto ? (<img src={`https://wsrv.nl/?url=${umkm.foto}`} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />) : (<div className="w-full h-full flex items-center justify-center text-5xl">📦</div>)}
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-md">
                        {umkm.pemilik}
                      </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{umkm.nama_produk}</h3>
                      <p className="text-green-700 font-black text-xl mb-3">{formatRupiah(umkm.harga)}</p>
                      <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3 leading-relaxed">{umkm.deskripsi}</p>
                      <a href={`https://wa.me/${umkm.wa}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${umkm.nama_produk}%20yang%20ada%20di%20Website%20Desa.`} target="_blank" rel="noreferrer" className="w-full bg-white hover:bg-green-600 text-green-700 hover:text-white border-2 border-green-600 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <span className="text-xl">💬</span> Hubungi Penjual
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}