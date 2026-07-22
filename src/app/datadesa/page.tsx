// src/app/datadesa/page.tsx
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
  getDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

function DataDesaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab") || "wilayah";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  // Sinkronisasi Tab dengan URL
  useEffect(() => {
    if (["wilayah", "pendidikan", "pekerjaan", "agama", "gender", "umur", "warga", "kawin"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/datadesa?tab=${tab}`);
  };

  // State Header
  const [heroData, setHeroData] = useState({
    judul: "Data Demografi Desa",
    sub: "Visualisasi statistik kependudukan yang akurat, transparan, dan diperbarui secara berkala.",
    bg: ""
  });

  // State Agregasi Data
  const [totalPenduduk, setTotalPenduduk] = useState(0);
  const [dataWilayah, setDataWilayah] = useState<any[]>([]);
  const [dataPendidikan, setDataPendidikan] = useState<any[]>([]);
  const [dataPekerjaan, setDataPekerjaan] = useState<any[]>([]);
  const [dataAgama, setDataAgama] = useState<any[]>([]);
  const [dataGender, setDataGender] = useState<any[]>([]);
  const [dataUmur, setDataUmur] = useState<any[]>([]);
  const [dataWarga, setDataWarga] = useState<any[]>([]);
  const [dataKawin, setDataKawin] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Header
        const snapHero = await getDoc(doc(db, "pengaturan_web", "datadesa_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Data Demografi Desa",
            sub: snapHero.data().sub || "Visualisasi statistik kependudukan akurat.",
            bg: snapHero.data().bg || ""
          });
        }

        // Fetch Penduduk & Agregasi
        const snapPenduduk = await getDocs(collection(db, "data_penduduk"));
        let total = 0;
        
        const aggWilayah: any = {};
        const aggPendidikan: any = {};
        const aggPekerjaan: any = {};
        const aggAgama: any = {};
        const aggGender: any = {};
        const aggUmur: any = {
          "0-4 Tahun (Balita)": 0,
          "5-14 Tahun (Anak-Anak)": 0,
          "15-64 Tahun (Usia Produktif)": 0,
          "65+ Tahun (Lansia)": 0
        };
        const aggWarga: any = {};
        const aggKawin: any = {};

        snapPenduduk.docs.forEach((doc) => {
          const d = doc.data();
          total++;

          // 1. Wilayah
          const dusun = d.dusun && d.dusun !== "-" ? d.dusun : "LAINNYA";
          if (!aggWilayah[dusun]) {
            aggWilayah[dusun] = { nama: dusun, total: 0, laki: 0, perempuan: 0, kk: 0 };
          }
          aggWilayah[dusun].total++;
          if (d.jenis_kelamin === "LAKI-LAKI") aggWilayah[dusun].laki++;
          if (d.jenis_kelamin === "PEREMPUAN") aggWilayah[dusun].perempuan++;
          if (d.hubungan_keluarga === "KEPALA KELUARGA") aggWilayah[dusun].kk++;

          // 2. Pendidikan
          const pend = d.pendidikan || "TIDAK DIKETAHUI";
          aggPendidikan[pend] = (aggPendidikan[pend] || 0) + 1;

          // 3. Pekerjaan
          const kerja = d.pekerjaan || "TIDAK DIKETAHUI";
          aggPekerjaan[kerja] = (aggPekerjaan[kerja] || 0) + 1;

          // 4. Agama
          const agama = d.agama || "TIDAK DIKETAHUI";
          aggAgama[agama] = (aggAgama[agama] || 0) + 1;

          // 5. Gender
          const gender = d.jenis_kelamin || "TIDAK DIKETAHUI";
          aggGender[gender] = (aggGender[gender] || 0) + 1;

          // 6. Warga Negara
          const warga = d.kewarganegaraan || "TIDAK DIKETAHUI";
          aggWarga[warga] = (aggWarga[warga] || 0) + 1;

          // 7. Status Kawin
          const kawin = d.status_kawin || "TIDAK DIKETAHUI";
          aggKawin[kawin] = (aggKawin[kawin] || 0) + 1;

          // 8. Umur (Kalkulasi dari Tahun Lahir)
          if (d.tanggal_lahir) {
            const yearLahir = new Date(d.tanggal_lahir).getFullYear();
            const yearSekarang = new Date().getFullYear();
            const age = yearSekarang - yearLahir;
            
            if (age <= 4) aggUmur["0-4 Tahun (Balita)"]++;
            else if (age <= 14) aggUmur["5-14 Tahun (Anak-Anak)"]++;
            else if (age <= 64) aggUmur["15-64 Tahun (Usia Produktif)"]++;
            else aggUmur["65+ Tahun (Lansia)"]++;
          }
        });

        setTotalPenduduk(total);

        // Helper untuk mengubah Object menjadi Array yang diurutkan
        const formatAgg = (aggObj: any) => {
          return Object.keys(aggObj)
            .map(key => ({
              nama: key,
              jumlah: aggObj[key],
              persen: total > 0 ? ((aggObj[key] / total) * 100).toFixed(1) : "0"
            }))
            .sort((a, b) => b.jumlah - a.jumlah); // Urut dari terbesar
        };

        setDataWilayah(Object.values(aggWilayah).sort((a: any, b: any) => b.total - a.total));
        setDataPendidikan(formatAgg(aggPendidikan));
        setDataPekerjaan(formatAgg(aggPekerjaan));
        setDataAgama(formatAgg(aggAgama));
        setDataGender(formatAgg(aggGender));
        setDataUmur(formatAgg(aggUmur));
        setDataWarga(formatAgg(aggWarga));
        setDataKawin(formatAgg(aggKawin));

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Komponen Helper untuk merender Grafik Bar murni Tailwind
  const RenderBarChart = ({ data, maxVal, colorClass }: { data: any[], maxVal: number, colorClass: string }) => (
    <div 
      className="space-y-4 mb-10"
    >
      {data.map((item, index) => (
        <div 
          key={index}
        >
          <div 
            className="flex justify-between text-sm font-bold text-gray-700 mb-1"
          >
            <span>
              {item.nama}
            </span>
            <span>
              {item.jumlah} Orang ({item.persen}%)
            </span>
          </div>
          <div 
            className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner"
          >
            <div 
              className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${maxVal > 0 ? (item.jumlah / maxVal) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Komponen Helper untuk merender Tabel Detail
  const RenderTable = ({ data, title }: { data: any[], title: string }) => (
    <div 
      className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
    >
      <table 
        className="min-w-full text-sm text-left bg-white"
      >
        <thead 
          className="bg-gray-50 border-b border-gray-200"
        >
          <tr>
            <th 
              className="py-4 px-6 font-black text-gray-700 w-16 text-center"
            >
              No
            </th>
            <th 
              className="py-4 px-6 font-black text-gray-700"
            >
              Kategori {title}
            </th>
            <th 
              className="py-4 px-6 font-black text-gray-700 text-right w-32"
            >
              Jumlah
            </th>
            <th 
              className="py-4 px-6 font-black text-gray-700 text-right w-32"
            >
              Persentase
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={index} 
              className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
            >
              <td 
                className="py-4 px-6 text-center font-bold text-gray-500"
              >
                {index + 1}
              </td>
              <td 
                className="py-4 px-6 font-bold text-gray-900"
              >
                {item.nama}
              </td>
              <td 
                className="py-4 px-6 text-right font-black text-blue-600"
              >
                {item.jumlah}
              </td>
              <td 
                className="py-4 px-6 text-right font-bold text-gray-500"
              >
                {item.persen} %
              </td>
            </tr>
          ))}
          <tr 
            className="bg-gray-50/80"
          >
            <td 
              colSpan={2} 
              className="py-4 px-6 text-right font-black text-gray-900"
            >
              TOTAL KESELURUHAN
            </td>
            <td 
              className="py-4 px-6 text-right font-black text-blue-700 text-lg"
            >
              {totalPenduduk}
            </td>
            <td 
              className="py-4 px-6 text-right font-black text-gray-900"
            >
              100 %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div 
          className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-4"
        ></div>
        <p 
          className="text-purple-700 font-bold tracking-widest animate-pulse"
        >
          MENGOLAH STATISTIK DEMOGRAFI...
        </p>
      </div>
    );
  }

  // Cari nilai max untuk skala chart
  const maxPendidikan = Math.max(...dataPendidikan.map(d => d.jumlah), 0);
  const maxPekerjaan = Math.max(...dataPekerjaan.map(d => d.jumlah), 0);
  const maxAgama = Math.max(...dataAgama.map(d => d.jumlah), 0);
  const maxGender = Math.max(...dataGender.map(d => d.jumlah), 0);
  const maxUmur = Math.max(...dataUmur.map(d => d.jumlah), 0);
  const maxWarga = Math.max(...dataWarga.map(d => d.jumlah), 0);
  const maxKawin = Math.max(...dataKawin.map(d => d.jumlah), 0);

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24"
    >
      
      {/* ==========================================
          HEADER (HERO SECTION)
      ========================================== */}
      <div 
        className={`relative py-16 md:py-24 text-white overflow-hidden shadow-md transition-colors duration-500 ${
          heroData.bg ? "bg-gray-900" : "bg-purple-700"
        }`}
      >
        <div 
          className="absolute inset-0 z-0"
        >
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Data Background" 
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
            className="text-purple-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-purple-900/50 px-4 py-1.5 rounded-full border border-purple-800 backdrop-blur-sm shadow-sm"
          >
            Visualisasi Data Penduduk
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
        
        {/* Navigasi Tab Internal (Bisa Di-Scroll Samping di HP) */}
        <div 
          className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex overflow-x-auto gap-2 md:gap-3 mb-10 no-scrollbar"
        >
          <button 
            onClick={() => handleTabChange("wilayah")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "wilayah" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🗺️ Wilayah
          </button>
          
          <button 
            onClick={() => handleTabChange("pendidikan")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "pendidikan" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🎓 Pendidikan
          </button>

          <button 
            onClick={() => handleTabChange("pekerjaan")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "pekerjaan" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            💼 Pekerjaan
          </button>

          <button 
            onClick={() => handleTabChange("agama")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "agama" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🕌 Agama
          </button>

          <button 
            onClick={() => handleTabChange("gender")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "gender" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🚻 Gender
          </button>

          <button 
            onClick={() => handleTabChange("umur")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "umur" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🎂 Umur
          </button>

          <button 
            onClick={() => handleTabChange("warga")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "warga" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            🌍 Kewarganegaraan
          </button>

          <button 
            onClick={() => handleTabChange("kawin")} 
            className={`flex-shrink-0 min-w-[140px] flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "kawin" ? "bg-purple-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
            }`}
          >
            💍 Perkawinan
          </button>
        </div>

        {totalPenduduk === 0 && !loading && (
          <div 
            className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center"
          >
            <span 
              className="text-6xl mb-4 block opacity-30"
            >
              📉
            </span>
            <h2 
              className="text-2xl font-bold text-gray-800"
            >
              Belum Ada Data Penduduk
            </h2>
          </div>
        )}

        {/* ==========================================
            TAB 1: WILAYAH ADMINISTRATIF (PERBANDINGAN DUSUN)
        ========================================== */}
        {activeTab === "wilayah" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🗺️</span> 
                Perbandingan Populasi Per Dusun
              </h2>
              
              <div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {dataWilayah.map((dusun, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="absolute top-0 left-0 w-2 h-full bg-purple-500"
                    ></div>
                    <h3 
                      className="text-xl font-black text-gray-900 mb-4 uppercase"
                    >
                      Dusun {dusun.nama}
                    </h3>
                    
                    <div 
                      className="grid grid-cols-2 gap-4"
                    >
                      <div 
                        className="bg-white p-4 rounded-xl border border-gray-100 text-center"
                      >
                        <p 
                          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1"
                        >
                          Total Warga
                        </p>
                        <p 
                          className="text-3xl font-black text-purple-600"
                        >
                          {dusun.total}
                        </p>
                      </div>
                      <div 
                        className="bg-white p-4 rounded-xl border border-gray-100 text-center"
                      >
                        <p 
                          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1"
                        >
                          Keluarga (KK)
                        </p>
                        <p 
                          className="text-3xl font-black text-blue-600"
                        >
                          {dusun.kk}
                        </p>
                      </div>
                      <div 
                        className="bg-white p-4 rounded-xl border border-gray-100 text-center"
                      >
                        <p 
                          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1"
                        >
                          Laki-Laki
                        </p>
                        <p 
                          className="text-3xl font-black text-cyan-600"
                        >
                          {dusun.laki}
                        </p>
                      </div>
                      <div 
                        className="bg-white p-4 rounded-xl border border-gray-100 text-center"
                      >
                        <p 
                          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1"
                        >
                          Perempuan
                        </p>
                        <p 
                          className="text-3xl font-black text-pink-600"
                        >
                          {dusun.perempuan}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: PENDIDIKAN
        ========================================== */}
        {activeTab === "pendidikan" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🎓</span> 
                Grafik Pendidikan Ditempuh
              </h2>
              <RenderBarChart 
                data={dataPendidikan} 
                maxVal={maxPendidikan} 
                colorClass="bg-blue-500" 
              />
              <RenderTable 
                data={dataPendidikan} 
                title="Pendidikan" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: PEKERJAAN
        ========================================== */}
        {activeTab === "pekerjaan" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>💼</span> 
                Grafik Mata Pencaharian
              </h2>
              <RenderBarChart 
                data={dataPekerjaan} 
                maxVal={maxPekerjaan} 
                colorClass="bg-green-500" 
              />
              <RenderTable 
                data={dataPekerjaan} 
                title="Pekerjaan" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: AGAMA
        ========================================== */}
        {activeTab === "agama" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🕌</span> 
                Grafik Agama & Kepercayaan
              </h2>
              <RenderBarChart 
                data={dataAgama} 
                maxVal={maxAgama} 
                colorClass="bg-yellow-500" 
              />
              <RenderTable 
                data={dataAgama} 
                title="Agama" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: GENDER
        ========================================== */}
        {activeTab === "gender" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🚻</span> 
                Grafik Jenis Kelamin
              </h2>
              <RenderBarChart 
                data={dataGender} 
                maxVal={maxGender} 
                colorClass="bg-pink-500" 
              />
              <RenderTable 
                data={dataGender} 
                title="Jenis Kelamin" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 6: UMUR
        ========================================== */}
        {activeTab === "umur" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🎂</span> 
                Grafik Kelompok Umur
              </h2>
              <RenderBarChart 
                data={dataUmur} 
                maxVal={maxUmur} 
                colorClass="bg-orange-500" 
              />
              <RenderTable 
                data={dataUmur} 
                title="Kelompok Umur" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: WARGA NEGARA
        ========================================== */}
        {activeTab === "warga" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>🌍</span> 
                Grafik Kewarganegaraan
              </h2>
              <RenderBarChart 
                data={dataWarga} 
                maxVal={maxWarga} 
                colorClass="bg-red-500" 
              />
              <RenderTable 
                data={dataWarga} 
                title="Kewarganegaraan" 
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 8: STATUS KAWIN
        ========================================== */}
        {activeTab === "kawin" && totalPenduduk > 0 && (
          <div 
            className="animate-fade-in space-y-8"
          >
            <div 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h2 
                className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"
              >
                <span>💍</span> 
                Grafik Status Perkawinan
              </h2>
              <RenderBarChart 
                data={dataKawin} 
                maxVal={maxKawin} 
                colorClass="bg-cyan-500" 
              />
              <RenderTable 
                data={dataKawin} 
                title="Status Perkawinan" 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function DataDesaPublik() {
  return (
    <Suspense 
      fallback={
        <div 
          className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
        >
          <div 
            className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-4"
          ></div>
          <p 
            className="text-purple-700 font-bold tracking-widest animate-pulse"
          >
            MENYIAPKAN DATA...
          </p>
        </div>
      }
    >
      <DataDesaContent />
    </Suspense>
  );
}