// src/components/dashboard/ManajemenAkun.tsx
"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc
} from "firebase/firestore";
import { 
  getAuth, 
  updateProfile, 
  updatePassword 
} from "firebase/auth";
import { db } from "../../lib/firebase";

interface ManajemenAkunProps {
  userEmail: string | null;
}

export default function ManajemenAkun({ 
  userEmail 
}: ManajemenAkunProps) {
  
  const [tabAktif, setTabAktif] = useState("profil");
  const [userRole, setUserRole] = useState("Memuat...");
  const [currentUserDocId, setCurrentUserDocId] = useState<string | null>(null);
  
  const [statusProses, setStatusProses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE: PROFIL SAYA
  // ==========================================
  const [profilNama, setProfilNama] = useState("");
  const [profilPasswordBaru, setProfilPasswordBaru] = useState("");
  const [profilFotoLama, setProfilFotoLama] = useState("");
  const [profilFotoList, setProfilFotoList] = useState<FileList | null>(null);

  // ==========================================
  // STATE: KELOLA AKUN (HANYA ADMIN)
  // ==========================================
  const [daftarAkun, setDaftarAkun] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formAkunBaru, setFormAkunBaru] = useState({
    nama: "",
    email: "",
    role: "Kontributor"
  });

  // ==========================================
  // FUNGSI FETCH DATA & OTORISASI RBAC
  // ==========================================
  const ambilData = async () => {
    if (!userEmail) return;

    try {
      // 1. Cari data user yang sedang login
      const qUser = query(
        collection(db, "users_desa"), 
        where("email", "==", userEmail)
      );
      const snapUser = await getDocs(qUser);
      
      let roleSaatIni = "Kontributor"; // Default aman terendah

      if (!snapUser.empty) {
        const docUser = snapUser.docs[0];
        setCurrentUserDocId(docUser.id);
        
        const dataUser = docUser.data();
        roleSaatIni = dataUser.role;
        setUserRole(roleSaatIni);
        setProfilNama(dataUser.nama || "");
        setProfilFotoLama(dataUser.foto || "");
      } else if (userEmail === "admin@kerjo.co.id") {
        // Fallback untuk Super Admin bawaan
        roleSaatIni = "Admin";
        setUserRole("Admin");
        setProfilNama("Super Administrator");
      }

      // 2. Jika Admin, ambil seluruh daftar akun
      if (roleSaatIni === "Admin") {
        const snapSemua = await getDocs(collection(db, "users_desa"));
        setDaftarAkun(snapSemua.docs.map(d => ({ id: d.id, ...d.data() })));
      }

    } catch (error) {
      console.error("Gagal memuat profil:", error);
    }
  };

  useEffect(() => {
    ambilData();
  }, [userEmail]);

  // ==========================================
  // CLOUDINARY UPLOADER
  // ==========================================
  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.url;
      return null;
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
    } catch (error) {}
  };

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
  // HANDLER: SIMPAN PROFIL DIRI SENDIRI
  // ==========================================
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Menyimpan pembaruan profil...");

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      let imageUrl = profilFotoLama;

      // 1. Upload Foto Baru Jika Ada
      if (profilFotoList && profilFotoList.length > 0) {
        setStatusProses("Mengunggah foto profil baru...");
        const newImg = await uploadFotoKeCloudinary(profilFotoList[0]);
        if (newImg) {
          if (profilFotoLama) await hapusFotoDiCloudinary(profilFotoLama);
          imageUrl = newImg;
        }
      }

      // 2. Update Auth Display Name & Photo URL (Firebase Auth)
      if (user) {
        await updateProfile(user, {
          displayName: profilNama,
          photoURL: imageUrl
        });

        // 3. Update Password Jika Diisi
        if (profilPasswordBaru.trim() !== "") {
          setStatusProses("Memperbarui kata sandi...");
          await updatePassword(user, profilPasswordBaru);
        }
      }

      // 4. Update Database Firestore (users_desa)
      if (currentUserDocId) {
        await updateDoc(doc(db, "users_desa", currentUserDocId), {
          nama: profilNama,
          foto: imageUrl
        });
      }

      setProfilFotoLama(imageUrl);
      setProfilFotoList(null);
      setProfilPasswordBaru("");
      setStatusProses("✅ Profil berhasil diperbarui!");
      setTimeout(() => setStatusProses(""), 4000);

    } catch (error: any) {
      console.error("Error Update Profil:", error);
      // PENANGANAN ERROR PASSWORD REQUIRES RECENT LOGIN
      if (error.code === "auth/requires-recent-login") {
        setStatusProses("⚠️ GAGAL GANTI PASSWORD: Demi keamanan, sistem Firebase mewajibkan Anda untuk LOGOUT dan LOGIN KEMBALI terlebih dahulu sebelum dapat mengganti kata sandi.");
      } else if (error.code === "auth/weak-password") {
        setStatusProses("❌ GAGAL: Kata sandi terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setStatusProses(`❌ Terjadi kesalahan: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLER: TAMBAH & HAPUS AKUN (HANYA ADMIN)
  // ==========================================
  const handleTambahAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusProses("Mendaftarkan akun ke database...");

    try {
      // Menambahkan hak akses ke database Firestore
      await addDoc(collection(db, "users_desa"), {
        nama: formAkunBaru.nama,
        email: formAkunBaru.email,
        role: formAkunBaru.role,
        foto: "",
        tanggal_dibuat: new Date().toISOString()
      });

      setIsModalOpen(false);
      ambilData();
      setFormAkunBaru({ nama: "", email: "", role: "Kontributor" });
      setStatusProses("✅ Akun berhasil didaftarkan ke Database! Info: User terkait harus melakukan 'Sign Up / Daftar' menggunakan Email tersebut agar bisa Login.");
      setTimeout(() => setStatusProses(""), 6000);
    } catch (error) {
      setStatusProses("❌ Gagal mendaftarkan akun.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHapusAkun = async (id: string, emailTarget: string) => {
    if (emailTarget === "admin@kerjo.co.id" || emailTarget === userEmail) {
      alert("Akses Ditolak: Anda tidak dapat menghapus akun Super Admin atau akun Anda sendiri.");
      return;
    }

    if (confirm(`Yakin ingin mencabut hak akses untuk email ${emailTarget}? (Ini hanya menghapus hak akses di Panel Admin)`)) {
      try {
        await deleteDoc(doc(db, "users_desa", id));
        ambilData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  return (
    <div 
      className="space-y-8 animate-fade-in pb-20 font-sans"
    >
      
      {/* 
        TAB NAVIGASI DINAMIS (RBAC) 
        Kontributor dan Pemdes tidak akan melihat tombol "Kelola Akun Admin"
      */}
      <div 
        className="flex flex-wrap gap-2 md:gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-8"
      >
        <button 
          onClick={() => setTabAktif("profil")} 
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            tabAktif === "profil" ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>👤</span> Profil Saya
        </button>
        
        {userRole === "Admin" && (
          <button 
            onClick={() => setTabAktif("kelola")} 
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tabAktif === "kelola" ? "bg-red-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>🛡️</span> Kelola Akun Admin
          </button>
        )}
      </div>

      {statusProses && (
        <div 
          className={`p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${
            statusProses.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : 
            statusProses.includes("⚠️") ? "bg-yellow-50 text-yellow-800 border-yellow-300" :
            "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {statusProses}
        </div>
      )}

      {/* ==========================================
          TAB 1: EDIT PROFIL DIRI SENDIRI
      ========================================== */}
      {tabAktif === "profil" && (
        <div 
          className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border-t-4 border-blue-600 animate-fade-in max-w-4xl mx-auto"
        >
          <div 
            className="text-center mb-10"
          >
            <h3 
              className="text-3xl font-black text-gray-900 mb-2"
            >
              Pengaturan Profil
            </h3>
            <p 
              className="text-gray-500 font-medium"
            >
              Kelola identitas publik dan kata sandi keamanan Anda di sini.
            </p>
          </div>

          <form 
            onSubmit={handleSimpanProfil} 
            className="space-y-8"
          >
            
            {/* UI UPLOAD FOTO PREMIUM */}
            <div 
              className="flex flex-col items-center justify-center mb-8"
            >
              <div 
                className="relative group cursor-pointer"
              >
                <div 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-blue-100 bg-gray-100 overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105"
                >
                  {profilFotoList && profilFotoList.length > 0 ? (
                    <img 
                      src={URL.createObjectURL(profilFotoList[0])} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : profilFotoLama ? (
                    <img 
                      src={getSafeImageUrl(profilFotoLama)} 
                      alt="Foto Profil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-5xl text-gray-300 bg-gray-50"
                    >
                      👤
                    </div>
                  )}
                  
                  {/* Layer Hitam Transparan Saat Hover */}
                  <div 
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <span 
                      className="text-white text-3xl mb-1"
                    >
                      📸
                    </span>
                    <span 
                      className="text-white text-[10px] font-bold tracking-widest uppercase"
                    >
                      Ubah Foto
                    </span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setProfilFotoList(e.target.files)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Klik untuk memilih foto"
                />
              </div>
              <p 
                className="text-xs text-gray-500 font-bold mt-4"
              >
                Format yang diizinkan: JPG, PNG, WEBP, HEIC.
              </p>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Nama Tampilan
                </label>
                <input 
                  type="text" 
                  required 
                  value={profilNama} 
                  onChange={(e) => setProfilNama(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                  placeholder="Nama Lengkap Anda"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Alamat Email (Tidak dapat diubah)
                </label>
                <input 
                  type="email" 
                  disabled 
                  value={userEmail || ""} 
                  className="w-full p-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Hak Akses (Role)
                </label>
                <input 
                  type="text" 
                  disabled 
                  value={userRole} 
                  className="w-full p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-black uppercase tracking-widest cursor-not-allowed"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Ganti Kata Sandi Baru
                </label>
                <input 
                  type="password" 
                  value={profilPasswordBaru} 
                  onChange={(e) => setProfilPasswordBaru(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
                  placeholder="Biarkan kosong jika tidak diganti"
                />
                <p 
                  className="text-[10px] text-gray-500 font-bold mt-1.5"
                >
                  *Jika terjadi error, mohon Logout terlebih dahulu dan Login kembali.
                </p>
              </div>
            </div>

            <div 
              className="pt-6 border-t border-gray-100"
            >
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 text-lg"
              >
                {isLoading ? "MENYIMPAN PERUBAHAN..." : "SIMPAN PROFIL SAYA"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 2: KELOLA AKUN (HANYA MUNCUL JIKA ADMIN)
      ========================================== */}
      {tabAktif === "kelola" && userRole === "Admin" && (
        <div 
          className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-red-600 animate-fade-in"
        >
          <div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h3 
                className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-1"
              >
                <span>🛡️</span> Manajemen Hak Akses
              </h3>
              <p 
                className="text-gray-500 text-sm font-medium"
              >
                Kontrol siapa saja yang dapat mengakses Panel Admin Desa.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors text-sm w-full md:w-auto"
            >
              + Berikan Akses Baru
            </button>
          </div>

          <div 
            className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner bg-gray-50 p-4"
          >
            <table 
              className="min-w-full text-sm text-left bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <thead 
                className="bg-gray-50 border-b border-gray-200"
              >
                <tr>
                  <th 
                    className="py-4 px-6 font-bold text-gray-600"
                  >
                    Profil Pengguna
                  </th>
                  <th 
                    className="py-4 px-6 font-bold text-gray-600"
                  >
                    Kontak Email
                  </th>
                  <th 
                    className="py-4 px-6 font-bold text-gray-600"
                  >
                    Role Akses
                  </th>
                  <th 
                    className="py-4 px-6 text-center font-bold text-gray-600 w-32"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {daftarAkun.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={4} 
                      className="text-center py-10 font-bold text-gray-500"
                    >
                      Belum ada data pengguna.
                    </td>
                  </tr>
                ) : (
                  daftarAkun.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-50 hover:bg-red-50/20 transition-colors"
                    >
                      <td 
                        className="py-4 px-6 flex items-center gap-4"
                      >
                        <div 
                          className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0"
                        >
                          {item.foto ? (
                            <img 
                              src={getSafeImageUrl(item.foto)} 
                              alt="User" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-lg text-gray-400"
                            >
                              👤
                            </div>
                          )}
                        </div>
                        <span 
                          className="font-black text-gray-900"
                        >
                          {item.nama}
                        </span>
                      </td>
                      <td 
                        className="py-4 px-6 font-mono text-gray-600 text-xs"
                      >
                        {item.email}
                      </td>
                      <td 
                        className="py-4 px-6"
                      >
                        <span 
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                            item.role === "Admin" ? "bg-red-100 text-red-800 border-red-300" :
                            item.role === "Pemerintah Desa" ? "bg-blue-100 text-blue-800 border-blue-300" :
                            "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td 
                        className="py-4 px-6 text-center"
                      >
                        <button 
                          onClick={() => handleHapusAkun(item.id, item.email)} 
                          className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg transition-colors text-xs shadow-sm"
                        >
                          Cabut Akses
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL TAMBAH AKUN AKSES (HANYA ADMIN)
      ========================================== */}
      {isModalOpen && userRole === "Admin" && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 border-t-8 border-red-600"
          >
            <h3 
              className="text-2xl font-black mb-2 text-gray-900"
            >
              Berikan Akses Admin
            </h3>
            <p 
              className="text-xs text-gray-500 font-medium mb-6 leading-relaxed"
            >
              Daftarkan email pengguna di sini. Kemudian minta pengguna untuk Sign Up di halaman Login menggunakan Email yang sama persis agar sistem mengaitkan hak akses ini ke akun mereka.
            </p>

            <form 
              onSubmit={handleTambahAkun} 
              className="space-y-4"
            >
              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Nama Pengguna
                </label>
                <input 
                  type="text" 
                  required 
                  value={formAkunBaru.nama} 
                  onChange={(e) => setFormAkunBaru({...formAkunBaru, nama: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold" 
                  placeholder="Cth: Budi Santoso"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Alamat Email (Wajib Sama dengan Email Sign Up)
                </label>
                <input 
                  type="email" 
                  required 
                  value={formAkunBaru.email} 
                  onChange={(e) => setFormAkunBaru({...formAkunBaru, email: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm" 
                  placeholder="budi@gmail.com"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Hak Akses (Role)
                </label>
                <select 
                  required 
                  value={formAkunBaru.role} 
                  onChange={(e) => setFormAkunBaru({...formAkunBaru, role: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500 font-black text-gray-700 uppercase"
                >
                  <option value="Kontributor">KONTRIBUTOR (Kabar, Agenda, UMKM)</option>
                  <option value="Pemerintah Desa">PEMERINTAH DESA (Semua Kecuali Kelola Akun)</option>
                  <option value="Admin">SUPER ADMIN (Semua Akses Penuh)</option>
                </select>
              </div>
              
              <div 
                className="flex gap-4 mt-8 pt-4 border-t border-gray-100"
              >
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {isLoading ? "Memproses..." : "Daftarkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}