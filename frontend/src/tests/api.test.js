import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../utils/api';

describe('apiRequest safe response parsing utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly parses valid 200 OK JSON responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'ok', data: [{ id: 1, title: 'Shift 1' }] })
    });

    const result = await apiRequest('/api/handover', { token: 'mock-token' });
    expect(result.status).toBe('ok');
    expect(result.data).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/handover', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer mock-token'
      })
    }));
  });

  it('safely handles empty 0-byte 403 responses without throwing Unexpected end of JSON input', async () => {
    // Simulates macOS Apple AirTunes on port 5000 returning empty 403 Forbidden
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => ''
    });

    await expect(apiRequest('/api/handover')).rejects.toThrow(
      'Access forbidden. Please verify your role permissions or backend server.'
    );
  });

  it('safely extracts error message from JSON error payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ status: 'error', message: 'Shift date is required.' })
    });

    await expect(apiRequest('/api/handover')).rejects.toThrow('Shift date is required.');
  });

  it('safely handles HTML error responses (500 / 502 / 504) without JSON parse error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      statusText: 'Gateway Timeout',
      text: async () => '<html><body>504 Gateway Timeout</body></html>'
    });

    await expect(apiRequest('/api/handover')).rejects.toThrow(
      'Server error (504). Please check backend service logs.'
    );
  });

  it('safely handles network connection failures', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(apiRequest('/api/handover')).rejects.toThrow(
      'Unable to connect to server (Failed to fetch). Ensure backend is running.'
    );
  });
});
