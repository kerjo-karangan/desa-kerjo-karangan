"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams } from "next/navigation";

// KOMPONEN PEMBUNGKUS UTAMA UNTUK MENGHINDARI ERROR LAYOUT
export default function LayananMandiri() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LayananContent />
    </Suspense>
  );
}

// -----------------------------------------------------------------
// DATABASE LOKAL: ATURAN PERSYARATAN DOKUMEN & PESAN KHUSUS
// -----------------------------------------------------------------
const INFO_SURAT: Record<string, { syarat: string[]; pesan: string }> = {
  "Surat Keterangan Usaha (SKU)": {
    syarat: ["Foto KTP", "Foto Bukti Usaha (Tempat Usaha)"],
    pesan: "",
  },
  "Surat Pengantar SKCK": {
    syarat: ["Foto KTP", "Foto Kartu Keluarga (KK)"],
    pesan: "",
  },
  "Surat Keterangan Tidak Mampu (SKTM)": {
    syarat: ["Foto KTP", "Foto KK", "Foto Kondisi Depan Rumah"],
    pesan: "",
  },
  "Surat Keterangan Domisili": {
    syarat: ["Foto KTP", "Foto KK"],
    pesan: "",
  },
  "Surat Pengantar Nikah/Cerai": {
    syarat: ["Foto KTP", "Foto KK", "Foto Akta Kelahiran"],
    pesan:
      "PERHATIAN: Pengurusan surat ini membutuhkan verifikasi dokumen fisik asli dan tanda tangan langsung. Formulir online ini hanya sebagai pendaftaran awal. Anda TETAP HARUS DATANG ke Balai Desa dengan membawa berkas asli.",
  },
};

// KOMPONEN ISI HALAMAN
function LayananContent() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  const [tabAktif, setTabAktif] = useState("surat");

  // Efek untuk membaca klik dari Navbar Sub-Button
  useEffect(() => {
    if (
      tabQuery === "surat" ||
      tabQuery === "status" ||
      tabQuery === "pengaduan"
    ) {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  // --- STATE PERMOHONAN SURAT ---
  const [nikSurat, setNikSurat] = useState("");
  const [namaSurat, setNamaSurat] = useState("");
  const [jenisSurat, setJenisSurat] = useState("");
  const [keperluanSurat, setKeperluanSurat] = useState("");
  const [fileSyaratList, setFileSyaratList] = useState<FileList | null>(null);
  const [statusSubmitSurat, setStatusSubmitSurat] = useState("");
  const [isLoadingSurat, setIsLoadingSurat] = useState(false);

  // --- STATE KOTAK PENGADUAN ---
  const [judulPengaduan, setJudulPengaduan] = useState("");
  const [isiPengaduan, setIsiPengaduan] = useState("");
  const [fotoPengaduan, setFotoPengaduan] = useState<File | null>(null);
  const [isAnonim, setIsAnonim] = useState(false);
  const [statusSubmitPengaduan, setStatusSubmitPengaduan] = useState("");
  const [isLoadingPengaduan, setIsLoadingPengaduan] = useState(false);

  // --- STATE LACAK STATUS ---
  const [lacakNik, setLacakNik] = useState("");
  const [hasilLacak, setHasilLacak] = useState<any | null>(null);
  const [statusLacak, setStatusLacak] = useState("");
  const [isLoadingLacak, setIsLoadingLacak] = useState(false);

  // FUNGSI UPLOAD FOTO KE IMGBB MENGGUNAKAN API KEY ANDA
  const uploadFotoKeImgBB = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    // MENGGUNAKAN API KEY DARI ANDA
    const apiKeyImgBB = "6755e61bb042b746d83c71595313674e";

    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      // Jalur CDN Fallback jika API utama terblokir
      try {
        const cdnUrl = `https://corsproxy.io/?https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`;
        const resCdn = await fetch(cdnUrl, {
          method: "POST",
          body: formData,
        });
        const dataCdn = await resCdn.json();
        if (dataCdn.success) return dataCdn.data.url;
        return null;
      } catch (errCdn) {
        return null;
      }
    }
  };

  // FUNGSI 1: KIRIM PERMOHONAN SURAT (DENGAN UPLOAD BERKAS)
  const handleKirimSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSurat(true);
    setStatusSubmitSurat("Memproses data permohonan...");

    try {
      let tautanBerkasBaru: string[] = [];

      // Jika surat mensyaratkan berkas, unggah dulu ke ImgBB
      if (fileSyaratList && fileSyaratList.length > 0) {
        setStatusSubmitSurat(
          `Mengunggah ${fileSyaratList.length} foto berkas persyaratan...`
        );
        const uploadPromises = Array.from(fileSyaratList).map((file) =>
          uploadFotoKeImgBB(file)
        );
        const hasilUpload = await Promise.all(uploadPromises);
        tautanBerkasBaru = hasilUpload.filter((url) => url !== null) as string[];
      }

      setStatusSubmitSurat("Mengirim permohonan ke database desa...");
      const kodeResi = "SRT-" + Math.floor(1000 + Math.random() * 9000);

      await addDoc(collection(db, "layanan_surat"), {
        resi: kodeResi,
        nik: nikSurat,
        nama: namaSurat,
        jenis_surat: jenisSurat,
        keperluan: keperluanSurat,
        berkas_syarat: tautanBerkasBaru, // Menyimpan link foto KTP/KK ke Firebase
        status_berkas: "Diajukan",
        tanggal_pengajuan: new Date().toISOString(),
      });

      setStatusSubmitSurat(
        `✅ Berhasil! Mohon simpan KODE RESI Anda: ${kodeResi}`
      );
      setNikSurat("");
      setNamaSurat("");
      setJenisSurat("");
      setKeperluanSurat("");
      setFileSyaratList(null);
    } catch (error) {
      setStatusSubmitSurat("❌ Gagal mengirim permohonan. Coba lagi.");
    } finally {
      setIsLoadingSurat(false);
    }
  };

  // FUNGSI 2: KIRIM PENGADUAN
  const handleKirimPengaduan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPengaduan(true);
    setStatusSubmitPengaduan("Memproses laporan...");

    try {
      let imageUrl = "";
      if (fotoPengaduan) {
        setStatusSubmitPengaduan("Mengunggah bukti foto...");
        imageUrl = (await uploadFotoKeImgBB(fotoPengaduan)) || "";
        if (!imageUrl) {
          setStatusSubmitPengaduan("❌ Gagal mengunggah foto laporan.");
          setIsLoadingPengaduan(false);
          return;
        }
      }

      setStatusSubmitPengaduan("Mengirim laporan ke server...");
      await addDoc(collection(db, "pengaduan_warga"), {
        judul: judulPengaduan,
        isi: isiPengaduan,
        foto_bukti: imageUrl,
        anonim: isAnonim,
        status_tanggapan: "Menunggu",
        tanggal_laporan: new Date().toISOString(),
      });

      setStatusSubmitPengaduan(
        "✅ Laporan berhasil dikirim! Terima kasih atas partisipasi Anda."
      );
      setJudulPengaduan("");
      setIsiPengaduan("");
      setFotoPengaduan(null);
      setIsAnonim(false);
    } catch (error) {
      setStatusSubmitPengaduan("❌ Gagal mengirim laporan.");
    } finally {
      setIsLoadingPengaduan(false);
    }
  };

  // FUNGSI 3: LACAK STATUS BERKAS
  const handleLacakBerkas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lacakNik) return;

    setIsLoadingLacak(true);
    setStatusLacak("Mencari data di database...");
    setHasilLacak(null);

    try {
      // Coba NIK dulu
      const q = query(
        collection(db, "layanan_surat"),
        where("nik", "==", lacakNik)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setHasilLacak(querySnapshot.docs[0].data());
        setStatusLacak("");
      } else {
        // Jika tidak ketemu, coba cari Resi
        const qResi = query(
          collection(db, "layanan_surat"),
          where("resi", "==", lacakNik)
        );
        const resiSnapshot = await getDocs(qResi);

        if (!resiSnapshot.empty) {
          setHasilLacak(resiSnapshot.docs[0].data());
          setStatusLacak("");
        } else {
          setStatusLacak(
            "❌ Data tidak ditemukan. Periksa kembali NIK atau Resi Anda."
          );
        }
      }
    } catch (error) {
      setStatusLacak("❌ Terjadi kesalahan sistem pelacakan.");
    } finally {
      setIsLoadingLacak(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER HERO SECTION */}
      <div className="bg-green-800 text-white py-16 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="bg-green-600 text-green-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">
            E-Government Desa
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Layanan Mandiri Warga
          </h1>
          <p className="text-base md:text-lg text-green-100 font-light leading-relaxed">
            Pusat pelayanan administrasi digital terpadu Desa Kerjo. Urus surat,
            lacak status, dan sampaikan aspirasi Anda dari mana saja.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl flex-grow">
        {/* TABS NAVIGASI */}
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-8">
          <button
            onClick={() => setTabAktif("surat")}
            className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
              tabAktif === "surat" || !tabAktif
                ? "bg-green-600 text-white shadow-md transform -translate-y-1"
                : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
            }`}
          >
            <span className="text-xl">📄</span> Permohonan Surat
          </button>
          <button
            onClick={() => setTabAktif("status")}
            className={`flex-1 md:flex-none px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
              tabAktif === "status"
                ? "bg-green-600 text-white shadow-md transform -translate-y-1"
                : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
            }`}
          >
            <span className="text-xl">🔍</span> Lacak Pengajuan
          </button>
          <button
            onClick={() => setTabAktif("pengaduan")}
            className={`w-full md:w-auto px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
              tabAktif === "pengaduan"
                ? "bg-green-600 text-white shadow-md transform -translate-y-1"
                : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
            }`}
          >
            <span className="text-xl">📢</span> Kotak Pengaduan
          </button>
        </div>

        {/* KONTEN ISOLASI: TAB PERMOHONAN SURAT */}
        {(tabAktif === "surat" || !tabAktif) && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Formulir Pengajuan Surat Baru
              </h2>
              <p className="text-gray-500 text-sm">
                Silakan isi data diri dan pilih jenis surat yang Anda butuhkan
                secara teliti.
              </p>
            </div>

            <form onSubmit={handleKirimSurat} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    NIK Pemohon
                  </label>
                  <input
                    type="number"
                    required
                    value={nikSurat}
                    onChange={(e) => setNikSurat(e.target.value)}
                    placeholder="Contoh: 3503xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Lengkap KTP
                  </label>
                  <input
                    type="text"
                    required
                    value={namaSurat}
                    onChange={(e) => setNamaSurat(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Jenis Surat yang Diajukan
                </label>
                <select
                  required
                  value={jenisSurat}
                  onChange={(e) => setJenisSurat(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white cursor-pointer font-medium text-gray-800"
                >
                  <option value="">-- Pilih Jenis Surat --</option>
                  <option value="Surat Keterangan Usaha (SKU)">
                    Surat Keterangan Usaha (SKU)
                  </option>
                  <option value="Surat Pengantar SKCK">
                    Surat Pengantar Kelakuan Baik (SKCK)
                  </option>
                  <option value="Surat Keterangan Tidak Mampu (SKTM)">
                    Surat Keterangan Tidak Mampu (SKTM)
                  </option>
                  <option value="Surat Keterangan Domisili">
                    Surat Keterangan Domisili
                  </option>
                  <option value="Surat Pengantar Nikah/Cerai">
                    Surat Pengantar Nikah / Cerai
                  </option>
                </select>
              </div>

              {/* AREA DINAMIS: MUNCUL JIKA SURAT MEMBUTUHKAN BERKAS / PERINGATAN */}
              {jenisSurat && INFO_SURAT[jenisSurat] && (
                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl space-y-4">
                  {INFO_SURAT[jenisSurat].pesan && (
                    <div className="flex gap-3 text-yellow-800 text-sm font-medium leading-relaxed pb-3 border-b border-yellow-200">
                      <span className="text-xl">⚠️</span>
                      <p>{INFO_SURAT[jenisSurat].pesan}</p>
                    </div>
                  )}

                  {INFO_SURAT[jenisSurat].syarat.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-800 mb-2">
                        Syarat Dokumen (Wajib Diunggah):
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 mb-4 font-medium">
                        {INFO_SURAT[jenisSurat].syarat.map((srt, idx) => (
                          <li key={idx}>{srt}</li>
                        ))}
                      </ul>
                      <label className="cursor-pointer flex flex-col items-center justify-center py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                        <span className="text-2xl mb-1">📸</span>
                        <span className="font-bold text-gray-600 text-sm">
                          Klik untuk upload foto dokumen sekaligus
                        </span>
                        <input
                          type="file"
                          required
                          accept="image/*"
                          multiple
                          onChange={(e) => setFileSyaratList(e.target.files)}
                          className="hidden"
                        />
                      </label>
                      {fileSyaratList && (
                        <p className="text-sm font-bold text-green-700 mt-2">
                          ✅ {fileSyaratList.length} berkas foto siap dikirim.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tujuan / Keperluan
                </label>
                <textarea
                  required
                  value={keperluanSurat}
                  onChange={(e) => setKeperluanSurat(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Syarat pengajuan KUR BRI"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white"
                ></textarea>
              </div>

              {statusSubmitSurat && (
                <div
                  className={`p-4 rounded-xl font-bold text-center border ${
                    statusSubmitSurat.includes("❌")
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-100 text-green-800 text-lg border-green-300"
                  }`}
                >
                  {statusSubmitSurat}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingSurat}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${
                  isLoadingSurat
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700 hover:-translate-y-1"
                }`}
              >
                {isLoadingSurat
                  ? "Memproses Permohonan..."
                  : "Kirim Pengajuan Surat"}
              </button>
            </form>
          </div>
        )}

        {/* KONTEN ISOLASI: TAB LACAK PENGAJUAN */}
        {tabAktif === "status" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 text-center max-w-xl mx-auto">
              <span className="text-5xl block mb-4">🔍</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Lacak Status Surat
              </h2>
              <p className="text-gray-500 text-sm">
                Masukkan NIK atau Kode Resi pengajuan Anda untuk melihat status
                terkini berkas Anda.
              </p>
            </div>

            <form
              onSubmit={handleLacakBerkas}
              className="flex flex-col md:flex-row gap-4 mb-10 max-w-2xl mx-auto"
            >
              <input
                type="text"
                required
                value={lacakNik}
                onChange={(e) => setLacakNik(e.target.value)}
                placeholder="Masukkan NIK / Kode Resi Anda..."
                className="flex-1 px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white font-bold text-center md:text-left text-lg text-gray-800 tracking-wider"
              />
              <button
                type="submit"
                disabled={isLoadingLacak}
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-all text-lg"
              >
                {isLoadingLacak ? "Mencari Data..." : "Lacak Berkas"}
              </button>
            </form>

            {statusLacak && (
              <p className="text-center font-bold text-red-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
                {statusLacak}
              </p>
            )}

            {/* HASIL PENCARIAN */}
            {hasilLacak ? (
              <div className="border border-green-200 rounded-2xl p-6 md:p-10 bg-green-50 shadow-inner">
                <div className="flex flex-col md:flex-row justify-between mb-8 pb-6 border-b border-green-200 gap-4">
                  <div>
                    <p className="text-sm text-green-700 font-bold uppercase tracking-wider mb-1">
                      Informasi Berkas
                    </p>
                    <h3 className="text-xl font-black text-gray-900">
                      {hasilLacak.jenis_surat}
                    </h3>
                    <p className="text-gray-700 font-medium mt-1">
                      {hasilLacak.nama}{" "}
                      <span className="text-gray-400">({hasilLacak.nik})</span>
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-green-700 font-bold uppercase tracking-wider mb-2">
                      Kode Resi
                    </p>
                    <span className="bg-white border-2 border-green-400 px-4 py-2 rounded-xl font-mono font-bold text-green-800 shadow-sm text-lg tracking-widest">
                      {hasilLacak.resi}
                    </span>
                  </div>
                </div>

                {/* Visualisasi Linimasa */}
                <div className="flex justify-between w-full max-w-2xl mx-auto relative mt-4">
                  <div className="absolute top-4 left-0 w-full h-1.5 bg-gray-300 -z-10 rounded-full"></div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-md text-lg">
                      ✓
                    </div>
                    <span className="text-xs md:text-sm font-bold mt-3 text-green-700">
                      Diajukan
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-colors text-lg ${
                        hasilLacak.status_berkas === "Verifikasi" ||
                        hasilLacak.status_berkas === "Selesai"
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-500 border-2 border-white"
                      }`}
                    >
                      {hasilLacak.status_berkas === "Verifikasi" ||
                      hasilLacak.status_berkas === "Selesai"
                        ? "✓"
                        : "2"}
                    </div>
                    <span
                      className={`text-xs md:text-sm font-bold mt-3 ${
                        hasilLacak.status_berkas === "Verifikasi" ||
                        hasilLacak.status_berkas === "Selesai"
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      Verifikasi
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-colors text-lg ${
                        hasilLacak.status_berkas === "Selesai"
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-500 border-2 border-white"
                      }`}
                    >
                      {hasilLacak.status_berkas === "Selesai" ? "✓" : "3"}
                    </div>
                    <span
                      className={`text-xs md:text-sm font-bold mt-3 ${
                        hasilLacak.status_berkas === "Selesai"
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      Siap Diambil
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              !statusLacak && (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-gray-50">
                  <span className="text-4xl text-gray-300 mb-3">🔍</span>
                  <p className="text-gray-500 font-medium">
                    Silakan lakukan pencarian di atas untuk memunculkan linimasa
                    proses berkas Anda.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* KONTEN ISOLASI: TAB KOTAK PENGADUAN */}
        {tabAktif === "pengaduan" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Sampaikan Aspirasi & Pengaduan
              </h2>
              <p className="text-gray-500 text-sm">
                Laporkan masalah infrastruktur desa, keluhan pelayanan, atau
                usulan langsung ke Pemerintah Desa.
              </p>
            </div>
            <form onSubmit={handleKirimPengaduan} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Judul Laporan / Keluhan
                </label>
                <input
                  type="text"
                  required
                  value={judulPengaduan}
                  onChange={(e) => setJudulPengaduan(e.target.value)}
                  placeholder="Contoh: Saluran Irigasi Dusun Krajan Tersumbat"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white text-gray-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi Lengkap Kejadian
                </label>
                <textarea
                  required
                  rows={5}
                  value={isiPengaduan}
                  onChange={(e) => setIsiPengaduan(e.target.value)}
                  placeholder="Ceritakan secara rinci apa yang terjadi, lokasi spesifiknya, dll..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white text-gray-800 leading-relaxed"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bukti Foto Laporan (Wajib)
                </label>
                <label className="w-full flex flex-col items-center justify-center px-4 py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                  <span className="text-4xl mb-3">
                    {fotoPengaduan ? "✅" : "📸"}
                  </span>
                  <span className="font-bold text-gray-700 text-sm md:text-base">
                    {fotoPengaduan
                      ? fotoPengaduan.name
                      : "Klik untuk memilih foto dari perangkat Anda"}
                  </span>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) setFotoPengaduan(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <input
                  type="checkbox"
                  id="anonim"
                  checked={isAnonim}
                  onChange={(e) => setIsAnonim(e.target.checked)}
                  className="w-6 h-6 text-green-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="anonim"
                  className="text-sm font-bold text-gray-800 cursor-pointer select-none flex flex-col"
                >
                  <span>Kirim sebagai Anonim (Rahasiakan Identitas Saya)</span>
                  <span className="text-xs text-gray-500 font-normal mt-0.5">
                    Nama Anda tidak akan ditampilkan di sistem dashboard admin.
                  </span>
                </label>
              </div>

              {statusSubmitPengaduan && (
                <div
                  className={`p-4 rounded-xl font-bold text-center border ${
                    statusSubmitPengaduan.includes("❌")
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-800 border-blue-200 text-lg"
                  }`}
                >
                  {statusSubmitPengaduan}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingPengaduan}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${
                  isLoadingPengaduan
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black hover:-translate-y-1"
                }`}
              >
                {isLoadingPengaduan
                  ? "Menganalisis & Mengirim Laporan..."
                  : "Kirim Laporan Pengaduan"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}