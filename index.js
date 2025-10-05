// index.js
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline'); // Untuk input nomor

// Import handler Anda
const messageHandler = require('./lib/messageHandler');
const reminder = require('./lib/reminder');
const sholat = require('./lib/sholat');
const sleep = require('./lib/sleep');

// Pastikan folder auth ada
const authDir = path.join(__dirname, 'auth');
fs.ensureDirSync(authDir);

// Fungsi untuk mendapatkan input dari terminal
function askForPhoneNumber() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Masukkan nomor WhatsApp (contoh: 6281234567890): ', (number) => {
            rl.close();
            // Bersihkan nomor (hapus spasi, tanda +, dll)
            const cleanNumber = number.replace(/\D/g, '');
            resolve(cleanNumber);
        });
    });
}

// Fungsi untuk membuat koneksi WhatsApp dengan pairing code
async function connectToWhatsApp() {
    console.log('Menghubungkan ke WhatsApp...\n');

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    // Ambil nomor telepon
    const phoneNumber = await askForPhoneNumber();
    if (!phoneNumber) {
        console.error('❌ Nomor tidak valid. Keluar.');
        process.exit(1);
    }

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Matikan QR karena pakai pairing code
        auth: state,
        browser: ['WhatsApp Bot', 'Chrome', '10.0.0'],
        syncFullHistory: false,
    });

    // Simpan kredensial saat diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Tangani update koneksi
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;

        if (qr) {
            console.log('⚠️ QR Code terdeteksi — ini seharusnya tidak muncul saat pairing code aktif.');
        }

        if (connection === 'close') {
            let shouldReconnect = true;
            const error = lastDisconnect?.error;

            // Cek apakah error adalah Boom dan bukan logged out
            if (error instanceof Boom) {
                shouldReconnect = error.output?.statusCode !== DisconnectReason.loggedOut;
            }

            console.log(`🔌 Koneksi ditutup karena: ${error?.message || 'unknown'}, reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                await connectToWhatsApp(); // Reconnect
            } else {
                console.log('🚫 Akun logout permanen. Hapus folder "auth" dan jalankan ulang.');
            }
        } else if (connection === 'open') {
            console.log('✅ Terhubung ke WhatsApp! Bot siap digunakan.\n');

            // Inisialisasi scheduler
            reminder.initReminderScheduler(sock);
            sholat.initPrayerScheduler(sock);
            sleep.initSleepScheduler(sock);
        } else if (update.pairingCode) {
            console.log(`\n🔑 Pairing Code Anda: ${update.pairingCode}\n`);
            console.log('📱 Buka WhatsApp di HP Anda > Tiga titik > Perangkat tertaut > Tautkan perangkat > Masukkan kode di atas.\n');
        }
    });

    // Tangani pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message || message.key.fromMe) return;
        await messageHandler.handleMessage(sock, message);
    });

    // Mulai proses pairing
    console.log('\n📲 Mengirim permintaan pairing ke nomor:', phoneNumber);
    await sock.waitForConnectionUpdate((update) => !!update.qr || !!update.pairingCode || update.connection === 'open');

    // Kirim request pairing code
    if (sock.user) {
        console.log('✅ Sudah terhubung sebelumnya.');
    } else {
        await sock.requestPairingCode(phoneNumber);
    }

    return sock;
}

// Jalankan bot
connectToWhatsApp().catch(err => {
    console.error('❌ Error saat menghubungkan ke WhatsApp:', err);
    process.exit(1);
});
