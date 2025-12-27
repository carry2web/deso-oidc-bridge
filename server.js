// Top-level error handlers for diagnostics
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import oidcRoutes from './routes/oidc.js';
import adminRoutes from './routes/admin.js';
console.log('=== [Startup] server.js loaded ===');
// import { handleNewUserWebhook } from './lib/handleNewUserWebhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
console.log('process.env.PORT:', process.env.PORT);
const PORT = process.env.PORT || 3000;

// Serve package.json for version info (read-only, safe for public)
app.get('/package.json', (req, res) => {
  const pkgPath = join(__dirname, 'package.json');
  fs.readFile(pkgPath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(join(__dirname, 'public')));

// Debug endpoint
app.get('/api/debug-status', (req, res) => {
  res.json({ debug: process.env.DEBUG === 'true' });
});

// Routes

app.use('/auth', authRoutes);
app.use('/', oidcRoutes);
app.use('/admin', adminRoutes);

// Webhook endpoint for new user creation notifications (disabled for now)
// app.post('/webhook/handleNewUser', express.json(), handleNewUserWebhook);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// Start webhook subscription/renewal logic (temporarily disabled for debug)
// import './lib/graphWebhookSubscription.js';

app.listen(PORT, () => {
  console.log(`🚀 DeSo OIDC Bridge running on http://localhost:${PORT}`);
});
