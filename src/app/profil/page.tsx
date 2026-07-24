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

// ==========================================
// FUNGSI KONVERSI HEIC
// ==========================================
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

// ==========================================
// KOMPONEN: KARTU UMKM DENGAN SLIDER & JADWAL REAL-TIME
// ==========================================
function UmkmCard({ item }: { item: any }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Mengambil Array Gambar
  let images: string[] = [];
  if (Array.isArray(item.gambar) && item.gambar.length > 0) {
    images = item.gambar;
  } else if (typeof item.foto === "string" && item.foto !== "") {
    images = [item.foto];
  }

  // Logika Hari dan Jam Operasional Real-Time
  const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dateNow = new Date();
  const indexHariIni = dateNow.getDay();
  const namaHariIni = hariList[indexHariIni];

  // Menyusun Array Hari Dimulai dari Hari Ini
  const orderedHari = [];
  for (let i = 0; i < 7; i++) {
    orderedHari.push(hariList[(indexHariIni + i) % 7]);
  }

  // Menentukan Status Buka/Tutup
  let isOpen = false;
  const jamOp = item.jam_operasional || {};
  const infoHariIni = jamOp[namaHariIni];

  if (infoHariIni && !infoHariIni.libur) {
    const currentMinutes = dateNow.getHours() * 60 + dateNow.getMinutes();
    const bukaParts = infoHariIni.buka?.split(":") || ["00", "00"];
    const tutupParts = infoHariIni.tutup?.split(":") || ["00", "00"];
    
    const bukaMinutes = parseInt(bukaParts[0]) * 60 + parseInt(bukaParts[1]);
    const tutupMinutes = parseInt(tutupParts[0]) * 60 + parseInt(tutupParts[1]);

    if (currentMinutes >= bukaMinutes && currentMinutes <= tutupMinutes) {
      isOpen = true;
    }
  }

  return (
    <div 
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col"
    >
      {/* AREA SLIDER FOTO UMKM */}
      <div 
        className="h-56 md:h-64 relative overflow-hidden bg-gray-100"
      >
        {images.length > 0 ? (
          <>
            <img 
              src={getSafeImageUrl(images[currentSlide])} 
              alt={item.nama_produk} 
              className="w-full h-full object-cover transition-transform duration-700"
            />
            {/* Indikator Slide */}
            {images.length > 1 && (
              <div 
                className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-20"
              >
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? "w-5 bg-blue-500" : "w-1.5 bg-white/60"
                    }`}
                  ></div>
                ))}
              </div>
            )}
            {/* Tombol Navigasi Slide (Hover di Laptop, Selalu di HP) */}
            {images.length > 1 && (
              <div 
                className="absolute inset-0 flex items-center justify-between px-2 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentSlide(currentSlide === 0 ? images.length - 1 : currentSlide - 1); }}
                  className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors"
                >
                  ◀
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentSlide((currentSlide + 1) % images.length); }}
                  className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white pointer-events-auto transition-colors"
                >
                  ▶
                </button>
              </div>
            )}
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-5xl text-gray-300"
          >
            🏪
          </div>
        )}

        {/* Badge Status Buka/Tutup Real Time */}
        <div 
          className="absolute top-4 right-4 flex flex-col gap-2 items-end z-20"
        >
          <div 
            className="bg-white/95 backdrop-blur-sm text-blue-700 font-black px-3 py-1 rounded-lg text-[10px] md:text-xs shadow-sm border border-white uppercase tracking-widest"
          >
            {item.kategori || "UMKM"}
          </div>
          <div 
            className={`font-black px-3 py-1 rounded-lg text-[10px] md:text-xs shadow-sm border uppercase tracking-widest flex items-center gap-1.5 ${
              isOpen ? "bg-green-500/90 text-white border-green-400" : "bg-red-500/90 text-white border-red-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-200 animate-pulse" : "bg-red-200"}`}></span>
            {isOpen ? "Sedang Buka" : "Tutup"}
          </div>
        </div>
      </div>
      
      {/* AREA DESKRIPSI & INFO UMKM */}
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
        
        {item.harga_mulai > 0 && (
          <div 
            className="bg-green-50 text-green-800 font-black text-sm px-3 py-2 rounded-xl border border-green-200 inline-block mb-4 shadow-sm"
          >
            Rp {item.harga_mulai.toLocaleString('id-ID')} {item.harga_sampai > 0 && `- Rp ${item.harga_sampai.toLocaleString('id-ID')}`}
          </div>
        )}

        <p 
          className="text-gray-600 text-sm leading-relaxed mb-6 flex-1 whitespace-pre-wrap"
        >
          {item.deskripsi}
        </p>
        
        {/* JADWAL OPERASIONAL (DROPDOWN) */}
        <div 
          className="mb-6 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
        >
          <button 
            onClick={() => setIsScheduleOpen(!isScheduleOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>🕒</span> 
              Jam Operasional (Hari Ini: {isOpen ? "Buka" : "Tutup"})
            </span>
            <span className={`transform transition-transform ${isScheduleOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          
          {isScheduleOpen && (
            <div 
              className="p-4 border-t border-gray-100 space-y-2 bg-white"
            >
              {orderedHari.map((hari) => {
                const jadwal = jamOp[hari];
                if (!jadwal) return null;
                const isToday = hari === namaHariIni;
                
                return (
                  <div 
                    key={hari} 
                    className={`flex justify-between items-center py-1.5 text-xs ${isToday ? "font-black text-blue-700" : "font-medium text-gray-600"}`}
                  >
                    <span>{hari} {isToday && "(Hari Ini)"}</span>
                    <span 
                      className={jadwal.libur ? "text-red-500 font-bold" : "text-gray-800"}
                    >
                      {jadwal.libur ? "Tutup / Libur" : `${jadwal.buka} - ${jadwal.tutup} WIB`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOMBOL AKSI (WA & MAPS) */}
        <div 
          className="space-y-3 mt-auto"
        >
          {item.link_maps && (
            <a 
              href={item.link_maps} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm border border-gray-200"
            >
              <span className="text-red-500">📍</span> Buka Lokasi di Google Maps
            </a>
          )}

          {item.wa && (
            <a 
              href={`https://wa.me/${item.wa}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md text-sm border border-green-400"
            >
              <span>💬</span> Pesan Sekarang (WhatsApp)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


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

        // 2. Fetch Teks Sejarah & Visi Misi
        const snapTeks = await getDoc(doc(db, "profil_desa", "utama"));
        if (snapTeks.exists() && snapTeks.data()) {
          setTeksProfil({
            sejarah: snapTeks.data().sejarah || "",
            visi_misi: snapTeks.data().visi_misi || ""
          });
        }

        // 3. Fetch SOTK 
        const snapAparatur = await getDocs(collection(db, "aparatur_desa"));
        const aparaturList = snapAparatur.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        }));
        aparaturList.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setDataAparatur(aparaturList);

        // 4. Fetch Lembaga 
        const snapLembaga = await getDocs(collection(db, "lembaga_desa"));
        setDataLembaga(snapLembaga.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

        // 5. Fetch UMKM / Potensi 
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

  const filteredPotensi = dataPotensi.filter((item) => 
    item.nama_produk?.toLowerCase().includes(searchUmkm.toLowerCase()) || 
    item.kategori?.toLowerCase().includes(searchUmkm.toLowerCase()) ||
    item.pemilik?.toLowerCase().includes(searchUmkm.toLowerCase())
  );

  // ==========================================
  // RENDERER STRUKTUR ORGANISASI (Bisa Dipakai SOTK & Anggota Lembaga)
  // ==========================================
  const renderStruktur = (dataList: any[], parentId: string | null = "") => {
    // Ambil child yang jalurAtas-nya sama dengan parentId
    const children = dataList.filter(item => (item.jalurAtas || "") === parentId);
    if (children.length === 0) return null;

    return (
      <div 
        className="flex flex-wrap justify-center gap-6 md:gap-10 relative mt-8"
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

            {/* Kartu Profil Struktur */}
            <div 
              className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 w-48 md:w-56 text-center z-10 hover:-translate-y-1 transition-transform relative group"
            >
              <div 
                className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full overflow-hidden border-4 border-blue-50 bg-gray-100 mb-3 shadow-inner"
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
                className="text-sm md:text-base font-black text-gray-900 mb-1 leading-tight"
              >
                {child.nama}
              </h3>
              <div 
                className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 inline-block"
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
            {dataList.some(d => (d.jalurAtas || "") === child.id) && (
              <div 
                className="w-[2px] h-8 bg-blue-600"
              ></div>
            )}

            {/* Render Rekursif Anak-anaknya */}
            {renderStruktur(dataList, child.id)}
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

                {/* Render Root SOTK (Yang tidak punya jalurAtas) */}
                {renderStruktur(dataAparatur, "")}
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
            {selectedLembaga ? (
              // TAMPILAN DETAIL ANGGOTA LEMBAGA (DENGAN STRUKTUR SOTK)
              <div 
                className="animate-fade-in overflow-x-auto pb-10"
              >
                <button 
                  onClick={() => setSelectedLembaga(null)}
                  className="mb-6 flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  <span>◀</span> Kembali ke Daftar Lembaga
                </button>

                <div 
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 text-center sticky left-0"
                >
                  <h2 
                    className="text-3xl font-black text-gray-900 mb-2"
                  >
                    {selectedLembaga.nama || selectedLembaga.nama_lembaga || "Lembaga Desa"}
                  </h2>
                  <p 
                    className="text-gray-500 max-w-2xl mx-auto leading-relaxed"
                  >
                    {selectedLembaga.deskripsi}
                  </p>
                </div>

                {/* Cek apakah ada anggota di lembaga ini */}
                {(!selectedLembaga.anggota_sotk && !selectedLembaga.anggota) || 
                 (selectedLembaga.anggota_sotk || selectedLembaga.anggota).length === 0 ? (
                  <div 
                    className="col-span-full text-center py-10 text-gray-500 font-bold sticky left-0 bg-white rounded-3xl border border-gray-100"
                  >
                    Belum ada data anggota struktural untuk lembaga ini.
                  </div>
                ) : (
                  <div 
                    className="min-w-[800px] flex flex-col items-center pt-4"
                  >
                    {/* Render Struktur Anggota Lembaga berdasarkan jalurAtas */}
                    {/* Jika tidak ada anggota yg jalurAtas-nya kosong (legacy data), kita buatkan root buatan atau render flat */}
                    {(() => {
                      const dataAnggota = selectedLembaga.anggota_sotk || selectedLembaga.anggota || [];
                      const hasRoot = dataAnggota.some((a: any) => (a.jalurAtas || "") === "");
                      
                      if (hasRoot) {
                        return renderStruktur(dataAnggota, "");
                      } else {
                        // Fallback jika data lama (flat, tidak ada hirarki)
                        return (
                          <div 
                            className="flex flex-wrap justify-center gap-6"
                          >
                            {dataAnggota.map((ang: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 text-center w-48"
                              >
                                <div 
                                  className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-blue-50 bg-gray-100 mb-3"
                                >
                                  {ang.foto ? (
                                    <img src={getSafeImageUrl(ang.foto)} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">👤</div>
                                  )}
                                </div>
                                <h4 
                                  className="font-bold text-gray-900 mb-1"
                                >
                                  {ang.nama}
                                </h4>
                                <span 
                                  className="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100"
                                >
                                  {ang.jabatan}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            ) : (
              // TAMPILAN DAFTAR LEMBAGA UTAMA
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
            TAB 4: KATALOG UMKM & POTENSI 
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
                    {filteredPotensi.map((item) => (
                      <UmkmCard 
                        key={item.id} 
                        item={item} 
                      />
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