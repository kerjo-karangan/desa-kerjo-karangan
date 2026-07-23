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
    sub: "Mengenal lebih dekat sejarah, visi misi, struktur pemerintahan, dan potensi desa.",
    bg: ""
  });
  
  // Database: profil_desa (utama)
  const [teksProfil, setTeksProfil] = useState({
    sejarah: "",
    visi_misi: ""
  });
  
  // Database: aparatur_desa
  const [dataAparatur, setDataAparatur] = useState<any[]>([]);
  
  // Database: lembaga_desa
  const [dataLembaga, setDataLembaga] = useState<any[]>([]);
  const [selectedLembaga, setSelectedLembaga] = useState<any | null>(null);
  
  // Database: potensi_desa
  const [dataPotensi, setDataPotensi] = useState<any[]>([]);

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

        // 2. Fetch Teks Sejarah & Visi Misi (DATABASE: profil_desa -> utama)
        const snapTeks = await getDoc(doc(db, "profil_desa", "utama"));
        if (snapTeks.exists() && snapTeks.data()) {
          setTeksProfil({
            sejarah: snapTeks.data().sejarah || "",
            visi_misi: snapTeks.data().visi_misi || ""
          });
        }

        // 3. Fetch SOTK (DATABASE: aparatur_desa)
        const snapAparatur = await getDocs(collection(db, "aparatur_desa"));
        const aparaturList = snapAparatur.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));
        // Urutkan berdasarkan urutan
        aparaturList.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setDataAparatur(aparaturList);

        // 4. Fetch Lembaga (DATABASE: lembaga_desa)
        const snapLembaga = await getDocs(collection(db, "lembaga_desa"));
        setDataLembaga(snapLembaga.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        // 5. Fetch UMKM / Potensi (DATABASE: potensi_desa)
        const snapPotensi = await getDocs(collection(db, "potensi_desa"));
        setDataPotensi(snapPotensi.docs.map(doc => ({ 
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
  const filteredPotensi = dataPotensi.filter((item) => 
    item.nama_produk?.toLowerCase().includes(searchUmkm.toLowerCase()) || 
    item.kategori?.toLowerCase().includes(searchUmkm.toLowerCase()) ||
    item.pemilik?.toLowerCase().includes(searchUmkm.toLowerCase())
  );

  // ==========================================
  // RENDERER STRUKTUR ORGANISASI SOTK
  // ==========================================
  const renderStrukturSOTK = (parentId: string | null = "") => {
    // Ambil child yang jalurAtas-nya sama dengan parentId
    const children = dataAparatur.filter(item => (item.jalurAtas || "") === parentId);
    if (children.length === 0) return null;

    return (
      <div 
        className="flex flex-wrap justify-center gap-6 relative mt-8"
      >
        {children.map((child) => (
          <div 
            key={child.id} 
            className="flex flex-col items-center relative"
          >
            {/* Garis Vertikal ke Atas (Koneksi ke Parent) */}
            {parentId !== "" && (
              <div 
                className={`absolute -top-8 w-px h-8 ${
                  child.jenisGaris === "Koordinasi" 
                  ? "border-l-2 border-dashed border-blue-400" 
                  : "bg-blue-600 w-[2px]"
                }`}
              ></div>
            )}

            {/* Kartu Aparatur */}
            <div 
              className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 w-56 text-center z-10 hover:-translate-y-1 transition-transform relative group"
            >
              <div 
                className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-blue-50 bg-gray-100 mb-3 shadow-inner"
              >
                {child.foto ? (
                  <img 
                    src={getSafeImageUrl(child.foto)} 
                    alt={child.nama} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-3xl text-gray-400"
                  >
                    👤
                  </div>
                )}
              </div>
              <h3 
                className="text-sm font-black text-gray-900 mb-1 leading-tight"
              >
                {child.nama}
              </h3>
              <div 
                className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 inline-block"
              >
                {child.jabatan}
              </div>
              
              {/* Tooltip Jenis Garis */}
              <div 
                className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
              >
                Garis {child.jenisGaris || "Instruksi"}
              </div>
            </div>

            {/* Garis Vertikal ke Bawah (Jika Punya Anak) */}
            {dataAparatur.some(d => d.jalurAtas === child.id) && (
              <div 
                className="w-[2px] h-8 bg-blue-600"
              ></div>
            )}

            {/* Render Rekursif Anak-anaknya */}
            {renderStrukturSOTK(child.id)}
          </div>
        ))}
      </div>
    );
  };

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
            onClick={() => { handleTabChange("sejarah"); setSelectedLembaga(null); }} 
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
            onClick={() => { handleTabChange("sotk"); setSelectedLembaga(null); }} 
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
            onClick={() => { handleTabChange("lembaga"); setSelectedLembaga(null); }} 
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
            onClick={() => { handleTabChange("umkm"); setSelectedLembaga(null); }} 
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
                Visi & Misi
              </h2>
              <div 
                className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium text-lg"
              >
                {teksProfil.visi_misi || "Data visi misi belum ditambahkan."}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: PEMERINTAH DESA (SOTK STRUKTURAL)
        ========================================== */}
        {activeTab === "sotk" && (
          <div 
            className="animate-fade-in overflow-x-auto pb-10"
          >
            {dataAparatur.length === 0 ? (
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
                className="min-w-[800px] flex flex-col items-center pt-4"
              >
                <div 
                  className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex gap-6 text-sm font-bold text-blue-800 mb-8"
                >
                  <div 
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-[2px] bg-blue-600"
                    ></div>
                    <span>Garis Instruksi</span>
                  </div>
                  <div 
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-[2px] border-t-2 border-dashed border-blue-400"
                    ></div>
                    <span>Garis Koordinasi</span>
                  </div>
                </div>

                {/* Render Root (Yang tidak punya jalurAtas) */}
                {renderStrukturSOTK("")}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: LEMBAGA KEMASYARAKATAN (MASTER-DETAIL)
        ========================================== */}
        {activeTab === "lembaga" && (
          <div 
            className="animate-fade-in"
          >
            {selectedLembaga ? (
              // TAMPILAN DETAIL ANGGOTA LEMBAGA
              <div 
                className="animate-fade-in"
              >
                <button 
                  onClick={() => setSelectedLembaga(null)}
                  className="mb-6 flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  <span>◀</span> Kembali ke Daftar Lembaga
                </button>

                <div 
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 text-center"
                >
                  <h2 
                    className="text-3xl font-black text-gray-900 mb-2"
                  >
                    {selectedLembaga.nama || selectedLembaga.nama_lembaga || "Lembaga Desa"}
                  </h2>
                  <p 
                    className="text-gray-500 max-w-2xl mx-auto"
                  >
                    {selectedLembaga.deskripsi}
                  </p>
                </div>

                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {selectedLembaga.anggota_sotk && selectedLembaga.anggota_sotk.length > 0 ? (
                    selectedLembaga.anggota_sotk.map((anggota: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 mb-3"
                        >
                          {anggota.foto ? (
                            <img 
                              src={getSafeImageUrl(anggota.foto)} 
                              alt={anggota.nama} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-3xl text-gray-400"
                            >
                              👤
                            </div>
                          )}
                        </div>
                        <h4 
                          className="font-bold text-gray-900 mb-1"
                        >
                          {anggota.nama}
                        </h4>
                        <span 
                          className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100"
                        >
                          {anggota.jabatan}
                        </span>
                      </div>
                    ))
                  ) : selectedLembaga.anggota && selectedLembaga.anggota.length > 0 ? (
                    selectedLembaga.anggota.map((anggota: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 mb-3"
                        >
                          <div 
                            className="w-full h-full flex items-center justify-center text-3xl text-gray-400"
                          >
                            👤
                          </div>
                        </div>
                        <h4 
                          className="font-bold text-gray-900 mb-1"
                        >
                          {anggota.nama}
                        </h4>
                        <span 
                          className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100"
                        >
                          {anggota.jabatan}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div 
                      className="col-span-full text-center py-10 text-gray-500 font-bold"
                    >
                      Belum ada data anggota untuk lembaga ini.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // TAMPILAN DAFTAR LEMBAGA
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
                        onClick={() => setSelectedLembaga(item)}
                        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center md:items-start text-center md:text-left group transform hover:-translate-y-1"
                      >
                        <h3 
                          className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors"
                        >
                          {item.nama || item.nama_lembaga || item.singkatan || "Lembaga Desa"}
                        </h3>
                        <p 
                          className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap line-clamp-3 flex-1"
                        >
                          {item.deskripsi}
                        </p>
                        <div 
                          className="w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                        >
                          Lihat Struktur Keanggotaan <span>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 4: KATALOG UMKM & POTENSI (DENGAN SEARCH)
        ========================================== */}
        {activeTab === "umkm" && (
          <div 
            className="animate-fade-in"
          >
            {dataPotensi.length === 0 ? (
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
                  Katalog Potensi & UMKM Belum Tersedia
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
                    placeholder="Cari nama produk, toko, atau kategori..." 
                    value={searchUmkm}
                    onChange={(e) => setSearchUmkm(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm text-gray-800 text-lg font-bold"
                  />
                  <span 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
                  >
                    🔍
                  </span>
                </div>

                {filteredPotensi.length === 0 ? (
                  <div 
                    className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 font-bold"
                  >
                    Data tidak ditemukan. Coba kata kunci lain.
                  </div>
                ) : (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {filteredPotensi.map((item) => {
                      
                      // Mengambil gambar pertama jika array, atau string biasa
                      let imageUrl = "";
                      if (Array.isArray(item.gambar) && item.gambar.length > 0) {
                        imageUrl = item.gambar[0];
                      } else if (typeof item.foto === "string" && item.foto !== "") {
                        imageUrl = item.foto;
                      }

                      // Render Jam Operasional (Map Database Baru)
                      const renderJamOperasional = () => {
                        if (typeof item.jam_operasional === 'object' && item.jam_operasional !== null) {
                          const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                          return (
                            <div 
                              className="text-[10px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2 font-mono"
                            >
                              <div className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-800">Jadwal Buka:</div>
                              {hariList.map(hari => {
                                const jadwal = item.jam_operasional[hari];
                                if (!jadwal) return null;
                                return (
                                  <div key={hari} className="flex justify-between py-0.5">
                                    <span>{hari}:</span>
                                    <span className="font-bold">{jadwal.libur ? "TUTUP" : `${jadwal.buka} - ${jadwal.tutup}`}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      };

                      return (
                        <div 
                          key={item.id} 
                          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
                        >
                          <div 
                            className="h-56 relative overflow-hidden bg-gray-100"
                          >
                            {imageUrl ? (
                              <img 
                                src={getSafeImageUrl(imageUrl)} 
                                alt={item.nama_produk} 
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
                              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-blue-700 font-black px-3 py-1 rounded-lg text-xs shadow-sm border border-white uppercase tracking-widest"
                            >
                              {item.kategori || "UMKM"}
                            </div>
                          </div>
                          
                          <div 
                            className="p-6 flex-1 flex flex-col"
                          >
                            <h3 
                              className="text-2xl font-black text-gray-900 mb-1 leading-tight"
                            >
                              {item.nama_produk}
                            </h3>
                            <p 
                              className="text-blue-600 font-bold text-sm mb-3"
                            >
                              Pemilik: {item.pemilik}
                            </p>
                            
                            {item.harga_mulai && item.harga_sampai && (
                              <div 
                                className="bg-green-50 text-green-800 font-black text-sm px-3 py-1.5 rounded-lg border border-green-200 inline-block mb-3"
                              >
                                Rp {item.harga_mulai.toLocaleString('id-ID')} - Rp {item.harga_sampai.toLocaleString('id-ID')}
                              </div>
                            )}

                            <p 
                              className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 whitespace-pre-wrap"
                            >
                              {item.deskripsi}
                            </p>
                            
                            <div 
                              className="space-y-3 pt-4 border-t border-gray-100 mt-auto"
                            >
                              {renderJamOperasional()}

                              {item.link_maps && (
                                <a 
                                  href={item.link_maps} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors mt-2"
                                >
                                  <span>📍</span> Lihat di Google Maps
                                </a>
                              )}

                              {item.wa && (
                                <a 
                                  href={`https://wa.me/${item.wa}`} 
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
                      )
                    })}
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