import moment from 'moment-timezone';
import axios from 'axios';
import { 
  getSubscribersReminder, 
  getReminders, 
  getSubscribersPrayer,
  getPrayerSettings,
  getSubscribersSleep
} from './database.js';
import { getTomorrowDay, getJadwal, formatJadwal } from './jadwal.js';

const PRAYER_MESSAGES = [
  '🕌 Waktunya sholat! Jangan lupa tunaikan kewajiban kita kepada Allah SWT.',
  '⏰ Sudah masuk waktu sholat. Yuk segera tunaikan ibadah!',
  '🤲 Ingat! Waktu sholat telah tiba. Mari kita sholat tepat waktu.',
  '📿 Waktu sholat sudah tiba. Jangan sampai terlewat ya!'
];

const SLEEP_MESSAGES = [
  '🌙 Waktunya istirahat! Tidur yang cukup itu penting loh.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '😴 Sudah malam nih, yuk istirahat! Jangan begadang ya.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🛌 Sebelum tidur, jangan lupa baca doa ya!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌟 Istirahat yang cukup bikin kita lebih produktif besok!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '💤 Hari yang melelahkan ya? Sekarang waktunya istirahat.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '🌃 Malam sudah larut, yuk tidur. Besok masih ada aktivitas!\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_',
  
  '😊 Selamat beristirahat! Semoga tidurmu nyenyak.\n\n*Doa Sebelum Tidur:*\nBismika Allahumma ahya wa bismika amut\n\n_"Dengan nama-Mu ya Allah aku hidup dan dengan nama-Mu aku mati"_'
];

let lastPrayerCheck = {};

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

export async function sendSleepReminder(sock) {
  const subscribers = getSubscribersSleep();
  
  if (subscribers.length === 0) return;
  
  const now = moment().tz('Asia/Jakarta');
  const hour = now.hours();
  const minute = now.minutes();
  
  // Check if between 21:00 and 21:35
  if (hour === 21 && minute >= 0 && minute <= 35) {
    const message = SLEEP_MESSAGES[Math.floor(Math.random() * SLEEP_MESSAGES.length)];
    
    for (const number of subscribers) {
      try {
        await sock.sendMessage(number, { text: message });
        await delay(1000);
      } catch (err) {
        console.error(`Failed to send sleep reminder to ${number}:`, err);
      }
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
