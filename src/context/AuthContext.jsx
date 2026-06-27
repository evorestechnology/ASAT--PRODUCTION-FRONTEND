import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { setAuthToken, apiFetch } from '../api';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * Listens to Supabase Auth state changes and resolves the user's role
 * by checking database tables via the backend API.
 * Exposes: { user, role, profile, loading, logout, idToken }
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Supabase auth user object
  const [role,    setRole]    = useState(null);   // 'admin' | 'designer' | 'mfg' | 'user'
  const [profile, setProfile] = useState(null);  // Database profile data
  const [loading, setLoading] = useState(true);  // Resolving auth state
  const [idToken, setIdToken] = useState(null);  // JWT token (access_token) for API calls

  // Track current user ID to skip unnecessary re-fetches on token refresh
  const currentUserIdRef = useRef(null);
  // Guard: prevent onAuthStateChange from re-entering resolveAuth while it's running
  const resolvingRef = useRef(false);
  // Flag: we initiated a signOut from within resolveAuth — ignore the resulting SIGNED_OUT event
  const internalSignOutRef = useRef(false);

  useEffect(() => {
    // 1. Initial Session Check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await resolveAuth(session);
        } else {
          clearAuthState();
        }
      } catch (err) {
        console.error('Initial session check failed:', err);
        internalSignOutRef.current = true;
        await supabase.auth.signOut();
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore SIGNED_OUT events we triggered internally to avoid re-entry
      if (event === 'SIGNED_OUT' && internalSignOutRef.current) {
        internalSignOutRef.current = false;
        return;
      }

      // If we're already mid-resolve, skip (prevents double-resolve on login)
      if (resolvingRef.current) return;

      const newUserId = session?.user?.id || null;

      // If the user ID is the same (e.g. TOKEN_REFRESHED), just refresh tokens — no refetch
      if (newUserId && newUserId === currentUserIdRef.current) {
        setUser(session.user);
        setIdToken(session.access_token);
        setAuthToken(session.access_token);
        return;
      }

      setLoading(true);
      if (session) {
        await resolveAuth(session);
      } else {
        clearAuthState();
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setRole(null);
    setProfile(null);
    setIdToken(null);
    setAuthToken(null);
    currentUserIdRef.current = null;
    localStorage.removeItem('asat_loggedIn');
    localStorage.removeItem('asat_user');
    localStorage.removeItem('asat_cart');
    localStorage.removeItem('asat_wishlist');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cart_updated'));
    window.dispatchEvent(new Event('wishlist_updated'));
  };

  const resolveAuth = async (session) => {
    resolvingRef.current = true;

    const supabaseUser = session.user;
    setUser(supabaseUser);
    setIdToken(session.access_token);
    setAuthToken(session.access_token);

    const uid = supabaseUser.id;
    currentUserIdRef.current = uid;

    try {
      // Resolve role and profile details via backend API
      // NOTE: backend wraps responses as { success, data: { role, profile }, ... }
      const response = await apiFetch('/api/auth/resolve-role');
      const resolvedRole = response?.data?.role ?? response?.role;
      const resolvedProfile = response?.data?.profile ?? response?.profile;

      if (!resolvedRole) throw Object.assign(new Error('No role returned'), { status: 404 });

      setRole(resolvedRole);
      setProfile(resolvedProfile);

      if (resolvedRole === 'user') {
        localStorage.setItem('asat_loggedIn', 'true');
        localStorage.setItem('asat_user', JSON.stringify({
          fullName: resolvedProfile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
          email: supabaseUser.email
        }));
      } else {
        localStorage.removeItem('asat_loggedIn');
        localStorage.removeItem('asat_user');
      }
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error resolving user role profile:', err);
      // Sign out, but mark it as internal so the listener doesn't re-trigger resolveAuth
      clearAuthState();
      internalSignOutRef.current = true;
      supabase.auth.signOut().catch(() => {});
    } finally {
      resolvingRef.current = false;
    }
  };

  const logout = async () => {
    clearAuthState();
    internalSignOutRef.current = true;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, logout, idToken }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth context */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
