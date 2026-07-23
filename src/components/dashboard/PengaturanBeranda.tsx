// src/components/dashboard/PengaturanBeranda.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface PengaturanBerandaProps {
  userEmail: string | null;
  activeSubMenu?: string; 
}

export default function PengaturanBeranda({ 
  userEmail, 
  activeSubMenu 
}: PengaturanBerandaProps) {
  
  const defaultTab = activeSubMenu === "beranda-kontak" ? "kontak"
                   : activeSubMenu === "beranda-slide" ? "slide"
                   : "hero";

  const [tabAktif, setTabAktif] = useState(defaultTab);

  useEffect(() => {
    if (activeSubMenu === "beranda-kontak") {
      setTabAktif("kontak");
    } else if (activeSubMenu === "beranda-slide") {
      setTabAktif("slide");
    } else if (activeSubMenu === "beranda-hero") {
      setTabAktif("hero");
    }
  }, [activeSubMenu]);

  // ==========================================
  // STATE: HEADER BERANDA (HERO)
  // ==========================================
  const [judulHero, setJudulHero] = useState("");
  const [subHero, setSubHero] = useState("");
  const [bgHeroLama, setBgHeroLama] = useState("");
  const [bgHeroList, setBgHeroList] = useState<FileList | null>(null);
  const [statusHero, setStatusHero] = useState("");
  const [isLoadingHero, setIsLoadingHero] = useState(false);

  // ==========================================
  // STATE: KONTAK & MAPS
  // ==========================================
  const [kontak, setKontak] = useState({
    alamat: "",
    email: "",
    jam_kerja: "",
    wa: "",
    ig: "",
    fb: "",
    yt: "",
    tiktok: "",
    peta_embed: ""
  });
  const [statusKontak, setStatusKontak] = useState("");
  const [isLoadingKontak, setIsLoadingKontak] = useState(false);

  // ==========================================
  // STATE: BERITA SLIDE (DATABASE: kabar_desa)
  // ==========================================
  const [beritaTampil, setBeritaTampil] = useState<any[]>([]);

  // ==========================================
  // FUNGSI KONVERSI GAMBAR HEIC -> JPG (WSVR)
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
  // FETCH DATA AWAL
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil Data Header Beranda
        const snapHero = await getDoc(doc(db, "pengaturan_web", "beranda_hero"));
        if (snapHero.exists() && snapHero.data()) {
          setJudulHero(snapHero.data().judul || "");
          setSubHero(snapHero.data().sub || "");
          setBgHeroLama(snapHero.data().bg || "");
        }

        // Ambil Data Kontak & Maps
        const snapKontak = await getDoc(doc(db, "pengaturan_web", "kontak"));
        if (snapKontak.exists() && snapKontak.data()) {
          setKontak({
            alamat: snapKontak.data().alamat || "",
            email: snapKontak.data().email || "",
            jam_kerja: snapKontak.data().jam_kerja || "",
            wa: snapKontak.data().wa || "",
            ig: snapKontak.data().ig || "",
            fb: snapKontak.data().fb || "",
            yt: snapKontak.data().yt || "",
            tiktok: snapKontak.data().tiktok || "",
            peta_embed: snapKontak.data().peta_embed || ""
          });
        }

        // Ambil Data Berita yang di-Pin (DATABASE: kabar_desa)
        const qBerita = query(
          collection(db, "kabar_desa"), 
          where("is_pinned", "==", true)
        );
        const snapBerita = await getDocs(qBerita);
        setBeritaTampil(snapBerita.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as any) 
        })));

      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    };
    
    fetchData();
  }, []);

  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/cloudinary", { 
        method: "POST", 
        body: formData 
      });
      
      const data = await res.json();
      if (data.success) {
        return data.url;
      }
      throw new Error(data.error);
    } catch (error) {
      return null;
    }
  };

  const hapusFotoDiCloudinary = async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/cloudinary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ==========================================
  // HANDLER SIMPAN DATA
  // ==========================================
  const handleSimpanHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingHero(true);
    setStatusHero("Menyimpan pengaturan header...");

    try {
      let imageUrl = bgHeroLama;
      
      if (bgHeroList && bgHeroList.length > 0) {
        setStatusHero("Mengunggah background ke Cloudinary...");
        const newBg = await uploadFotoKeCloudinary(bgHeroList[0]);
        if (newBg) {
          if (bgHeroLama) {
            await hapusFotoDiCloudinary(bgHeroLama);
          }
          imageUrl = newBg;
        }
      }

      await setDoc(doc(db, "pengaturan_web", "beranda_hero"), {
        judul: judulHero,
        sub: subHero,
        bg: imageUrl,
        diperbarui_oleh: userEmail,
        terakhir_diperbarui: new Date().toISOString()
      });

      setBgHeroLama(imageUrl);
      setBgHeroList(null);
      setStatusHero("✅ Beranda berhasil diperbarui!");
      
      const input = document.getElementById("inputHeroBeranda") as HTMLInputElement;
      if (input) {
        input.value = "";
      }
      
      setTimeout(() => setStatusHero(""), 4000);
    } catch (error) {
      setStatusHero("❌ Gagal menyimpan header.");
    } finally {
      setIsLoadingHero(false);
    }
  };

  const handleSimpanKontak = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingKontak(true);
    setStatusKontak("Menyimpan kontak & peta...");

    try {
      await setDoc(doc(db, "pengaturan_web", "kontak"), {
        ...kontak,
        diperbarui_oleh: userEmail,
        terakhir_diperbarui: new Date().toISOString()
      });
      
      setStatusKontak("✅ Kontak berhasil diperbarui!");
      setTimeout(() => setStatusKontak(""), 4000);
    } catch (error) {
      setStatusKontak("❌ Gagal menyimpan kontak.");
    } finally {
      setIsLoadingKontak(false);
    }
  };

  // ==========================================
  // HANDLER HAPUS GAMBAR THUMBNAIL (SILANG)
  // ==========================================
  const handleHapusGambarHero = () => {
    if (confirm("Yakin ingin menghapus gambar latar belakang ini?")) {
      setBgHeroLama("");
      setBgHeroList(null);
      const input = document.getElementById("inputHeroBeranda") as HTMLInputElement;
      if (input) {
        input.value = "";
      }
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      <div 
        className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("hero")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "hero" 
            ? "bg-yellow-500 text-white shadow-md" 
            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span 
            className="text-xl"
          >
            🖼️
          </span> 
          Header Beranda
        </button>
        
        <button 
          onClick={() => setTabAktif("kontak")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "kontak" 
            ? "bg-purple-600 text-white shadow-md" 
            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span 
            className="text-xl"
          >
            📞
          </span> 
          Kontak & Sosmed
        </button>
        
        <button 
          onClick={() => setTabAktif("slide")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "slide" 
            ? "bg-blue-600 text-white shadow-md" 
            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span 
            className="text-xl"
          >
            📰
          </span> 
          Berita Slide
        </button>
      </div>

      {/* ==========================================
          TAB 1: PENGATURAN HEADER BERANDA
      ========================================== */}
      {tabAktif === "hero" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span 
              className="text-3xl"
            >
              🖼️
            </span> 
            Pengaturan Visual Beranda
          </h3>
          <p 
            className="text-gray-500 text-sm mb-8"
          >
            Ubah gambar latar belakang (background) dan teks sambutan utama di halaman depan web.
          </p>
          
          <form 
            onSubmit={handleSimpanHero} 
            className="space-y-6"
          >
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              
              <div 
                className="space-y-6"
              >
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-800"
                  >
                    Judul Utama (Mendukung Multi-Baris Paragraf)
                  </label>
                  <textarea 
                    required 
                    rows={4}
                    value={judulHero} 
                    onChange={(e) => setJudulHero(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all font-bold text-lg whitespace-pre-wrap"
                    placeholder="Contoh: Selamat Datang Di&#10;Desa Kerjo"
                  ></textarea>
                </div>
                <div>
                  <label 
                    className="block text-sm font-bold mb-2 text-gray-800"
                  >
                    Teks Sub-Judul (Deskripsi Singkat)
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={subHero} 
                    onChange={(e) => setSubHero(e.target.value)} 
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 focus:bg-white transition-all text-sm leading-relaxed whitespace-pre-wrap"
                    placeholder="Mewujudkan pelayanan masyarakat yang transparan..."
                  ></textarea>
                </div>
              </div>

              <div 
                className="space-y-4"
              >
                <label 
                  className="block text-sm font-bold text-gray-800 border-b border-gray-100 pb-2"
                >
                  Gambar Background Beranda
                </label>
                
                {(bgHeroLama || (bgHeroList && bgHeroList.length > 0)) && (
                  <div 
                    className="relative w-full h-40 md:h-56 rounded-xl overflow-hidden shadow-inner border-2 border-gray-200 group"
                  >
                    <img 
                      src={bgHeroList && bgHeroList.length > 0 ? URL.createObjectURL(bgHeroList[0]) : getSafeImageUrl(bgHeroLama)} 
                      alt="Hero Beranda Preview"
                      className="w-full h-full object-cover" 
                    />
                    {/* TOMBOL SILANG HAPUS GAMBAR SAAT HOVER */}
                    <button 
                      type="button"
                      onClick={handleHapusGambarHero}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span 
                        className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2"
                      >
                        <span>❌</span> Hapus Gambar
                      </span>
                    </button>
                  </div>
                )}
                
                <label 
                  className="cursor-pointer flex flex-col items-center justify-center py-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all shadow-sm"
                >
                  <span 
                    className="text-3xl mb-2"
                  >
                    📸
                  </span>
                  <span 
                    className="font-bold text-yellow-800 text-sm"
                  >
                    {bgHeroLama || bgHeroList ? "Pilih Gambar Pengganti" : "Upload Background ke Cloudinary"}
                  </span>
                  <input 
                    id="inputHeroBeranda"
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setBgHeroList(e.target.files)} 
                    className="hidden" 
                  />
                </label>
                
                {bgHeroList && (
                  <div 
                    className="text-xs font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    ✅ Gambar baru siap disimpan.
                  </div>
                )}
              </div>
            </div>
            
            {statusHero && (
              <div 
                className={`p-4 rounded-xl text-sm font-bold text-center border ${
                  statusHero.includes("❌") 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : "bg-green-100 text-green-800 border-green-300"
                }`}
              >
                {statusHero}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoadingHero} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoadingHero ? "Memproses Data..." : "Terapkan Perubahan ke Beranda"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: KONTAK & SOSIAL MEDIA
      ========================================== */}
      {tabAktif === "kontak" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span 
              className="text-3xl"
            >
              📞
            </span> 
            Identitas Kontak & Peta
          </h3>
          <p 
            className="text-gray-500 text-sm mb-8"
          >
            Informasi yang diisi di sini akan otomatis tampil di Footer publik dan mengaktifkan tombol WhatsApp melayang warga.
          </p>
          
          <form 
            onSubmit={handleSimpanKontak} 
            className="space-y-8"
          >
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              
              <div 
                className="bg-purple-50 p-6 rounded-2xl border border-purple-100 space-y-5"
              >
                <h4 
                  className="font-black text-purple-900 flex items-center gap-2 mb-2 border-b border-purple-200 pb-3"
                >
                  <span>
                    📍
                  </span> 
                  Info Layanan Fisik
                </h4>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-purple-800"
                  >
                    Alamat Lengkap Balai Desa
                  </label>
                  <textarea 
                    required 
                    rows={2} 
                    value={kontak.alamat} 
                    onChange={(e) => setKontak({...kontak, alamat: e.target.value})} 
                    className="w-full p-3 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white transition-all text-sm leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-purple-800"
                  >
                    Link Peta Google Maps (Embed src)
                  </label>
                  <textarea 
                    rows={3} 
                    value={kontak.peta_embed} 
                    onChange={(e) => setKontak({...kontak, peta_embed: e.target.value})} 
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full p-3 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white transition-all text-sm font-mono text-gray-700"
                  ></textarea>
                  <p 
                    className="text-[9px] mt-1 text-purple-600 font-bold"
                  >
                    Hanya masukkan URL (link) yang ada di dalam atribut src="" pada kode embed Google Maps.
                  </p>
                </div>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-purple-800"
                  >
                    Email Resmi Desa
                  </label>
                  <input 
                    type="email" 
                    value={kontak.email} 
                    onChange={(e) => setKontak({...kontak, email: e.target.value})} 
                    className="w-full p-3 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-purple-800"
                  >
                    Jam Kerja / Operasional
                  </label>
                  <input 
                    type="text" 
                    value={kontak.jam_kerja} 
                    onChange={(e) => setKontak({...kontak, jam_kerja: e.target.value})} 
                    placeholder="Senin - Jumat (08:00 - 15:00 WIB)"
                    className="w-full p-3 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm font-bold"
                  />
                </div>
              </div>

              <div 
                className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-5"
              >
                <h4 
                  className="font-black text-green-900 flex items-center gap-2 mb-2 border-b border-green-200 pb-3"
                >
                  <span>
                    🌐
                  </span> 
                  Kanal Digital & WA
                </h4>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-green-800"
                  >
                    No. WhatsApp Admin (Gunakan awalan 62)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={kontak.wa} 
                    onChange={(e) => setKontak({...kontak, wa: e.target.value})} 
                    placeholder="628123456789"
                    className="w-full p-3 border border-green-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono text-sm font-bold text-green-900"
                  />
                  <p 
                    className="text-[9px] mt-1 text-green-600 font-bold"
                  >
                    Nomor ini digunakan untuk Tombol Bantuan WA yang melayang di sudut layar publik.
                  </p>
                </div>
                
                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-green-800"
                  >
                    Link Instagram
                  </label>
                  <input 
                    type="url" 
                    value={kontak.ig} 
                    onChange={(e) => setKontak({...kontak, ig: e.target.value})} 
                    className="w-full p-3 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-xs text-blue-600 font-mono"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-green-800"
                  >
                    Link Facebook
                  </label>
                  <input 
                    type="url" 
                    value={kontak.fb} 
                    onChange={(e) => setKontak({...kontak, fb: e.target.value})} 
                    className="w-full p-3 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-xs text-blue-600 font-mono"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-green-800"
                  >
                    Link YouTube
                  </label>
                  <input 
                    type="url" 
                    value={kontak.yt} 
                    onChange={(e) => setKontak({...kontak, yt: e.target.value})} 
                    className="w-full p-3 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-xs text-blue-600 font-mono"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs font-bold mb-2 text-green-800"
                  >
                    Link TikTok
                  </label>
                  <input 
                    type="url" 
                    value={kontak.tiktok} 
                    onChange={(e) => setKontak({...kontak, tiktok: e.target.value})} 
                    className="w-full p-3 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-xs text-blue-600 font-mono"
                    placeholder="https://tiktok.com/..."
                  />
                </div>
                
              </div>
            </div>
            
            {statusKontak && (
              <div 
                className={`p-4 rounded-xl text-sm font-bold text-center border ${
                  statusKontak.includes("❌") 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : "bg-green-100 text-green-800 border-green-300"
                }`}
              >
                {statusKontak}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoadingKontak} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg"
            >
              {isLoadingKontak ? "Menyimpan Data..." : "Simpan Info Kontak & Sosmed"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 3: BERITA SLIDE (PREVIEW SINKRON KABAR_DESA)
      ========================================== */}
      {tabAktif === "slide" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in"
        >
          <h3 
            className="text-2xl font-bold mb-2 flex items-center gap-2"
          >
            <span 
              className="text-3xl"
            >
              📰
            </span> 
            Pratinjau Berita Slide Beranda
          </h3>
          <p 
            className="text-gray-500 text-sm mb-8"
          >
            Data di bawah ini ditarik otomatis dari menu <b>Kabar & Agenda</b> (Database: <code>kabar_desa</code>). Untuk mengubah daftar ini, silakan tandai (Pin) berita yang Anda inginkan di halaman manajemen berita.
          </p>

          {beritaTampil.length === 0 ? (
            <div 
              className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50"
            >
              <p 
                className="text-gray-500 font-bold"
              >
                Belum ada berita yang ditandai untuk tampil di Beranda.
              </p>
            </div>
          ) : (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {beritaTampil.map((berita) => {
                
                // Cek format gambar (Array atau String)
                let imgUrl = "";
                if (Array.isArray(berita.gambar) && berita.gambar.length > 0) {
                  imgUrl = berita.gambar[0];
                } else if (typeof berita.gambar === "string") {
                  imgUrl = berita.gambar;
                }

                return (
                  <div 
                    key={berita.id} 
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div 
                      className="h-32 bg-gray-200 relative"
                    >
                      {imgUrl ? (
                        <img 
                          src={getSafeImageUrl(imgUrl)} 
                          alt="Preview"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-gray-400 text-2xl"
                        >
                          🖼️
                        </div>
                      )}
                      <span 
                        className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase"
                      >
                        PINNED
                      </span>
                    </div>
                    <div 
                      className="p-4"
                    >
                      <h4 
                        className="font-bold text-gray-900 text-sm line-clamp-2 mb-2"
                      >
                        {berita.judul}
                      </h4>
                      <p 
                        className="text-xs text-gray-500 mb-2"
                      >
                        {berita.tanggal_posting ? new Date(berita.tanggal_posting).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        }) : "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}