const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculateRisk } = require('../src/routes/smp');

describe('Safety Management Plan (SMP) - calculateRisk()', () => {
  it('should calculate Low risk for 1x1', () => {
    const res = calculateRisk(1, 1);
    assert.strictEqual(res.score, 1);
    assert.strictEqual(res.level, 'Low');
  });

  it('should calculate Low risk at boundary (2x2 = 4)', () => {
    const res = calculateRisk(2, 2);
    assert.strictEqual(res.score, 4);
    assert.strictEqual(res.level, 'Low');
  });

  it('should calculate Medium risk starting at score 5 (1x5, 5x1)', () => {
    const res = calculateRisk(1, 5);
    assert.strictEqual(res.score, 5);
    assert.strictEqual(res.level, 'Medium');
  });

  it('should calculate Medium risk for 3x3 = 9', () => {
    const res = calculateRisk(3, 3);
    assert.strictEqual(res.score, 9);
    assert.strictEqual(res.level, 'Medium');
  });

  it('should calculate High risk starting at score 10 (2x5 = 10)', () => {
    const res = calculateRisk(2, 5);
    assert.strictEqual(res.score, 10);
    assert.strictEqual(res.level, 'High');
  });

  it('should calculate High risk for 4x4 = 16', () => {
    const res = calculateRisk(4, 4);
    assert.strictEqual(res.score, 16);
    assert.strictEqual(res.level, 'High');
  });

  it('should calculate Extreme risk for score >= 17 (4x5 = 20, 5x5 = 25)', () => {
    const res20 = calculateRisk(4, 5);
    assert.strictEqual(res20.score, 20);
    assert.strictEqual(res20.level, 'Extreme');

    const res25 = calculateRisk(5, 5);
    assert.strictEqual(res25.score, 25);
    assert.strictEqual(res25.level, 'Extreme');
  });

  it('should clamp out-of-range likelihood and severity values to 1..5', () => {
    const under = calculateRisk(0, -2);
    assert.strictEqual(under.likelihood, 1);
    assert.strictEqual(under.severity, 1);
    assert.strictEqual(under.score, 1);
    assert.strictEqual(under.level, 'Low');

    const over = calculateRisk(10, 8);
    assert.strictEqual(over.likelihood, 5);
    assert.strictEqual(over.severity, 5);
    assert.strictEqual(over.score, 25);
    assert.strictEqual(over.level, 'Extreme');
  });
});
