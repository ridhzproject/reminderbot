// lib/messageHandler.js
const db = require('./db');
const jadwal = require('./jadwal');
const reminder = require('./reminder');
const sholat = require('./sholat');
const sleep = require('./sleep');
const fs = require('fs');
const path = require('path');

// Fungsi untuk menangani pesan
const handleMessage = async (sock, message) => {
    try {
        const prefix = process.env.PREFIX.split(',');
        const body = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        
        // Cek apakah pesan dimulai dengan prefix
        let isCommand = false;
        let command = '';
        let args = [];
        
        for (const p of prefix) {
            if (body.startsWith(p)) {
                isCommand = true;
                const text = body.slice(p.length).trim();
                const parts = text.split(' ');
                command = parts[0].toLowerCase();
                args = parts.slice(1);
                break;
            }
        }
        
        if (!isCommand) return;
        
        const sender = message.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderId = isGroup ? message.key.participant : sender;
        
        // React dengan jam pasir
        await sock.sendMessage(sender, { react: { text: '⏳', key: message.key } });
        
        // Delay 500ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Handle command
        switch (command) {
            case 'menu':
                await handleMenu(sock, sender, message.key);
                break;
                
            case 'jadwal':
                await handleJadwal(sock, sender, args, message.key);
                break;
                
            case 'jadwalfull':
                await handleJadwalFull(sock, sender, message.key);
                break;
                
            case 'addre':
                await handleAddReminder(sock, sender, args, senderId, message.key);
                break;
                
            case 'listre':
                await handleListReminder(sock, sender, senderId, message.key);
                break;
                
            case 'delre':
                await handleDeleteReminder(sock, sender, args, senderId, message.key);
                break;
                
            case 'addsubsre':
                await handleAddReminderSub(sock, sender, senderId, message.key);
                break;
                
            case 'listsubsre':
                await handleListReminderSub(sock, sender, message.key);
                break;
                
            case 'delsubsre':
                await handleDeleteReminderSub(sock, sender, senderId, message.key);
                break;
                
            case 'setsubsre':
                await handleSetReminderTime(sock, sender, args, message.key);
                break;
                
            case 'remindernow':
                await handleReminderNow(sock, sender, senderId, message.key);
                break;
                
            case 'jadwalsholat':
                await handleJadwalSholat(sock, sender, args, message.key);
                break;
                
            case 'setautosholat':
                await handleSetAutoSholat(sock, sender, args, message.key);
                break;
                
            case 'setkotasholat':
                await handleSetKotaSholat(sock, sender, args, message.key);
                break;
                
            case 'addsubsholat':
                await handleAddSholatSub(sock, sender, senderId, message.key);
                break;
                
            case 'delsubsholat':
                await handleDeleteSholatSub(sock, sender, senderId, message.key);
                break;
                
            case 'addsubsleep':
                await handleAddSleepSub(sock, sender, senderId, message.key);
                break;
                
            case 'listsubsleep':
                await handleListSleepSub(sock, sender, message.key);
                break;
                
            case 'delsubsleep':
                await handleDeleteSleepSub(sock, sender, senderId, message.key);
                break;
                
            default:
                await sock.sendMessage(sender, { 
                    text: 'Command tidak dikenali. Ketik *menu* untuk melihat daftar command.',
                    reacts: { text: '❌', key: message.key }
                });
                return;
        }
        
        // React dengan centang hijau
        await sock.sendMessage(sender, { react: { text: '✅', key: message.key } });
    } catch (error) {
        console.error('Error handling message:', error);
        await sock.sendMessage(message.key.remoteJid, { 
            text: 'Terjadi kesalahan saat memproses command.',
            reacts: { text: '❌', key: message.key }
        });
    }
};

// Fungsi untuk handle menu
const handleMenu = async (sock, sender, messageKey) => {
    const menuText = `*MENU BOT WHATSAPP*\n\n` +
        `*JADWAL SEKOLAH*\n` +
        `• jadwal - Lihat jadwal hari ini\n` +
        `• jadwal [hari] - Lihat jadwal hari tertentu\n` +
        `• jadwalfull - Lihat jadwal lengkap (gambar)\n\n` +
        `*REMINDER TUGAS*\n` +
        `• addre [tugas] - Tambah reminder tugas\n` +
        `• listre - Lihat daftar reminder\n` +
        `• delre [id] - Hapus reminder\n\n` +
        `*SUBSCRIPTION REMINDER*\n` +
        `• addsubsre - Berlangganan reminder harian\n` +
        `• listsubsre - Lihat daftar subscriber\n` +
        `• delsubsre - Berhenti berlangganan\n` +
        `• setsubsre [jam:menit] - Atur waktu reminder\n` +
        `• remindernow - Kirim reminder sekarang\n\n` +
        `*JADWAL SHOLAT*\n` +
        `• jadwalsholat [kota] - Lihat jadwal sholat\n` +
        `• setautosholat [on/off] - Aktifkan auto reminder sholat\n` +
        `• setkotasholat [id kota] - Atur kota untuk jadwal sholat\n` +
        `• addsubsholat - Berlangganan reminder sholat\n` +
        `• delsubsholat - Berhenti berlangganan reminder sholat\n\n` +
        `*PENGINGAT TIDUR*\n` +
        `• addsubsleep - Berlangganan pengingat tidur\n` +
        `• listsubsleep - Lihat daftar subscriber\n` +
        `• delsubsleep - Berhenti berlangganan\n\n` +
        `Prefix: ${process.env.PREFIX}`;
    
    await sock.sendMessage(sender, { text: menuText });
};

// Fungsi untuk handle jadwal
const handleJadwal = async (sock, sender, args, messageKey) => {
    let jadwalHari;
    let hari;
    
    if (args.length > 0) {
        hari = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
        jadwalHari = jadwal.getJadwalByHari(hari);
    } else {
        jadwalHari = jadwal.getJadwalHariIni();
        hari = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    }
    
    const jadwalText = jadwal.formatJadwal(jadwalHari, hari);
    await sock.sendMessage(sender, { text: jadwalText });
};

// Fungsi untuk handle jadwal full
const handleJadwalFull = async (sock, sender, messageKey) => {
    const imagePath = jadwal.getJadwalImage();
    
    if (imagePath) {
        await sock.sendMessage(sender, { 
            image: { url: imagePath },
            caption: 'Jadwal Lengkap'
        });
    } else {
        await sock.sendMessage(sender, { text: 'Gambar jadwal tidak tersedia.' });
    }
};

// Fungsi untuk handle add reminder
const handleAddReminder = async (sock, sender, args, senderId, messageKey) => {
    if (args.length === 0) {
        await sock.sendMessage(sender, { text: 'Format: addre [tugas]' });
        return;
    }
    
    const reminderText = args.join(' ');
    try {
        const id = await db.addReminder(senderId, reminderText);
        await sock.sendMessage(sender, { text: `Reminder berhasil ditambahkan dengan ID: ${id}` });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal menambahkan reminder.' });
    }
};

// Fungsi untuk handle list reminder
const handleListReminder = async (sock, sender, senderId, messageKey) => {
    try {
        const reminders = await db.getReminders(senderId);
        
        if (reminders.length === 0) {
            await sock.sendMessage(sender, { text: 'Tidak ada reminder.' });
            return;
        }
        
        let text = '*DAFTAR REMINDER*\n\n';
        reminders.forEach((item, index) => {
            text += `${index + 1}. ID: ${item.id}\n`;
            text += `   Tugas: ${item.reminder}\n`;
            text += `   Dibuat: ${item.createdAt}\n\n`;
        });
        
        await sock.sendMessage(sender, { text });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengambil daftar reminder.' });
    }
};

// Fungsi untuk handle delete reminder
const handleDeleteReminder = async (sock, sender, args, senderId, messageKey) => {
    if (args.length === 0) {
        await sock.sendMessage(sender, { text: 'Format: delre [id reminder]' });
        return;
    }
    
    const id = parseInt(args[0]);
    if (isNaN(id)) {
        await sock.sendMessage(sender, { text: 'ID harus berupa angka.' });
        return;
    }
    
    try {
        const changes = await db.deleteReminder(id, senderId);
        if (changes > 0) {
            await sock.sendMessage(sender, { text: 'Reminder berhasil dihapus.' });
        } else {
            await sock.sendMessage(sender, { text: 'Reminder tidak ditemukan atau bukan milik Anda.' });
        }
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal menghapus reminder.' });
    }
};

// Fungsi untuk handle add reminder subscription
const handleAddReminderSub = async (sock, sender, senderId, messageKey) => {
    try {
        await db.addReminderSub(senderId);
        await sock.sendMessage(sender, { text: 'Anda berhasil berlangganan reminder harian.' });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berlangganan reminder.' });
    }
};

// Fungsi untuk handle list reminder subscription
const handleListReminderSub = async (sock, sender, messageKey) => {
    try {
        const subscribers = await db.getReminderSubs();
        
        if (subscribers.length === 0) {
            await sock.sendMessage(sender, { text: 'Tidak ada subscriber reminder.' });
            return;
        }
        
        let text = '*DAFTAR SUBSCRIBER REMINDER*\n\n';
        subscribers.forEach((item, index) => {
            text += `${index + 1}. ${item}\n`;
        });
        
        await sock.sendMessage(sender, { text });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengambil daftar subscriber.' });
    }
};

// Fungsi untuk handle delete reminder subscription
const handleDeleteReminderSub = async (sock, sender, senderId, messageKey) => {
    try {
        const changes = await db.deleteReminderSub(senderId);
        if (changes > 0) {
            await sock.sendMessage(sender, { text: 'Anda berhasil berhenti berlangganan reminder harian.' });
        } else {
            await sock.sendMessage(sender, { text: 'Anda tidak berlangganan reminder harian.' });
        }
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berhenti berlangganan reminder.' });
    }
};

// Fungsi untuk handle set reminder time
const handleSetReminderTime = async (sock, sender, args, messageKey) => {
    if (args.length === 0) {
        await sock.sendMessage(sender, { text: 'Format: setsubsre [jam:menit]' });
        return;
    }
    
    const time = args[0];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(time)) {
        await sock.sendMessage(sender, { text: 'Format waktu tidak valid. Gunakan format HH:MM (contoh: 18:45).' });
        return;
    }
    
    try {
        await db.updateReminderTime(time);
        await sock.sendMessage(sender, { text: `Waktu reminder berhasil diatur ke ${time}.` });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengatur waktu reminder.' });
    }
};

// Fungsi untuk handle reminder now
const handleReminderNow = async (sock, sender, senderId, messageKey) => {
    try {
        await reminder.sendReminderNow(sock, senderId);
        await sock.sendMessage(sender, { text: 'Reminder berhasil dikirim.' });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengirim reminder.' });
    }
};

// Fungsi untuk handle jadwal sholat
const handleJadwalSholat = async (sock, sender, args, messageKey) => {
    try {
        let cityId;
        let cityName = '';
        
        if (args.length > 0) {
            // Cari kota
            const searchResult = await sholat.searchCity(args.join(' '));
            if (searchResult.status && searchResult.data.length > 0) {
                cityId = searchResult.data[0].id;
                cityName = searchResult.data[0].lokasi;
            } else {
                await sock.sendMessage(sender, { text: 'Kota tidak ditemukan.' });
                return;
            }
        } else {
            // Gunakan kota default dari settings
            const settings = await db.getSholatSettings();
            cityId = settings.cityId;
        }
        
        // Ambil tanggal hari ini
        const today = new Date().toISOString().split('T')[0];
        
        // Dapatkan jadwal sholat
        const scheduleData = await sholat.getPrayerSchedule(cityId, today);
        const scheduleText = sholat.formatPrayerSchedule(scheduleData);
        
        await sock.sendMessage(sender, { text: scheduleText });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mendapatkan jadwal sholat.' });
    }
};

// Fungsi untuk handle set auto sholat
const handleSetAutoSholat = async (sock, sender, args, messageKey) => {
    if (args.length === 0) {
        await sock.sendMessage(sender, { text: 'Format: setautosholat [on/off]' });
        return;
    }
    
    const status = args[0].toLowerCase();
    if (status !== 'on' && status !== 'off') {
        await sock.sendMessage(sender, { text: 'Status tidak valid. Gunakan "on" atau "off".' });
        return;
    }
    
    try {
        const value = status === 'on' ? 1 : 0;
        await db.updateSholatAutoReminder(value);
        await sock.sendMessage(sender, { text: `Auto reminder sholat berhasil diatur ke ${status}.` });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengatur auto reminder sholat.' });
    }
};

// Fungsi untuk handle set kota sholat
const handleSetKotaSholat = async (sock, sender, args, messageKey) => {
    if (args.length === 0) {
        await sock.sendMessage(sender, { text: 'Format: setkotasholat [id kota]' });
        return;
    }
    
    const cityId = args[0];
    
    try {
        await db.updateSholatCity(cityId);
        await sock.sendMessage(sender, { text: `Kota untuk jadwal sholat berhasil diatur ke ID: ${cityId}.` });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengatur kota untuk jadwal sholat.' });
    }
};

// Fungsi untuk handle add sholat subscription
const handleAddSholatSub = async (sock, sender, senderId, messageKey) => {
    try {
        await db.addSholatSub(senderId);
        await sock.sendMessage(sender, { text: 'Anda berhasil berlangganan reminder sholat.' });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berlangganan reminder sholat.' });
    }
};

// Fungsi untuk handle delete sholat subscription
const handleDeleteSholatSub = async (sock, sender, senderId, messageKey) => {
    try {
        const changes = await db.deleteSholatSub(senderId);
        if (changes > 0) {
            await sock.sendMessage(sender, { text: 'Anda berhasil berhenti berlangganan reminder sholat.' });
        } else {
            await sock.sendMessage(sender, { text: 'Anda tidak berlangganan reminder sholat.' });
        }
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berhenti berlangganan reminder sholat.' });
    }
};

// Fungsi untuk handle add sleep subscription
const handleAddSleepSub = async (sock, sender, senderId, messageKey) => {
    try {
        await db.addSleepSub(senderId);
        await sock.sendMessage(sender, { text: 'Anda berhasil berlangganan pengingat tidur.' });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berlangganan pengingat tidur.' });
    }
};

// Fungsi untuk handle list sleep subscription
const handleListSleepSub = async (sock, sender, messageKey) => {
    try {
        const subscribers = await db.getSleepSubs();
        
        if (subscribers.length === 0) {
            await sock.sendMessage(sender, { text: 'Tidak ada subscriber pengingat tidur.' });
            return;
        }
        
        let text = '*DAFTAR SUBSCRIBER PENGINGAT TIDUR*\n\n';
        subscribers.forEach((item, index) => {
            text += `${index + 1}. ${item}\n`;
        });
        
        await sock.sendMessage(sender, { text });
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal mengambil daftar subscriber.' });
    }
};

// Fungsi untuk handle delete sleep subscription
const handleDeleteSleepSub = async (sock, sender, senderId, messageKey) => {
    try {
        const changes = await db.deleteSleepSub(senderId);
        if (changes > 0) {
            await sock.sendMessage(sender, { text: 'Anda berhasil berhenti berlangganan pengingat tidur.' });
        } else {
            await sock.sendMessage(sender, { text: 'Anda tidak berlangganan pengingat tidur.' });
        }
    } catch (error) {
        await sock.sendMessage(sender, { text: 'Gagal berhenti berlangganan pengingat tidur.' });
    }
};

module.exports = {
    handleMessage
};
