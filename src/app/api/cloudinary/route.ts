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

// 2. FUNGSI UPLOAD GAMBAR BARU (Menerima FormData Anti-Limit)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "File tidak terdeteksi" }, { status: 400 });
    }

    // Mengubah File Asli menjadi Buffer lalu ke format yang dipahami Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload ke folder 'desa_kerjo' di Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: "desa_kerjo",
    });

    return NextResponse.json({ success: true, url: uploadResponse.secure_url });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengunggah gambar ke Cloudinary" }, 
      { status: 500 }
    );
  }
}

// 3. FUNGSI HAPUS GAMBAR
export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ success: false, error: "URL tidak ditemukan" }, { status: 400 });
    }

    // Algoritma mengekstrak "public_id" dari URL Cloudinary
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((p: string) => p === 'upload');
    
    if (uploadIndex === -1) {
      return NextResponse.json({ success: false, error: "URL tidak valid" }, { status: 400 });
    }

    const fileWithExt = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = fileWithExt.split('.')[0]; 

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, message: "Gambar dimusnahkan" });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus gambar" }, 
      { status: 500 }
    );
  }
}