// lib/reminder.js
const db = require('./db');
const jadwal = require('./jadwal');
const cron = require('node-cron');

// Fungsi untuk mengirim reminder
const sendReminder = async (sock, subscribers) => {
    try {
        const jadwalBesok = jadwal.getJadwalBesok();
        const besok = new Date();
        besok.setDate(besok.getDate() + 1);
        const hariBesok = besok.toLocaleDateString('id-ID', { weekday: 'long' });
        
        const jadwalText = jadwal.formatJadwal(jadwalBesok, hariBesok);
        
        // Dapatkan semua reminder
        const allReminders = [];
        for (const userId of subscribers) {
            const reminders = await db.getReminders(userId);
            allReminders.push(...reminders.map(r => ({ ...r, userId })));
        }
        
        let reminderText = '';
        if (allReminders.length > 0) {
            reminderText = '\n\n*Daftar Reminder:*\n';
            allReminders.forEach((item, index) => {
                reminderText += `${index + 1}. ${item.reminder}\n`;
            });
        } else {
            reminderText = '\n\n*Tidak ada reminder untuk besok*';
        }
        
        const message = `*JADWAL UNTUK BESOK*\n\n${jadwalText}${reminderText}`;
        
        // Kirim ke semua subscriber
        for (const userId of subscribers) {
            await sock.sendMessage(userId, { text: message });
        }
        
        return true;
    } catch (error) {
        console.error('Error sending reminder:', error);
        return false;
    }
};

// Fungsi untuk mengirim reminder sekarang
const sendReminderNow = async (sock, userId) => {
    try {
        const jadwalBesok = jadwal.getJadwalBesok();
        const besok = new Date();
        besok.setDate(besok.getDate() + 1);
        const hariBesok = besok.toLocaleDateString('id-ID', { weekday: 'long' });
        
        const jadwalText = jadwal.formatJadwal(jadwalBesok, hariBesok);
        
        // Dapatkan reminder untuk user ini
        const reminders = await db.getReminders(userId);
        
        let reminderText = '';
        if (reminders.length > 0) {
            reminderText = '\n\n*Daftar Reminder:*\n';
            reminders.forEach((item, index) => {
                reminderText += `${index + 1}. ${item.reminder}\n`;
            });
        } else {
            reminderText = '\n\n*Tidak ada reminder untuk besok*';
        }
        
        const message = `*JADWAL UNTUK BESOK*\n\n${jadwalText}${reminderText}`;
        
        await sock.sendMessage(userId, { text: message });
        return true;
    } catch (error) {
        console.error('Error sending reminder now:', error);
        return false;
    }
};

// Inisialisasi scheduler untuk reminder harian
const initReminderScheduler = (sock) => {
    // Jalankan setiap hari pada jam 18:45
    cron.schedule('45 18 * * *', async () => {
        try {
            const settings = await db.getReminderSettings();
            const subscribers = await db.getReminderSubs();
            
            if (subscribers.length > 0) {
                console.log(`Sending daily reminder to ${subscribers.length} subscribers`);
                await sendReminder(sock, subscribers);
            }
        } catch (error) {
            console.error('Error in daily reminder scheduler:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta'
    });
};

module.exports = {
    sendReminder,
    sendReminderNow,
    initReminderScheduler
};
