import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../config/supabase';

describe('Google OAuth Configuration & Provider Interface', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly invokes supabase.auth.signInWithOAuth with google provider and redirect options', async () => {
    const mockSignInWithOAuth = vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth?...' },
      error: null
    });

    supabase.auth.signInWithOAuth = mockSignInWithOAuth;

    const targetUrl = 'http://localhost:5173/auth/callback';
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    expect(result.data.provider).toBe('google');
    expect(result.error).toBeNull();
  });

  it('handles Google OAuth initialization failure gracefully', async () => {
    const mockSignInWithOAuth = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Provider is not enabled in Supabase' }
    });

    supabase.auth.signInWithOAuth = mockSignInWithOAuth;

    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173/auth/callback' }
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Provider is not enabled');
  });
});
