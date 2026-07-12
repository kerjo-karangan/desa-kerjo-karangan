"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginAdmin() {
  const router = useRouter();
  
  // State untuk menyimpan inputan pengguna dan status loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); // Bersihkan pesan error sebelumnya
    setIsLoading(true);

    try {
      // Mencoba membuka pintu Firebase dengan email dan password
      await signInWithEmailAndPassword(auth, email, password);
      
      // Jika kunci cocok, langsung arahkan ke Ruang Kendali
      router.push("/dashboard");
    } catch (error: any) {
      // Penanganan pesan error otomatis dari Firebase
      if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password"
      ) {
        setErrorMsg("Email atau kata sandi tidak valid.");
      } else {
        setErrorMsg("Terjadi kesalahan. Pastikan koneksi internet stabil.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 animate-fade-in-up">
        
        {/* Header Portal */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-sm">
            DK
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Portal Keamanan</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Sistem Informasi Desa Kerjo</p>
        </div>

        {/* Formulir Login */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-800"
              placeholder="admin@kerjo.desa.id"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-800"
              placeholder="••••••••"
            />
          </div>

          {/* Menampilkan kotak merah jika terjadi error */}
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg text-center animate-pulse border border-red-100">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 ${
              isLoading 
                ? "bg-green-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            {isLoading ? "Memverifikasi Kredensial..." : "Otorisasi Masuk"}
          </button>
        </form>

        {/* Footer Kecil di dalam Box Login */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Terenskripsi & Dilindungi Oleh Firebase
          </p>
        </div>

      </div>
    </main>
  );
}