import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch verified profile from backend using the access token
  const fetchBackendProfile = async (token) => {
    try {
      const data = await apiRequest('/api/auth/me', { token });
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      console.warn('[AuthContext] Backend profile fetch note:', err.message);
      // Fallback profile if backend unreachable
      return null;
    }
  };

  useEffect(() => {
    // If Supabase credentials are not configured, stop loading immediately
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error('[AuthContext] Session retrieval error:', sessionError.message);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        fetchBackendProfile(currentSession.access_token).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Subscribe to auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.access_token) {
        await fetchBackendProfile(newSession.access_token);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Supabase credentials are not configured. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in frontend/.env';
      setError(msg);
      throw new Error(msg);
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }

    setSession(data.session);
    setUser(data.user);

    if (data.session?.access_token) {
      await fetchBackendProfile(data.session.access_token);
    }

    return data;
  };

  // Google OAuth Login handler
  const loginWithGoogle = async (redirectTo) => {
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Supabase credentials are not configured. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in frontend/.env';
      setError(msg);
      throw new Error(msg);
    }

    const targetUrl = redirectTo || `${window.location.origin}/`;

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      throw oauthError;
    }

    return data;
  };

  // Logout handler
  const logout = async () => {
    setError(null);
    try {
      if (supabase && isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err.message);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  const value = {
    user,
    session,
    profile,
    role: profile?.role || user?.user_metadata?.role || null,
    loading,
    error,
    isConfigured: isSupabaseConfigured,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
