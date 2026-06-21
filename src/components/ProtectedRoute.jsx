import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────
   KEYFRAME + LOADER STYLES
───────────────────────────────────────────────────────────── */
const LOADER_STYLES = `
  @keyframes asat-spin   { to { transform: rotate(360deg); } }
  @keyframes asat-spin-r { to { transform: rotate(-360deg); } }
  @keyframes asat-pulse  {
    0%,100% { opacity:.3; transform:scale(.92); }
    50%     { opacity:1;  transform:scale(1); }
  }
  @keyframes asat-glow {
    0%,100% { text-shadow: 0 0 12px rgba(197,160,89,.25); }
    50%     { text-shadow: 0 0 32px rgba(197,160,89,.75), 0 0 60px rgba(197,160,89,.35); }
  }
  @keyframes asat-bar {
    0%   { width: 0%; }
    60%  { width: 75%; }
    85%  { width: 88%; }
    100% { width: 95%; }
  }
  @keyframes asat-dot-bounce {
    0%,80%,100% { opacity:0; transform:scale(.5); }
    40%         { opacity:1; transform:scale(1); }
  }
  @keyframes asat-fadein {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes asat-orbit1 {
    0%   { transform: rotate(0deg)   translateX(54px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
  }
  @keyframes asat-orbit2 {
    0%   { transform: rotate(120deg) translateX(54px) rotate(-120deg); }
    100% { transform: rotate(480deg) translateX(54px) rotate(-480deg); }
  }
  @keyframes asat-orbit3 {
    0%   { transform: rotate(240deg) translateX(54px) rotate(-240deg); }
    100% { transform: rotate(600deg) translateX(54px) rotate(-600deg); }
  }
  @keyframes asat-orbitA {
    0%   { transform: rotate(0deg)    translateX(78px) rotate(0deg); }
    100% { transform: rotate(-360deg) translateX(78px) rotate(360deg); }
  }
  @keyframes asat-orbitB {
    0%   { transform: rotate(180deg)  translateX(78px) rotate(-180deg); }
    100% { transform: rotate(-180deg) translateX(78px) rotate(180deg); }
  }

  /* ── Loader shell ── */
  .asat-loader {
    position: fixed; inset: 0; z-index: 99999;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #0e0e0e;
    font-family: 'Montserrat', sans-serif;
    animation: asat-fadein .4s ease both;
  }

  /* ── Corner bracket accents ── */
  .asat-loader__corner { position: fixed; width: 32px; height: 32px; opacity: .3; }
  .asat-loader__corner--tl { top:24px;    left:24px;  border-top:1px solid #C5A059; border-left:1px solid #C5A059; }
  .asat-loader__corner--tr { top:24px;    right:24px; border-top:1px solid #C5A059; border-right:1px solid #C5A059; }
  .asat-loader__corner--bl { bottom:24px; left:24px;  border-bottom:1px solid #C5A059; border-left:1px solid #C5A059; }
  .asat-loader__corner--br { bottom:24px; right:24px; border-bottom:1px solid #C5A059; border-right:1px solid #C5A059; }

  /* ── Orbital ring system ── */
  .asat-loader__orbit {
    position: relative;
    width: 160px; height: 160px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 36px;
  }
  .asat-loader__ring { position: absolute; inset: 0; border-radius: 50%; }
  .asat-loader__ring--outer { border: 1px solid rgba(197,160,89,.15); animation: asat-spin   8s   linear infinite; }
  .asat-loader__ring--mid   { inset: 16px; border: 1px solid rgba(197,160,89,.10); animation: asat-spin-r 5s   linear infinite; }
  .asat-loader__ring--inner { inset: 34px; border: 1px solid rgba(197,160,89,.20); animation: asat-spin   3.5s linear infinite; }

  /* ── Orbiting particles ── */
  .asat-loader__particle {
    position: absolute; top: 50%; left: 50%;
    width: 6px; height: 6px; border-radius: 50%;
    background: #C5A059; margin: -3px 0 0 -3px;
    box-shadow: 0 0 8px rgba(197,160,89,.8);
  }
  .asat-loader__particle--1 { animation: asat-orbit1  2.4s linear infinite; }
  .asat-loader__particle--2 { animation: asat-orbit2  2.4s linear infinite; }
  .asat-loader__particle--3 { animation: asat-orbit3  2.4s linear infinite; width:4px;height:4px;margin:-2px 0 0 -2px;opacity:.6; }
  .asat-loader__particle--4 { animation: asat-orbitA  4s   linear infinite; width:4px;height:4px;margin:-2px 0 0 -2px;background:#fff;opacity:.3;box-shadow:none; }
  .asat-loader__particle--5 { animation: asat-orbitB  4s   linear infinite; width:3px;height:3px;margin:-1.5px 0 0 -1.5px;background:#fff;opacity:.2;box-shadow:none; }

  /* ── Central logo mark ── */
  .asat-loader__mark {
    position: relative; z-index: 2;
    width: 56px; height: 56px; border-radius: 50%;
    background: radial-gradient(circle at 40% 40%, #2a2014, #0e0e0e);
    border: 1px solid rgba(197,160,89,.35);
    display: flex; align-items: center; justify-content: center;
    animation: asat-pulse 2.2s ease-in-out infinite;
    box-shadow: 0 0 0 8px rgba(197,160,89,.04),
                0 0 30px rgba(197,160,89,.12),
                inset 0 0 20px rgba(197,160,89,.06);
  }
  .asat-loader__diamond {
    width: 18px; height: 18px;
    background: linear-gradient(135deg, #C5A059, #e8c97a, #a07830);
    transform: rotate(45deg); border-radius: 2px;
    box-shadow: 0 0 12px rgba(197,160,89,.6);
  }

  /* ── Brand text ── */
  .asat-loader__brand { text-align: center; margin-bottom: 32px; }
  .asat-loader__brand-name {
    display: block;
    font-family: 'Cinzel', serif;
    font-size: 1.55rem; letter-spacing: 8px;
    color: #fff; font-weight: 700; margin-bottom: 6px;
    animation: asat-glow 2.5s ease-in-out infinite;
  }
  .asat-loader__brand-tag {
    display: block; font-size: 0.52rem;
    letter-spacing: 5px; text-transform: uppercase;
    color: #C5A059; font-weight: 400;
  }

  /* ── Progress bar ── */
  .asat-loader__bar-wrap {
    width: 200px; height: 1px;
    background: rgba(255,255,255,.07);
    border-radius: 100px; overflow: hidden; margin-bottom: 22px;
  }
  .asat-loader__bar {
    height: 100%;
    background: linear-gradient(to right, #a07830, #C5A059, #e8c97a);
    border-radius: 100px;
    animation: asat-bar 3.5s cubic-bezier(.4,0,.2,1) forwards;
    box-shadow: 0 0 10px rgba(197,160,89,.5);
  }

  /* ── Status + bouncing dots ── */
  .asat-loader__status {
    display: flex; align-items: center; gap: 2px;
    font-size: 0.65rem; letter-spacing: 3px;
    text-transform: uppercase; color: rgba(255,255,255,.35);
  }
  .asat-loader__dot {
    width: 3px; height: 3px; border-radius: 50%;
    background: #C5A059; display: inline-block;
    animation: asat-dot-bounce 1.2s ease-in-out infinite;
    margin-left: 2px;
  }
  .asat-loader__dot:nth-child(2) { animation-delay: .2s; }
  .asat-loader__dot:nth-child(3) { animation-delay: .4s; }
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

        {/* Corner bracket accents */}
        <div className="asat-loader__corner asat-loader__corner--tl" />
        <div className="asat-loader__corner asat-loader__corner--tr" />
        <div className="asat-loader__corner asat-loader__corner--bl" />
        <div className="asat-loader__corner asat-loader__corner--br" />

        {/* Orbital ring + particle system */}
        <div className="asat-loader__orbit">
          <div className="asat-loader__ring asat-loader__ring--outer" />
          <div className="asat-loader__ring asat-loader__ring--mid" />
          <div className="asat-loader__ring asat-loader__ring--inner" />
          <div className="asat-loader__particle asat-loader__particle--1" />
          <div className="asat-loader__particle asat-loader__particle--2" />
          <div className="asat-loader__particle asat-loader__particle--3" />
          <div className="asat-loader__particle asat-loader__particle--4" />
          <div className="asat-loader__particle asat-loader__particle--5" />
          <div className="asat-loader__mark">
            <div className="asat-loader__diamond" />
          </div>
        </div>

        {/* Brand name + tagline */}
        <div className="asat-loader__brand">
          <span className="asat-loader__brand-name">ASAT</span>
          <span className="asat-loader__brand-tag">**A Designer Paradise**</span>
        </div>

        {/* Glowing progress bar */}
        <div className="asat-loader__bar-wrap">
          <div className="asat-loader__bar" />
        </div>

        {/* Animated status text */}
        <div className="asat-loader__status">
          <span>Verifying session</span>
          <span className="asat-loader__dot" />
          <span className="asat-loader__dot" />
          <span className="asat-loader__dot" />
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
