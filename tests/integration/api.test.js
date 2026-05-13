'use strict';

const request = require('supertest');
const app     = require('../../app');

describe('Integration — Banking API', () => {

    describe('Health endpoint', () => {
        it('responds within 500ms', async () => {
            const start = Date.now();
            const res   = await request(app).get('/health');
            const ms    = Date.now() - start;
            expect(res.status).toBe(200);
            expect(ms).toBeLessThan(500);
        });
    });

    describe('Accounts CRUD flow', () => {
        let createdId;

        it('lists accounts', async () => {
            const res = await request(app).get('/api/accounts');
            expect(res.status).toBe(200);
            expect(res.body.total).toBeGreaterThan(0);
        });

        it('creates account', async () => {
            const res = await request(app)
                .post('/api/accounts')
                .send({ holder: 'Integration Test User' });
            expect(res.status).toBe(201);
            createdId = res.body.id;
        });

        it('fetches the created account', async () => {
            if (!createdId) return;
            const res = await request(app).get(`/api/accounts/${createdId}`);
            expect(res.status).toBe(200);
            expect(res.body.holder).toBe('Integration Test User');
        });

        it('deletes the created account', async () => {
            if (!createdId) return;
            const res = await request(app).delete(`/api/accounts/${createdId}`);
            expect(res.status).toBe(204);
        });

        it('confirms deletion', async () => {
            if (!createdId) return;
            const res = await request(app).get(`/api/accounts/${createdId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Security headers', () => {
        it('X-Content-Type-Options is set', async () => {
            const res = await request(app).get('/health');
            expect(res.headers['x-content-type-options']).toBeTruthy();
        });

        it('X-Frame-Options is set', async () => {
            const res = await request(app).get('/health');
            expect(res.headers['x-frame-options']).toBeTruthy();
        });
    });
});
