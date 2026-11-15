const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('API Route Protection & Authentication Guards', () => {
  it('GET /api/health should be public and return status 200', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  it('GET /api/dashboard/summary should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/handover should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/handover');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/smp/hazards should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/smp/hazards');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/admin/users should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/reports/handovers/pdf should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/reports/handovers/pdf');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/erp/status without x-api-key should return 401', async () => {
    const res = await request(app).get('/api/erp/status');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.status, 'error');
  });

  it('GET /api/erp/status with valid x-api-key should return 200 and system details', async () => {
    const res = await request(app)
      .get('/api/erp/status')
      .set('x-api-key', 'coalsafe-erp-secret-2024');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.system, 'CoalSafe Colliery Management System');
  });

  it('GET /api/unknown-endpoint should return 404', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.status, 'error');
  });
});
