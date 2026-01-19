require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const { connectDB } = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/dashboard.html'));
});

app.get('/deployments', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/deployments.html'));
});

app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/wallet.html'));
});

app.get('/referrals', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/referrals.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/settings.html'));
});

app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/messages.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/admin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
