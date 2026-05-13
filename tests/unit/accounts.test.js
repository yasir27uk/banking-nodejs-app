'use strict';

const request = require('supertest');
const app     = require('../../app');

describe('GET /api/accounts', () => {
    it('returns list of accounts', async () => {
        const res = await request(app).get('/api/accounts');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.accounts)).toBe(true);
        expect(res.body.total).toBeGreaterThan(0);
    });
});

describe('GET /api/accounts/:id', () => {
    it('returns account by id', async () => {
        const res = await request(app).get('/api/accounts/ACC-001');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe('ACC-001');
        expect(res.body.holder).toBeTruthy();
    });

    it('returns 404 for unknown id', async () => {
        const res = await request(app).get('/api/accounts/UNKNOWN');
        expect(res.status).toBe(404);
    });
});

describe('POST /api/accounts', () => {
    it('creates a new account', async () => {
        const res = await request(app)
            .post('/api/accounts')
            .send({ holder: 'Test User', currency: 'GBP' });
        expect(res.status).toBe(201);
        expect(res.body.holder).toBe('Test User');
        expect(res.body.balance).toBe(0);
        expect(res.body.status).toBe('active');
    });

    it('returns 400 when holder is missing', async () => {
        const res = await request(app).post('/api/accounts').send({});
        expect(res.status).toBe(400);
    });
});
