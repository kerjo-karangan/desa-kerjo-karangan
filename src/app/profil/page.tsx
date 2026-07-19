// src/app/profil/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";

// KOMPONEN PEMBUNGKUS UTAMA MENGHINDARI ERROR LAYOUT
export default function ProfilDesa() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
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
    if (
      tabQuery === "sejarah" ||
      tabQuery === "sotk" ||
      tabQuery === "lembaga" ||
      tabQuery === "umkm"
    ) {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const docRef = doc(db, "profil_desa", "utama");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfil({
            sejarah: docSnap.data().sejarah || "",
            visi_misi: docSnap.data().visi_misi || "",
          });
        }

        const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
        const dataAparatur = (await getDocs(qAparatur)).docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAparaturDesa(dataAparatur);

        const qLembaga = query(collection(db, "lembaga_desa"));
        setDaftarLembaga((await getDocs(qLembaga)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const qUmkm = query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc"));
        setDaftarUmkm((await getDocs(qUmkm)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  // ==========================================
  // KOMPONEN REKURSIF UNTUK MENGGAMBAR BAGAN SOTK
  // ==========================================
  const RenderPohonSOTK = ({ parentId }: { parentId: string }) => {
    // Cari siapa saja yang 'jalurAtas'-nya adalah 'parentId'
    const bawahan = aparaturDesa.filter((org) => (org.jalurAtas || "") === parentId);

    if (bawahan.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4 relative">
        {bawahan.map((child) => (
          <div key={child.id} className="flex flex-col items-center relative">
            
            {/* Garis Vertikal dari Atasan ke Bawahan */}
            {parentId !== "" && (
              <div
                className={`w-0 h-8 border-l-4 ${
                  child.jenisGaris === "Koordinasi"
                    ? "border-dashed border-blue-400" // Garis Koordinasi (Putus-putus)
                    : "border-solid border-green-600" // Garis Instruksi (Tegas)
                }`}
              ></div>
            )}

            {/* Kotak Profil Jabatan */}
            <div className="bg-white border-b-4 border-green-600 p-5 rounded-2xl shadow-md w-48 text-center z-10 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-inner border border-gray-200">
                {child.foto ? (
                  <img src={`https://wsrv.nl/?url=${child.foto}`} className="w-full h-full object-cover" alt={child.nama} />
                ) : (
                  <span className="text-3xl text-gray-300">👤</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                {child.nama}
              </h4>
              <p className="text-[10px] bg-green-50 text-green-800 font-black uppercase tracking-widest px-2 py-1.5 rounded mt-2 inline-block border border-green-100">
                {child.jabatan}
              </p>
            </div>

            {/* Panggil fungsi ini lagi untuk menggambar bawahan dari orang ini */}
            <RenderPohonSOTK parentId={child.id} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* HERO SECTION */}
      <div className="bg-green-800 text-white py-16 md:py-24 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-green-300 font-extrabold tracking-widest uppercase text-sm mb-2 block">
            Mengenal Lebih Dekat
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Profil & Kelembagaan
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto font-light">
            Sejarah, susunan aparatur, pilar masyarakat, serta produk unggulan
            Desa Kerjo.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl flex-grow">
        
        {/* TABS NAVIGASI ISOLASI */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          <button
            onClick={() => setTabAktif("sejarah")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "sejarah" || !tabAktif
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">📖</span> Sejarah & Visi Misi
          </button>
          <button
            onClick={() => setTabAktif("sotk")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "sotk"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">👔</span> Pemerintah Desa
          </button>
          <button
            onClick={() => setTabAktif("lembaga")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "lembaga"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">🤝</span> Lembaga Masyarakat
          </button>
          <button
            onClick={() => setTabAktif("umkm")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
              tabAktif === "umkm"
                ? "bg-green-600 text-white transform -translate-y-1 shadow-md"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            <span className="text-xl">🛍️</span> Potensi & UMKM
          </button>
        </div>

        {/* ==========================================
            KONTEN ISOLASI 1: SEJARAH & VISI MISI
        ========================================== */}
        {(tabAktif === "sejarah" || !tabAktif) && (
          <div className="grid grid-cols-1 gap-8 animate-fade-in max-w-4xl mx-auto">
            <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-9xl opacity-5 select-none pointer-events-none">📖</div>
              <h2 className="text-3xl font-extrabold text-green-800 mb-6 flex items-center gap-3 relative z-10">
                Sejarah Desa
              </h2>
              {loading ? (
                <div className="animate-pulse space-y-3 relative z-10">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-justify relative z-10">
                  {profil.sejarah || "Sejarah desa belum dipublikasikan oleh admin."}
                </p>
              )}
            </section>
            
            <section className="bg-gradient-to-br from-green-800 to-green-900 p-8 md:p-12 rounded-3xl shadow-lg text-white transform hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 text-9xl opacity-10 select-none pointer-events-none">🎯</div>
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-green-50 relative z-10">
                Visi & Misi
              </h2>
              {loading ? (
                <div className="animate-pulse space-y-3 relative z-10">
                  <div className="h-4 bg-green-700 rounded w-full"></div>
                  <div className="h-4 bg-green-700 rounded w-full"></div>
                </div>
              ) : (
                <p className="text-green-50 text-lg leading-relaxed whitespace-pre-wrap text-justify font-medium relative z-10">
                  {profil.visi_misi || "Visi dan Misi desa belum dipublikasikan oleh admin."}
                </p>
              )}
            </section>
          </div>
        )}

        {/* ==========================================
            KONTEN ISOLASI 2: SOTK & HIERARKI
        ========================================== */}
        {tabAktif === "sotk" && (
          <section className="animate-fade-in bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="text-center mb-10">
              <span className="text-green-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Struktur Organisasi (SOTK)
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Pemerintah Desa Kerjo
              </h2>
              
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-8 h-1 bg-green-600"></div> Garis Instruksi
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-8 h-1 border-b-2 border-dashed border-blue-400"></div> Garis Koordinasi
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : aparaturDesa.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                <span className="text-5xl text-gray-300 block mb-4">👔</span>
                <p className="text-gray-500 font-medium">Bagan aparatur belum diatur.</p>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center min-w-[800px]">
                {/* Memanggil Komponen Rekursif, dimulai dari orang yang tidak punya atasan ("") */}
                <RenderPohonSOTK parentId="" />
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            KONTEN ISOLASI 3: LEMBAGA MASYARAKAT
        ========================================== */}
        {tabAktif === "lembaga" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-blue-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Pilar Masyarakat
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Lembaga Kemasyarakatan
              </h2>
              <p className="text-gray-500 mt-3">Mitra strategis dalam mewujudkan kemajuan desa.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : daftarLembaga.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300">
                <span className="text-4xl block mb-3">🤝</span>
                <p className="text-gray-500 font-medium">Belum ada lembaga yang terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {daftarLembaga.map((lem) => (
                  <div
                    key={lem.id}
                    className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-5 hover:shadow-md hover:border-blue-300 transition-all text-center md:text-left"
                  >
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-200 p-2 shadow-sm">
                      {lem.foto ? (
                        <img
                          src={`https://wsrv.nl/?url=${lem.foto}`}
                          className="w-full h-full object-contain"
                          alt={lem.singkatan}
                        />
                      ) : (
                        <span className="text-4xl">🏛️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">
                        {lem.singkatan}
                      </h3>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 mt-1">
                        {lem.nama}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed text-justify line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                        {lem.deskripsi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            KONTEN ISOLASI 4: UMKM & POTENSI DESA
        ========================================== */}
        {tabAktif === "umkm" && (
          <section className="animate-fade-in bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-center mb-12">
              <span className="text-yellow-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">
                Pemberdayaan Ekonomi
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Katalog Potensi & UMKM
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : daftarUmkm.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-3xl text-center border border-dashed border-gray-300">
                <span className="text-4xl block mb-3">🛍️</span>
                <p className="text-gray-500 font-medium">Belum ada produk UMKM yang dipromosikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {daftarUmkm.map((umkm) => (
                  <div
                    key={umkm.id}
                    className="bg-gray-50 rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-yellow-400 transition-all group"
                  >
                    <div className="h-56 bg-gray-200 relative overflow-hidden">
                      {umkm.foto ? (
                        <img
                          src={`https://wsrv.nl/?url=${umkm.foto}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                          alt={umkm.nama_produk}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                      )}
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-md">
                        {umkm.pemilik}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                        {umkm.nama_produk}
                      </h3>
                      <p className="text-green-700 font-black text-xl mb-3">
                        {formatRupiah(umkm.harga)}
                      </p>
                      <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3 leading-relaxed">
                        {umkm.deskripsi}
                      </p>
                      <a
                        href={`https://wa.me/${umkm.wa}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${umkm.nama_produk}%20yang%20ada%20di%20Website%20Desa.`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-white hover:bg-green-600 text-green-700 hover:text-white border-2 border-green-600 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
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