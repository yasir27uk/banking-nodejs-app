'use strict';

const request = require('supertest');
const app     = require('../../app');

describe('GET /health', () => {
    it('returns 200 with status=healthy', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body.service).toBe('banking-nodejs-api');
    });

    it('includes uptime and timestamp', async () => {
        const res = await request(app).get('/health');
        expect(typeof res.body.uptime).toBe('number');
        expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
});

describe('GET /', () => {
    it('returns 200 with service info', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('banking-nodejs-api');
        expect(res.body.status).toBe('ok');
    });
});

describe('GET /nonexistent', () => {
    it('returns 404', async () => {
        const res = await request(app).get('/nonexistent');
        expect(res.status).toBe(404);
    });
});
