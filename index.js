// index.js
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const messageHandler = require('./lib/messageHandler');
const reminder = require('./lib/reminder');
const sholat = require('./lib/sholat');
const sleep = require('./lib/sleep');

// Pastikan folder auth ada
const authDir = path.join(__dirname, 'auth');
fs.ensureDirSync(authDir);

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
        } else if (connection === 'open') {
            console.log('Koneksi terbuka!');
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
    
    // Event handler untuk koneksi update (diperbaiki)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (connection === 'connecting') {
            console.log('Menghubungkan...');
        } else if (connection === 'open') {
            console.log('Terhubung ke WhatsApp!');
            
            // Inisialisasi scheduler
            reminder.initReminderScheduler(sock);
            sholat.initPrayerScheduler(sock);
            sleep.initSleepScheduler(sock);
        } else if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi ditutup karena ', lastDisconnect?.error, ', reconnect ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        }
        
        // Jika ada pairing code, tampilkan di console
        if (update.qr) {
            console.log('QR Code tersedia, silakan scan dengan WhatsApp Web');
        }
    });
    
    // Event handler untuk pairing code
    sock.ev.on('auth.update', (auth) => {
        if (auth.code) {
            console.log(`Pairing code: ${auth.code}`);
            console.log('Masukkan pairing code ini di WhatsApp Anda');
        }
    });
    
    return sock;
}

// Jalankan koneksi
connectToWhatsApp().catch(err => {
    console.error('Error saat menghubungkan ke WhatsApp:', err);
});
