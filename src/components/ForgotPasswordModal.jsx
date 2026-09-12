import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';

const fpStyles = `
    .fp-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
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
        background: rgba(0, 0, 0, 0.65);
        pointer-events: all;
        backdrop-filter: blur(4px);
        visibility: visible;
    }
    .fp-panel {
        width: 100%;
        max-width: 480px;
        background: #FFFFFF;
        border-radius: 20px 20px 0 0;
        padding: 36px 36px 52px;
        box-shadow: 0 -12px 60px rgba(0, 0, 0, 0.25);
        transform: translateY(110%);
        transition: transform 0.4s cubic-bezier(0.34, 1.1, 0.64, 1);
        position: relative;
        box-sizing: border-box;
    }
    @media (min-width: 600px) {
        .fp-overlay { align-items: center; }
        .fp-panel { border-radius: 20px; max-height: 90vh; overflow-y: auto; }
    }
    @media (max-width: 480px) {
        .fp-panel { padding: 24px 16px 36px; border-radius: 16px 16px 0 0; }
        .fp-title { font-size: 1.25rem; }
        .fp-otp-row { gap: 6px !important; }
        .fp-otp-digit { width: clamp(34px, 11vw, 44px) !important; height: 48px !important; font-size: 1.25rem !important; border-radius: 8px !important; }
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
    .fp-close-btn:hover { color: #000; background: #f0f0f0; }
    .fp-gold-bar { width: 40px; height: 3px; background: linear-gradient(90deg, #C5A059, #e8c97a); border-radius: 2px; margin-bottom: 22px; }
    .fp-title { font-family: 'Cinzel', serif; font-size: 1.45rem; font-weight: 700; color: #111; letter-spacing: 1.5px; margin-bottom: 6px; }
    .fp-subtitle { font-family: 'Montserrat', sans-serif; font-size: 0.8rem; color: #666; margin-bottom: 28px; line-height: 1.55; }

    .fp-steps { display: flex; align-items: center; gap: 0; margin-bottom: 28px; }
    .fp-step-dot {
        width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ddd; background: #fff;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; color: #aaa;
        flex-shrink: 0; transition: all 0.3s ease;
    }
    .fp-step-dot.active { border-color: #C5A059; background: #C5A059; color: #fff; box-shadow: 0 0 0 4px rgba(197,160,89,0.18); }
    .fp-step-dot.done { border-color: #2ecc71; background: #2ecc71; color: #fff; }
    .fp-step-line { flex: 1; height: 2px; background: #eee; transition: background 0.3s ease; }
    .fp-step-line.done { background: #2ecc71; }

    .fp-otp-row { display: flex; gap: 10px; justify-content: center; margin: 20px 0 8px; }
    .fp-otp-digit {
        width: 48px; height: 56px; border: 2px solid #e0e0e0; border-radius: 10px;
        text-align: center; font-family: 'Courier New', monospace; font-size: 1.6rem; font-weight: 700;
        color: #111; background: #fafafa; outline: none;
        transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        caret-color: #C5A059;
    }
    .fp-otp-digit:focus { border-color: #C5A059; background: #fff; box-shadow: 0 0 0 3px rgba(197,160,89,0.18); }
    .fp-otp-digit.filled { border-color: #C5A059; background: rgba(197,160,89,0.06); }

    .fp-alert {
        padding: 11px 14px; border-radius: 8px; font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem; line-height: 1.5; margin-bottom: 18px;
        display: flex; align-items: flex-start; gap: 8px;
    }
    .fp-alert--error { background: #fef0ee; border-left: 3px solid #e74c3c; color: #c0392b; }
    .fp-alert--success { background: #eafaf1; border-left: 3px solid #2ecc71; color: #1a7a42; }
    .fp-alert--info { background: rgba(197,160,89,0.08); border-left: 3px solid #C5A059; color: #7a6020; }

    .fp-btn {
        width: 100%; padding: 15px; background: #111111; color: #fff; border: none;
        border-radius: 8px; font-family: 'Cinzel', serif; font-size: 0.88rem;
        letter-spacing: 1.8px; text-transform: uppercase; font-weight: 700;
        cursor: pointer; transition: background 0.3s, transform 0.15s, box-shadow 0.3s; margin-top: 6px;
    }
    .fp-btn:hover:not(:disabled) { background: #C5A059; box-shadow: 0 4px 18px rgba(197,160,89,0.35); }
    .fp-btn:active:not(:disabled) { transform: scale(0.98); }
    .fp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .fp-resend-row { text-align: center; margin-top: 14px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: #888; }
    .fp-resend-btn {
        background: none; border: none; color: #C5A059;
        font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700;
        cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px;
        transition: opacity 0.2s;
    }
    .fp-resend-btn:disabled { color: #bbb; cursor: not-allowed; text-decoration: none; }

    .fp-input-wrap { position: relative; margin-bottom: 18px; }
    .fp-input {
        width: 100%; padding: 13px 45px 13px 15px; border: 2px solid #e8e8e8; border-radius: 10px;
        font-family: 'Montserrat', sans-serif; font-size: 0.9rem; color: #111;
        background: #fafafa; outline: none;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s; box-sizing: border-box;
    }
    .fp-input:focus { border-color: #C5A059; background: #fff; box-shadow: 0 0 0 3px rgba(197,160,89,0.15); }
    .fp-input::placeholder { color: #bbb; }
    .fp-eye-btn {
        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: #aaa; cursor: pointer; font-size: 0.95rem;
        padding: 0; display: flex; align-items: center; transition: color 0.2s;
    }
    .fp-eye-btn:hover { color: #111; }
    .fp-label {
        display: block; font-family: 'Montserrat', sans-serif; font-size: 0.72rem;
        font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #555; margin-bottom: 7px;
    }

    .fp-back-link {
        background: none; border: none; color: #C5A059;
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

export default function ForgotPasswordModal({ isOpen, onClose }) {
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
                setFpStep(1); setFpEmail(''); setFpOtp(['', '', '', '', '', '']);
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
        const cleanEmail = fpEmail.trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setFpAlert({ type: 'error', text: 'Please enter a valid Gmail address.' });
            return;
        }
        setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/send-otp', {
                method: 'POST', body: JSON.stringify({ email: cleanEmail }),
            });
            setFpAlert({ type: 'info', text: `A 6-digit reset code has been sent to ${cleanEmail}. Check your inbox (and spam folder).` });
            setFpResendCountdown(60);
            setFpStep(2);
        } catch (err) {
            setFpAlert({ type: 'error', text: err.error || err.message || 'Failed to send reset code.' });
        } finally { setFpLoading(false); }
    };

    const handleVerifyOtp = async () => {
        setFpAlert(null);
        if (otpValue.length !== 6) {
            setFpAlert({ type: 'error', text: 'Please enter the full 6-digit code.' });
            return;
        }
        setFpLoading(true);
        try {
            setFpStep(3);
            setFpAlert(null);
        } finally { setFpLoading(false); }
    };

    const handleResetPassword = async () => {
        setFpAlert(null);
        if (fpNewPw.length < 6) {
            setFpAlert({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }
        if (fpNewPw !== fpConfirmPw) {
            setFpAlert({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/reset', {
                method: 'POST',
                body: JSON.stringify({ email: fpEmail.trim().toLowerCase(), otp: otpValue, newPassword: fpNewPw }),
            });
            setFpStep(4);
            setFpAlert(null);
        } catch (err) {
            const msg = err.error || err.message || 'Failed to reset password.';
            setFpAlert({ type: 'error', text: msg });
        } finally { setFpLoading(false); }
    };

    const handleResend = async () => {
        setFpAlert(null);
        setFpLoading(true);
        try {
            await apiFetch('/api/auth/forgot-password/send-otp', {
                method: 'POST', body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
            });
            setFpOtp(['', '', '', '', '', '']);
            setFpResendCountdown(60);
            otpRefs.current[0]?.focus();
            setFpAlert({ type: 'info', text: 'A new reset code has been sent to your Gmail.' });
        } catch (err) {
            setFpAlert({ type: 'error', text: err.error || err.message || 'Failed to resend code.' });
        } finally { setFpLoading(false); }
    };

    const strength = getStrength(fpNewPw);
    const stepLabels = ['Gmail', 'Verify', 'Password'];

    return (
        <div className={`fp-overlay${isOpen ? ' fp-overlay--open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <style>{fpStyles}</style>
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
                                        <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.6rem', fontWeight: 600, color: isActive ? '#C5A059' : isDone ? '#2ecc71' : '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
                                    </div>
                                    {i < stepLabels.length - 1 && <div className={`fp-step-line${fpStep > n ? ' done' : ''}`} style={{ marginBottom: 18 }} />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}

                {/* STEP 1: Enter Gmail */}
                {fpStep === 1 && (<>
                    <div className="fp-gold-bar" />
                    <div className="fp-title">Reset Password</div>
                    <div className="fp-subtitle">Enter the Gmail address linked to your account and we'll send you a 6-digit verification code.</div>
                    {fpAlert && (
                        <div className={`fp-alert fp-alert--${fpAlert.type}`}>
                            <i className={`fas ${fpAlert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} style={{ flexShrink: 0, marginTop: 1 }} />
                            {fpAlert.text}
                        </div>
                    )}
                    <label className="fp-label">Gmail</label>
                    <div className="fp-input-wrap">
                        <input id="fp-email" type="email" className="fp-input" placeholder="Enter your Gmail"
                            value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                            autoComplete="email" autoFocus />
                    </div>
                    <button className="fp-btn" onClick={handleSendOtp} disabled={fpLoading}>
                        {fpLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Sending…</> : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }} />Send Reset Code</>}
                    </button>
                </>)}

                {/* STEP 2: Verify Code */}
                {fpStep === 2 && (<>
                    <div className="fp-gold-bar" />
                    <div className="fp-title">Enter Code</div>
                    <div className="fp-subtitle">We sent a 6-digit code to <strong style={{ color: '#000' }}>{fpEmail}</strong>. Valid for 5 minutes.</div>
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
                            ? <>Resend code in <strong style={{ color: '#000' }}>{fpResendCountdown}s</strong></>
                            : <>Didn't receive it?&nbsp;<button className="fp-resend-btn" onClick={handleResend} disabled={fpLoading}>Resend Code</button></>
                        }
                    </div>
                    <button className="fp-btn" style={{ marginTop: 22 }} onClick={handleVerifyOtp} disabled={fpLoading || otpValue.length !== 6}>
                        {fpLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Verifying…</> : <><i className="fas fa-shield-halved" style={{ marginRight: 8 }} />Verify Code</>}
                    </button>
                    <button className="fp-back-link" onClick={() => { setFpStep(1); setFpAlert(null); }}>← Change Gmail address</button>
                </>)}

                {/* STEP 3: Set New Password */}
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
                        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', boxShadow: '0 6px 24px rgba(46,204,113,0.35)' }}>
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
