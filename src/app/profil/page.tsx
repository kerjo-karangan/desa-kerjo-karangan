// src/app/profil/page.tsx
"use client";

import { 
  useEffect, 
  useState, 
  Suspense 
} from "react";
import { 
  useSearchParams, 
  useRouter 
} from "next/navigation";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

function ProfilContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab") || "sejarah";
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // Fitur Pencarian UMKM
  const [searchUmkm, setSearchUmkm] = useState("");

  useEffect(() => {
    if (tabParam === "sejarah" || tabParam === "sotk" || tabParam === "lembaga" || tabParam === "umkm") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/profil?tab=${tab}`);
  };

  // State Data
  const [heroData, setHeroData] = useState({
    judul: "Profil Desa Kerjo",
    sub: "Mengenal lebih dekat sejarah, visi misi, struktur pemerintahan, dan potensi UMKM desa.",
    bg: ""
  });
  const [teksProfil, setTeksProfil] = useState({
    sejarah: "",
    visi: "",
    misi: ""
  });
  const [dataSotk, setDataSotk] = useState<any[]>([]);
  const [dataLembaga, setDataLembaga] = useState<any[]>([]);
  const [dataUmkm, setDataUmkm] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfilData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Header Profil
        const snapHero = await getDoc(doc(db, "pengaturan_web", "profil_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Profil Desa Kerjo",
            sub: snapHero.data().sub || "Mengenal lebih dekat sejarah, visi misi, dan potensi desa.",
            bg: snapHero.data().bg || ""
          });
        }

        // 2. Fetch Teks Sejarah & Visi Misi
        const snapTeks = await getDoc(doc(db, "pengaturan_web", "profil_teks"));
        if (snapTeks.exists() && snapTeks.data()) {
          setTeksProfil({
            sejarah: snapTeks.data().sejarah || "",
            visi: snapTeks.data().visi || "",
            misi: snapTeks.data().misi || ""
          });
        }

        // 3. Fetch SOTK
        const qSotk = query(collection(db, "profil_sotk"));
        const snapSotk = await getDocs(qSotk);
        setDataSotk(snapSotk.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        // 4. Fetch Lembaga
        const qLembaga = query(collection(db, "profil_lembaga"));
        const snapLembaga = await getDocs(qLembaga);
        setDataLembaga(snapLembaga.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        // 5. Fetch UMKM
        const qUmkm = query(collection(db, "katalog_umkm"));
        const snapUmkm = await getDocs(qUmkm);
        setDataUmkm(snapUmkm.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilData();
  }, []);

  // Fungsi Konversi .HEIC ke .JPG agar gambar Apple terbuka di semua device
  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    let safeUrl = url;
    if (safeUrl.includes("cloudinary.com") && safeUrl.toLowerCase().endsWith(".heic")) {
      safeUrl = safeUrl.replace(/\.heic$/i, ".jpg");
    }
    if (safeUrl.includes("cloudinary.com") || safeUrl.startsWith("http")) {
      return safeUrl;
    }
    return `https://wsrv.nl/?url=${safeUrl}`;
  };

  // Filter UMKM berdasarkan Search Bar
  const filteredUmkm = dataUmkm.filter((umkm) => 
    umkm.nama_toko?.toLowerCase().includes(searchUmkm.toLowerCase()) || 
    umkm.kategori?.toLowerCase().includes(searchUmkm.toLowerCase())
  );

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-blue-700 font-bold tracking-widest animate-pulse"
        >
          MEMUAT DATA PROFIL...
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24"
    >
      
      {/* ==========================================
          HEADER (HERO SECTION)
      ========================================== */}
      <div 
        className={`relative py-16 md:py-24 text-white overflow-hidden shadow-md transition-colors duration-500 ${
          heroData.bg ? "bg-gray-900" : "bg-blue-700"
        }`}
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Profil Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"
          ></div>
        </div>
        
        <div 
          className="container mx-auto px-4 relative z-10 text-center animate-fade-in"
        >
          <span 
            className="text-blue-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-blue-900/50 px-4 py-1.5 rounded-full border border-blue-800 backdrop-blur-sm shadow-sm"
          >
            Mengenal Lebih Dekat
          </span>
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl whitespace-pre-wrap leading-tight"
          >
            {heroData.judul}
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-lg whitespace-pre-wrap"
          >
            {heroData.sub}
          </p>
        </div>
      </div>

      {/* ==========================================
          KONTEN UTAMA & MENU TAB
      ========================================== */}
      <div 
        className="container mx-auto px-4 max-w-6xl relative z-20 -mt-8"
      >
        
        {/* Navigasi Tab Internal */}
        <div 
          className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-wrap gap-2 md:gap-4 justify-center mx-auto mb-10"
        >
          <button 
            onClick={() => handleTabChange("sejarah")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "sejarah" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              📖
            </span> 
            Sejarah & Visi
          </button>
          
          <button 
            onClick={() => handleTabChange("sotk")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "sotk" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              🏛️
            </span> 
            Pemerintah Desa
          </button>

          <button 
            onClick={() => handleTabChange("lembaga")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "lembaga" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              🤝
            </span> 
            Lembaga Desa
          </button>

          <button 
            onClick={() => handleTabChange("umkm")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "umkm" 
              ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" 
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span 
              className="text-xl"
            >
              🛍️
            </span> 
            Potensi & UMKM
          </button>
        </div>

        {/* ==========================================
            TAB 1: SEJARAH & VISI MISI
        ========================================== */}
        {activeTab === "sejarah" && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span 
                  className="text-4xl"
                >
                  📜
                </span> 
                Sejarah Desa
              </h2>
              <div 
                className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium"
              >
                {teksProfil.sejarah || "Data sejarah desa belum ditambahkan."}
              </div>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div 
                className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 w-2 h-full bg-blue-500"
                ></div>
                <h2 
                  className="text-3xl font-black text-blue-900 mb-6 flex items-center gap-3"
                >
                  <span 
                    className="text-4xl"
                  >
                    🎯
                  </span> 
                  Visi
                </h2>
                <div 
                  className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium text-lg italic"
                >
                  "{teksProfil.visi || "Data visi belum ditambahkan."}"
                </div>
              </div>

              <div 
                className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 w-2 h-full bg-green-500"
                ></div>
                <h2 
                  className="text-3xl font-black text-green-900 mb-6 flex items-center gap-3"
                >
                  <span 
                    className="text-4xl"
                  >
                    🚀
                  </span> 
                  Misi
                </h2>
                <div 
                  className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium"
                >
                  {teksProfil.misi || "Data misi belum ditambahkan."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: PEMERINTAH DESA (SOTK)
        ========================================== */}
        {activeTab === "sotk" && (
          <div 
            className="animate-fade-in"
          >
            {dataSotk.length === 0 ? (
              <div 
                className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <span 
                  className="text-6xl mb-4 block opacity-30"
                >
                  🏛️
                </span>
                <h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  Struktur Pemerintahan Belum Diisi
                </h2>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {dataSotk.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-center group hover:shadow-xl transition-shadow relative"
                  >
                    <div 
                      className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-blue-400"
                    ></div>
                    <div 
                      className="relative z-10 pt-10 pb-6 px-6"
                    >
                      <div 
                        className="w-32 h-32 mx-auto bg-white rounded-full p-1.5 shadow-lg mb-4"
                      >
                        {item.foto ? (
                          <img 
                            src={getSafeImageUrl(item.foto)} 
                            alt={item.nama} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div 
                            className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl text-gray-400"
                          >
                            👤
                          </div>
                        )}
                      </div>
                      <h3 
                        className="text-xl font-black text-gray-900 mb-1"
                      >
                        {item.nama}
                      </h3>
                      <span 
                        className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-3"
                      >
                        {item.jabatan}
                      </span>
                      {item.keterangan && (
                        <p 
                          className="text-gray-500 text-sm leading-relaxed"
                        >
                          {item.keterangan}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: LEMBAGA KEMASYARAKATAN
        ========================================== */}
        {activeTab === "lembaga" && (
          <div 
            className="animate-fade-in"
          >
            {dataLembaga.length === 0 ? (
              <div 
                className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <span 
                  className="text-6xl mb-4 block opacity-30"
                >
                  🤝
                </span>
                <h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  Data Lembaga Belum Tersedia
                </h2>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {dataLembaga.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left"
                  >
                    <div 
                      className="w-24 h-24 flex-shrink-0"
                    >
                      {item.logo ? (
                        <img 
                          src={getSafeImageUrl(item.logo)} 
                          alt={item.nama_lembaga} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div 
                          className="w-full h-full bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-4xl"
                        >
                          🏛️
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 
                        className="text-2xl font-black text-gray-900 mb-2"
                      >
                        {item.nama_lembaga}
                      </h3>
                      <p 
                        className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap"
                      >
                        {item.deskripsi}
                      </p>
                      <div 
                        className="bg-gray-50 inline-block px-4 py-2 rounded-xl text-sm border border-gray-200"
                      >
                        <span 
                          className="font-bold text-gray-700"
                        >
                          Ketua:
                        </span> {item.ketua}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 4: KATALOG UMKM (DENGAN SEARCH)
        ========================================== */}
        {activeTab === "umkm" && (
          <div 
            className="animate-fade-in"
          >
            {dataUmkm.length === 0 ? (
              <div 
                className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
              >
                <span 
                  className="text-6xl mb-4 block opacity-30"
                >
                  🛍️
                </span>
                <h2 
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  Katalog UMKM Belum Tersedia
                </h2>
              </div>
            ) : (
              <>
                {/* Fitur Search Bar */}
                <div 
                  className="mb-8 max-w-2xl mx-auto relative"
                >
                  <input 
                    type="text" 
                    placeholder="Cari nama toko, produk, atau kategori UMKM..." 
                    value={searchUmkm}
                    onChange={(e) => setSearchUmkm(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm text-gray-800 text-lg"
                  />
                  <span 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
                  >
                    🔍
                  </span>
                </div>

                {filteredUmkm.length === 0 ? (
                  <div 
                    className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500"
                  >
                    UMKM tidak ditemukan. Coba kata kunci lain.
                  </div>
                ) : (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {filteredUmkm.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
                      >
                        <div 
                          className="h-56 relative overflow-hidden bg-gray-100"
                        >
                          {item.foto_produk ? (
                            <img 
                              src={getSafeImageUrl(item.foto_produk)} 
                              alt={item.nama_toko} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-5xl text-gray-300"
                            >
                              🏪
                            </div>
                          )}
                          <div 
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-blue-700 font-black px-3 py-1 rounded-lg text-xs shadow-sm border border-white"
                          >
                            {item.kategori || "UMKM"}
                          </div>
                        </div>
                        
                        <div 
                          className="p-6 flex-1 flex flex-col"
                        >
                          <h3 
                            className="text-2xl font-black text-gray-900 mb-1"
                          >
                            {item.nama_toko}
                          </h3>
                          <p 
                            className="text-blue-600 font-bold text-sm mb-4"
                          >
                            Pemilik: {item.pemilik}
                          </p>
                          <p 
                            className="text-gray-600 text-sm leading-relaxed mb-6 flex-1"
                          >
                            {item.deskripsi_produk}
                          </p>
                          
                          <div 
                            className="space-y-3 pt-4 border-t border-gray-100 mt-auto"
                          >
                            <div 
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <span>📍</span> 
                              <span 
                                className="truncate"
                              >
                                {item.alamat}
                              </span>
                            </div>
                            <div 
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <span>⏰</span> 
                              <span>
                                {item.jam_operasional}
                              </span>
                            </div>
                            {item.no_wa && (
                              <a 
                                href={`https://wa.me/${item.no_wa}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-4 block w-full bg-green-50 hover:bg-green-600 hover:text-white text-green-700 font-black py-3 rounded-xl text-center transition-colors border border-green-200"
                              >
                                Hubungi Penjual (WA)
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProfilPublik() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        >
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-blue-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN HALAMAN...
          </p>
        </div>
      }
    >
      <ProfilContent />
    </Suspense>
  );
}