import moment from 'moment-timezone';
import axios from 'axios';
import { jadwalSekolah } from './jadwal.js';
import { 
  getSubscribersReminder, 
  getReminders, 
  getSubscribersPrayer,
  getPrayerSettings,
  getSubscribersSleep
} from './database.js';
import { getTomorrowDay, getJadwal, formatJadwal } from './jadwal.js';

const STUDY_MESSAGES = [
  '📚 Semangat belajar! Ingat, pendidikan adalah kunci masa depan.',
  '✨ Pelajaran baru, semangat baru! Berikan yang terbaik.',
  '💪 Yakin bisa! Setiap pelajaran adalah kesempatan untuk berkembang.',
  '🌟 Fokus dan konsentrasi, kamu pasti bisa!',
  '🎯 Target hari ini: Pahami materi dengan baik.',
  '💡 Belajar dengan gembira, sukses akan mengikuti.',
  '📝 Catat dengan rapi, pahami dengan hati.',
  '🌈 Setiap pelajaran membawamu selangkah lebih dekat ke impianmu.',
  '🚀 Jangan menyerah! Kesulitan hari ini adalah kekuatan untuk esok.',
  '💫 Belajar adalah investasi terbaik untuk masa depanmu.',
  '🎨 Setiap orang punya cara belajar sendiri. Temukan caramu!',
  '⭐ Ingat! Tidak ada yang tidak mungkin jika kamu mau berusaha.'
];

const PRAYER_MESSAGES = [
  '🕌 Waktunya sholat! Jangan lupa tunaikan kewajiban kita kepada Allah SWT.',
  '⏰ Sudah masuk waktu sholat. Yuk segera tunaikan ibadah!',
  '🤲 Ingat! Waktu sholat telah tiba. Mari kita sholat tepat waktu.',
  '📿 Waktu sholat sudah tiba. Jangan sampai terlewat ya!',
  '🌟 Tinggalkan sejenak aktivitasmu, Allah sudah menunggu di sajadah.',
  '💫 Sholat tepat waktu adalah kunci keberkahan dalam hidup.',
  '🌺 Mari sucikan hati dan pikiran dengan sholat.',
  '🎯 Ingat! Sholat adalah tiang agama. Jangan ditunda-tunda.',
  '💝 Sudah waktunya menghadap Allah. Yuk sholat!',
  '🌸 Sholat adalah nutrisi untuk jiwa kita.',
  '✨ Raih kedamaian hati dengan sholat tepat waktu.',
  '💫 Sukses dunia akhirat dimulai dari sholat tepat waktu.'
];

const SLEEP_MESSAGES = [
  '🌙 Waktunya istirahat! Tidur yang cukup itu penting loh.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '😴 Sudah malam nih, yuk istirahat! Jangan begadang ya.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🛌 Sebelum tidur, jangan lupa baca doa ya!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌟 Istirahat yang cukup bikin kita lebih produktif besok!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '💤 Hari yang melelahkan ya? Sekarang waktunya istirahat.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌃 Malam sudah larut, yuk tidur. Besok masih ada aktivitas!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '😊 Selamat beristirahat! Semoga tidurmu nyenyak.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌠 Yuk tidur lebih awal, biar besok lebih semangat!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌛 Sudah waktunya mengistirahatkan tubuh dan pikiran.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '💫 Tidur tepat waktu adalah investasi untuk kesehatan.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌙 Matikan gadget, saatnya tidur berkualitas.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_'
];

// Tracking untuk lesson reminder
let lastLessonIndex = {};

// Tracking untuk prayer reminder
let lastPrayerCheck = {};

// Tracking untuk sleep reminder dengan schedule random
let sleepReminderSchedule = {
  date: null,
  scheduledMinutes: [],
  sentMinutes: []
};

// Reminder pelajaran setiap 1 menit
export async function sendLessonReminder(sock) {
  const subscribers = getSubscribersReminder();
  const now = new Date();
  const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const hari = days[now.getDay()];
  const jadwal = jadwalSekolah[hari];
  
  if (!jadwal || jadwal.length === 1 && jadwal[0] === 'Libur') return;

  // Cek jam dan menit sekarang
  const jamMenit = now.toTimeString().slice(0, 5);
  let pelajaranIndex = -1;
  
  for (let i = 0; i < jadwal.length; i++) {
    const [waktu] = jadwal[i].split('=');
    const [start, end] = waktu.trim().split('-');
    if (jamMenit >= start && jamMenit < end) {
      pelajaranIndex = i;
      break;
    }
  }
  
  if (pelajaranIndex === -1) return;

  // Cegah spam reminder untuk pelajaran yang sama
  if (lastLessonIndex[hari] === pelajaranIndex) return;
  lastLessonIndex[hari] = pelajaranIndex;

  const pelajaran = jadwal[pelajaranIndex].split('=')[1]?.trim() || '-';
  const motivasi = STUDY_MESSAGES[Math.floor(Math.random() * STUDY_MESSAGES.length)];
  const message = `⏰ Ganti pelajaran!
Sekarang pelajaran: *${pelajaran}*

${motivasi}`;

  for (const number of subscribers) {
    try {
      await sock.sendMessage(number, { text: message });
      await delay(1000);
    } catch (err) {
      console.error(`Failed to send lesson reminder to ${number}:`, err);
    }
  }
}

// Daily reminder (jadwal besok)
export async function sendDailyReminder(sock) {
  const subscribers = getSubscribersReminder();
  const reminders = getReminders();
  const tomorrowDay = getTomorrowDay();
  const jadwal = getJadwal(tomorrowDay);
  
  if (!jadwal) return;
  
  let message = `🔔 *PENGINGAT HARIAN*\n\n`;
  message += formatJadwal(tomorrowDay, jadwal);
  
  if (reminders.length > 0) {
    message += '\n\n📝 *CATATAN/TUGAS:*\n';
    reminders.forEach((r, i) => {
      message += `${i + 1}. ${r.text}\n`;
    });
  }
  
  for (const number of subscribers) {
    try {
      await sock.sendMessage(number, { text: message });
      await delay(1000);
    } catch (err) {
      console.error(`Failed to send reminder to ${number}:`, err);
    }
  }
}

// Prayer time reminder
export async function sendPrayerReminder(sock) {
  try {
    const settings = getPrayerSettings();
    const subscribers = getSubscribersPrayer();
    
    if (subscribers.length === 0) return;
    
    const today = moment().tz('Asia/Jakarta').format('YYYY/MM/DD');
    const response = await axios.get(
      `https://api.myquran.com/v2/sholat/jadwal/${settings.kotaId}/${today}`
    );
    
    if (!response.data.status) return;
    
    const jadwal = response.data.data.jadwal;
    const now = moment().tz('Asia/Jakarta');
    const currentTime = now.format('HH:mm');
    
    const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    
    for (const prayer of prayers) {
      const prayerTime = jadwal[prayer];
      if (!prayerTime) continue;
      
      const prayerMoment = moment.tz(`${today} ${prayerTime}`, 'YYYY/MM/DD HH:mm', 'Asia/Jakarta');
      const diff = now.diff(prayerMoment, 'minutes');
      
      // Send reminder if within 5 minutes after prayer time and not sent yet
      if (diff >= 0 && diff < 5) {
        const checkKey = `${today}-${prayer}`;
        
        if (lastPrayerCheck[checkKey]) continue;
        lastPrayerCheck[checkKey] = true;
        
        const message = `${PRAYER_MESSAGES[Math.floor(Math.random() * PRAYER_MESSAGES.length)]}\n\n*Waktu ${prayer.toUpperCase()}:* ${prayerTime}`;
        
        for (const number of subscribers) {
          try {
            await sock.sendMessage(number, { text: message });
            await delay(1000);
          } catch (err) {
            console.error(`Failed to send prayer reminder to ${number}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('Prayer reminder error:', err);
  }
}

// Sleep reminder - kirim 2x random antara jam 21:00-21:35
export async function sendSleepReminder(sock) {
  const subscribers = getSubscribersSleep();
  
  if (subscribers.length === 0) return;
  
  const now = moment().tz('Asia/Jakarta');
  const hour = now.hours();
  const minute = now.minutes();
  const today = now.format('YYYY-MM-DD');
  
  // Generate schedule untuk hari ini jika belum ada
  if (sleepReminderSchedule.date !== today) {
    // Generate 2 menit random antara 0-35
    const minutes = [];
    while (minutes.length < 2) {
      const randomMinute = Math.floor(Math.random() * 36); // 0-35
      if (!minutes.includes(randomMinute)) {
        minutes.push(randomMinute);
      }
    }
    
    sleepReminderSchedule = {
      date: today,
      scheduledMinutes: minutes.sort((a, b) => a - b),
      sentMinutes: []
    };
    
    console.log(`Sleep reminder scheduled for today at 21:${String(minutes[0]).padStart(2, '0')} and 21:${String(minutes[1]).padStart(2, '0')}`);
  }
  
  // Check if between 21:00 and 21:35 dan apakah sekarang adalah waktu yang dijadwalkan
  if (hour === 21 && minute >= 0 && minute <= 35) {
    // Cek apakah menit ini ada di jadwal dan belum pernah dikirim
    if (sleepReminderSchedule.scheduledMinutes.includes(minute) && 
        !sleepReminderSchedule.sentMinutes.includes(minute)) {
      
      const message = SLEEP_MESSAGES[Math.floor(Math.random() * SLEEP_MESSAGES.length)];
      
      for (const number of subscribers) {
        try {
          await sock.sendMessage(number, { text: message });
          await delay(1000);
        } catch (err) {
          console.error(`Failed to send sleep reminder to ${number}:`, err);
        }
      }
      
      // Tandai menit ini sudah dikirim
      sleepReminderSchedule.sentMinutes.push(minute);
      console.log(`Sleep reminder sent at 21:${String(minute).padStart(2, '0')}`);
    }
  }
}

// Helper function delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
