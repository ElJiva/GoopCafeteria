
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../database/goop.db'));

const columns = db.pragma('table_info(orders)');
console.log('Columns in orders table:');
columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
