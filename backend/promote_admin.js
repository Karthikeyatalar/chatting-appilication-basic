const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

const username = process.argv[2];

if (!username) {
  console.log('Please provide a username: node promote_admin.js <username>');
  process.exit(1);
}

try {
  const result = db.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run(username);
  if (result.changes > 0) {
    console.log(`User ${username} promoted to admin successfully.`);
  } else {
    console.log(`User ${username} not found.`);
  }
} catch (err) {
  console.error('Error promoting user:', err);
}
