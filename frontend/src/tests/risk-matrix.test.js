import { describe, it, expect } from 'vitest';

describe('Risk Matrix & Score Calculations (Frontend)', () => {
  const getRiskMeta = (l, s) => {
    const score = l * s;
    if (score >= 17) return { score, level: 'Extreme', color: 'red' };
    if (score >= 10) return { score, level: 'High', color: 'orange' };
    if (score >= 5) return { score, level: 'Medium', color: 'amber' };
    return { score, level: 'Low', color: 'emerald' };
  };

  it('correctly maps 1x1 to Low risk score 1', () => {
    const res = getRiskMeta(1, 1);
    expect(res.score).toBe(1);
    expect(res.level).toBe('Low');
    expect(res.color).toBe('emerald');
  });

  it('correctly maps 3x3 to Medium risk score 9', () => {
    const res = getRiskMeta(3, 3);
    expect(res.score).toBe(9);
    expect(res.level).toBe('Medium');
    expect(res.color).toBe('amber');
  });

  it('correctly maps 3x4 to High risk score 12', () => {
    const res = getRiskMeta(3, 4);
    expect(res.score).toBe(12);
    expect(res.level).toBe('High');
    expect(res.color).toBe('orange');
  });

  it('correctly maps 5x5 to Extreme risk score 25', () => {
    const res = getRiskMeta(5, 5);
    expect(res.score).toBe(25);
    expect(res.level).toBe('Extreme');
    expect(res.color).toBe('red');
  });
});
