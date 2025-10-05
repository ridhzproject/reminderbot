// lib/jadwal.js
const fs = require('fs');
const path = require('path');

const jadwal = {
    Senin: [
        { waktu: '06.45-07.30', pelajaran: 'Upacara' },
        { waktu: '07.30-08.15', pelajaran: 'PKWU' },
        { waktu: '08.15-09.00', pelajaran: 'PKWU' },
        { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
        { waktu: '09.25-10.10', pelajaran: 'Matematika' },
        { waktu: '10.10-10.55', pelajaran: 'Matematika' },
        { waktu: '10.55-11.40', pelajaran: 'Matematika(TL)' },
        { waktu: '11.40-12.25', pelajaran: 'Matematika(TL)' },
        { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
        { waktu: '12.50-13.35', pelajaran: 'Biologi(TL)' },
        { waktu: '13.35-14.20', pelajaran: 'Biologi(TL)' },
        { waktu: '14.20-15.05', pelajaran: 'Bahasa Indonesia' },
        { waktu: '15.05-15.50', pelajaran: 'Bahasa Indonesia' }
    ],
    Selasa: [
        { waktu: '06.45-07.30', pelajaran: 'PPKn' },
        { waktu: '07.30-08.15', pelajaran: 'PPkn' },
        { waktu: '08.15-09.00', pelajaran: 'Matematika' },
        { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
        { waktu: '09.25-10.10', pelajaran: 'Matematika' },
        { waktu: '10.10-10.55', pelajaran: 'Biologi(TL)' },
        { waktu: '10.55-11.40', pelajaran: 'Biologi(TL)' },
        { waktu: '11.40-12.25', pelajaran: 'Biologi(TL)' },
        { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
        { waktu: '12.50-13.35', pelajaran: 'Bahasa Indonesia' },
        { waktu: '13.35-14.20', pelajaran: 'Bahasa Indonesia' },
        { waktu: '14.20-15.05', pelajaran: 'Matematika(TL)' },
        { waktu: '15.05-15.50', pelajaran: 'Matematika(TL)' }
    ],
    Rabu: [
        { waktu: '06.45-07.30', pelajaran: 'Fisika(TL)' },
        { waktu: '07.30-08.15', pelajaran: 'Fisika(TL)' },
        { waktu: '08.15-09.00', pelajaran: 'Fisika(TL)' },
        { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
        { waktu: '09.25-10.10', pelajaran: 'PAI' },
        { waktu: '10.10-10.55', pelajaran: 'PAI' },
        { waktu: '10.55-11.40', pelajaran: 'PAI' },
        { waktu: '11.40-12.25', pelajaran: 'Matematika(TL)' },
        { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
        { waktu: '12.50-13.35', pelajaran: 'Sejarah' },
        { waktu: '13.35-14.20', pelajaran: 'Sejarah' },
        { waktu: '14.20-15.05', pelajaran: 'Kimia(TL)' },
        { waktu: '15.05-15.50', pelajaran: 'Kimia(TL)' }
    ],
    Kamis: [
        { waktu: '06.45-07.30', pelajaran: 'Kimia(TL)' },
        { waktu: '07.30-08.15', pelajaran: 'Kimia(TL)' },
        { waktu: '08.15-09.00', pelajaran: 'Kimia(TL)' },
        { waktu: '09.00-09.25', pelajaran: 'Istirahat/Sholat Dhuha' },
        { waktu: '09.25-10.10', pelajaran: 'Bahasa inggris' },
        { waktu: '10.10-10.55', pelajaran: 'Bahasa inggris' },
        { waktu: '10.55-11.40', pelajaran: 'Bahasa inggris' },
        { waktu: '11.40-12.25', pelajaran: 'Seni Budaya' },
        { waktu: '12.25-12.50', pelajaran: 'Istirahat/Sholat dzuhur' },
        { waktu: '12.50-13.35', pelajaran: 'Seni Budaya' },
        { waktu: '13.35-14.20', pelajaran: 'PJOK' },
        { waktu: '14.20-15.05', pelajaran: 'PJOK' },
        { waktu: '15.05-15.50', pelajaran: 'PJOK' }
    ],
    Jumat: [
        { waktu: '06.45-07.30', pelajaran: 'Bahasa Jawa' },
        { waktu: '07.30-08.15', pelajaran: 'Bahasa Jawa' },
        { waktu: '08.15-09.00', pelajaran: 'Bimbingan Konseling' },
        { waktu: '09.00-09.30', pelajaran: 'Istirahat/Sholat Dhuha' },
        { waktu: '09.30-10.15', pelajaran: 'Fisika(TL)' },
        { waktu: '10.15-11.00', pelajaran: 'Fisika(TL)' }
    ],
    Sabtu: [],
    Minggu: []
};

// Fungsi untuk mendapatkan jadwal hari ini
const getJadwalHariIni = () => {
    const hari = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return jadwal[hari] || [];
};

// Fungsi untuk mendapatkan jadwal besok
const getJadwalBesok = () => {
    const hariIni = new Date();
    const besok = new Date(hariIni);
    besok.setDate(hariIni.getDate() + 1);
    const hariBesok = besok.toLocaleDateString('id-ID', { weekday: 'long' });
    return jadwal[hariBesok] || [];
};

// Fungsi untuk mendapatkan jadwal berdasarkan nama hari
const getJadwalByHari = (hari) => {
    return jadwal[hari] || [];
};

// Fungsi untuk format jadwal menjadi teks
const formatJadwal = (jadwalHari, hari) => {
    if (jadwalHari.length === 0) {
        return `*${hari}*\n\nLibur 🎉`;
    }

    let text = `*${hari}*\n\n`;
    jadwalHari.forEach((item, index) => {
        text += `${index + 1}. ${item.waktu} = ${item.pelajaran}\n`;
    });
    return text;
};

// Fungsi untuk mendapatkan gambar jadwal
const getJadwalImage = () => {
    const imagePath = path.join(__dirname, 'jadwalxia.jpg');
    if (fs.existsSync(imagePath)) {
        return imagePath;
    }
    return null;
};

module.exports = {
    getJadwalHariIni,
    getJadwalBesok,
    getJadwalByHari,
    formatJadwal,
    getJadwalImage
};
