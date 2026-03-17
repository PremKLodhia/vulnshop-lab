const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, '../../data/vulnshop_secure.db');

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Database deleted.');
}

// Re-init and seed
require('./database').initDb();
require('./seed');
