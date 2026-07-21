// src/app/api/cloudinary/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// 1. Konfigurasi Cloudinary mengambil data dari .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 2. FUNGSI UPLOAD GAMBAR (Menerima Base64 dari Client)
export async function POST(request: Request) {
  try {
    const { file } = await request.json();
    
    // Upload ke folder 'desa_kerjo' di Cloudinary agar rapi
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: "desa_kerjo",
    });

    return NextResponse.json({ 
      success: true, 
      url: uploadResponse.secure_url 
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengunggah gambar ke Cloudinary" }, 
      { status: 500 }
    );
  }
}

// 3. FUNGSI HAPUS GAMBAR (Menerima URL gambar yang ingin dihapus)
export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ success: false, error: "URL tidak ditemukan" }, { status: 400 });
    }

    // Algoritma mengekstrak "public_id" dari URL Cloudinary
    // Contoh URL: https://res.cloudinary.com/demo/image/upload/v1612345/desa_kerjo/foto1.jpg
    const urlParts = url.split('/');
    
    // PERBAIKAN: Menambahkan (p: string) agar TypeScript Strict Mode tidak memunculkan garis peringatan
    const uploadIndex = urlParts.findIndex((p: string) => p === 'upload');
    
    if (uploadIndex === -1) {
      return NextResponse.json({ success: false, error: "Bukan URL Cloudinary yang valid" }, { status: 400 });
    }

    // Ambil string setelah folder 'upload' dan versi 'v...' untuk mendapatkan public_id
    const fileWithExt = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = fileWithExt.split('.')[0]; 

    // Perintah sakti penghancur gambar dari server Cloudinary
    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, message: "Gambar berhasil dimusnahkan dari Server" });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus gambar dari Cloudinary" }, 
      { status: 500 }
    );
  }
}