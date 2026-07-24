require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const mpesaRoutes = require('./routes/mpesa');
const escrowRoutes = require('./routes/escrow');
const sellerRoutes = require('./routes/seller');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Security & parsing middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(xss());

// General API rate limit (auth routes have their own stricter limit)
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', globalLimiter);

// --- Routes ---
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/seller', sellerRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`NESHMART backend running on port ${PORT}`));
