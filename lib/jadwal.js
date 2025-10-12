export const jadwalSekolah = {
  senin: [
    '06.45-07.30 = Upacara',
    '07.30-08.15 = PKWU',
    '08.15-09.00 = PKWU',
    '09.00-09.25 = Istirahat/Sholat Dhuha',
    '09.25-10.10 = Matematika',
    '10.10-10.55 = Matematika',
    '10.55-11.40 = Matematika(TL)',
    '11.40-12.25 = Matematika(TL)',
    '12.25-12.50 = Istirahat/Sholat Dzuhur',
    '12.50-13.35 = Biologi(TL)',
    '13.35-14.20 = Biologi(TL)',
    '14.20-15.05 = Bahasa Indonesia',
    '15.05-15.50 = Bahasa Indonesia'
  ],
  selasa: [
    '06.45-07.30 = PPKn',
    '07.30-08.15 = PPKn',
    '08.15-09.00 = Matematika',
    '09.00-09.25 = Istirahat/Sholat Dhuha',
    '09.25-10.10 = Matematika',
    '10.10-10.55 = Biologi(TL)',
    '10.55-11.40 = Biologi(TL)',
    '11.40-12.25 = Biologi(TL)',
    '12.25-12.50 = Istirahat/Sholat Dzuhur',
    '12.50-13.35 = Bahasa Indonesia',
    '13.35-14.20 = Bahasa Indonesia',
    '14.20-15.05 = Matematika(TL)',
    '15.05-15.50 = Matematika(TL)'
  ],
  rabu: [
    '06.45-07.30 = Fisika(TL)',
    '07.30-08.15 = Fisika(TL)',
    '08.15-09.00 = Fisika(TL)',
    '09.00-09.25 = Istirahat/Sholat Dhuha',
    '09.25-10.10 = PAI',
    '10.10-10.55 = PAI',
    '10.55-11.40 = PAI',
    '11.40-12.25 = Matematika(TL)',
    '12.25-12.50 = Istirahat/Sholat Dzuhur',
    '12.50-13.35 = Sejarah',
    '13.35-14.20 = Sejarah',
    '14.20-15.05 = Kimia(TL)',
    '15.05-15.50 = Kimia(TL)'
  ],
  kamis: [
    '06.45-07.30 = Kimia(TL)',
    '07.30-08.15 = Kimia(TL)',
    '08.15-09.00 = Kimia(TL)',
    '09.00-09.25 = Istirahat/Sholat Dhuha',
    '09.25-10.10 = Bahasa Inggris',
    '10.10-10.55 = Bahasa Inggris',
    '10.55-11.40 = Bahasa Inggris',
    '11.40-12.25 = Seni Budaya',
    '12.25-12.50 = Istirahat/Sholat Dzuhur',
    '12.50-13.35 = Seni Budaya',
    '13.35-14.20 = PJOK',
    '14.20-15.05 = PJOK',
    '15.05-15.50 = PJOK'
  ],
  jumat: [
    '06.45-07.30 = Bahasa Jawa',
    '07.30-08.15 = Bahasa Jawa',
    '08.15-09.00 = Bimbingan Konseling',
    '09.00-09.30 = Istirahat/Sholat Dhuha',
    '09.30-10.15 = Fisika(TL)',
    '10.15-11.00 = Fisika(TL)'
  ],
  sabtu: ['Libur'],
  minggu: ['Libur']
};

export function getJadwal(hari) {
  const days = {
    'senin': 'senin',
    'selasa': 'selasa',
    'rabu': 'rabu',
    'kamis': 'kamis',
    'jumat': 'jumat',
    'sabtu': 'sabtu',
    'minggu': 'minggu'
  };
  
  const day = days[hari.toLowerCase()];
  if (!day) return null;
  
  return jadwalSekolah[day];
}

export function getTomorrowDay() {
  const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return days[tomorrow.getDay()];
}

export function formatJadwal(hari, jadwal) {
  let text = `📚 *JADWAL ${hari.toUpperCase()}*\n\n`;
  
  if (jadwal.length === 1 && jadwal[0] === 'Libur') {
    text += '🎉 Hari ini libur!';
  } else {
    jadwal.forEach((item, i) => {
      text += `${i + 1}. ${item}\n`;
    });
  }
  
  return text;
}
