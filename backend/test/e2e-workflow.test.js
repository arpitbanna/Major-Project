const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config();

const app = require('../src/app');

describe('Full End-to-End Workflow Verification (Live Database Integration)', () => {
  let supabaseClient;
  const sessions = {};

  before(async () => {
    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });

    // Authenticate all 4 accounts
    const roles = [
      { key: 'admin', email: 'admin@colliery.in' },
      { key: 'manager', email: 'manager@colliery.in' },
      { key: 'incharge', email: 'incharge@colliery.in' },
      { key: 'supervisor', email: 'supervisor@colliery.in' }
    ];

    for (const r of roles) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: r.email,
        password: 'CoalSafe@2026'
      });
      assert.ifError(error);
      assert.ok(data.session?.access_token);
      sessions[r.key] = data.session.access_token;
    }
  });

  it('1. All 4 demo roles authenticate and receive verified profiles from /api/auth/me', async () => {
    for (const [key, token] of Object.entries(sessions)) {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.profile.role);
    }
  });

  it('2. RBAC Guard: Admin can access /api/admin/users, but Supervisor receives 403 Forbidden', async () => {
    // Admin access
    const adminRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${sessions.admin}`);
    assert.strictEqual(adminRes.status, 200);
    assert.ok(Array.isArray(adminRes.body.data));

    // Supervisor denied
    const supRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${sessions.supervisor}`);
    assert.strictEqual(supRes.status, 403);
  });

  it('3. Dashboard summary returns live operational counts from seeded tables', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${sessions.manager}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.todayHandovers >= 0);
    assert.ok(res.body.tablesInitialized === true);
  });

  it('4. Shift Handover Lifecycle: Create Draft -> Submit -> Cross-shift Acknowledge -> Lock', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create Draft by In-charge
    const createRes = await request(app)
      .post('/api/handover')
      .set('Authorization', `Bearer ${sessions.incharge}`)
      .send({
        mine_section: 'Panel B - Test Section',
        shift_date: today,
        shift_type: 'Shift 1 (Morning)',
        production_summary: 'Test production log 500T',
        equipment_status: 'All machinery test OK',
        safety_observations: 'No issues observed',
        pending_work: 'Clean area',
        remarks: 'Test shift handover'
      });
    assert.strictEqual(createRes.status, 201);
    const handoverId = createRes.body.data.id;

    // Submit Draft
    const submitRes = await request(app)
      .post(`/api/handover/${handoverId}/submit`)
      .set('Authorization', `Bearer ${sessions.incharge}`);
    assert.strictEqual(submitRes.status, 200);

    // 4-Eyes Check: Outgoing incharge CANNOT acknowledge own handover
    const selfAckRes = await request(app)
      .post(`/api/handover/${handoverId}/acknowledge`)
      .set('Authorization', `Bearer ${sessions.incharge}`);
    assert.strictEqual(selfAckRes.status, 403);

    // Incoming Manager CAN acknowledge
    const managerAckRes = await request(app)
      .post(`/api/handover/${handoverId}/acknowledge`)
      .set('Authorization', `Bearer ${sessions.manager}`);
    assert.strictEqual(managerAckRes.status, 200);

    // Anti-tamper Check: Acknowledged handover cannot be updated
    const editRes = await request(app)
      .put(`/api/handover/${handoverId}`)
      .set('Authorization', `Bearer ${sessions.incharge}`)
      .send({ production_summary: 'Tampered summary' });
    assert.strictEqual(editRes.status, 400);
  });

  it('5. Hazard & SMP Lifecycle: Report -> Assign Action -> Complete -> Verify -> Close', async () => {
    // Supervisor reports hazard
    const reportRes = await request(app)
      .post('/api/smp/hazards')
      .set('Authorization', `Bearer ${sessions.supervisor}`)
      .send({
        mine_section: 'Tailgate Test Area',
        hazard_category: 'Strata Control',
        title: 'Roof fracture observed during test inspection',
        description: 'Micro-fractures detected along roof line',
        location_details: 'Test Chainage 100m',
        likelihood: 3,
        severity: 4
      });
    assert.strictEqual(reportRes.status, 201);
    assert.strictEqual(reportRes.body.data.risk_score, 12);
    assert.strictEqual(reportRes.body.data.risk_level, 'High');
    const hazardId = reportRes.body.data.id;

    // Manager assigns action
    const actionRes = await request(app)
      .post(`/api/smp/hazards/${hazardId}/actions`)
      .set('Authorization', `Bearer ${sessions.manager}`)
      .send({
        action_description: 'Install additional steel props',
        action_type: 'Engineering Control',
        due_date: new Date().toISOString().split('T')[0]
      });
    assert.strictEqual(actionRes.status, 201);
    const actionId = actionRes.body.data.id;

    // Incharge completes action
    const completeRes = await request(app)
      .patch(`/api/smp/actions/${actionId}`)
      .set('Authorization', `Bearer ${sessions.incharge}`)
      .send({
        status: 'Completed',
        completion_remarks: 'Steel props installed and tested'
      });
    assert.strictEqual(completeRes.status, 200);

    // Manager verifies controls
    const verifyRes = await request(app)
      .post(`/api/smp/hazards/${hazardId}/verify`)
      .set('Authorization', `Bearer ${sessions.manager}`)
      .send({ verification_notes: 'Inspected on-site; props adequate' });
    assert.strictEqual(verifyRes.status, 200);

    // Manager closes hazard
    const closeRes = await request(app)
      .post(`/api/smp/hazards/${hazardId}/close`)
      .set('Authorization', `Bearer ${sessions.manager}`);
    assert.strictEqual(closeRes.status, 200);

    // Closed hazard is locked against re-assessment
    const reAssessRes = await request(app)
      .post(`/api/smp/hazards/${hazardId}/assess`)
      .set('Authorization', `Bearer ${sessions.manager}`)
      .send({ likelihood: 1, severity: 1 });
    assert.strictEqual(reAssessRes.status, 400);
  });
});
