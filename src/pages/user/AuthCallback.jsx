import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch, setAuthToken } from '../../api';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        // Check for error in query string (e.g. user denied access)
        const params = new URLSearchParams(location.search);
        const urlError = params.get('error_description') || params.get('error');
        if (urlError) {
          throw new Error(urlError);
        }

        // 1. Get or exchange session
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (!session) {
          // If session is not immediately available, wait a moment for Supabase to parse hash
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession && isMounted) {
              authListener.subscription?.unsubscribe();
              await completeSignIn(newSession);
            }
          });

          // Timeout fallback after 6s
          setTimeout(() => {
            if (isMounted) {
              authListener.subscription?.unsubscribe();
              navigate('/login', { state: { message: 'Sign in timed out. Please try again.' } });
            }
          }, 6000);
          return;
        }

        await completeSignIn(session);
      } catch (err) {
        console.error('Auth callback processing error:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to complete Google authentication.');
          setTimeout(() => {
            navigate('/login', { state: { message: err.message || 'Google authentication failed.' } });
          }, 2500);
        }
      }
    };

    const completeSignIn = async (session) => {
      try {
        setAuthToken(session.access_token);

        // Sync or auto-provision OAuth customer profile and wallet
        let profile = null;
        try {
          const res = await apiFetch('/api/users/sync-oauth', { method: 'POST' });
          profile = res.profile;
        } catch (err) {
          console.warn('OAuth profile sync warning:', err);
        }

        // Merge any pending cart item stored prior to authentication
        const pendingItem = localStorage.getItem('asat_pending_cart_item');
        if (pendingItem) {
          try {
            const item = JSON.parse(pendingItem);
            const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
            const existingIdx = cart.findIndex((i) => {
              const matchBasic = i.id === item.id && i.size === item.size && i.colorIdx === item.colorIdx;
              if (!matchBasic) return false;
              if (item.isMfgProduct) {
                return i.printStyle === item.printStyle;
              }
              return !i.isMfgProduct;
            });

            if (existingIdx > -1) {
              cart[existingIdx].qty += item.qty;
            } else {
              cart.push(item);
            }
            localStorage.setItem('asat_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cart_updated'));
            localStorage.removeItem('asat_pending_cart_item');
          } catch (e) {
            console.error('Error merging pending cart item in OAuth callback:', e);
          }
        }

        // Clean up address bar
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Redirect to intended page or home
        let redirectTarget = localStorage.getItem('asat_auth_redirect') || '/';
        localStorage.removeItem('asat_auth_redirect');

        // Check if the user is missing required details
        const userMeta = session.user.user_metadata || {};
        const isMissingDetails = !userMeta.phone || !userMeta.dob || !profile?.phone;

        let welcomeMessage = '';
        const userName =
          userMeta.full_name ||
          userMeta.name ||
          (session.user.email ? session.user.email.split('@')[0] : 'there');

        if (isMissingDetails) {
            redirectTarget = '/profile';
            welcomeMessage = `Welcome ${userName}! Please complete your profile details to continue.`;
        } else {
            welcomeMessage = `Welcome to ASAT, ${userName}! Signed in with Google.`;
        }

        navigate(redirectTarget, {
          replace: true,
          state: { welcomeMessage },
        });
      } catch (err) {
        console.error('Error in completeSignIn:', err);
        navigate('/', { replace: true });
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [location, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {errorMsg ? (
        <div style={{ maxWidth: '400px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef0ee',
              color: '#c0392b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              margin: '0 auto 16px',
            }}
          >
            <i className="fas fa-circle-exclamation" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: '#111' }}>
            Authentication Failed
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>{errorMsg}</p>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Redirecting you to login...</span>
        </div>
      ) : (
        <div style={{ maxWidth: '400px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid #E5E5E5',
              borderTopColor: '#000000',
              borderRadius: '50%',
              animation: 'asat-spin 0.8s linear infinite',
              margin: '0 auto 24px',
            }}
          />
          <style>{`
            @keyframes asat-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <h2
            style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              letterSpacing: '-0.5px',
              textTransform: 'uppercase',
              color: '#000000',
              marginBottom: '8px',
            }}
          >
            A<span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>S</span>AT
          </h2>
          <p
            style={{
              fontSize: '0.8rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#777',
              fontWeight: '600',
            }}
          >
            Completing Google Authentication…
          </p>
        </div>
      )}
    </div>
  );
}

export default AuthCallback;
