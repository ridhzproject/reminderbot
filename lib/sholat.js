// lib/sholat.js
const axios = require('axios');
const db = require('./db');
const cron = require('node-cron');

// Fungsi untuk mencari kota
const searchCity = async (keyword) => {
    try {
        const response = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${keyword}`);
        return response.data;
    } catch (error) {
        console.error('Error searching city:', error);
        throw error;
    }
};

// Fungsi untuk mendapatkan jadwal sholat
const getPrayerSchedule = async (cityId, date) => {
    try {
        const response = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${date}`);
        return response.data;
    } catch (error) {
        console.error('Error getting prayer schedule:', error);
        throw error;
    }
};

// Fungsi untuk format jadwal sholat
const formatPrayerSchedule = (data) => {
    const { lokasi, jadwal } = data.data;
    let text = `*JADWAL SHOLAT*\n\n`;
    text += `Lokasi: ${lokasi}\n`;
    text += `Tanggal: ${jadwal.tanggal}\n\n`;
    text += `Imsak: ${jadwal.imsak}\n`;
    text += `Subuh: ${jadwal.subuh}\n`;
    text += `Dhuha: ${jadwal.dhuha}\n`;
    text += `Dzuhur: ${jadwal.dzuhur}\n`;
    text += `Ashar: ${jadwal.ashar}\n`;
    text += `Maghrib: ${jadwal.maghrib}\n`;
    text += `Isya: ${jadwal.isya}\n`;
    
    return text;
};

// Fungsi untuk mengirim reminder sholat
const sendPrayerReminder = async (sock, prayerName) => {
    try {
        const settings = await db.getSholatSettings();
        const subscribers = await db.getSholatSubs();
        
        if (subscribers.length === 0 || settings.autoReminder === 0) {
            return;
        }
        
        // Kata-kata pengingat sholat
        const reminders = [
            "Waktunya sholat, jangan ditunda-tunda ya!",
            "Sholat adalah tiang agama, kokohkanlah!",
            "Allah memanggilmu untuk sholat, segera bersiap!",
            "Sholatmu adalah cahaya di hatimu, jangan padamkan!"
        ];
        
        const randomReminder = reminders[Math.floor(Math.random() * reminders.length)];
        
        const message = `*PENGINGAT SHOLAT*\n\n${randomReminder}\n\nWaktu sholat ${prayerName} telah tiba. Segera lakukan wudhu dan sholat tepat waktu!`;
        
        // Kirim ke semua subscriber
        for (const userId of subscribers) {
            await sock.sendMessage(userId, { text: message });
        }
        
        return true;
    } catch (error) {
        console.error('Error sending prayer reminder:', error);
        return false;
    }
};

// Inisialisasi scheduler untuk reminder sholat
const initPrayerScheduler = (sock) => {
    // Cek setiap menit
    cron.schedule('* * * * *', async () => {
        try {
            const settings = await db.getSholatSettings();
            
            if (settings.autoReminder === 0) {
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            const scheduleData = await getPrayerSchedule(settings.cityId, today);
            const { jadwal } = scheduleData.data;
            
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Cek apakah waktu sholat sudah tiba
            if (currentTime === jadwal.subuh) {
                await sendPrayerReminder(sock, 'Subuh');
            } else if (currentTime === jadwal.dzuhur) {
                await sendPrayerReminder(sock, 'Dzuhur');
            } else if (currentTime === jadwal.ashar) {
                await sendPrayerReminder(sock, 'Ashar');
            } else if (currentTime === jadwal.maghrib) {
                await sendPrayerReminder(sock, 'Maghrib');
            } else if (currentTime === jadwal.isya) {
                await sendPrayerReminder(sock, 'Isya');
            }
        } catch (error) {
            console.error('Error in prayer scheduler:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta'
    });
};

module.exports = {
    searchCity,
    getPrayerSchedule,
    formatPrayerSchedule,
    sendPrayerReminder,
    initPrayerScheduler
};
