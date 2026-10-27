const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_TOKEN || process.env.JWT_SECRET || 'staffsync_secret_jwt_key_2026';

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Workspace Admin' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  joined: { type: String, default: () => new Date().toISOString().slice(0, 10) }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

// REST API endpoints
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  app: 'StaffSync API',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const userRole = role || 'Employee';
  const userDept = department || 'Engineering';

  if (mongoose.connection.readyState !== 1) {
    const token = jwt.sign({ id: 'demo-user', email, name, role: userRole, department: userDept }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: { id: 'demo-user', name, email, role: userRole, department: userDept } });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole
    });

    // Also add to Employee directory if not already there
    const empExisting = await Employee.findOne({ email: email.toLowerCase() });
    if (!empExisting) {
      await Employee.create({
        name,
        email: email.toLowerCase(),
        department: userDept,
        role: userRole,
        status: 'Active'
      });
    }

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role, department: userDept }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: userDept }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});

// Demo employees directory for easy login
const DEMO_STAFF = {
  'aarav@staffsync.demo': { name: 'Aarav Sharma', role: 'Frontend Developer', department: 'Engineering' },
  'ananya@staffsync.demo': { name: 'Ananya Patel', role: 'HR Executive', department: 'Human Resources' },
  'rohan@staffsync.demo': { name: 'Rohan Mehta', role: 'UI/UX Designer', department: 'Design' },
  'priya@staffsync.demo': { name: 'Priya Singh', role: 'Marketing Lead', department: 'Marketing' },
  'kabir@staffsync.demo': { name: 'Kabir Verma', role: 'Backend Developer', department: 'Engineering' },
  'isha@staffsync.demo': { name: 'Isha Gupta', role: 'Accountant', department: 'Finance' }
};

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (mongoose.connection.readyState === 1) {
    try {
      let user = await User.findOne({ email: cleanEmail });

      // 1. Auto-provision demo admin if first time logging in
      if (!user && (cleanEmail === 'admin@staffsync.demo' || cleanEmail === 'simesti.rai@staffsync.demo')) {
        const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
        user = await User.create({
          name: cleanEmail.includes('simesti') ? 'Simesti Rai' : 'Workspace Admin',
          email: cleanEmail,
          password: hashedPassword,
          role: 'Workspace Admin'
        });
      }

      // 2. Check if this is a known staff member / employee from the Employee database
      if (!user) {
        let emp = await Employee.findOne({ email: cleanEmail });
        // Or if matching known demo staff
        if (!emp && DEMO_STAFF[cleanEmail]) {
          const staffInfo = DEMO_STAFF[cleanEmail];
          emp = await Employee.create({
            name: staffInfo.name,
            email: cleanEmail,
            department: staffInfo.department,
            role: staffInfo.role,
            status: 'Active'
          });
        }

        // If employee exists, provision their login account
        if (emp) {
          const hashedPassword = await bcrypt.hash(password || 'staff123', 10);
          user = await User.create({
            name: emp.name,
            email: cleanEmail,
            password: hashedPassword,
            role: emp.role || 'Employee'
          });
        }
      }

      if (!user) {
        return res.status(401).json({ message: 'No account found with this email. Please check the email or register.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please try again.' });
      }

      const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      return res.status(500).json({ message: 'Login error: ' + err.message });
    }
  }

  // Fallback demo mode (offline / mock)
  const staff = DEMO_STAFF[cleanEmail];
  const displayName = cleanEmail.includes('simesti') ? 'Simesti Rai' : staff ? staff.name : 'Team Member';
  const displayRole = cleanEmail.includes('simesti') ? 'Workspace Admin' : staff ? staff.role : 'Staff Member';

  if (password.length >= 4) {
    const token = jwt.sign({ id: 'demo-' + cleanEmail, email: cleanEmail, name: displayName, role: displayRole }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: { id: 'demo-' + cleanEmail, name: displayName, email: cleanEmail, role: displayRole }
    });
  }
  return res.status(401).json({ message: 'Password must be at least 4 characters.' });
});

// Auth: Me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authentication token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
});

// Employees Endpoints
app.get('/api/employees', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected. Set MONGODB_URI.' });
  try {
    res.json(await Employee.find().sort({ createdAt: -1 }));
  } catch (e) {
    res.status(500).json({ message: 'Could not fetch employees.' });
  }
});

app.post('/api/employees', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected. Set MONGODB_URI.' });
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({
      message: e.code === 11000 ? 'An employee with this email already exists.' : e.message
    });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected.' });
  try {
    const removed = await Employee.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ message: 'Employee deleted.' });
  } catch {
    res.status(400).json({ message: 'Invalid employee ID.' });
  }
});

// Merged Static Frontend Serving
const candidateDistPaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist')
];

const clientDistPath = candidateDistPaths.find(p => fs.existsSync(p));

if (clientDistPath) {
  console.log(`Serving static client files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('MongoDB connected');
    } catch (e) {
      console.error('MongoDB connection failed:', e.message);
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`StaffSync running on http://localhost:${PORT}`));
}

start();
