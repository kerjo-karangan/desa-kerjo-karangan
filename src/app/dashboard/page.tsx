"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function DashboardAdmin() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("welcome");

  // --- STATE LAYANAN WARGA (TERMASUK EDIT SURAT ADMIN) ---
  const [daftarSurat, setDaftarSurat] = useState<any[]>([]);
  const [daftarPengaduan, setDaftarPengaduan] = useState<any[]>([]);

  const [editSuratId, setEditSuratId] = useState<string | null>(null);
  const [editSuratNama, setEditSuratNama] = useState("");
  const [editSuratNik, setEditSuratNik] = useState("");
  const [editSuratJenis, setEditSuratJenis] = useState("");
  const [editSuratKeperluan, setEditSuratKeperluan] = useState("");
  const [isLoadingSuratAdmin, setIsLoadingSuratAdmin] = useState(false);

  // --- STATE KABAR & AGENDA ---
  const [judulKabar, setJudulKabar] = useState("");
  const [isiKabar, setIsiKabar] = useState("");
  const [fotoKabarList, setFotoKabarList] = useState<FileList | null>(null);
  const [statusKabar, setStatusKabar] = useState("");
  const [isLoadingKabar, setIsLoadingKabar] = useState(false);
  const [riwayatKabar, setRiwayatKabar] = useState<any[]>([]);
  const [editKabarId, setEditKabarId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]);

  const [namaAgenda, setNamaAgenda] = useState("");
  const [tanggalAgenda, setTanggalAgenda] = useState("");
  const [lokasiAgenda, setLokasiAgenda] = useState("");
  const [daftarAgenda, setDaftarAgenda] = useState<any[]>([]);
  const [statusAgenda, setStatusAgenda] = useState("");
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);

  // --- STATE PROFIL & SOTK ---
  const [sejarahDesa, setSejarahDesa] = useState("");
  const [visiMisiDesa, setVisiMisiDesa] = useState("");
  const [statusProfil, setStatusProfil] = useState("");
  const [isLoadingProfil, setIsLoadingProfil] = useState(false);

  const [namaAparatur, setNamaAparatur] = useState("");
  const [jabatanAparatur, setJabatanAparatur] = useState("");
  const [urutanAparatur, setUrutanAparatur] = useState<number>(1);
  const [fotoAparatur, setFotoAparatur] = useState<File | null>(null);
  const [daftarAparatur, setDaftarAparatur] = useState<any[]>([]);
  const [statusAparatur, setStatusAparatur] = useState("");
  const [isLoadingAparatur, setIsLoadingAparatur] = useState(false);
  const [editAparaturId, setEditAparaturId] = useState<string | null>(null);
  const [fotoLamaAparatur, setFotoLamaAparatur] = useState("");

  const [namaProduk, setNamaProduk] = useState("");
  const [pemilikUmkm, setPemilikUmkm] = useState("");
  const [hargaProduk, setHargaProduk] = useState("");
  const [waUmkm, setWaUmkm] = useState("");
  const [deskripsiProduk, setDeskripsiProduk] = useState("");
  const [fotoProduk, setFotoProduk] = useState<File | null>(null);
  const [daftarUmkm, setDaftarUmkm] = useState<any[]>([]);
  const [statusUmkm, setStatusUmkm] = useState("");
  const [isLoadingUmkm, setIsLoadingUmkm] = useState(false);
  const [editUmkmId, setEditUmkmId] = useState<string | null>(null);
  const [fotoLamaUmkm, setFotoLamaUmkm] = useState("");

  const [namaLembaga, setNamaLembaga] = useState("");
  const [singkatanLembaga, setSingkatanLembaga] = useState("");
  const [deskripsiLembaga, setDeskripsiLembaga] = useState("");
  const [fotoLembaga, setFotoLembaga] = useState<File | null>(null);
  const [daftarLembaga, setDaftarLembaga] = useState<any[]>([]);
  const [statusLembaga, setStatusLembaga] = useState("");
  const [isLoadingLembaga, setIsLoadingLembaga] = useState(false);
  const [editLembagaId, setEditLembagaId] = useState<string | null>(null);
  const [fotoLamaLembaga, setFotoLamaLembaga] = useState("");

  // --- STATE TRANSPARANSI ---
  const [danaDesa, setDanaDesa] = useState<number | string>(0);
  const [alokasiDanaDesa, setAlokasiDanaDesa] = useState<number | string>(0);
  const [pad, setPad] = useState<number | string>(0);
  const [banprov, setBanprov] = useState<number | string>(0);
  const [statusApbdes, setStatusApbdes] = useState("");
  const [isLoadingApbdes, setIsLoadingApbdes] = useState(false);

  const [daftarRegulasi, setDaftarRegulasi] = useState<any[]>([]);
  const [tahunRegulasi, setTahunRegulasi] = useState("");
  const [jenisRegulasi, setJenisRegulasi] = useState("Perdes");
  const [judulRegulasi, setJudulRegulasi] = useState("");
  const [linkRegulasi, setLinkRegulasi] = useState("");
  const [statusRegulasi, setStatusRegulasi] = useState("");
  const [isLoadingRegulasi, setIsLoadingRegulasi] = useState(false);
  const [editRegulasiId, setEditRegulasiId] = useState<string | null>(null);

  const [namaProyek, setNamaProyek] = useState("");
  const [paguAnggaran, setPaguAnggaran] = useState<number | string>("");
  const [danaTerealisasi, setDanaTerealisasi] = useState<number | string>("");
  const [daftarRealisasi, setDaftarRealisasi] = useState<any[]>([]);
  const [statusRealisasi, setStatusRealisasi] = useState("");
  const [isLoadingRealisasi, setIsLoadingRealisasi] = useState(false);

  // --- STATE MANAJEMEN AKUN ---
  const [namaAkun, setNamaAkun] = useState("");
  const [emailAkun, setEmailAkun] = useState("");
  const [roleAkun, setRoleAkun] = useState("Kontributor");
  const [statusAkun, setStatusAkun] = useState("");
  const [isLoadingAkun, setIsLoadingAkun] = useState(false);

  // --- STATE DATA DESA / KEPENDUDUKAN (BARU) ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [daftarPenduduk, setDaftarPenduduk] = useState<any[]>([]);

  // ==========================================
  // FUNGSI PENARIK SEMUA DATA DARI FIREBASE
  // ==========================================
  const ambilDataAwal = async () => {
    try {
      const qSurat = query(collection(db, "layanan_surat"), orderBy("tanggal_pengajuan", "desc"));
      setDaftarSurat((await getDocs(qSurat)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qPengaduan = query(collection(db, "pengaduan_warga"), orderBy("tanggal_laporan", "desc"));
      setDaftarPengaduan((await getDocs(qPengaduan)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qKabar = query(collection(db, "kabar_desa"), orderBy("tanggal_posting", "desc"));
      setRiwayatKabar((await getDocs(qKabar)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qAgenda = query(collection(db, "agenda_desa"), orderBy("tanggal", "asc"));
      setDaftarAgenda((await getDocs(qAgenda)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const snapProfil = await getDoc(doc(db, "profil_desa", "utama"));
      if (snapProfil.exists()) {
        setSejarahDesa(snapProfil.data().sejarah || "");
        setVisiMisiDesa(snapProfil.data().visi_misi || "");
      }

      const qAparatur = query(collection(db, "aparatur_desa"), orderBy("urutan", "asc"));
      setDaftarAparatur((await getDocs(qAparatur)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qUmkm = query(collection(db, "potensi_desa"), orderBy("tanggal_input", "desc"));
      setDaftarUmkm((await getDocs(qUmkm)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      setDaftarLembaga((await getDocs(collection(db, "lembaga_desa"))).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const snapApbdes = await getDoc(doc(db, "transparansi", "apbdes"));
      if (snapApbdes.exists()) {
        setDanaDesa(snapApbdes.data().dana_desa || 0);
        setAlokasiDanaDesa(snapApbdes.data().alokasi_dana_desa || 0);
        setPad(snapApbdes.data().pad || 0);
        setBanprov(snapApbdes.data().banprov || 0);
      }

      const qRegulasi = query(collection(db, "regulasi_desa"), orderBy("tahun", "desc"));
      setDaftarRegulasi((await getDocs(qRegulasi)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const qRealisasi = query(collection(db, "realisasi_desa"), orderBy("tanggal_input", "desc"));
      setDaftarRealisasi((await getDocs(qRealisasi)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // TARIK DATA PENDUDUK BARU
      const qPenduduk = query(collection(db, "kependudukan"));
      setDaftarPenduduk((await getDocs(qPenduduk)).docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Gagal menarik data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email);
        setIsCheckingAuth(false);
        ambilDataAwal();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // ==========================================
  // FUNGSI UPLOAD FOTO DGN JALUR CDN
  // ==========================================
  const uploadFotoKeImgBB = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    // API KEY ANDA
    const apiKeyImgBB = "6755e61bb042b746d83c71595313674e";
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error("Jalur utama gagal");
    } catch (error) {
      try {
        const cdnUrl = `https://corsproxy.io/?https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`;
        const resCdn = await fetch(cdnUrl, { method: "POST", body: formData });
        const dataCdn = await resCdn.json();
        if (dataCdn.success) return dataCdn.data.url;
        return null;
      } catch (errCdn) {
        return null;
      }
    }
  };

  // ==========================================
  // SEMUA FUNGSI SIMPAN & EDIT
  // ==========================================

  // --- FUNGSI EDIT SURAT ADMIN ---
  const ubahStatusSurat = async (id: string, statusBaru: string) => {
    try {
      await updateDoc(doc(db, "layanan_surat", id), { status_berkas: statusBaru });
      ambilDataAwal();
    } catch (error) {
      alert("Gagal merubah status surat.");
    }
  };

  const mulaiEditSurat = (item: any) => {
    setEditSuratId(item.id);
    setEditSuratNama(item.nama);
    setEditSuratNik(item.nik);
    setEditSuratJenis(item.jenis_surat);
    setEditSuratKeperluan(item.keperluan);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditSurat = () => {
    setEditSuratId(null);
    setEditSuratNama("");
    setEditSuratNik("");
    setEditSuratJenis("");
    setEditSuratKeperluan("");
  };

  const simpanEditSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSuratAdmin(true);
    try {
      if (editSuratId) {
        await updateDoc(doc(db, "layanan_surat", editSuratId), {
          nama: editSuratNama,
          nik: editSuratNik,
          jenis_surat: editSuratJenis,
          keperluan: editSuratKeperluan,
        });
        alert("✅ Data permohonan surat berhasil diperbaiki.");
        batalEditSurat();
        ambilDataAwal();
      }
    } catch (error) {
      alert("❌ Gagal memperbaiki data surat.");
    } finally {
      setIsLoadingSuratAdmin(false);
    }
  };

  const hapusSurat = async (id: string) => {
    if (confirm("Yakin ingin menghapus berkas pengajuan ini secara permanen?")) {
      await deleteDoc(doc(db, "layanan_surat", id));
      ambilDataAwal();
    }
  };

  const hapusPengaduan = async (id: string) => {
    if (confirm("Yakin hapus pengaduan ini?")) {
      await deleteDoc(doc(db, "pengaduan_warga", id));
      ambilDataAwal();
    }
  };

  const hapusKabar = async (id: string) => {
    if (confirm("Yakin hapus berita permanen?")) {
      await deleteDoc(doc(db, "kabar_desa", id));
      ambilDataAwal();
    }
  };

  const hapusAgenda = async (id: string) => {
    if (confirm("Hapus agenda ini?")) {
      await deleteDoc(doc(db, "agenda_desa", id));
      ambilDataAwal();
    }
  };

  const hapusAparatur = async (id: string) => {
    if (confirm("Yakin hapus anggota aparatur ini?")) {
      await deleteDoc(doc(db, "aparatur_desa", id));
      ambilDataAwal();
    }
  };

  const hapusUmkm = async (id: string) => {
    if (confirm("Yakin hapus produk UMKM ini?")) {
      await deleteDoc(doc(db, "potensi_desa", id));
      ambilDataAwal();
    }
  };

  const hapusRegulasi = async (id: string) => {
    if (confirm("Yakin hapus dokumen regulasi ini?")) {
      await deleteDoc(doc(db, "regulasi_desa", id));
      ambilDataAwal();
    }
  };

  const hapusRealisasi = async (id: string) => {
    if (confirm("Yakin menghapus data realisasi proyek ini?")) {
      await deleteDoc(doc(db, "realisasi_desa", id));
      ambilDataAwal();
    }
  };

  const hapusLembaga = async (id: string) => {
    if (confirm("Yakin menghapus lembaga ini?")) {
      await deleteDoc(doc(db, "lembaga_desa", id));
      ambilDataAwal();
    }
  };

  // --- KABAR ---
  const handleSimpanKabar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingKabar(true);
    setStatusKabar("Memproses...");
    try {
      let tautanGambarBaru: string[] = [];
      if (fotoKabarList && fotoKabarList.length > 0) {
        setStatusKabar(`Mengunggah foto...`);
        const uploadPromises = Array.from(fotoKabarList).map((file) => uploadFotoKeImgBB(file));
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter((url) => url !== null) as string[];
      }
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];
      if (editKabarId) {
        await updateDoc(doc(db, "kabar_desa", editKabarId), {
          judul: judulKabar,
          isi: isiKabar,
          gambar: gambarFinal,
        });
        setStatusKabar("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "kabar_desa"), {
          judul: judulKabar,
          isi: isiKabar,
          gambar: gambarFinal,
          tanggal_posting: new Date().toISOString(),
          penulis: userEmail,
        });
        setStatusKabar("✅ Dipublikasikan!");
      }
      batalEditKabar();
      ambilDataAwal();
      setTimeout(() => setStatusKabar(""), 4000);
    } catch (error) {
      setStatusKabar("❌ Gagal menyimpan.");
    } finally {
      setIsLoadingKabar(false);
    }
  };

  const mulaiEditKabar = (item: any) => {
    setEditKabarId(item.id);
    setJudulKabar(item.judul);
    setIsiKabar(item.isi);
    setGambarLama(Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusGambarDariDaftarLama = (indexGambar: number) => {
    setGambarLama((prev) => prev.filter((_, i) => i !== indexGambar));
  };

  const batalEditKabar = () => {
    setEditKabarId(null);
    setJudulKabar("");
    setIsiKabar("");
    setGambarLama([]);
    setFotoKabarList(null);
    const input = document.getElementById("inputFotoKabar") as HTMLInputElement;
    if (input) input.value = "";
  };

  // --- AGENDA ---
  const handleSimpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAgenda(true);
    setStatusAgenda("Menyimpan...");
    try {
      await addDoc(collection(db, "agenda_desa"), {
        nama: namaAgenda,
        tanggal: tanggalAgenda,
        lokasi: lokasiAgenda,
      });
      setStatusAgenda("✅ Ditambahkan!");
      setNamaAgenda("");
      setTanggalAgenda("");
      setLokasiAgenda("");
      ambilDataAwal();
      setTimeout(() => setStatusAgenda(""), 4000);
    } catch (error) {
      setStatusAgenda("❌ Gagal menyimpan agenda.");
    } finally {
      setIsLoadingAgenda(false);
    }
  };

  // --- PROFIL ---
  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfil(true);
    setStatusProfil("Menyimpan...");
    try {
      await setDoc(doc(db, "profil_desa", "utama"), {
        sejarah: sejarahDesa,
        visi_misi: visiMisiDesa,
        terakhir_diperbarui: new Date().toISOString(),
      });
      setStatusProfil("✅ Diperbarui!");
      setTimeout(() => setStatusProfil(""), 4000);
    } catch (error) {
      setStatusProfil("❌ Gagal.");
    } finally {
      setIsLoadingProfil(false);
    }
  };

  // --- APARATUR ---
  const handleSimpanAparatur = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAparatur(true);
    setStatusAparatur("Memproses...");
    try {
      let imageUrl = fotoLamaAparatur;
      if (fotoAparatur) {
        setStatusAparatur("Upload foto...");
        imageUrl = (await uploadFotoKeImgBB(fotoAparatur)) || "";
      }
      if (editAparaturId) {
        await updateDoc(doc(db, "aparatur_desa", editAparaturId), {
          nama: namaAparatur,
          jabatan: jabatanAparatur,
          urutan: Number(urutanAparatur),
          foto: imageUrl,
        });
        setStatusAparatur("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "aparatur_desa"), {
          nama: namaAparatur,
          jabatan: jabatanAparatur,
          urutan: Number(urutanAparatur),
          foto: imageUrl,
        });
        setStatusAparatur("✅ Ditambahkan!");
      }
      batalEditAparatur();
      ambilDataAwal();
      setTimeout(() => setStatusAparatur(""), 4000);
    } catch (error) {
      setStatusAparatur("❌ Gagal.");
    } finally {
      setIsLoadingAparatur(false);
    }
  };

  const mulaiEditAparatur = (item: any) => {
    setEditAparaturId(item.id);
    setNamaAparatur(item.nama);
    setJabatanAparatur(item.jabatan);
    setUrutanAparatur(item.urutan);
    setFotoLamaAparatur(item.foto || "");
    setFotoAparatur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditAparatur = () => {
    setEditAparaturId(null);
    setNamaAparatur("");
    setJabatanAparatur("");
    setUrutanAparatur(daftarAparatur.length + 2);
    setFotoLamaAparatur("");
    setFotoAparatur(null);
  };

  // --- UMKM ---
  const handleSimpanUmkm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingUmkm(true);
    setStatusUmkm("Memproses...");
    try {
      let imageUrl = fotoLamaUmkm;
      if (fotoProduk) {
        setStatusUmkm("Upload...");
        imageUrl = (await uploadFotoKeImgBB(fotoProduk)) || "";
      }
      if (editUmkmId) {
        await updateDoc(doc(db, "potensi_desa", editUmkmId), {
          nama_produk: namaProduk,
          pemilik: pemilikUmkm,
          harga: Number(hargaProduk),
          wa: waUmkm,
          deskripsi: deskripsiProduk,
          foto: imageUrl,
        });
        setStatusUmkm("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "potensi_desa"), {
          nama_produk: namaProduk,
          pemilik: pemilikUmkm,
          harga: Number(hargaProduk),
          wa: waUmkm,
          deskripsi: deskripsiProduk,
          foto: imageUrl,
          tanggal_input: new Date().toISOString(),
        });
        setStatusUmkm("✅ Ditambahkan!");
      }
      batalEditUmkm();
      ambilDataAwal();
      setTimeout(() => setStatusUmkm(""), 4000);
    } catch (error) {
      setStatusUmkm("❌ Gagal.");
    } finally {
      setIsLoadingUmkm(false);
    }
  };

  const mulaiEditUmkm = (item: any) => {
    setEditUmkmId(item.id);
    setNamaProduk(item.nama_produk);
    setPemilikUmkm(item.pemilik);
    setHargaProduk(item.harga.toString());
    setWaUmkm(item.wa);
    setDeskripsiProduk(item.deskripsi);
    setFotoLamaUmkm(item.foto || "");
    setFotoProduk(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditUmkm = () => {
    setEditUmkmId(null);
    setNamaProduk("");
    setPemilikUmkm("");
    setHargaProduk("");
    setWaUmkm("");
    setDeskripsiProduk("");
    setFotoLamaUmkm("");
    setFotoProduk(null);
  };

  // --- LEMBAGA ---
  const handleSimpanLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLembaga(true);
    setStatusLembaga("Memproses...");
    try {
      let imageUrl = fotoLamaLembaga;
      if (fotoLembaga) {
        setStatusLembaga("Upload foto...");
        imageUrl = (await uploadFotoKeImgBB(fotoLembaga)) || "";
      }
      if (editLembagaId) {
        await updateDoc(doc(db, "lembaga_desa", editLembagaId), {
          nama: namaLembaga,
          singkatan: singkatanLembaga,
          deskripsi: deskripsiLembaga,
          foto: imageUrl,
        });
        setStatusLembaga("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "lembaga_desa"), {
          nama: namaLembaga,
          singkatan: singkatanLembaga,
          deskripsi: deskripsiLembaga,
          foto: imageUrl,
        });
        setStatusLembaga("✅ Ditambahkan!");
      }
      batalEditLembaga();
      ambilDataAwal();
      setTimeout(() => setStatusLembaga(""), 4000);
    } catch (error) {
      setStatusLembaga("❌ Gagal.");
    } finally {
      setIsLoadingLembaga(false);
    }
  };

  const mulaiEditLembaga = (item: any) => {
    setEditLembagaId(item.id);
    setNamaLembaga(item.nama);
    setSingkatanLembaga(item.singkatan);
    setDeskripsiLembaga(item.deskripsi);
    setFotoLamaLembaga(item.foto || "");
    setFotoLembaga(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditLembaga = () => {
    setEditLembagaId(null);
    setNamaLembaga("");
    setSingkatanLembaga("");
    setDeskripsiLembaga("");
    setFotoLamaLembaga("");
    setFotoLembaga(null);
  };

  // --- APBDES ---
  const handleSimpanApbdes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingApbdes(true);
    setStatusApbdes("Menyimpan...");
    try {
      await setDoc(doc(db, "transparansi", "apbdes"), {
        dana_desa: Number(danaDesa),
        alokasi_dana_desa: Number(alokasiDanaDesa),
        pad: Number(pad),
        banprov: Number(banprov),
        terakhir_diperbarui: new Date().toISOString(),
      });
      setStatusApbdes("✅ Diperbarui!");
      setTimeout(() => setStatusApbdes(""), 4000);
    } catch (error) {
      setStatusApbdes("❌ Gagal.");
    } finally {
      setIsLoadingApbdes(false);
    }
  };

  // --- REGULASI ---
  const handleSimpanRegulasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRegulasi(true);
    setStatusRegulasi("Menyimpan...");
    try {
      if (editRegulasiId) {
        await updateDoc(doc(db, "regulasi_desa", editRegulasiId), {
          tahun: tahunRegulasi,
          jenis: jenisRegulasi,
          judul: judulRegulasi,
          link: linkRegulasi,
        });
        setStatusRegulasi("✅ Diperbarui!");
      } else {
        await addDoc(collection(db, "regulasi_desa"), {
          tahun: tahunRegulasi,
          jenis: jenisRegulasi,
          judul: judulRegulasi,
          link: linkRegulasi,
          tanggal_upload: new Date().toISOString(),
        });
        setStatusRegulasi("✅ Ditambahkan!");
      }
      batalEditRegulasi();
      ambilDataAwal();
      setTimeout(() => setStatusRegulasi(""), 4000);
    } catch (error) {
      setStatusRegulasi("❌ Gagal.");
    } finally {
      setIsLoadingRegulasi(false);
    }
  };

  const mulaiEditRegulasi = (item: any) => {
    setEditRegulasiId(item.id);
    setTahunRegulasi(item.tahun);
    setJenisRegulasi(item.jenis);
    setJudulRegulasi(item.judul);
    setLinkRegulasi(item.link);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const batalEditRegulasi = () => {
    setEditRegulasiId(null);
    setTahunRegulasi("");
    setJenisRegulasi("Perdes");
    setJudulRegulasi("");
    setLinkRegulasi("");
  };

  // --- REALISASI ---
  const handleSimpanRealisasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRealisasi(true);
    setStatusRealisasi("Memproses...");
    try {
      await addDoc(collection(db, "realisasi_desa"), {
        nama_proyek: namaProyek,
        pagu: Number(paguAnggaran),
        terealisasi: Number(danaTerealisasi),
        tanggal_input: new Date().toISOString(),
      });
      setStatusRealisasi("✅ Ditambahkan!");
      setNamaProyek("");
      setPaguAnggaran("");
      setDanaTerealisasi("");
      ambilDataAwal();
      setTimeout(() => setStatusRealisasi(""), 4000);
    } catch (error) {
      setStatusRealisasi("❌ Gagal.");
    } finally {
      setIsLoadingRealisasi(false);
    }
  };

  // --- AKUN ---
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
      setStatusAkun("✅ Data Tersimpan!");
      setNamaAkun("");
      setEmailAkun("");
      setRoleAkun("Kontributor");
    } catch (error) {
      setStatusAkun("❌ Gagal.");
    } finally {
      setIsLoadingAkun(false);
    }
  };

  // ==========================================
  // FUNGSI IMPORT EXCEL DATA DESA (BARU TAHAP 27)
  // ==========================================
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      let successCount = 0;

      // Melewati baris pertama (header)
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        
        // Memastikan baris tersebut memiliki data yang cukup (berdasarkan format CSV Anda)
        if (row.length >= 6 && row[3] && row[5]) { 
          try {
            await addDoc(collection(db, "kependudukan"), {
              dusun: row[0]?.trim() || "",
              rw: row[1]?.trim() || "",
              rt: row[2]?.trim() || "",
              nama: row[3]?.trim() || "",
              no_kk: row[4]?.trim() || "",
              nik: row[5]?.trim() || "",
              jk: row[6]?.trim() || "",
              tempat_lahir: row[7]?.trim() || "",
              tanggal_lahir: row[8]?.trim() || "",
              agama: row[9]?.trim() || "",
              pendidikan: row[10]?.trim() || "",
              pekerjaan: row[11]?.trim() || "",
              status_kawin: row[12]?.trim() || "",
              hub_keluarga: row[13]?.trim() || "",
              tanggal_input: new Date().toISOString()
            });
            successCount++;
          } catch (err) {
            console.error("Gagal import baris ke", i);
          }
        }
      }
      
      alert(`✅ Import Selesai! Berhasil memasukkan ${successCount} data penduduk.`);
      ambilDataAwal();
      setIsImporting(false);
      setCsvFile(null);
    };
    reader.readAsText(csvFile);
  };

  // Fungsi Hapus Manual Penduduk
  const hapusPenduduk = async (id: string) => {
    if (confirm("Yakin ingin menghapus data penduduk ini?")) {
      await deleteDoc(doc(db, "kependudukan", id));
      ambilDataAwal();
    }
  };


  if (isCheckingAuth)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-green-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-green-800">
          <h2 className="text-2xl font-black mb-1">Ruang Kendali</h2>
          <p className="text-green-400 text-xs truncate">{userEmail}</p>
        </div>
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          <button
            onClick={() => setActiveMenu("welcome")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "welcome"
                ? "bg-green-700 text-white translate-x-2"
                : "hover:bg-green-800"
            }`}
          >
            🏠 Ringkasan Sistem
          </button>
          
          {/* MENU BARU: DATA DESA EXCEL */}
          <button
            onClick={() => setActiveMenu("datadesa")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "datadesa"
                ? "bg-purple-600 text-white translate-x-2 shadow-md"
                : "hover:bg-green-800"
            }`}
          >
            👥 Data Penduduk (Excel)
          </button>

          <button
            onClick={() => setActiveMenu("layanan")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "layanan"
                ? "bg-yellow-500 text-gray-900 translate-x-2 shadow-md"
                : "hover:bg-green-800"
            }`}
          >
            ✉️ Layanan Warga
            {daftarSurat.filter((s) => s.status_berkas === "Diajukan").length >
              0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                Baru
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveMenu("kabar")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "kabar"
                ? "bg-green-700 text-white translate-x-2"
                : "hover:bg-green-800"
            }`}
          >
            📰 Kabar & Agenda
          </button>
          <button
            onClick={() => setActiveMenu("profil")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "profil"
                ? "bg-green-700 text-white translate-x-2"
                : "hover:bg-green-800"
            }`}
          >
            🏛️ Profil & UMKM
          </button>
          <button
            onClick={() => setActiveMenu("transparansi")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "transparansi"
                ? "bg-green-700 text-white translate-x-2"
                : "hover:bg-green-800"
            }`}
          >
            📊 Transparansi
          </button>
          <button
            onClick={() => setActiveMenu("akun")}
            className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all ${
              activeMenu === "akun"
                ? "bg-green-700 text-white translate-x-2"
                : "hover:bg-green-800"
            }`}
          >
            👥 Manajemen Akun
          </button>
        </nav>
        <div className="p-4 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* ==========================================
            MODUL BERANDA
        ========================================== */}
        {activeMenu === "welcome" && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 bg-gradient-to-r from-white to-green-50">
              <h3 className="text-3xl font-extrabold text-green-900 mb-2">
                Selamat Datang, Admin!
              </h3>
              <p className="text-gray-600 font-medium">
                Sistem Informasi Desa Kerjo berjalan normal. Berikut adalah
                ringkasan data saat ini:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Tambahan Info Data Penduduk */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-purple-500 flex flex-col justify-center items-center">
                <span className="text-4xl mb-3">👥</span>
                <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Total Data Penduduk</h4>
                <p className="text-4xl font-black text-gray-900 mt-2">
                  {daftarPenduduk.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-yellow-500 flex flex-col justify-center items-center">
                <span className="text-4xl mb-3">✉️</span>
                <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Permohonan Surat</h4>
                <p className="text-4xl font-black text-gray-900 mt-2">
                  {daftarSurat.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-green-500 flex flex-col justify-center items-center">
                <span className="text-4xl mb-3">📰</span>
                <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Berita Dipublikasi</h4>
                <p className="text-4xl font-black text-gray-900 mt-2">
                  {riwayatKabar.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-blue-500 flex flex-col justify-center items-center">
                <span className="text-4xl mb-3">📢</span>
                <h4 className="text-gray-500 font-bold uppercase tracking-wider text-xs text-center">Pengaduan Masuk</h4>
                <p className="text-4xl font-black text-gray-900 mt-2">
                  {daftarPengaduan.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL BARU: DATA DESA / KEPENDUDUKAN EXCEL
        ========================================== */}
        {activeMenu === "datadesa" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-purple-500">
              <h3 className="text-2xl font-bold mb-2">📥 Impor Data Kependudukan (CSV)</h3>
              <p className="text-gray-500 text-sm mb-6">
                Unggah file Excel (yang telah di-Save As menjadi format .csv) untuk memperbarui data penduduk desa secara otomatis ke dalam sistem.
              </p>
              
              <form onSubmit={handleImportCSV} className="flex flex-col md:flex-row gap-4 items-end bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-purple-900 mb-2">Pilih File CSV (.csv)</label>
                  <input 
                    type="file" 
                    accept=".csv" 
                    required
                    onChange={(e) => {if(e.target.files) setCsvFile(e.target.files[0])}} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-purple-700 hover:file:bg-gray-100 cursor-pointer border border-purple-200 rounded-xl bg-white" 
                  />
                </div>
                <button type="submit" disabled={isImporting} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md">
                  {isImporting ? "Mengekstrak Data..." : "Mulai Import Data"}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold text-gray-800">Database Penduduk Aktif</h4>
                <span className="bg-purple-100 text-purple-800 font-bold px-4 py-1 rounded-full text-sm">{daftarPenduduk.length} Jiwa Terdata</span>
              </div>
              
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-4">Nama Lengkap & NIK</th>
                    <th className="py-4 px-4">Alamat (Dusun/RW/RT)</th>
                    <th className="py-4 px-4">Lahir & Pendidikan</th>
                    <th className="py-4 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarPenduduk.slice(0, 50).map((penduduk) => ( // Tampilkan 50 data teratas agar browser tidak berat
                    <tr key={penduduk.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-base">{penduduk.nama}</div>
                        <div className="text-xs font-mono text-purple-600 font-bold tracking-wider mt-1">{penduduk.nik}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-700">{penduduk.dusun}</div>
                        <div className="text-xs text-gray-500">RW: {penduduk.rw} / RT: {penduduk.rt}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800 font-medium">{penduduk.tempat_lahir}, {penduduk.tanggal_lahir}</div>
                        <div className="text-xs text-gray-500">{penduduk.pendidikan}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => hapusPenduduk(penduduk.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-md transition-colors">
                          Hapus Data
                        </button>
                      </td>
                    </tr>
                  ))}
                  {daftarPenduduk.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-500 font-medium border-2 border-dashed rounded-xl">Belum ada data penduduk yang diimpor ke sistem.</td></tr>
                  )}
                  {daftarPenduduk.length > 50 && (
                    <tr><td colSpan={4} className="text-center py-4 text-purple-600 font-bold bg-purple-50">+ {daftarPenduduk.length - 50} data lainnya disembunyikan untuk menjaga performa tabel.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL LAYANAN WARGA
        ========================================== */}
        {activeMenu === "layanan" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-500">
              <h3 className="text-2xl font-bold mb-2">📄 Antrean Surat Masuk</h3>
              <p className="text-gray-500 text-sm mb-6">
                Pantau dan proses permohonan surat warga yang masuk melalui sistem Layanan Mandiri.
              </p>

              {/* FORM EDIT SURAT ADMIN */}
              {editSuratId && (
                <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-yellow-900 text-lg">
                      ✏️ Koreksi Data Pengajuan (Resi: {editSuratNik})
                    </h4>
                    <button
                      onClick={batalEditSurat}
                      className="bg-gray-300 hover:bg-gray-400 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      Batal Koreksi
                    </button>
                  </div>
                  <form
                    onSubmit={simpanEditSurat}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    <div>
                      <label className="text-xs font-bold text-gray-700">Nama Pemohon</label>
                      <input
                        type="text"
                        value={editSuratNama}
                        onChange={(e) => setEditSuratNama(e.target.value)}
                        className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Nomor NIK</label>
                      <input
                        type="text"
                        value={editSuratNik}
                        onChange={(e) => setEditSuratNik(e.target.value)}
                        className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Jenis Surat</label>
                      <input
                        type="text"
                        value={editSuratJenis}
                        onChange={(e) => setEditSuratJenis(e.target.value)}
                        className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Keperluan</label>
                      <input
                        type="text"
                        value={editSuratKeperluan}
                        onChange={(e) => setEditSuratKeperluan(e.target.value)}
                        className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:ring-2 bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingSuratAdmin}
                      className="md:col-span-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
                    >
                      {isLoadingSuratAdmin ? "Menyimpan Perubahan..." : "Simpan Data Koreksi"}
                    </button>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-4 px-4 font-bold text-gray-600">Resi & Tanggal</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Identitas Pemohon</th>
                      <th className="py-4 px-4 font-bold text-gray-600">Jenis Surat & Lampiran Berkas</th>
                      <th className="py-4 px-4 font-bold text-gray-600 text-center">Status</th>
                      <th className="py-4 px-4 font-bold text-gray-600 text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarSurat.map((surat) => (
                      <tr key={surat.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="block font-mono font-bold text-blue-700 text-base">
                            {surat.resi}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {new Date(surat.tanggal_pengajuan).toLocaleDateString("id-ID")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="block font-bold text-gray-900 text-base">
                            {surat.nama}
                          </span>
                          <span className="text-xs text-gray-500 font-mono tracking-wide">
                            NIK: {surat.nik}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="block font-bold text-green-700 mb-1">
                            {surat.jenis_surat}
                          </span>
                          <span className="text-xs text-gray-600 max-w-xs block mb-3 italic">
                            "{surat.keperluan}"
                          </span>
                          
                          {/* FITUR MELIHAT BERKAS KTP/KK (JIKA ADA) */}
                          {surat.berkas_syarat && surat.berkas_syarat.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {surat.berkas_syarat.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={`https://wsrv.nl/?url=${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <span>🖼️</span> Buka Berkas {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              surat.status_berkas === "Diajukan"
                                ? "bg-red-100 text-red-700"
                                : surat.status_berkas === "Verifikasi"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {surat.status_berkas}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex flex-col gap-2 justify-center">
                          {surat.status_berkas === "Diajukan" && (
                            <button
                              onClick={() => ubahStatusSurat(surat.id, "Verifikasi")}
                              className="bg-yellow-400 font-bold px-3 py-2 rounded-lg text-xs hover:bg-yellow-500 shadow-sm"
                            >
                              Verifikasi Berkas
                            </button>
                          )}
                          {surat.status_berkas === "Verifikasi" && (
                            <button
                              onClick={() => ubahStatusSurat(surat.id, "Selesai")}
                              className="bg-green-500 text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-green-600 shadow-sm"
                            >
                              Tandai Selesai
                            </button>
                          )}
                          <button
                            onClick={() => mulaiEditSurat(surat)}
                            className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-lg text-xs shadow-sm"
                          >
                            Koreksi Teks
                          </button>
                          <button
                            onClick={() => hapusSurat(surat.id)}
                            className="text-red-500 font-bold text-xs mt-1 hover:underline"
                          >
                            Hapus Permanen
                          </button>
                        </td>
                      </tr>
                    ))}
                    {daftarSurat.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500 font-medium">
                          Belum ada permohonan surat masuk.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mt-4 mb-2">
                📢 Kotak Pengaduan Warga
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Daftar laporan dan aspirasi dari warga. Tanggapi dengan cepat
                untuk pelayanan prima.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {daftarPengaduan.map((lap) => (
                  <div
                    key={lap.id}
                    className="border border-gray-200 p-6 rounded-2xl flex justify-between bg-gray-50 relative hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => hapusPengaduan(lap.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-lg bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                      title="Hapus Pengaduan"
                    >
                      ✖
                    </button>
                    <div className="flex gap-5">
                      {lap.foto_bukti && (
                        <a
                          href={`https://wsrv.nl/?url=${lap.foto_bukti}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm block hover:opacity-80 flex-shrink-0"
                        >
                          <img
                            src={`https://wsrv.nl/?url=${lap.foto_bukti}`}
                            alt="Bukti Laporan"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 pr-8">
                          {lap.judul}
                        </h4>
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <span>📅</span> {new Date(lap.tanggal_laporan).toLocaleDateString("id-ID")} • 
                          <span className="text-blue-600">{lap.anonim ? "👤 Pelapor Anonim" : "Terverifikasi"}</span>
                        </span>
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed border-t border-gray-200 pt-2">
                          {lap.isi}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {daftarPengaduan.length === 0 && (
                   <div className="col-span-1 md:col-span-2 text-center py-10 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium">Kotak pengaduan masih kosong.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL KABAR & AGENDA DESA
        ========================================== */}
        {activeMenu === "kabar" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-500">
              <div className="flex justify-between mb-2 border-b pb-4">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    {editKabarId ? "✏️ Edit Berita" : "📰 Publikasi Berita Baru"}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Tambahkan berita terbaru, kegiatan, atau pengumuman desa
                    untuk diinformasikan kepada warga.
                  </p>
                </div>
                {editKabarId && (
                  <button
                    onClick={batalEditKabar}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSimpanKabar} className="space-y-5 mt-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Judul Berita Utama
                  </label>
                  <input
                    type="text"
                    required
                    value={judulKabar}
                    onChange={(e) => setJudulKabar(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all text-lg font-bold"
                  />
                </div>
                
                {editKabarId && gambarLama.length > 0 && (
                  <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                    <p className="text-sm font-bold text-orange-900 mb-4">
                      Foto Tersimpan (Klik ikon 'X' merah untuk menghapus foto):
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {gambarLama.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-32 h-32 border-2 border-white rounded-xl overflow-hidden group shadow-md"
                        >
                          <img
                            src={`https://wsrv.nl/?url=${url}`}
                            alt="Foto Berita Lama"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => hapusGambarDariDaftarLama(idx)}
                            className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full text-sm font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                            title="Hapus Foto Ini"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Tambahkan Foto Dokumentasi Baru
                  </label>
                  <label className="cursor-pointer flex flex-col items-center justify-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all group">
                    <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">📸</span>
                    <span className="font-bold text-gray-700">
                      Klik di sini untuk memilih foto dari perangkat Anda
                    </span>
                    <span className="text-xs text-gray-400 mt-1">(Bisa memilih lebih dari satu foto sekaligus)</span>
                    <input
                      id="inputFotoKabar"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFotoKabarList(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  {fotoKabarList && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3 inline-block">
                      <p className="text-sm font-bold text-green-800">
                        ✅ {fotoKabarList.length} foto baru siap diunggah.
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Isi Lengkap Berita
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={isiKabar}
                    onChange={(e) => setIsiKabar(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all leading-relaxed"
                  ></textarea>
                </div>
                
                {statusKabar && (
                  <div
                    className={`p-4 rounded-xl text-sm font-bold text-center border ${
                      statusKabar.includes("❌")
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {statusKabar}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoadingKabar}
                  className={`w-full text-white font-bold px-6 py-4 rounded-xl shadow-md transition-all text-lg ${
                    isLoadingKabar
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 hover:-translate-y-1"
                  }`}
                >
                  {isLoadingKabar
                    ? "Mengunggah Foto & Memproses Berita..."
                    : editKabarId
                    ? "Simpan Perubahan Berita"
                    : "Publikasikan Berita Sekarang"}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm overflow-x-auto border border-gray-100">
              <h4 className="text-xl font-bold mb-6 text-gray-800">Riwayat Publikasi Berita</h4>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-4 font-bold text-gray-600">Tanggal</th>
                    <th className="py-4 px-4 font-bold text-gray-600">Judul Berita & Penulis</th>
                    <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatKabar.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-500">
                        {new Date(item.tanggal_posting).toLocaleDateString("id-ID", {day: 'numeric', month: 'long', year: 'numeric'})}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 text-base mb-1">{item.judul}</div>
                        <div className="text-xs text-gray-400">Oleh: {item.penulis}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => mulaiEditKabar(item)}
                          className="bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mr-2 font-bold transition-colors"
                        >
                          Edit Berita
                        </button>
                        <button
                          onClick={() => hapusKabar(item.id)}
                          className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {riwayatKabar.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada berita yang dipublikasikan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mt-8 border-t-4 border-yellow-500">
              <h3 className="text-2xl font-bold mb-2">📅 Agenda & Kalender Kegiatan Desa</h3>
              <p className="text-gray-500 text-sm mb-6">
                Atur jadwal kegiatan desa yang akan datang agar warga dapat
                berpartisipasi.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner">
                  <h4 className="font-bold text-yellow-900 mb-4 text-lg">
                    Tambah Jadwal Agenda Baru
                  </h4>
                  <form onSubmit={handleSimpanAgenda} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Nama Kegiatan / Acara</label>
                      <input
                        type="text"
                        required
                        value={namaAgenda}
                        onChange={(e) => setNamaAgenda(e.target.value)}
                        placeholder="Misal: Posyandu Balita"
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Tanggal & Waktu Pelaksanaan</label>
                      <input
                        type="datetime-local"
                        required
                        value={tanggalAgenda}
                        onChange={(e) => setTanggalAgenda(e.target.value)}
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">Lokasi / Tempat</label>
                      <input
                        type="text"
                        required
                        value={lokasiAgenda}
                        onChange={(e) => setLokasiAgenda(e.target.value)}
                        placeholder="Misal: Balai Desa Kerjo"
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    {statusAgenda && (
                      <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">
                        {statusAgenda}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingAgenda}
                      className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 shadow-md transition-colors"
                    >
                      {isLoadingAgenda ? "Menyimpan..." : "Tambahkan ke Kalender"}
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-4 font-bold text-gray-600">Jadwal Waktu</th>
                        <th className="py-3 px-4 font-bold text-gray-600">Nama Kegiatan & Lokasi</th>
                        <th className="py-3 px-4 text-center font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarAgenda.map((agenda) => (
                        <tr key={agenda.id} className="border-b hover:bg-yellow-50 transition-colors">
                          <td className="py-4 px-4 font-bold text-gray-700">
                            {new Date(agenda.tanggal).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })} WIB
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900 text-base">
                              {agenda.nama}
                            </div>
                            <div className="text-xs font-bold text-yellow-600 mt-1 flex items-center gap-1">
                              <span>📍</span> {agenda.lokasi}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => hapusAgenda(agenda.id)}
                              className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                              Hapus Agenda
                            </button>
                          </td>
                        </tr>
                      ))}
                      {daftarAgenda.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-gray-500">
                            Belum ada jadwal agenda desa yang didaftarkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL PROFIL, APARATUR, UMKM, & LEMBAGA
        ========================================== */}
        {activeMenu === "profil" && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. SEJARAH & VISI MISI */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-green-600">
              <h3 className="text-2xl font-bold mb-2">🏛️ Pengaturan Teks Profil</h3>
              <p className="text-gray-500 text-sm mb-6">
                Sesuaikan teks Sejarah dan Visi Misi yang akan menjadi wajah
                desa di halaman publik.
              </p>
              <form onSubmit={handleSimpanProfil} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Sejarah Desa</label>
                  <textarea
                    required
                    rows={6}
                    value={sejarahDesa}
                    onChange={(e) => setSejarahDesa(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">Visi & Misi</label>
                  <textarea
                    required
                    rows={6}
                    value={visiMisiDesa}
                    onChange={(e) => setVisiMisiDesa(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none leading-relaxed"
                  ></textarea>
                </div>
                {statusProfil && (
                  <div className="p-4 rounded-xl font-bold text-center bg-green-100 text-green-800 border border-green-300">
                    {statusProfil}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoadingProfil}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoadingProfil ? "Menyimpan Perubahan..." : "Simpan Profil Utama"}
                </button>
              </form>
            </div>

            {/* 2. SOTK APARATUR */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-blue-600">
              <h3 className="text-2xl font-bold mb-2">👔 Susunan Perangkat Desa (SOTK)</h3>
              <p className="text-gray-500 text-sm mb-6">
                Kelola hierarki susunan perangkat desa beserta foto formal
                untuk ditampilkan di halaman profil publik.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                  <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-3">
                    <h4 className="font-bold text-blue-900 text-lg">
                      {editAparaturId ? "✏️ Mode Edit SOTK" : "Tambah Anggota SOTK Baru"}
                    </h4>
                    {editAparaturId && (
                      <button
                        onClick={batalEditAparatur}
                        className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSimpanAparatur} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Lengkap & Gelar</label>
                      <input
                        type="text"
                        required
                        value={namaAparatur}
                        onChange={(e) => setNamaAparatur(e.target.value)}
                        placeholder="Misal: Drs. Budi Santoso"
                        className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Jabatan</label>
                      <input
                        type="text"
                        required
                        value={jabatanAparatur}
                        onChange={(e) => setJabatanAparatur(e.target.value)}
                        placeholder="Misal: Kepala Desa"
                        className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700" title="Nomor 1 untuk Kepala Desa agar tampil paling atas">
                          No. Urut (Hierarki)
                        </label>
                        <input
                          type="number"
                          required
                          value={urutanAparatur}
                          onChange={(e) => setUrutanAparatur(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-center font-black text-xl text-blue-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Foto Wajah (Formal)</label>
                        <label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-blue-300 rounded-xl hover:bg-blue-100 transition-all overflow-hidden shadow-sm">
                          <span className="font-bold text-blue-800 text-xs flex items-center gap-2">
                            <span className="text-xl">📸</span> {fotoAparatur ? "Siap" : "Pilih File"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) setFotoAparatur(e.target.files[0]);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    {editAparaturId && fotoLamaAparatur && (
                      <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <img
                          src={`https://wsrv.nl/?url=${fotoLamaAparatur}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                        />
                        <div>
                          <span className="text-xs font-bold text-blue-800 block">Foto Tersimpan</span>
                          <span className="text-[10px] text-gray-500">Isi 'Foto Baru' jika ingin mengganti</span>
                        </div>
                      </div>
                    )}
                    {statusAparatur && (
                      <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">
                        {statusAparatur}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingAparatur}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition-colors text-lg"
                    >
                      {isLoadingAparatur ? "Memproses..." : editAparaturId ? "Simpan Perubahan SOTK" : "Tambahkan ke SOTK"}
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-4 px-4 font-bold text-gray-600 text-center">No. Hierarki</th>
                        <th className="py-4 px-4 font-bold text-gray-600">Identitas & Jabatan Lengkap</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarAparatur.map((org) => (
                        <tr key={org.id} className="border-b hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-blue-200">
                              {org.urutan}
                            </div>
                          </td>
                          <td className="py-4 px-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                              {org.foto ? (
                                <img
                                  src={`https://wsrv.nl/?url=${org.foto}`}
                                  alt="profil"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="flex items-center justify-center w-full h-full text-2xl text-gray-400">👤</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-base">{org.nama}</div>
                              <div className="text-xs text-blue-700 uppercase font-black tracking-widest mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
                                {org.jabatan}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => mulaiEditAparatur(org)}
                                className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Edit Profil
                              </button>
                              <button
                                onClick={() => hapusAparatur(org.id)}
                                className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. LEMBAGA MASYARAKAT */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-indigo-500">
              <h3 className="text-2xl font-bold mb-2">🤝 Lembaga Kemasyarakatan Desa</h3>
              <p className="text-gray-500 text-sm mb-6">
                Kelola data Lembaga Masyarakat seperti PKK, Karang Taruna,
                LPMD, dll beserta lambang organisasinya.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-inner">
                  <div className="flex justify-between items-center mb-6 border-b border-indigo-200 pb-3">
                    <h4 className="font-bold text-indigo-900 text-lg">
                      {editLembagaId ? "✏️ Edit Profil Lembaga" : "Daftarkan Lembaga Baru"}
                    </h4>
                    {editLembagaId && (
                      <button
                        onClick={batalEditLembaga}
                        className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSimpanLembaga} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Organisasi Lengkap</label>
                      <input
                        type="text"
                        required
                        value={namaLembaga}
                        onChange={(e) => setNamaLembaga(e.target.value)}
                        placeholder="Misal: Pemberdayaan Kesejahteraan Keluarga"
                        className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Singkatan</label>
                        <input
                          type="text"
                          required
                          value={singkatanLembaga}
                          onChange={(e) => setSingkatanLembaga(e.target.value)}
                          placeholder="Misal: PKK"
                          className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-center text-indigo-900 text-xl tracking-widest"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Logo Organisasi</label>
                        <label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-indigo-300 rounded-xl hover:bg-indigo-100 transition-all overflow-hidden shadow-sm">
                          <span className="font-bold text-indigo-800 text-xs flex items-center gap-2">
                            <span className="text-xl">📸</span> {fotoLembaga ? "Siap" : "Upload Logo"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) setFotoLembaga(e.target.files[0]);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi Singkat / Tupoksi Lembaga</label>
                      <textarea
                        required
                        rows={4}
                        value={deskripsiLembaga}
                        onChange={(e) => setDeskripsiLembaga(e.target.value)}
                        className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                      ></textarea>
                    </div>
                    {editLembagaId && fotoLamaLembaga && (
                      <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                        <img
                          src={`https://wsrv.nl/?url=${fotoLamaLembaga}`}
                          className="w-12 h-12 rounded-md object-contain"
                        />
                        <div>
                          <span className="text-xs font-bold text-indigo-800 block">Logo Tersimpan</span>
                          <span className="text-[10px] text-gray-500">Isi 'Upload Logo' jika ingin mengganti</span>
                        </div>
                      </div>
                    )}
                    {statusLembaga && (
                      <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">
                        {statusLembaga}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingLembaga}
                      className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-md transition-colors text-lg"
                    >
                      {isLoadingLembaga ? "Memproses..." : editLembagaId ? "Simpan Perubahan Lembaga" : "Tambahkan Lembaga Baru"}
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-4 px-4 font-bold text-gray-600">Identitas Lembaga (Logo & Nama)</th>
                        <th className="py-4 px-4 font-bold text-gray-600">Deskripsi Singkat</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarLembaga.map((lem) => (
                        <tr key={lem.id} className="border-b hover:bg-indigo-50 transition-colors">
                          <td className="py-4 px-4 flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md p-1">
                              {lem.foto ? (
                                <img
                                  src={`https://wsrv.nl/?url=${lem.foto}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="flex items-center justify-center h-full text-3xl">🤝</span>
                              )}
                            </div>
                            <div>
                              <div className="font-black text-indigo-900 text-lg tracking-wide">{lem.singkatan}</div>
                              <div className="text-xs font-bold text-gray-500 uppercase mt-1 leading-snug w-40 line-clamp-2">
                                {lem.nama}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs text-gray-600 leading-relaxed max-w-xs line-clamp-3">
                              {lem.deskripsi}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => mulaiEditLembaga(lem)}
                                className="w-full max-w-[100px] bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Edit Data
                              </button>
                              <button
                                onClick={() => hapusLembaga(lem.id)}
                                className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {daftarLembaga.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-gray-500">
                            Belum ada data lembaga terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. KATALOG UMKM */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-yellow-600">
              <h3 className="text-2xl font-bold mb-2">🛍️ Katalog Potensi / UMKM Desa</h3>
              <p className="text-gray-500 text-sm mb-6">
                Daftarkan produk UMKM atau potensi perekonomian desa untuk
                dipamerkan ke halaman warga.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-inner">
                  <div className="flex justify-between items-center mb-6 border-b border-yellow-300 pb-3">
                    <h4 className="font-bold text-yellow-900 text-lg">
                      {editUmkmId ? "✏️ Edit Produk UMKM" : "Daftarkan UMKM Baru"}
                    </h4>
                    {editUmkmId && (
                      <button
                        onClick={batalEditUmkm}
                        className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSimpanUmkm} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Produk / Potensi Usaha</label>
                      <input
                        type="text"
                        required
                        value={namaProduk}
                        onChange={(e) => setNamaProduk(e.target.value)}
                        placeholder="Misal: Kripik Singkong Khas Kerjo"
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Pemilik / Pengelola</label>
                      <input
                        type="text"
                        required
                        value={pemilikUmkm}
                        onChange={(e) => setPemilikUmkm(e.target.value)}
                        placeholder="Misal: Ibu Tejo"
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Harga Estimasi (Rp)</label>
                        <input
                          type="number"
                          required
                          value={hargaProduk}
                          onChange={(e) => setHargaProduk(e.target.value)}
                          placeholder="15000"
                          className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-yellow-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">No. WhatsApp Aktif</label>
                        <input
                          type="number"
                          required
                          value={waUmkm}
                          onChange={(e) => setWaUmkm(e.target.value)}
                          placeholder="62812..."
                          className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Deskripsi Singkat Keunggulan Produk</label>
                      <textarea
                        required
                        rows={3}
                        value={deskripsiProduk}
                        onChange={(e) => setDeskripsiProduk(e.target.value)}
                        className="w-full p-3 rounded-xl border border-yellow-300 outline-none focus:ring-2 focus:ring-yellow-500 leading-relaxed"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">
                        {editUmkmId ? "Ubah Foto Promosi (Opsional)" : "Foto Produk / Warung"}
                      </label>
                      <label className="cursor-pointer flex flex-col items-center justify-center h-[52px] bg-white border border-yellow-300 rounded-xl hover:bg-yellow-100 transition-all overflow-hidden shadow-sm">
                        <span className="font-bold text-yellow-800 text-xs flex items-center gap-2">
                          <span className="text-xl">📸</span> {fotoProduk ? "File Siap" : "Upload Gambar"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) setFotoProduk(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {editUmkmId && fotoLamaUmkm && (
                      <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-yellow-200 shadow-sm">
                        <img
                          src={`https://wsrv.nl/?url=${fotoLamaUmkm}`}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <span className="text-xs font-bold text-yellow-800 block">Gambar Tersimpan</span>
                          <span className="text-[10px] text-gray-500">Upload baru untuk mengganti</span>
                        </div>
                      </div>
                    )}
                    {statusUmkm && (
                      <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-300 p-3 rounded-lg text-center">
                        {statusUmkm}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingUmkm}
                      className="w-full bg-yellow-600 text-white font-bold py-3.5 rounded-xl hover:bg-yellow-700 shadow-md transition-colors text-lg"
                    >
                      {isLoadingUmkm ? "Memproses Data..." : editUmkmId ? "Simpan Perubahan Produk" : "Tambahkan ke Katalog"}
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-4 px-4 font-bold text-gray-600">Foto & Identitas Produk</th>
                        <th className="py-4 px-4 font-bold text-gray-600">Kontak Penjual</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Manajemen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarUmkm.map((umkm) => (
                        <tr key={umkm.id} className="border-b hover:bg-yellow-50 transition-colors">
                          <td className="py-4 px-4 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                              {umkm.foto ? (
                                <img
                                  src={`https://wsrv.nl/?url=${umkm.foto}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="flex items-center justify-center h-full text-2xl text-gray-400">📦</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-base">{umkm.nama_produk}</div>
                              <div className="text-sm text-green-700 font-black mt-1 bg-green-50 inline-block px-2 py-0.5 rounded">
                                Rp {new Intl.NumberFormat("id-ID").format(umkm.harga)}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-800">{umkm.pemilik}</div>
                            <div className="text-xs font-mono font-bold text-blue-600 mt-1">
                              WA: {umkm.wa}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => mulaiEditUmkm(umkm)}
                                className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Edit Produk
                              </button>
                              <button
                                onClick={() => hapusUmkm(umkm.id)}
                                className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {daftarUmkm.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-gray-500">
                            Belum ada data produk UMKM yang dipromosikan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL TRANSPARANSI & REGULASI
        ========================================== */}
        {activeMenu === "transparansi" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-t-4 border-yellow-400">
              <h3 className="text-2xl font-bold mb-2">📊 Kelola Grafik APBDes</h3>
              <p className="text-gray-500 text-sm mb-6">
                Perbarui angka anggaran untuk ditampilkan pada grafik donat
                secara otomatis di halaman warga.
              </p>
              <form onSubmit={handleSimpanApbdes} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Dana Desa (DD)</label>
                    <input
                      type="number"
                      required
                      value={danaDesa}
                      onChange={(e) => setDanaDesa(e.target.value)}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Alokasi Dana Desa (ADD)</label>
                    <input
                      type="number"
                      required
                      value={alokasiDanaDesa}
                      onChange={(e) => setAlokasiDanaDesa(e.target.value)}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Pendapatan Asli Desa (PAD)</label>
                    <input
                      type="number"
                      required
                      value={pad}
                      onChange={(e) => setPad(e.target.value)}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Bantuan Keuangan Provinsi</label>
                    <input
                      type="number"
                      required
                      value={banprov}
                      onChange={(e) => setBanprov(e.target.value)}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white outline-none font-bold text-lg"
                    />
                  </div>
                </div>
                {statusApbdes && (
                  <div className="p-4 rounded-xl font-bold text-center bg-green-100 text-green-800 border border-green-300">
                    {statusApbdes}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoadingApbdes}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black px-10 py-4 rounded-xl shadow-md transition-colors text-lg"
                >
                  {isLoadingApbdes ? "Memproses Database..." : "Simpan dan Perbarui Grafik Anggaran"}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-green-600">
              <h3 className="text-2xl font-bold mb-2">
                📈 Realisasi / Penyerapan Dana Desa
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Masukkan data penyerapan dana pada proyek desa yang sedang atau
                telah selesai berjalan. Persentase akan dihitung otomatis.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-green-50 p-6 rounded-2xl border border-green-200 shadow-inner">
                  <h4 className="font-bold text-green-900 mb-6 text-lg border-b border-green-300 pb-2">
                    Catat Data Realisasi Baru
                  </h4>
                  <form onSubmit={handleSimpanRealisasi} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Nama Proyek / Bidang Kegiatan</label>
                      <input
                        type="text"
                        required
                        value={namaProyek}
                        onChange={(e) => setNamaProyek(e.target.value)}
                        placeholder="Misal: Pembangunan Jalan Makadam RT 01"
                        className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Pagu Anggaran Maksimal (Rp)</label>
                      <input
                        type="number"
                        required
                        value={paguAnggaran}
                        onChange={(e) => setPaguAnggaran(e.target.value)}
                        placeholder="150000000"
                        className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Dana Sudah Terealisasi (Rp)</label>
                      <input
                        type="number"
                        required
                        value={danaTerealisasi}
                        onChange={(e) => setDanaTerealisasi(e.target.value)}
                        placeholder="100000000"
                        className="w-full p-3 rounded-xl border border-green-300 outline-none focus:ring-2 focus:ring-green-600 bg-white font-mono font-bold text-green-800"
                      />
                    </div>
                    {statusRealisasi && (
                      <div className="text-xs font-bold text-green-800 bg-green-100 border border-green-400 p-3 rounded-lg text-center">
                        {statusRealisasi}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingRealisasi}
                      className="w-full bg-green-700 text-white font-bold py-3.5 rounded-xl hover:bg-green-800 shadow-md transition-colors text-lg"
                    >
                      {isLoadingRealisasi ? "Menyimpan..." : "Tambahkan Laporan Realisasi"}
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-4 px-4 font-bold text-gray-600">Nama Proyek & Nilai Anggaran</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Ketercapaian (%)</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Aksi Hapus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarRealisasi.map((real) => {
                        const persen = Math.round((real.terealisasi / real.pagu) * 100);
                        return (
                          <tr key={real.id} className="border-b hover:bg-green-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900 text-base mb-1">
                                {real.nama_proyek}
                              </div>
                              <div className="text-xs font-medium text-gray-600 bg-gray-100 inline-block px-3 py-1 rounded-md border border-gray-200">
                                Terealisasi: <span className="font-bold text-green-700">Rp {new Intl.NumberFormat("id-ID").format(real.terealisasi)}</span> dari Rp {new Intl.NumberFormat("id-ID").format(real.pagu)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className={`mx-auto w-16 py-1.5 rounded-lg font-black text-sm border-2 ${
                                persen >= 100 ? "bg-green-100 text-green-700 border-green-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"
                              }`}>
                                {persen}%
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => hapusRealisasi(real.id)}
                                className="bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                              >
                                Hapus Baris
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {daftarRealisasi.length === 0 && (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada data realisasi yang dilaporkan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 border-t-4 border-blue-600">
              <h3 className="text-2xl font-bold mb-2">📂 Manajemen Dokumen & Regulasi</h3>
              <p className="text-gray-500 text-sm mb-6">
                Unggah tautan dokumen Peraturan Desa (Perdes), Laporan, atau
                SK Kades untuk diunduh publik secara bebas.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-inner">
                  <div className="flex justify-between items-center mb-6 border-b border-blue-300 pb-3">
                    <h4 className="font-bold text-blue-900 text-lg">
                      {editRegulasiId ? "✏️ Edit Arsip Dokumen" : "Tambah Arsip Dokumen Baru"}
                    </h4>
                    {editRegulasiId && (
                      <button
                        onClick={batalEditRegulasi}
                        className="text-xs bg-gray-300 hover:bg-gray-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSimpanRegulasi} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Tahun Disahkan</label>
                        <input
                          type="number"
                          required
                          value={tahunRegulasi}
                          onChange={(e) => setTahunRegulasi(e.target.value)}
                          placeholder="Misal: 2024"
                          className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-center bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-gray-700">Jenis Dokumen Hukum</label>
                        <select
                          value={jenisRegulasi}
                          onChange={(e) => setJenisRegulasi(e.target.value)}
                          className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white"
                        >
                          <option value="Perdes">Peraturan Desa (Perdes)</option>
                          <option value="SK Kades">SK Kepala Desa</option>
                          <option value="Laporan">Laporan Penyelenggaraan</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Judul / Penamaan Dokumen Lengkap</label>
                      <textarea
                        required
                        rows={3}
                        value={judulRegulasi}
                        onChange={(e) => setJudulRegulasi(e.target.value)}
                        placeholder="Misal: Peraturan Desa Nomor 5 Tahun 2024 tentang Anggaran Pendapatan dan Belanja Desa"
                        className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 bg-white leading-relaxed"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-700">Tautan File Cloud (Google Drive / Dropbox)</label>
                      <input
                        type="url"
                        required
                        value={linkRegulasi}
                        onChange={(e) => setLinkRegulasi(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full p-3 rounded-xl border border-blue-300 outline-none focus:ring-2 focus:ring-blue-600 bg-white font-mono text-xs"
                      />
                    </div>
                    {statusRegulasi && (
                      <div className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 p-3 rounded-lg text-center">
                        {statusRegulasi}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoadingRegulasi}
                      className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-xl hover:bg-blue-800 shadow-md transition-colors text-lg"
                    >
                      {isLoadingRegulasi ? "Menyimpan ke Server..." : editRegulasiId ? "Simpan Perubahan Dokumen" : "Publikasikan Tautan Dokumen"}
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-4 px-4 font-bold text-gray-600">Tahun & Kategori</th>
                        <th className="py-4 px-4 font-bold text-gray-600">Judul Dokumen Resmi</th>
                        <th className="py-4 px-4 text-center font-bold text-gray-600">Manajemen Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarRegulasi.map((docItem) => (
                        <tr key={docItem.id} className="border-b hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-black text-gray-900 text-xl block mb-1">
                              {docItem.tahun}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-md font-black uppercase tracking-widest inline-block">
                              {docItem.jenis}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-800 text-base leading-snug mb-2">
                              {docItem.judul}
                            </div>
                            <a
                              href={docItem.link}
                              target="_blank"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              <span>🔗</span> Tes Buka Tautan Unduhan
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => mulaiEditRegulasi(docItem)}
                                className="w-full max-w-[100px] bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Edit Dokumen
                              </button>
                              <button
                                onClick={() => hapusRegulasi(docItem.id)}
                                className="w-full max-w-[100px] bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Hapus Berkas
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {daftarRegulasi.length === 0 && (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-500">Belum ada arsip regulasi desa yang diunggah.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODUL MANAJEMEN AKUN
        ========================================== */}
        {activeMenu === "akun" && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border-t-4 border-gray-800 animate-fade-in">
            <h3 className="text-2xl font-bold mb-2">👥 Registrasi Hak Akses Sistem</h3>
            <p className="text-gray-500 text-sm mb-8">
              Tambahkan identitas pengguna baru untuk mengelola website ini
              bersama Anda. Pastikan email yang didaftarkan aktif.
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
        )}
      </main>
    </div>
  );
}