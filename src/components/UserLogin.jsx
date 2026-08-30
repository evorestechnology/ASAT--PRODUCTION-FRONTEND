import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiFetch, setAuthToken } from '../api';

const authImages = [
    '/images/fashion1.png',
    '/images/fashion2.png',
    '/images/fashion3.png',
];

const styles = `
    .auth-split-layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        background-color: #FFFFFF;
    }
    .auth-image-side {
        flex: 1.2;
        position: relative;
        overflow: hidden;
        display: none;
    }
    @media (min-width: 900px) {
        .auth-image-side { display: block; }
    }
    .auth-slide {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0;
        transition: opacity 1.5s ease-in-out, transform 10s linear;
        transform: scale(1.05);
    }
    .auth-slide.active { opacity: 1; transform: scale(1); }
    .auth-image-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%);
        z-index: 10;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 60px;
        color: white;
    }
    .auth-brand-name {
        font-family: -apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif;
        font-size: 3.5rem;
        letter-spacing: -1px;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 15px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.35);
        line-height: 1.1;
    }
    .auth-brand-tagline {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.9rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.9);
        text-shadow: 0 2px 10px rgba(0,0,0,0.4);
    }
    .auth-form-side {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
        background: #FFFFFF;
    }
    .auth-form-container { width: 100%; max-width: 400px; }
    .auth-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 2.2rem;
        color: #000000;
        margin-bottom: 8px;
        font-weight: 900;
        letter-spacing: -0.5px;
        text-transform: uppercase;
        line-height: 1.1;
    }
    .auth-subtitle {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.85rem;
        color: #777777;
        margin-bottom: 36px;
        letter-spacing: 0.5px;
    }
    .auth-input-group { margin-bottom: 20px; }
    .auth-input-group label {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 1px;
        color: #000000;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: 700;
    }
    .auth-input {
        width: 100%;
        padding: 14px 18px;
        border: 1px solid #E5E5E5;
        border-radius: 12px;
        background: #FAFAF8;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.9rem;
        color: #000000;
        transition: all 0.25s ease;
        outline: none;
        box-sizing: border-box;
    }
    .auth-input:focus {
        border-color: #000000;
        background: #FFFFFF;
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
    }
    .auth-input::placeholder { color: #999; font-size: 0.85rem; }
    .auth-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.8rem;
    }
    .auth-checkbox-label { display: flex; align-items: center; gap: 8px; color: #666; cursor: pointer; }
    .auth-checkbox-label input { accent-color: #000000; cursor: pointer; width: 16px; height: 16px; }
    .auth-forgot-link { color: #000000; text-decoration: none; font-weight: 600; transition: opacity 0.2s; }
    .auth-forgot-link:hover { opacity: 0.7; }
    .auth-submit-btn {
        width: 100%;
        padding: 16px;
        background: #000000;
        color: #FFFFFF;
        border: none;
        border-radius: 30px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 2px;
        cursor: pointer;
        transition: opacity 0.2s ease, transform 0.2s ease;
        text-transform: uppercase;
        font-weight: 800;
        position: relative;
        overflow: hidden;
    }
    .auth-submit-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .auth-submit-btn:active { transform: scale(0.99); }
    .auth-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .auth-switch-text {
        text-align: center;
        margin-top: 28px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.85rem;
        color: #666;
    }
    .auth-switch-link { color: #000000; font-weight: 700; text-decoration: none; margin-left: 5px; }
    .auth-switch-link:hover { text-decoration: underline; }
    .auth-back-home {
        position: absolute;
        top: 30px;
        left: 40px;
        color: #000000;
        text-decoration: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 1px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.2s;
    }
    .auth-back-home:hover { opacity: 0.6; }

    /* ══ FORGOT PASSWORD OVERLAY PANEL ══ */
    .fp-overlay {
        position: fixed;
        inset: 0;
        z-index: 9000;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: rgba(0, 0, 0, 0);
        transition: background 0.35s ease, visibility 0.35s ease;
        pointer-events: none;
        visibility: hidden;
        overflow: hidden;
    }
    .fp-overlay.fp-overlay--open {
        background: rgba(0, 0, 0, 0.55);
        pointer-events: all;
        backdrop-filter: blur(3px);
        visibility: visible;
    }
    .fp-panel {
        width: 100%;
        max-width: 480px;
        background: #fff;
        border-radius: 20px 20px 0 0;
        padding: 36px 36px 52px;
        box-shadow: 0 -12px 60px rgba(0,0,0,0.18);
        transform: translateY(110%);
        transition: transform 0.4s cubic-bezier(0.34, 1.1, 0.64, 1);
        position: relative;
        box-sizing: border-box;
    }
    @media (min-width: 600px) {
        .fp-overlay { align-items: center; }
        .fp-panel { border-radius: 20px; max-height: 90vh; overflow-y: auto; }
    }
    .fp-overlay--open .fp-panel { transform: translateY(0); }
    .fp-close-btn {
        position: absolute;
        top: 18px;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.3rem;
        color: #888;
        cursor: pointer;
        line-height: 1;
        padding: 4px 8px;
        border-radius: 50%;
        transition: color 0.2s, background 0.2s;
    }
    .fp-close-btn:hover { color: var(--dark); background: #f0f0f0; }
    .fp-gold-bar { width: 40px; height: 3px; background: linear-gradient(90deg, var(--gold), #e8c97a); border-radius: 2px; margin-bottom: 22px; }
    .fp-title { font-family: 'Cinzel', serif; font-size: 1.45rem; font-weight: 700; color: var(--dark); letter-spacing: 1.5px; margin-bottom: 6px; }
    .fp-subtitle { font-family: 'Montserrat', sans-serif; font-size: 0.8rem; color: #777; margin-bottom: 28px; line-height: 1.55; }

    /* Step indicators */
    .fp-steps { display: flex; align-items: center; gap: 0; margin-bottom: 28px; }
    .fp-step-dot {
        width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ddd; background: #fff;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; color: #aaa;
        flex-shrink: 0; transition: all 0.3s ease;
    }
    .fp-step-dot.active { border-color: var(--gold); background: var(--gold); color: #fff; box-shadow: 0 0 0 4px rgba(197,160,89,0.18); }
    .fp-step-dot.done { border-color: #2ecc71; background: #2ecc71; color: #fff; }
    .fp-step-line { flex: 1; height: 2px; background: #eee; transition: background 0.3s ease; }
    .fp-step-line.done { background: #2ecc71; }

    /* OTP boxes */
    .fp-otp-row { display: flex; gap: 10px; justify-content: center; margin: 20px 0 8px; }
    .fp-otp-digit {
        width: 48px; height: 56px; border: 2px solid #e0e0e0; border-radius: 10px;
        text-align: center; font-family: 'Courier New', monospace; font-size: 1.6rem; font-weight: 700;
        color: var(--dark); background: #fafafa; outline: none;
        transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        caret-color: var(--gold);
    }
    .fp-otp-digit:focus { border-color: var(--gold); background: #fff; box-shadow: 0 0 0 3px rgba(197,160,89,0.18); }
    .fp-otp-digit.filled { border-color: var(--gold); background: rgba(197,160,89,0.06); }

    /* Alerts */
    .fp-alert {
        padding: 11px 14px; border-radius: 8px; font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem; line-height: 1.5; margin-bottom: 18px;
        display: flex; align-items: flex-start; gap: 8px;
    }
    .fp-alert--error { background: #fef0ee; border-left: 3px solid #e74c3c; color: #c0392b; }
    .fp-alert--success { background: #eafaf1; border-left: 3px solid #2ecc71; color: #1a7a42; }
    .fp-alert--info { background: rgba(197,160,89,0.08); border-left: 3px solid var(--gold); color: #7a6020; }

    .fp-btn {
        width: 100%; padding: 15px; background: var(--dark); color: #fff; border: none;
        border-radius: 8px; font-family: 'Cinzel', serif; font-size: 0.88rem;
        letter-spacing: 1.8px; text-transform: uppercase; font-weight: 700;
        cursor: pointer; transition: background 0.3s, transform 0.15s, box-shadow 0.3s; margin-top: 6px;
    }
    .fp-btn:hover:not(:disabled) { background: var(--gold); box-shadow: 0 4px 18px rgba(197,160,89,0.35); }
    .fp-btn:active:not(:disabled) { transform: scale(0.98); }
    .fp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .fp-resend-row { text-align: center; margin-top: 14px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: #888; }
    .fp-resend-btn {
        background: none; border: none; color: var(--gold);
        font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700;
        cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px;
        transition: opacity 0.2s;
    }
    .fp-resend-btn:disabled { color: #bbb; cursor: not-allowed; text-decoration: none; }

    .fp-input-wrap { position: relative; margin-bottom: 18px; }
    .fp-input {
        width: 100%; padding: 13px 45px 13px 15px; border: 2px solid #e8e8e8; border-radius: 10px;
        font-family: 'Montserrat', sans-serif; font-size: 0.9rem; color: var(--dark);
        background: #fafafa; outline: none;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s; box-sizing: border-box;
    }
    .fp-input:focus { border-color: var(--gold); background: #fff; box-shadow: 0 0 0 3px rgba(197,160,89,0.15); }
    .fp-input::placeholder { color: #bbb; }
    .fp-eye-btn {
        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: #aaa; cursor: pointer; font-size: 0.95rem;
        padding: 0; display: flex; align-items: center; transition: color 0.2s;
    }
    .fp-eye-btn:hover { color: var(--dark); }
    .fp-label {
        display: block; font-family: 'Montserrat', sans-serif; font-size: 0.72rem;
        font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #555; margin-bottom: 7px;
    }

    .fp-success-icon { text-align: center; margin-bottom: 16px; }
    .fp-success-circle {
        width: 68px; height: 68px; border-radius: 50%;
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 2rem; color: #fff; box-shadow: 0 6px 24px rgba(46,204,113,0.35);
        animation: fpBounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    @keyframes fpBounce {
        0%   { transform: scale(0.5); opacity: 0; }
        60%  { transform: scale(1.12); opacity: 1; }
        100% { transform: scale(1); }
    }
    .fp-back-link {
        background: none; border: none; color: var(--gold);
        font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 600;
        cursor: pointer; padding: 0; margin-top: 14px; display: block; text-align: center;
        text-decoration: underline; text-underline-offset: 2px; transition: opacity 0.2s;
    }
    .fp-back-link:hover { opacity: 0.75; }
    .fp-pw-strength { height: 4px; border-radius: 2px; margin-top: 6px; background: #eee; transition: background 0.3s; overflow: hidden; }
    .fp-pw-strength-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease, background 0.3s; }
`;

function getStrength(pw) {
    if (!pw) return { width: '0%', color: '#eee', label: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { width: '20%', color: '#e74c3c', label: 'Weak' };
    if (score === 2) return { width: '40%', color: '#e67e22', label: 'Fair' };
    if (score === 3) return { width: '65%', color: '#f1c40f', label: 'Good' };
    return { width: '100%', color: '#2ecc71', label: 'Strong' };
}

function ForgotPasswordPanel({ isOpen, onClose }) {
    const [fpStep, setFpStep] = useState(1);
    const [fpEmail, setFpEmail] = useState('');
    const [fpOtp, setFpOtp] = useState(['', '', '', '', '', '']);
    const [fpNewPw, setFpNewPw] = useState('');
    const [fpConfirmPw, setFpConfirmPw] = useState('');
    const [fpShowPw, setFpShowPw] = useState(false);
    const [fpShowConfirm, setFpShowConfirm] = useState(false);
    const [fpLoading, setFpLoading] = useState(false);
    const [fpAlert, setFpAlert] = useState(null);
    const [fpResendCountdown, setFpResendCountdown] = useState(0);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (!isOpen) {
            const t = setTimeout(() => {
                setFpStep(1); setFpEmail(''); setFpOtp(['','','','','','']);
                setFpNewPw(''); setFpConfirmPw(''); setFpAlert(null);
                setFpResendCountdown(0); setFpLoading(false);
            }, 400);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    useEffect(() => {
        if (fpResendCountdown <= 0) return;
        const t = setTimeout(() => setFpResendCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [fpResendCountdown]);

    const handleOtpChange = (i, val) => {
        const cleaned = val.replace(/\D/g, '').slice(-1);
        const next = [...fpOtp]; next[i] = cleaned; setFpOtp(next);
        if (cleaned && i < 5) otpRefs.current[i + 1]?.focus();
    };
    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !fpOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = [...fpOtp];
        pasted.split('').forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
        setFpOtp(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const otpValue = fpOtp.join('');

    const handleSendOtp = async () => {
        setFpAlert(null);
        if (!fpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)) {
            setFpAlert({ type: 'error', text: 'Please enter a valid email address.' }); return;
        }
        setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/send-otp', {
                method: 'POST', body: JSON.stringify({ email: fpEmail }),
            });
            setFpAlert({ type: 'info', text: `A 6-digit reset code has been sent to ${fpEmail}. Check your inbox (and spam folder).` });
            setFpResendCountdown(60);
            setFpStep(2);
        } catch (err) {
            setFpAlert({ type: 'error', text: err.error || err.message || 'Failed to send reset code.' });
        } finally { setFpLoading(false); }
    };

    const handleVerifyOtp = async () => {
        setFpAlert(null);
        if (otpValue.length !== 6) {
            setFpAlert({ type: 'error', text: 'Please enter the full 6-digit code.' }); return;
        }
        setFpLoading(true);
        try {
            setFpStep(3); setFpAlert(null);
        } finally { setFpLoading(false); }
    };

    const handleResetPassword = async () => {
        setFpAlert(null);
        if (fpNewPw.length < 6) {
            setFpAlert({ type: 'error', text: 'Password must be at least 6 characters.' }); return;
        }
        if (fpNewPw !== fpConfirmPw) {
            setFpAlert({ type: 'error', text: 'Passwords do not match.' }); return;
        }
        setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/reset', {
                method: 'POST',
                body: JSON.stringify({ email: fpEmail, otp: otpValue, newPassword: fpNewPw }),
            });
            setFpStep(4); setFpAlert(null);
        } catch (err) {
            const msg = err.error || err.message || 'Failed to reset password.';
            setFpAlert({ type: 'error', text: msg });
        } finally { setFpLoading(false); }
    };

    const handleResend = async () => {
        setFpAlert(null); setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/send-otp', {
                method: 'POST', body: JSON.stringify({ email: fpEmail }),
            });
            setFpOtp(['','','','','','']); setFpResendCountdown(60);
            otpRefs.current[0]?.focus();
            setFpAlert({ type: 'info', text: 'A new reset code has been sent to your email.' });
        } catch (err) {
            setFpAlert({ type: 'error', text: err.error || err.message || 'Failed to resend code.' });
        } finally { setFpLoading(false); }
    };

    const strength = getStrength(fpNewPw);
    const stepLabels = ['Email', 'Verify', 'Password'];

    return (
        <div className={`fp-overlay${isOpen ? ' fp-overlay--open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="fp-panel" role="dialog" aria-modal="true" aria-label="Forgot Password">
                <button className="fp-close-btn" onClick={onClose} aria-label="Close">
                    <i className="fas fa-times" />
                </button>

                {fpStep < 4 && (
                    <div className="fp-steps">
                        {stepLabels.map((label, i) => {
                            const n = i + 1;
                            const isDone = fpStep > n;
                            const isActive = fpStep === n;
                            return (
                                <React.Fragment key={label}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                        <div className={`fp-step-dot${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}>
                                            {isDone ? <i className="fas fa-check" style={{ fontSize: '0.6rem' }} /> : n}
                                        </div>
                                        <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.6rem', fontWeight: 600, color: isActive ? 'var(--gold)' : isDone ? '#2ecc71' : '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
                                    </div>
                                    {i < stepLabels.length - 1 && <div className={`fp-step-line${fpStep > n ? ' done' : ''}`} style={{ marginBottom: 18 }} />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}

                {/* STEP 1 */}
                {fpStep === 1 && (<>
                    <div className="fp-gold-bar" />
                    <div className="fp-title">Reset Password</div>
                    <div className="fp-subtitle">Enter the email address linked to your account and we'll send you a 6-digit verification code.</div>
                    {fpAlert && (
                        <div className={`fp-alert fp-alert--${fpAlert.type}`}>
                            <i className={`fas ${fpAlert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} style={{ flexShrink: 0, marginTop: 1 }} />
                            {fpAlert.text}
                        </div>
                    )}
                    <label className="fp-label">Email Address</label>
                    <div className="fp-input-wrap">
                        <input id="fp-email" type="email" className="fp-input" placeholder="your@email.com"
                            value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                            autoComplete="email" autoFocus />
                    </div>
                    <button className="fp-btn" onClick={handleSendOtp} disabled={fpLoading}>
                        {fpLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Sending…</> : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }} />Send Reset Code</>}
                    </button>
                </>)}

                {/* STEP 2 */}
                {fpStep === 2 && (<>
                    <div className="fp-gold-bar" />
                    <div className="fp-title">Enter Code</div>
                    <div className="fp-subtitle">We sent a 6-digit code to <strong style={{ color: 'var(--dark)' }}>{fpEmail}</strong>. Valid for 5 minutes.</div>
                    {fpAlert && (
                        <div className={`fp-alert fp-alert--${fpAlert.type}`}>
                            <i className={`fas ${fpAlert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} style={{ flexShrink: 0, marginTop: 1 }} />
                            {fpAlert.text}
                        </div>
                    )}
                    <div className="fp-otp-row" onPaste={handleOtpPaste}>
                        {fpOtp.map((digit, i) => (
                            <input key={i} ref={el => otpRefs.current[i] = el}
                                type="text" inputMode="numeric" maxLength={1}
                                className={`fp-otp-digit${digit ? ' filled' : ''}`}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                autoFocus={i === 0}
                                aria-label={`OTP digit ${i + 1}`} />
                        ))}
                    </div>
                    <div className="fp-resend-row">
                        {fpResendCountdown > 0
                            ? <>Resend code in <strong style={{ color: 'var(--dark)' }}>{fpResendCountdown}s</strong></>
                            : <>Didn't receive it?&nbsp;<button className="fp-resend-btn" onClick={handleResend} disabled={fpLoading}>Resend Code</button></>
                        }
                    </div>
                    <button className="fp-btn" style={{ marginTop: 22 }} onClick={handleVerifyOtp} disabled={fpLoading || otpValue.length !== 6}>
                        {fpLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Verifying…</> : <><i className="fas fa-shield-halved" style={{ marginRight: 8 }} />Verify Code</>}
                    </button>
                    <button className="fp-back-link" onClick={() => { setFpStep(1); setFpAlert(null); }}>← Change email address</button>
                </>)}

                {/* STEP 3 */}
                {fpStep === 3 && (<>
                    <div className="fp-gold-bar" />
                    <div className="fp-title">New Password</div>
                    <div className="fp-subtitle">Choose a strong new password. Minimum 6 characters.</div>
                    {fpAlert && (
                        <div className={`fp-alert fp-alert--${fpAlert.type}`}>
                            <i className={`fas ${fpAlert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} style={{ flexShrink: 0, marginTop: 1 }} />
                            {fpAlert.text}
                        </div>
                    )}
                    <label className="fp-label">New Password</label>
                    <div className="fp-input-wrap">
                        <input type={fpShowPw ? 'text' : 'password'} className="fp-input"
                            placeholder="Enter new password" value={fpNewPw}
                            onChange={e => setFpNewPw(e.target.value)}
                            autoFocus autoComplete="new-password" />
                        <button className="fp-eye-btn" type="button" onClick={() => setFpShowPw(p => !p)} tabIndex={-1}>
                            <i className={`fas ${fpShowPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                    </div>
                    {fpNewPw && (
                        <div style={{ marginTop: -12, marginBottom: 16 }}>
                            <div className="fp-pw-strength">
                                <div className="fp-pw-strength-bar" style={{ width: strength.width, background: strength.color }} />
                            </div>
                            <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.68rem', color: strength.color, fontWeight: 600, letterSpacing: '0.5px' }}>{strength.label}</span>
                        </div>
                    )}
                    <label className="fp-label">Confirm Password</label>
                    <div className="fp-input-wrap">
                        <input type={fpShowConfirm ? 'text' : 'password'} className="fp-input"
                            placeholder="Repeat your new password" value={fpConfirmPw}
                            onChange={e => setFpConfirmPw(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                            autoComplete="new-password" />
                        <button className="fp-eye-btn" type="button" onClick={() => setFpShowConfirm(p => !p)} tabIndex={-1}>
                            <i className={`fas ${fpShowConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                    </div>
                    {fpConfirmPw && fpNewPw !== fpConfirmPw && (
                        <p style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.72rem', color: '#e74c3c', marginTop: -12, marginBottom: 12 }}>
                            <i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }} />Passwords do not match
                        </p>
                    )}
                    <button className="fp-btn" onClick={handleResetPassword} disabled={fpLoading || !fpNewPw || !fpConfirmPw}>
                        {fpLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Resetting…</> : <><i className="fas fa-lock" style={{ marginRight: 8 }} />Reset Password</>}
                    </button>
                    <button className="fp-back-link" onClick={() => { setFpStep(2); setFpAlert(null); }}>← Re-enter verification code</button>
                </>)}

                {/* STEP 4: Success */}
                {fpStep === 4 && (<>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', boxShadow: '0 6px 24px rgba(46,204,113,0.35)', animation: 'fpBounce 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both' }}>
                            <i className="fas fa-check" />
                        </div>
                    </div>
                    <div className="fp-title" style={{ textAlign: 'center', marginBottom: 10 }}>Password Reset!</div>
                    <div className="fp-subtitle" style={{ textAlign: 'center', marginBottom: 28 }}>Your password has been updated successfully. You can now sign in with your new password.</div>
                    <button className="fp-btn" onClick={onClose}>
                        <i className="fas fa-arrow-right-to-bracket" style={{ marginRight: 8 }} />Sign In Now
                    </button>
                </>)}
            </div>
        </div>
    );
}

function UserLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPanel, setShowForgotPanel] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            if (session) setAuthToken(session.access_token);

            let roleInfo = null;
            try { roleInfo = await apiFetch('/api/auth/resolve-role'); } catch (err) { console.error('Role resolution error:', err); }

            const resolvedRole = roleInfo?.data?.role ?? roleInfo?.role;
            if (!roleInfo || resolvedRole !== 'user') {
                await supabase.auth.signOut();
                setAuthToken(null);
                const roleLabel = resolvedRole === 'admin' ? 'Admin' : resolvedRole === 'designer' ? 'Designer' : resolvedRole === 'mfg' ? 'Manufacturer' : null;
                setError(roleLabel
                    ? `This account belongs to a ${roleLabel}. Please use the ${roleLabel} login portal instead.`
                    : 'No customer account found. Please register first or use the correct login portal.');
                return;
            }

            const pendingItem = localStorage.getItem('asat_pending_cart_item');
            if (pendingItem) {
                try {
                    const item = JSON.parse(pendingItem);
                    const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
                    const existingIdx = cart.findIndex(i => {
                        const matchBasic = i.id === item.id && i.size === item.size && i.colorIdx === item.colorIdx;
                        if (!matchBasic) return false;
                        if (item.isMfgProduct) {
                            return i.printStyle === item.printStyle;
                        } else {
                            return !i.isMfgProduct;
                        }
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
                    console.error('Error merging pending cart item:', e);
                }
            }

            const from = location.state?.from;
            navigate((from && from !== '/') ? from : '/', { state: { welcomeMessage: 'Signed in successfully! Welcome back.' } });
        } catch (err) {
            setError(err.message || 'Sign in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split-layout">
            <style>{styles}</style>

            <ForgotPasswordPanel isOpen={showForgotPanel} onClose={() => setShowForgotPanel(false)} />

            <div className="auth-form-side">
                

                <div className="auth-form-container">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">login and purchase your elite collection.</p>

                    {location.state?.message && (
                        <div style={{ background: 'rgba(197,160,89,0.08)', borderLeft: '3px solid var(--gold)', color: 'var(--dark)', padding: '12px 16px', fontSize: '0.8rem', fontFamily: 'Montserrat,sans-serif', marginBottom: '25px', letterSpacing: '0.5px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-circle-info" style={{ color: 'var(--gold)' }} />
                            <span>{location.state.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <input type="email" className="auth-input" required value={email}
                                onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                        </div>
                        <div className="auth-input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} className="auth-input"
                                    style={{ paddingRight: '45px' }} required value={password}
                                    onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox-label">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me
                            </label>
                            <button type="button" className="auth-forgot-link"
                                onClick={() => setShowForgotPanel(true)}
                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                                Forgot Password?
                            </button>
                        </div>

                        {error && (
                            <div style={{ color: '#c0392b', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: '#fef0ee', borderLeft: '3px solid #c0392b', borderRadius: '4px' }}>
                                <i className="fas fa-circle-exclamation" style={{ marginRight: 6 }} />{error}
                            </div>
                        )}
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Signing In…</> : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-switch-text">
                        Don't have an account?
                        <Link to="/register" state={{ from: location.state?.from }} className="auth-switch-link">Create Account</Link>
                    </div>
                </div>
            </div>

            <div className="auth-image-side">
                {authImages.map((image, index) => (
                    <div key={index} className={`auth-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url('${image}')` }} />
                ))}
                <div className="auth-image-overlay">
                    <h1 className="auth-brand-name">
                        A<span style={{ display: 'inline-block', transform: 'scaleX(-1)', transformOrigin: 'center' }}>S</span>AT
                    </h1>
                    <p className="auth-brand-tagline">THE INDEPENDENT DESIGNER ATELIER</p>
                </div>
            </div>
        </div>
    );
}

export default UserLogin;
