const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// SQLite Database Setup
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    fullName TEXT,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    text TEXT,
    receiver TEXT DEFAULT 'all',
    fileUrl TEXT,
    fileType TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Ensure role column exists
try {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
} catch (err) {
  // Column already exists or table doesn't exist yet
}

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.id);
    if (user && user.role === 'admin') {
      req.userId = decoded.id;
      next();
    } else {
      res.status(403).json({ message: 'Require Admin Role' });
    }
  });
};

// API Routes
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, fullName, role FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin API Routes
app.get('/api/admin/stats', isAdmin, (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
    res.json({ userCount, messageCount });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/users', isAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, fullName, role FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/messages', isAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/export-messages', isAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC').all();
    
    // Simple encryption logic for the export
    const crypto = require('crypto');
    const algorithm = 'aes-256-ctr';
    const secretKey = crypto.createHash('sha256').update(String(JWT_SECRET)).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);

    const encrypt = (text) => {
      if (!text) return '';
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
      return encrypted.toString('hex');
    };

    const encryptedData = messages.map(m => ({
      ...m,
      text: encrypt(m.text),
      isEncrypted: true
    }));

    res.json({
      data: encryptedData,
      iv: iv.toString('hex'),
      exportedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/admin/messages/:id', isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ fileUrl, fileType: req.file.mimetype });
});

app.post('/api/register', async (req, res) => {
  const { username, email, fullName, password, role = 'user' } = req.body;
  console.log('Registration attempt:', { username, email, fullName, role });
  try {
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      console.log('Registration failed: User exists');
      return res.status(400).json({ message: 'User or Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    db.prepare('INSERT INTO users (id, username, email, fullName, password, role) VALUES (?, ?, ?, ?, ?, ?)').run(id, username, email, fullName, hashedPassword, role);
    
    console.log('Registration successful:', username);
    // Notify all connected clients about the new user
    io.emit('newUser', { id, username, fullName, role });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Socket.io logic
const connectedUsers = new Map(); // username -> socketId

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    socket.username = username;
    connectedUsers.set(username, socket.id);
    
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE receiver = 'all' 
      OR user = ? 
      OR receiver = ? 
      ORDER BY id DESC LIMIT 50
    `).all(username, username);
    
    socket.emit('previousMessages', messages.reverse());
    io.emit('message', { user: 'System', text: `${username} has joined the chat!`, receiver: 'all', timestamp: new Date().toISOString() });
  });

  socket.on('sendMessage', ({ text, receiver = 'all', fileUrl = null, fileType = null }) => {
    const newMessage = {
      user: socket.username,
      text,
      receiver,
      fileUrl,
      fileType,
      timestamp: new Date().toISOString()
    };
    
    db.prepare('INSERT INTO messages (user, text, receiver, fileUrl, fileType, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(newMessage.user, newMessage.text, newMessage.receiver, newMessage.fileUrl, newMessage.fileType, newMessage.timestamp);
    
    if (receiver === 'all') {
      io.emit('message', newMessage);
    } else {
      const targetSocketId = connectedUsers.get(receiver);
      if (targetSocketId) {
        io.to(targetSocketId).emit('message', newMessage);
      }
      socket.emit('message', newMessage);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      connectedUsers.delete(socket.username);
      io.emit('message', { user: 'System', text: `${socket.username} has left the chat.`, receiver: 'all', timestamp: new Date().toISOString() });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
