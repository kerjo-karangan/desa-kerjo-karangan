// src/components/dashboard/ManajemenAkun.tsx
"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ManajemenAkun({ userEmail }: { userEmail: string | null }) {
  const [namaAkun, setNamaAkun] = useState("");
  const [emailAkun, setEmailAkun] = useState("");
  const [roleAkun, setRoleAkun] = useState("Kontributor");
  const [statusAkun, setStatusAkun] = useState("");
  const [isLoadingAkun, setIsLoadingAkun] = useState(false);

  const handleSimpanAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAkun(true);
    setStatusAkun("Menyimpan...");
    try {
      await setDoc(doc(db, "users_role", emailAkun.toLowerCase()), {
        nama: namaAkun,
        email: emailAkun.toLowerCase(),
        role: roleAkun,
        didaftarkan_oleh: userEmail,
        tanggal_daftar: new Date().toISOString(),
      });
      setStatusAkun("✅ Data Tersimpan! Pengguna bisa login.");
      setNamaAkun("");
      setEmailAkun("");
      setRoleAkun("Kontributor");
    } catch (error) {
      setStatusAkun("❌ Gagal mendaftarkan akun.");
    } finally {
      setIsLoadingAkun(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border-t-4 border-gray-800 animate-fade-in">
      <h3 className="text-2xl font-bold mb-2">👥 Registrasi Hak Akses Sistem</h3>
      <p className="text-gray-500 text-sm mb-8">
        Tambahkan identitas pengguna baru untuk mengelola website ini bersama Anda. Pastikan email yang didaftarkan aktif di Google.
      </p>
      
      <form onSubmit={handleSimpanAkun} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Nama Lengkap Pengguna</label>
            <input
              type="text"
              required
              value={namaAkun}
              onChange={(e) => setNamaAkun(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 bg-gray-50 focus:bg-white transition-all font-medium"
              placeholder="Contoh: Budi Santoso"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Alamat Email Aktif (Terdaftar di Google)</label>
            <input
              type="email"
              required
              value={emailAkun}
              onChange={(e) => setEmailAkun(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 bg-gray-50 focus:bg-white transition-all font-medium"
              placeholder="budi@kerjo.desa.id"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">Peran & Tingkat Otoritas (Role Sistem)</label>
          <select
            value={roleAkun}
            onChange={(e) => setRoleAkun(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800 cursor-pointer"
          >
            <option value="Kontributor">Kontributor (Hanya bisa menambah & mengedit Berita)</option>
            <option value="Administrator">Administrator (Kendali Penuh Seluruh Sistem Dashboard)</option>
          </select>
        </div>
        
        {statusAkun && (
          <div className="p-4 bg-gray-100 text-gray-800 font-bold rounded-xl border border-gray-300 text-center">
            {statusAkun}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoadingAkun}
          className="w-full md:w-auto bg-gray-900 hover:bg-black text-white font-bold px-10 py-4 rounded-xl shadow-lg transition-all text-lg transform hover:-translate-y-1"
        >
          {isLoadingAkun ? "Menyimpan Identitas ke Server..." : "Daftarkan Otoritas Akun Baru"}
        </button>
      </form>
    </div>
  );
}