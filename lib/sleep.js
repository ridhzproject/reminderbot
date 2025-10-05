// lib/sleep.js
const db = require('./db');
const cron = require('node-cron');

// Fungsi untuk mengirim pesan tidur
const sendSleepMessage = async (sock) => {
    try {
        const subscribers = await db.getSleepSubs();
        
        if (subscribers.length === 0) {
            return;
        }
        
        // Kata-kata pengingat tidur
        const sleepMessages = [
            "Waktunya istirahat, tidur yang cukup membuatmu lebih segar besok!",
            "Jangan begadang terus, tubuhmu butuh istirahat yang cukup!",
            "Selamat malam, semoga mimpi indah menyertaimu!",
            "Tidurlah sekarang, besok ada banyak hal menantimu!",
            "Istirahat adalah bagian dari produktivitas, selamat tidur!",
            "Matikan lampu dan tidurlah, tubuhmu berterima kasih!",
            "Waktu tidur telah tiba, recharge energi untuk besok!"
        ];
        
        const randomMessage = sleepMessages[Math.floor(Math.random() * sleepMessages.length)];
        
        const message = `*PENGINGAT TIDUR*\n\n${randomMessage}\n\nJangan lupa berdoa sebelum tidur:\n"بِسْمِكَ اللَّهُمَّ أَحْيَا وَبِاسْمِكَ أَمُوت"\n\n(Bismika Allahumma ahya wa bismika amut)\n\nArtinya: "Dengan nama-Mu ya Allah, aku hidup dan dengan nama-Mu aku mati."`;
        
        // Kirim ke semua subscriber
        for (const userId of subscribers) {
            await sock.sendMessage(userId, { text: message });
        }
        
        return true;
    } catch (error) {
        console.error('Error sending sleep message:', error);
        return false;
    }
};

// Inisialisasi scheduler untuk pesan tidur
const initSleepScheduler = (sock) => {
    // Jalankan setiap menit antara jam 21:00-21:35
    cron.schedule('* 21 * * *', async () => {
        try {
            const now = new Date();
            const minutes = now.getMinutes();
            
            // Random waktu antara 21:00-21:35
            if (minutes <= 35) {
                // 20% chance untuk mengirim pesan setiap menit
                if (Math.random() < 0.2) {
                    console.log('Sending sleep message');
                    await sendSleepMessage(sock);
                }
            }
        } catch (error) {
            console.error('Error in sleep scheduler:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta'
    });
};

module.exports = {
    sendSleepMessage,
    initSleepScheduler
};
