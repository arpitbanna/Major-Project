const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

describe('Mines Catalog API (/api/mines)', () => {
  it('GET /api/mines/stats should return 200 with stats schema', async () => {
    const res = await request(app).get('/api/mines/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(typeof res.body.stats === 'object');
  });

  it('GET /api/mines should return 200 with list and pagination info', async () => {
    const res = await request(app).get('/api/mines?limit=10');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/mines/:mine_id with non-existent ID should return 404', async () => {
    const res = await request(app).get('/api/mines/NON_EXISTENT_MINE_9999');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.status, 'error');
  });
});
