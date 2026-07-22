// src/components/dashboard/ManajemenAkun.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getApp, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

interface AkunProps {
  userEmail: string | null;
}

export default function ManajemenAkun({ userEmail }: AkunProps) {
  const [daftarUser, setDaftarUser] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Kontributor");
  const [fotoList, setFotoList] = useState<FileList | null>(null);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [fotoLama, setFotoLama] = useState("");

  const ambilDataAkun = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users_desa"));
      // PERBAIKAN TYPESCRIPT: Menambahkan 'as any' secara eksplisit
      const users = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      
      setDaftarUser(users);

      const me = users.find((u: any) => u.email === userEmail);
      
      if (me) {
        setMyProfile(me);
        if (me.role === "Admin" || userEmail === "admin@kerjo.co.id") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          mulaiEdit(me);
        }
      } else if (userEmail === "admin@kerjo.co.id") {
        setIsAdmin(true); 
      }
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      ambilDataAkun();
    }
  }, [userEmail]);

  const uploadFotoKeCloudinary = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        return data.url;
      }
      throw new Error(data.error);
    } catch (error) {
      console.error("Upload error:", error);
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

  const handleSimpanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Memproses...");

    try {
      let imageUrl = fotoLama;
      
      if (fotoList && fotoList.length > 0) {
        setStatus("Mengunggah Foto Profil ke Cloudinary...");
        const newUrl = await uploadFotoKeCloudinary(fotoList[0]);
        if (newUrl) {
          if (fotoLama) {
            await hapusFotoDiCloudinary(fotoLama);
          }
          imageUrl = newUrl;
        }
      }

      if (editModeId) {
        await updateDoc(doc(db, "users_desa", editModeId), {
          nama: nama, 
          role: role, 
          foto: imageUrl
        });
        
        if (password.length >= 6) {
           const auth = getAuth();
           if (auth.currentUser && auth.currentUser.email === email) {
              await updatePassword(auth.currentUser, password);
              setStatus("✅ Profil & Password berhasil diperbarui!");
           } else {
              setStatus("⚠️ Profil diupdate. (Password orang lain tidak bisa diubah demi keamanan Firebase)");
           }
        } else {
           setStatus("✅ Profil berhasil diperbarui!");
        }
      } else {
        setStatus("Membuat Autentikasi Firebase via Jalur Aman...");
        let secondaryApp;
        try { 
          secondaryApp = getApp("Secondary"); 
        } catch { 
          secondaryApp = initializeApp(firebaseConfig, "Secondary"); 
        }
        
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await secondaryAuth.signOut(); 

        setStatus("Menyimpan Hak Akses Role ke Database...");
        await setDoc(doc(db, "users_desa", userCredential.user.uid), {
          email: email, 
          nama: nama, 
          role: role, 
          foto: imageUrl, 
          tanggal_dibuat: new Date().toISOString()
        });
        
        setStatus("✅ User baru berhasil didaftarkan!");
      }

      if (isAdmin) {
        batalEdit();
      }
      
      ambilDataAkun();
      setTimeout(() => setStatus(""), 5000);
      
    } catch (error: any) {
      setStatus(`❌ Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const mulaiEdit = (user: any) => {
    setEditModeId(user.uid || user.id); 
    setNama(user.nama); 
    setEmail(user.email); 
    setRole(user.role); 
    setFotoLama(user.foto || "");
    setPassword(""); 
    setFotoList(null); 
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEdit = () => {
    setEditModeId(null); 
    setNama(""); 
    setEmail(""); 
    setPassword(""); 
    setRole("Kontributor"); 
    setFotoLama(""); 
    setFotoList(null);
  };

  const hapusUser = async (uid: string, fotoUrl: string) => {
    if (!confirm("Hapus hak akses user ini dari Database? Akun Auth di Firebase tetap ada, tapi ia tidak bisa lagi login ke Dashboard ini.")) return;
    
    if (fotoUrl) {
      await hapusFotoDiCloudinary(fotoUrl);
    }
    
    await deleteDoc(doc(db, "users_desa", uid));
    ambilDataAkun();
  };

  if (!isAdmin && !myProfile) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-3xl shadow-sm border border-gray-100">
        <span className="text-5xl mb-4 block">🚫</span>
        Akses Ditolak. Hubungi Admin Utama Desa Kerjo.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      <div className={`bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 border-t-4 ${isAdmin && !editModeId ? 'border-green-500' : 'border-blue-500'}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
          {editModeId 
            ? "✏️ Edit Profil Akun" 
            : isAdmin 
              ? "➕ Tambah User Baru" 
              : "⚙️ Pengaturan Profil Saya"
          }
        </h3>
        <p className="text-gray-500 text-sm mb-8 pb-4 border-b border-gray-100">
          {isAdmin 
            ? "Kelola akses anggota staf untuk Dashboard E-Government Desa Kerjo." 
            : "Anda bisa mengubah nama, foto profil, atau password Anda secara mandiri di sini."
          }
        </p>

        <form onSubmit={handleSimpanUser} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700">
                Nama Pengguna Lengkap
              </label>
              <input 
                type="text" 
                required 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                className="w-full p-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all font-bold text-gray-800" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700">
                Alamat Email (Digunakan Untuk Login)
              </label>
              <input 
                type="email" 
                required 
                disabled={!!editModeId} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 font-mono text-gray-600 disabled:opacity-60" 
                placeholder="nama@kerjo.desa.id" 
              />
              {editModeId && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">
                  Email login sistem tidak dapat diubah.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-700">
                {editModeId ? "Ganti Password Baru" : "Buat Password"}
              </label>
              <input 
                type="password" 
                required={!editModeId} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                minLength={6} 
                placeholder={editModeId ? "Kosongkan jika tidak ingin merubah sandi" : "Minimal 6 Karakter"} 
                className="w-full p-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white font-mono tracking-widest text-gray-800" 
              />
            </div>
            
            {isAdmin ? (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700">
                  Tetapkan Hak Akses (Role)
                </label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 font-black text-gray-800 cursor-pointer"
                >
                  <option value="Admin">🟢 Admin Utama (Akses Penuh Keseluruhan)</option>
                  <option value="Pemerintah Desa">🔵 Pemerintah Desa (Akses Penuh Tanpa Manajemen Akun)</option>
                  <option value="Kontributor">🟠 Kontributor (Hanya Manajemen Berita & UMKM)</option>
                </select>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <span className="block text-xs text-blue-500 font-bold mb-1">
                  Status Hak Akses Anda Saat Ini:
                </span>
                <span className="font-black text-blue-800 uppercase tracking-widest text-lg">
                  {myProfile?.role || "Tidak Diketahui"}
                </span>
              </div>
            )}
            
            <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm flex-shrink-0 bg-gray-200">
                {fotoLama ? (
                   <img 
                     src={fotoLama.startsWith("http") ? fotoLama : `https://wsrv.nl/?url=${fotoLama}`} 
                     alt="Foto Profil"
                     className="w-full h-full object-cover" 
                   />
                ) : (
                   <span className="flex items-center justify-center h-full text-3xl opacity-50">👤</span>
                )}
              </div>
              <div className="w-full">
                <label className="block text-xs font-bold mb-2 text-gray-700">
                  Ganti Foto Profil (Server Cloudinary)
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFotoList(e.target.files)} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer bg-white border border-gray-200 rounded-lg p-1 shadow-sm outline-none" 
                />
              </div>
            </div>
          </div>
          
          {status && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center border shadow-sm ${status.includes("❌") ? "bg-red-50 text-red-700 border-red-200" : status.includes("⚠️") ? "bg-yellow-50 text-yellow-800 border-yellow-300" : "bg-green-100 text-green-800 border-green-300"}`}>
              {status}
            </div>
          )}
          
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            {editModeId && isAdmin && (
              <button 
                type="button" 
                onClick={batalEdit} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-4 rounded-xl transition-colors"
              >
                Batal Edit
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 text-lg"
            >
              {loading ? "Sistem Sedang Memproses..." : editModeId ? "Simpan Perubahan Profil" : "Daftarkan User Baru"}
            </button>
          </div>
        </form>
      </div>

      {isAdmin && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">👥 Daftar Pengurus Sistem</h4>
            <span className="bg-blue-100 text-blue-800 font-black text-xs px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
              Total Aktif: {daftarUser.length} Akun
            </span>
          </div>
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-4 font-bold text-gray-600">Profil & Nama User</th>
                <th className="py-4 px-4 font-bold text-gray-600">Email Login</th>
                <th className="py-4 px-4 font-bold text-gray-600 text-center">Status Akses (Role)</th>
                <th className="py-4 px-4 text-center font-bold text-gray-600">Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {daftarUser.map((u) => (
                <tr key={u.uid} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                      {u.foto ? (
                        <img 
                          src={u.foto.startsWith("http") ? u.foto : `https://wsrv.nl/?url=${u.foto}`} 
                          alt="Profil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full text-xl opacity-50">👤</span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-base">{u.nama}</div>
                      {u.email === userEmail && (
                        <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded font-bold tracking-widest uppercase mt-0.5 inline-block shadow-sm">
                          Akun Anda
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-gray-600 text-xs">
                    {u.email}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${
                      u.role === "Admin" ? "bg-green-50 text-green-700 border-green-200" : 
                      u.role === "Pemerintah Desa" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                      "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={() => mulaiEdit(u)} 
                        className="w-full max-w-[90px] bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-sm"
                      >
                        Edit
                      </button>
                      {u.email !== userEmail && (
                        <button 
                          onClick={() => hapusUser(u.uid, u.foto)} 
                          className="w-full max-w-[90px] bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors shadow-sm"
                        >
                          Cabut Akses
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {daftarUser.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 font-medium">
                    Memuat daftar akun...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}