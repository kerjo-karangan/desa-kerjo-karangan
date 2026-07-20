// src/app/profil/lembaga/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function DetailLembaga() {
  const router = useRouter();
  const params = useParams();
  const idLembaga = params?.id as string;

  const [lembaga, setLembaga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    if (!idLembaga) return;

    const ambilDetailLembaga = async () => {
      try {
        const docRef = doc(db, "lembaga_desa", idLembaga);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLembaga({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorStatus(true);
        }
      } catch (error) {
        console.error("Gagal mengambil detail lembaga", error);
        setErrorStatus(true);
      } finally {
        setLoading(false);
      }
    };

    ambilDetailLembaga();
  }, [idLembaga]);

  // KOMPONEN REKURSIF UNTUK MENGGAMBAR BAGAN SOTK LEMBAGA
  const RenderPohonSOTK = ({ parentId }: { parentId: string }) => {
    // Cari anggota yang melapor (jalurAtas) kepada parentId ini
    const bawahan = (lembaga.anggota_sotk || []).filter((org: any) => (org.jalurAtas || "") === parentId);

    if (bawahan.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4 relative">
        {bawahan.sort((a:any, b:any) => a.urutan - b.urutan).map((child: any) => (
          <div key={child.id} className="flex flex-col items-center relative">
            
            {parentId !== "" && (
              <div
                className={`w-0 h-8 border-l-4 ${
                  child.jenisGaris === "Koordinasi" ? "border-dashed border-indigo-400" : "border-solid border-indigo-600"
                }`}
              ></div>
            )}

            <div className="bg-white border-b-4 border-indigo-600 p-5 rounded-2xl shadow-md w-48 text-center z-10 hover:-translate-y-2 transition-transform duration-300 border-x border-t border-gray-100">
              <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-inner border border-indigo-100">
                {child.foto ? (
                  <img src={child.foto.startsWith("http") ? child.foto : `https://wsrv.nl/?url=${child.foto}`} className="w-full h-full object-cover" alt={child.nama} />
                ) : (
                  <span className="text-3xl text-indigo-300">👤</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{child.nama}</h4>
              <p className="text-[10px] bg-indigo-50 text-indigo-800 font-black uppercase tracking-widest px-2 py-1.5 rounded mt-2 inline-block border border-indigo-200">
                {child.jabatan}
              </p>
            </div>

            {/* Panggil Rekursi untuk mencari bawahan dari anggota ini */}
            <RenderPohonSOTK parentId={child.id} />
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-md"></div>
        <p className="text-gray-500 font-bold text-lg animate-pulse tracking-wide">Membuka profil lembaga...</p>
      </div>
    );
  }

  if (errorStatus || !lembaga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <span className="text-7xl mb-6 drop-shadow-md">⚠️</span>
        <h1 className="text-3xl font-black text-gray-800 mb-2">Lembaga Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-8 max-w-md">Mohon maaf, lembaga masyarakat yang Anda cari mungkin sudah dihapus atau tautannya salah.</p>
        <Link href="/profil?tab=lembaga" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
          Kembali ke Daftar Lembaga
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header Sticky */}
      <div className="bg-white/80 backdrop-blur-md py-4 border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl flex items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-700 hover:text-white font-bold hover:bg-indigo-600 px-5 py-2 rounded-xl transition-colors text-sm border border-indigo-200 hover:border-indigo-600 bg-white shadow-sm">
            <span className="text-xl">←</span> Kembali ke Profil
          </button>
        </div>
      </div>

      <article className="container mx-auto px-4 py-10 max-w-5xl animate-fade-in">
        
        {/* Header Profil Lembaga */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 border-t-4 border-indigo-500">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-3xl flex items-center justify-center flex-shrink-0 border border-gray-200 p-4 shadow-inner">
            {lembaga.foto ? (
              <img src={lembaga.foto.startsWith("http") ? lembaga.foto : `https://wsrv.nl/?url=${lembaga.foto}`} className="w-full h-full object-contain" alt={lembaga.singkatan} />
            ) : (
              <span className="text-6xl text-gray-300">🏛️</span>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-2">
              {lembaga.singkatan}
            </h1>
            <h2 className="text-lg md:text-xl font-bold text-indigo-600 uppercase tracking-widest mb-6">
              {lembaga.nama}
            </h2>
            <p className="text-gray-600 leading-relaxed text-justify md:text-left text-lg">
              {lembaga.deskripsi}
            </p>
          </div>
        </div>

        {/* Bagan SOTK Lembaga Khusus */}
        <div className="bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="text-center mb-10">
            <span className="text-indigo-600 font-extrabold tracking-widest uppercase text-sm mb-2 block">Struktur Kepengurusan</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Susunan Anggota {lembaga.singkatan}</h2>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-8 h-1 bg-indigo-600"></div> Garis Instruksi</div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-8 h-1 border-b-2 border-dashed border-indigo-400"></div> Garis Koordinasi</div>
            </div>
          </div>
          
          {(!lembaga.anggota_sotk || lembaga.anggota_sotk.length === 0) ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <span className="text-5xl text-gray-300 block mb-4">👥</span>
              <p className="text-gray-500 font-medium">Susunan pengurus untuk lembaga ini belum diatur oleh Admin.</p>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center min-w-[800px]">
              {/* Mulai render dari "Puncak" (parentId = "") */}
              <RenderPohonSOTK parentId="" />
            </div>
          )}
        </div>

      </article>
    </main>
  );
}