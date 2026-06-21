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

  const currentUserIdRef = useRef(null);

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
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;

      // If the user ID is the same (e.g. TOKEN_REFRESHED, or window focus check),
      // we do not need to show the loading spinner or re-fetch profile/role.
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
    const supabaseUser = session.user;
    setUser(supabaseUser);
    setIdToken(session.access_token);
    setAuthToken(session.access_token);

    const uid = supabaseUser.id;
    currentUserIdRef.current = uid;

    try {
      // Resolve role and profile details via backend API
      const { role: resolvedRole, profile: resolvedProfile } = await apiFetch('/api/auth/resolve-role');

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
      clearAuthState();
    }
  };

  const logout = async () => {
    clearAuthState();
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
