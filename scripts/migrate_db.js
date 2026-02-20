
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../database/goop.db'));

try {
    console.log('Migrating database...');
    db.prepare("ALTER TABLE orders ADD COLUMN user_id TEXT").run();
    console.log('Migration successful: Added user_id column to orders table.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column user_id already exists.');
    } else {
        console.error('Migration failed:', err.message);
    }
}
