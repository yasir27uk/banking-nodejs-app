'use strict';

const express    = require('express');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const healthRouter   = require('./src/routes/health');
const accountsRouter = require('./src/routes/accounts');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/accounts', accountsRouter);

app.get('/', (req, res) => res.json({ service: 'banking-nodejs-api', version: process.env.APP_VERSION || '1.0.0', status: 'ok' }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error(err.message);
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => console.log(`Banking API listening on port ${PORT}`));
}

module.exports = app;
