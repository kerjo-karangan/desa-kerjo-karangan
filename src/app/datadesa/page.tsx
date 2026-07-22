// src/app/datadesa/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function DataDesaPublik() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-yellow-700 font-bold tracking-widest animate-pulse">
          MEMUAT GRAFIK DATA...
        </p>
      </div>
    }>
      <DataDesaContent />
    </Suspense>
  );
}

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

const CHART_COLORS = [
  "rgba(34, 197, 94, 0.8)",   // Hijau
  "rgba(59, 130, 246, 0.8)",  // Biru
  "rgba(234, 179, 8, 0.8)",   // Kuning
  "rgba(239, 68, 68, 0.8)",   // Merah
  "rgba(168, 85, 247, 0.8)",  // Ungu
  "rgba(20, 184, 166, 0.8)",  // Teal
  "rgba(249, 115, 22, 0.8)",  // Oranye
  "rgba(236, 72, 153, 0.8)",  // Pink
  "rgba(99, 102, 241, 0.8)",  // Indigo
  "rgba(100, 116, 139, 0.8)", // Slate
];

function DataDesaContent() {
  const [loading, setLoading] = useState(true);
  const [heroData, setHeroData] = useState({
    judul: "Data Demografi Desa",
    sub: "Visualisasi data kependudukan yang transparan, akurat, dan terus diperbarui.",
    bg: ""
  });

  const [statistik, setStatistik] = useState({
    totalPenduduk: 0,
    totalLaki: 0,
    totalPerempuan: 0,
    totalKeluarga: 0,
  });

  const [grafikGender, setGrafikGender] = useState<any>(null);
  const [grafikAgama, setGrafikAgama] = useState<any>(null);
  const [grafikPendidikan, setGrafikPendidikan] = useState<any>(null);
  const [grafikPekerjaan, setGrafikPekerjaan] = useState<any>(null);
  const [grafikKawin, setGrafikKawin] = useState<any>(null);
  const [grafikDarah, setGrafikDarah] = useState<any>(null);

  const hitungKemunculan = (array: any[], key: string) => {
    return array.reduce((acc, curr) => {
      const val = curr[key] || "TIDAK DIKETAHUI";
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  };

  const susunDataGrafik = (dataObj: any, labelJudul: string) => {
    const labels = Object.keys(dataObj).sort((a, b) => dataObj[b] - dataObj[a]);
    const dataValues = labels.map((lbl) => dataObj[lbl]);
    
    return {
      labels,
      datasets: [
        {
          label: labelJudul,
          data: dataValues,
          backgroundColor: CHART_COLORS.slice(0, labels.length),
          borderColor: "rgba(255, 255, 255, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  useEffect(() => {
    const ambilData = async () => {
      setLoading(true);
      try {
        const snapHero = await getDoc(doc(db, "pengaturan_web", "datadesa_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setHeroData({
            judul: snapHero.data().judul || "Data Demografi Desa",
            sub: snapHero.data().sub || "Visualisasi data kependudukan yang transparan...",
            bg: snapHero.data().bg || ""
          });
        }

        const snapPenduduk = await getDocs(collection(db, "data_penduduk"));
        const dataPenduduk = snapPenduduk.docs.map((doc) => doc.data());

        const totalPenduduk = dataPenduduk.length;
        const totalLaki = dataPenduduk.filter((p) => p.jenis_kelamin === "LAKI-LAKI").length;
        const totalPerempuan = dataPenduduk.filter((p) => p.jenis_kelamin === "PEREMPUAN").length;
        const keluargaUnik = new Set(dataPenduduk.map((p) => p.id_keluarga));

        setStatistik({
          totalPenduduk,
          totalLaki,
          totalPerempuan,
          totalKeluarga: keluargaUnik.size,
        });

        if (totalPenduduk > 0) {
          setGrafikGender(susunDataGrafik(hitungKemunculan(dataPenduduk, "jenis_kelamin"), "Jumlah"));
          setGrafikAgama(susunDataGrafik(hitungKemunculan(dataPenduduk, "agama"), "Jumlah"));
          setGrafikPendidikan(susunDataGrafik(hitungKemunculan(dataPenduduk, "pendidikan"), "Jumlah"));
          setGrafikKawin(susunDataGrafik(hitungKemunculan(dataPenduduk, "status_kawin"), "Jumlah"));
          setGrafikDarah(susunDataGrafik(hitungKemunculan(dataPenduduk, "golongan_darah"), "Jumlah"));
          
          const rawPekerjaan = hitungKemunculan(dataPenduduk, "pekerjaan");
          const top10PekerjaanKeys = Object.keys(rawPekerjaan)
            .sort((a, b) => rawPekerjaan[b] - rawPekerjaan[a])
            .slice(0, 10);
            
          const top10PekerjaanObj: any = {};
          top10PekerjaanKeys.forEach(k => {
            top10PekerjaanObj[k] = rawPekerjaan[k];
          });
          
          setGrafikPekerjaan(susunDataGrafik(top10PekerjaanObj, "Jumlah"));
        }
      } catch (error) {
        console.error("Gagal mengambil data penduduk:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilData();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-yellow-700 font-bold tracking-widest animate-pulse">
          MENGHITUNG STATISTIK...
        </p>
      </div>
    );
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24">
      
      <div className={`text-white py-16 md:py-24 relative overflow-hidden shadow-md transition-colors duration-500 ${heroData.bg ? 'bg-gray-900' : 'bg-yellow-700'}`}>
        <div className="absolute inset-0 z-0">
          {heroData.bg && (
            <img 
              src={getSafeImageUrl(heroData.bg)} 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in">
          <span className="text-yellow-200 font-extrabold tracking-widest uppercase text-sm mb-3 inline-block bg-yellow-900/50 px-4 py-1.5 rounded-full border border-yellow-800 backdrop-blur-sm shadow-sm">
            Portal Demografi Desa
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl whitespace-pre-wrap leading-tight text-white">
            {heroData.judul}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-lg whitespace-pre-wrap">
            {heroData.sub}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl flex-grow">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-20 -mt-12 mb-12">
          
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
            <span className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm">
              👥
            </span>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Total Penduduk
            </h3>
            <span className="text-3xl md:text-4xl font-black text-gray-900">
              {new Intl.NumberFormat('id-ID').format(statistik.totalPenduduk)}
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
            <span className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm">
              👨‍👩‍👧‍👦
            </span>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Total Keluarga (KK)
            </h3>
            <span className="text-3xl md:text-4xl font-black text-gray-900">
              {new Intl.NumberFormat('id-ID').format(statistik.totalKeluarga)}
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
            <span className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm">
              👨
            </span>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Laki - Laki
            </h3>
            <span className="text-3xl md:text-4xl font-black text-gray-900">
              {new Intl.NumberFormat('id-ID').format(statistik.totalLaki)}
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
            <span className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm">
              👩
            </span>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
              Perempuan
            </h3>
            <span className="text-3xl md:text-4xl font-black text-gray-900">
              {new Intl.NumberFormat('id-ID').format(statistik.totalPerempuan)}
            </span>
          </div>

        </div>

        {statistik.totalPenduduk === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center animate-fade-in">
            <span className="text-6xl mb-4 block opacity-30">📭</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Data Belum Tersedia
            </h2>
            <p className="text-gray-500">
              Pemerintah desa belum mengunggah data demografi ke dalam sistem.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🚻</span> Jenis Kelamin
                </h3>
              </div>
              <div className="h-64 relative">
                {grafikGender && (
                  <Doughnut 
                    data={grafikGender} 
                    options={{ responsive: true, maintainAspectRatio: false }} 
                  />
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🕌</span> Agama & Kepercayaan
                </h3>
              </div>
              <div className="h-64 relative">
                {grafikAgama && (
                  <Pie 
                    data={grafikAgama} 
                    options={{ responsive: true, maintainAspectRatio: false }} 
                  />
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🎓</span> Tingkat Pendidikan
                </h3>
              </div>
              <div className="h-80 relative">
                {grafikPendidikan && (
                  <Bar 
                    data={grafikPendidikan} 
                    options={horizontalBarOptions} 
                  />
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">💼</span> Mata Pencaharian (Top 10)
                </h3>
              </div>
              <div className="h-80 relative">
                {grafikPekerjaan && (
                  <Bar 
                    data={grafikPekerjaan} 
                    options={barOptions} 
                  />
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">💍</span> Status Perkawinan
                </h3>
              </div>
              <div className="h-64 relative">
                {grafikKawin && (
                  <Doughnut 
                    data={grafikKawin} 
                    options={{ responsive: true, maintainAspectRatio: false }} 
                  />
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🩸</span> Golongan Darah
                </h3>
              </div>
              <div className="h-64 relative">
                {grafikDarah && (
                  <Bar 
                    data={grafikDarah} 
                    options={barOptions} 
                  />
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}