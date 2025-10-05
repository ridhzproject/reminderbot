// index.js
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline'); // Tambahkan ini
const messageHandler = require('./lib/messageHandler');
const reminder = require('./lib/reminder');
const sholat = require('./lib/sholat');
const sleep = require('./lib/sleep');

// Pastikan folder auth ada
const authDir = path.join(__dirname, 'auth');
fs.ensureDirSync(authDir);

// Buat interface readline untuk input dari terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Fungsi untuk membuat koneksi WhatsApp
async function connectToWhatsApp() {
    console.log('Menghubungkan ke WhatsApp...');
    
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Nonaktifkan QR code
        browser: ['WhatsApp Bot', 'Chrome', '10.0.0'],
    });
    
    // Event handler untuk kredensial diperbarui
    sock.ev.on('creds.update', saveCreds);
    
    // Event handler untuk koneksi update
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi ditutup karena ', lastDisconnect?.error, ', reconnect ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'connecting') {
            console.log('Menghubungkan...');
            
            // Minta nomor telepon untuk pairing code
            rl.question('Masukkan nomor WhatsApp Anda (dengan kode negara, contoh: 628123456789): ', async (number) => {
                const phoneNumber = number.replace(/[^0-9]/g, ''); // Hanya angka
                
                if (phoneNumber.length < 10) {
                    console.log('Nomor telepon tidak valid. Silakan coba lagi.');
                    rl.close();
                    process.exit(1);
                }
                
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log(`\nPairing Code: ${code}`);
                    console.log('Masukkan pairing code ini di WhatsApp Anda:\n1. Buka WhatsApp\n2. Ketuk Menu > Perangkat Tertaut\n3. Ketuk "Tautkan perangkat"\n4. Masukkan kode di atas\n');
                    rl.close(); // Tutup interface readline
                } catch (error) {
                    console.error('Gagal mendapatkan pairing code:', error);
                    rl.close();
                    process.exit(1);
                }
            });
            
        } else if (connection === 'open') {
            console.log('Terhubung ke WhatsApp!');
            
            // Inisialisasi scheduler
            reminder.initReminderScheduler(sock);
            sholat.initPrayerScheduler(sock);
            sleep.initSleepScheduler(sock);
        }
    });
    
    // Event handler untuk pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        
        // Abaikan pesan dari bot sendiri
        if (message.key.fromMe) return;
        
        // Handle pesan
        await messageHandler.handleMessage(sock, message);
    });
    
    return sock;
}

// Jalankan koneksi
connectToWhatsApp().catch(err => {
    console.error('Error saat menghubungkan ke WhatsApp:', err);
    rl.close(); // Pastikan interface ditutup jika ada error
});
