import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'database.json');

let db = {
  reminders: [],
  subscribersReminder: [],
  subscribersPrayer: [],
  subscribersSleep: [],
  prayerSettings: {
    kotaId: process.env.KOTA_ID || '1632',
    kotaName: 'KOTA KEDIRI'
  },
  reminderSettings: {
    time: '18:45'
  }
};

export function initDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = { ...db, ...JSON.parse(data) };
      console.log('✓ Database loaded');
    } else {
      saveDB();
      console.log('✓ Database created');
    }
  } catch (err) {
    console.error('Database init error:', err);
  }
}

export function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Database save error:', err);
  }
}

export function getDB() {
  return db;
}

// Reminder functions
export function addReminder(text) {
  db.reminders.push({
    id: Date.now(),
    text,
    createdAt: new Date().toISOString()
  });
  saveDB();
  return true;
}

export function getReminders() {
  return db.reminders;
}

export function deleteReminder(index) {
  if (index > 0 && index <= db.reminders.length) {
    db.reminders.splice(index - 1, 1);
    saveDB();
    return true;
  }
  return false;
}

// Subscriber Reminder functions
export function addSubscriberReminder(number) {
  if (!db.subscribersReminder.includes(number)) {
    db.subscribersReminder.push(number);
    saveDB();
    return true;
  }
  return false;
}

export function getSubscribersReminder() {
  return db.subscribersReminder;
}

export function deleteSubscriberReminder(number) {
  const index = db.subscribersReminder.indexOf(number);
  if (index > -1) {
    db.subscribersReminder.splice(index, 1);
    saveDB();
    return true;
  }
  return false;
}

export function setReminderTime(time) {
  db.reminderSettings.time = time;
  saveDB();
}

export function getReminderTime() {
  return db.reminderSettings.time;
}

// Subscriber Prayer functions
export function addSubscriberPrayer(number) {
  if (!db.subscribersPrayer.includes(number)) {
    db.subscribersPrayer.push(number);
    saveDB();
    return true;
  }
  return false;
}

export function getSubscribersPrayer() {
  return db.subscribersPrayer;
}

export function deleteSubscriberPrayer(number) {
  const index = db.subscribersPrayer.indexOf(number);
  if (index > -1) {
    db.subscribersPrayer.splice(index, 1);
    saveDB();
    return true;
  }
  return false;
}

export function setPrayerKota(kotaId, kotaName) {
  db.prayerSettings.kotaId = kotaId;
  db.prayerSettings.kotaName = kotaName;
  saveDB();
}

export function getPrayerSettings() {
  return db.prayerSettings;
}

// Subscriber Sleep functions
export function addSubscriberSleep(number) {
  if (!db.subscribersSleep.includes(number)) {
    db.subscribersSleep.push(number);
    saveDB();
    return true;
  }
  return false;
}

export function getSubscribersSleep() {
  return db.subscribersSleep;
}

export function deleteSubscriberSleep(number) {
  const index = db.subscribersSleep.indexOf(number);
  if (index > -1) {
    db.subscribersSleep.splice(index, 1);
    saveDB();
    return true;
  }
  return false;
}
