// lib/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

// Pastikan folder database ada
const dbDir = path.join(__dirname, '..', 'database');
fs.ensureDirSync(dbDir);

const dbPath = path.join(dbDir, 'bot.db');
const db = new sqlite3.Database(dbPath);

// Inisialisasi tabel
db.serialize(() => {
    // Tabel untuk reminders
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        reminder TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel untuk reminder subscribers
    db.run(`CREATE TABLE IF NOT EXISTS reminder_subs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        UNIQUE(userId)
    )`);

    // Tabel untuk pengaturan reminder
    db.run(`CREATE TABLE IF NOT EXISTS reminder_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        time TEXT NOT NULL DEFAULT '18:45',
        timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta'
    )`);

    // Tabel untuk sholat subscribers
    db.run(`CREATE TABLE IF NOT EXISTS sholat_subs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        UNIQUE(userId)
    )`);

    // Tabel untuk pengaturan sholat
    db.run(`CREATE TABLE IF NOT EXISTS sholat_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        cityId TEXT NOT NULL DEFAULT '1632',
        autoReminder INTEGER DEFAULT 0
    )`);

    // Tabel untuk sleep subscribers
    db.run(`CREATE TABLE IF NOT EXISTS sleep_subs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        UNIQUE(userId)
    )`);

    // Inisialisasi pengaturan default jika belum ada
    db.run(`INSERT OR IGNORE INTO reminder_settings (id, time, timezone) VALUES (1, '18:45', 'Asia/Jakarta')`);
    db.run(`INSERT OR IGNORE INTO sholat_settings (id, cityId, autoReminder) VALUES (1, '1632', 0)`);
});

module.exports = {
    // Reminder functions
    addReminder: (userId, reminder) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO reminders (userId, reminder) VALUES (?, ?)',
                [userId, reminder],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    getReminders: (userId) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM reminders WHERE userId = ? ORDER BY createdAt',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },

    deleteReminder: (id, userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM reminders WHERE id = ? AND userId = ?',
                [id, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    // Reminder subscribers functions
    addReminderSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO reminder_subs (userId) VALUES (?)',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    getReminderSubs: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT userId FROM reminder_subs', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.userId));
            });
        });
    },

    deleteReminderSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM reminder_subs WHERE userId = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    // Reminder settings functions
    getReminderSettings: () => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM reminder_settings WHERE id = 1',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    updateReminderTime: (time) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE reminder_settings SET time = ? WHERE id = 1',
                [time],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    // Sholat functions
    addSholatSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO sholat_subs (userId) VALUES (?)',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    getSholatSubs: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT userId FROM sholat_subs', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.userId));
            });
        });
    },

    deleteSholatSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM sholat_subs WHERE userId = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    // Sholat settings functions
    getSholatSettings: () => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM sholat_settings WHERE id = 1',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    updateSholatCity: (cityId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE sholat_settings SET cityId = ? WHERE id = 1',
                [cityId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    updateSholatAutoReminder: (value) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE sholat_settings SET autoReminder = ? WHERE id = 1',
                [value],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    },

    // Sleep functions
    addSleepSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO sleep_subs (userId) VALUES (?)',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    getSleepSubs: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT userId FROM sleep_subs', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.userId));
            });
        });
    },

    deleteSleepSub: (userId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM sleep_subs WHERE userId = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }
};
