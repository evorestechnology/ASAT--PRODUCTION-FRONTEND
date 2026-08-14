import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────
   KEYFRAME + LOADER STYLES
───────────────────────────────────────────────────────────── */
const LOADER_STYLES = `
  @keyframes asat-rotate-clockwise {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes asat-rotate-counter {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  }
  @keyframes asat-pulse-logo {
    0%, 100% { transform: scale(1) rotate(45deg); opacity: 1; }
    50% { transform: scale(0.9) rotate(45deg); opacity: 0.7; }
  }
  @keyframes asat-progress {
    0% { transform: scaleX(0); }
    45% { transform: scaleX(0.4); }
    75% { transform: scaleX(0.75); }
    100% { transform: scaleX(1); }
  }
  @keyframes asat-pulse-dot {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes asat-fade-in-up {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .asat-loader {
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg, #FAFAF8);
    color: var(--fg, #000000);
    font-family: var(--font-body, 'Montserrat', sans-serif);
    overflow: hidden;
  }

  /* Minimal corner crosshair styling */
  .asat-loader__corner {
    position: fixed;
    width: 20px;
    height: 20px;
    opacity: 0.25;
    transition: opacity 0.3s;
  }
  .asat-loader__corner::before,
  .asat-loader__corner::after {
    content: '';
    position: absolute;
    background-color: var(--fg, #000000);
  }
  /* Top-left */
  .asat-loader__corner--tl {
    top: 30px;
    left: 30px;
  }
  .asat-loader__corner--tl::before { top: 0; left: 0; width: 100%; height: 1px; }
  .asat-loader__corner--tl::after { top: 0; left: 0; width: 1px; height: 100%; }

  /* Top-right */
  .asat-loader__corner--tr {
    top: 30px;
    right: 30px;
  }
  .asat-loader__corner--tr::before { top: 0; right: 0; width: 100%; height: 1px; }
  .asat-loader__corner--tr::after { top: 0; right: 0; width: 1px; height: 100%; }

  /* Bottom-left */
  .asat-loader__corner--bl {
    bottom: 30px;
    left: 30px;
  }
  .asat-loader__corner--bl::before { bottom: 0; left: 0; width: 100%; height: 1px; }
  .asat-loader__corner--bl::after { bottom: 0; left: 0; width: 1px; height: 100%; }

  /* Bottom-right */
  .asat-loader__corner--br {
    bottom: 30px;
    right: 30px;
  }
  .asat-loader__corner--br::before { bottom: 0; right: 0; width: 100%; height: 1px; }
  .asat-loader__corner--br::after { bottom: 0; right: 0; width: 1px; height: 100%; }

  /* Layout container */
  .asat-loader__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: asat-fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Visual geometric spinner */
  .asat-loader__visual {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .asat-loader__ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid transparent;
  }

  .asat-loader__ring--primary {
    width: 100px;
    height: 100px;
    border-top-color: var(--fg, #000000);
    border-bottom-color: var(--fg, #000000);
    opacity: 0.15;
    animation: asat-rotate-clockwise 3s linear infinite;
  }

  .asat-loader__ring--secondary {
    width: 80px;
    height: 80px;
    border-left-color: var(--fg, #000000);
    border-right-color: var(--fg, #000000);
    opacity: 0.3;
    animation: asat-rotate-counter 2s linear infinite;
  }

  .asat-loader__logo-wrapper {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .asat-loader__logo-diamond {
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--fg, #000000);
    transform: rotate(45deg);
    background-color: var(--bg, #FAFAF8);
    animation: asat-pulse-logo 2.5s ease-in-out infinite;
  }

  /* Typography */
  .asat-loader__brand {
    text-align: center;
    margin-bottom: 28px;
  }

  .asat-loader__title {
    font-family: var(--font-heading, 'Cinzel', serif);
    font-size: 2.5rem;
    font-weight: 300;
    letter-spacing: 18px;
    margin-bottom: 8px;
    color: var(--fg, #000000);
    text-indent: 18px; /* offsets letter-spacing centering issue */
  }

  .asat-loader__tagline {
    font-family: var(--font-ui, 'Montserrat', sans-serif);
    font-size: 0.6rem;
    font-weight: 400;
    letter-spacing: 8px;
    color: var(--fg, #000000);
    opacity: 0.45;
    text-transform: uppercase;
    text-indent: 8px;
  }

  /* Elegantly thin progress line */
  .asat-loader__progress-container {
    width: 140px;
    height: 1px;
    background-color: var(--border, #E8E8E8);
    overflow: hidden;
    margin-bottom: 20px;
  }

  .asat-loader__progress-bar {
    height: 100%;
    width: 100%;
    background-color: var(--fg, #000000);
    transform-origin: left center;
    animation: asat-progress 3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Status message */
  .asat-loader__status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--fg, #000000);
    opacity: 0.5;
  }

  .asat-loader__status-text {
    font-family: var(--font-ui, 'Montserrat', sans-serif);
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  .asat-loader__pulse-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--fg, #000000);
    animation: asat-pulse-dot 1.5s ease-in-out infinite;
  }
`;

/**
 * Full-screen branded loading experience shown while auth state is resolving.
 * Features: orbital particle rings, pulsing diamond logo, glowing brand name,
 * animated progress bar, and bouncing status dots — all on a deep dark canvas.
 */
function AuthLoading() {
  return (
    <>
      <style>{LOADER_STYLES}</style>
      <div className="asat-loader" role="status" aria-label="Loading ASAT">
        {/* Modern Minimalist Crosshair accents in corners */}
        <div className="asat-loader__corner asat-loader__corner--tl" />
        <div className="asat-loader__corner asat-loader__corner--tr" />
        <div className="asat-loader__corner asat-loader__corner--bl" />
        <div className="asat-loader__corner asat-loader__corner--br" />

        {/* Sleek Minimalist Spinner */}
        <div className="asat-loader__container">
          <div className="asat-loader__visual">
            <div className="asat-loader__ring asat-loader__ring--primary" />
            <div className="asat-loader__ring asat-loader__ring--secondary" />
            <div className="asat-loader__logo-wrapper">
              <div className="asat-loader__logo-diamond" />
            </div>
          </div>

          {/* Brand typography */}
          <div className="asat-loader__brand">
            <h1 className="asat-loader__title">ASAT</h1>
            <p className="asat-loader__tagline">A DESIGNER PARADISE</p>
          </div>

          {/* Elegant line progress */}
          <div className="asat-loader__progress-container">
            <div className="asat-loader__progress-bar" />
          </div>

          {/* Text status */}
          <div className="asat-loader__status">
            <span className="asat-loader__status-text">Verifying Session</span>
            <span className="asat-loader__pulse-dot" />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * ProtectedRoute — generic role-based route guard.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin']} redirectTo="/master/login">
 *     <MasterLayout />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Still resolving auth state — show loader
  if (loading) return <AuthLoading />;

  // Not logged in at all
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated but role hasn't resolved yet from Firestore
  // (can happen briefly after sign-in before onAuthStateChanged completes)
  if (role === null) return <AuthLoading />;

  // Logged in but wrong role — redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    const roleRedirects = {
      admin:    '/master',
      designer: '/designer',
      mfg:      '/mfg',
      user:     '/',
    };
    return <Navigate to={roleRedirects[role] || '/'} replace />;
  }

  return children;
}

/**
 * GuestRoute — redirects already-logged-in users away from login/register pages.
 * Prevents going back to /login after authentication.
 */
export function GuestRoute({ children, role: expectedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) return <AuthLoading />;

  // If user is logged in AND role is fully resolved, redirect to dashboard
  if (user && role !== null) {
    const roleRedirects = {
      admin:    '/master',
      designer: '/designer',
      mfg:      '/mfg',
      user:     '/',
    };
    return <Navigate to={roleRedirects[role] || '/'} replace />;
  }

  return children;
}
