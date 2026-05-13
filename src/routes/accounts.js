'use strict';

const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');

// ── In-memory store (test / demo only) ───────────────────────────────────────
const accounts = new Map([
    ['ACC-001', { id: 'ACC-001', holder: 'Alice Smith',   balance: 5000.00, currency: 'GBP', status: 'active' }],
    ['ACC-002', { id: 'ACC-002', holder: 'Bob Johnson',   balance: 12500.50, currency: 'GBP', status: 'active' }],
    ['ACC-003', { id: 'ACC-003', holder: 'Carol Williams', balance: 250.75, currency: 'GBP', status: 'frozen' }],
]);

// ── GET /api/accounts ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({ accounts: [...accounts.values()], total: accounts.size });
});

// ── GET /api/accounts/:id ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
    const acc = accounts.get(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    res.json(acc);
});

// ── POST /api/accounts ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
    const { holder, currency = 'GBP' } = req.body || {};
    if (!holder) return res.status(400).json({ error: 'holder is required' });
    const id  = `ACC-${uuidv4().slice(0, 6).toUpperCase()}`;
    const acc = { id, holder, balance: 0, currency, status: 'active' };
    accounts.set(id, acc);
    res.status(201).json(acc);
});

// ── DELETE /api/accounts/:id ──────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
    if (!accounts.delete(req.params.id)) return res.status(404).json({ error: 'Account not found' });
    res.status(204).send();
});

module.exports = router;
