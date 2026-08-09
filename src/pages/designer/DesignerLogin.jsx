import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch, setAuthToken } from '../../api';
import { useAuth } from '../../context/AuthContext';

const authImages = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
];

const styles = `
    .auth-split-layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        background-color: var(--light);
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
    .auth-slide.active {
        opacity: 1;
        transform: scale(1);
    }
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
        font-family: 'Cinzel', serif;
        font-size: 3rem;
        letter-spacing: 4px;
        font-weight: 700;
        margin-bottom: 15px;
        text-shadow: 0 4px 15px rgba(0,0,0,0.4);
    }
    .auth-brand-tagline {
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        letter-spacing: 2px;
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
    }
    .auth-form-container {
        width: 100%;
        max-width: 420px;
    }
    .auth-title {
        font-family: serif;
        font-size: 2.2rem;
        color: var(--dark);
        margin-bottom: 10px;
        font-weight: 700;
        letter-spacing: 2px;
    }
    .auth-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 40px;
        letter-spacing: 1px;
    }
    .auth-input-group {
        margin-bottom: 25px;
    }
    .auth-input-group label {
        display: block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 1.5px;
        color: var(--dark);
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: 600;
    }
    .auth-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.02);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem;
        color: var(--dark);
        transition: all 0.3s ease;
        outline: none;
        box-sizing: border-box;
    }
    .auth-input:focus {
        border-color: var(--gold);
        background: #fff;
        box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
    }
    .auth-input::placeholder { color: #999; font-size: 0.85rem; }
    .auth-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 35px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
    }
    .auth-checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        cursor: pointer;
    }
    .auth-checkbox-label input {
        accent-color: var(--dark);
        cursor: pointer;
        width: 16px;
        height: 16px;
    }
    .auth-forgot-link {
        color: var(--dark);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s;
    }
    .auth-forgot-link:hover { color: var(--gold); }
    .auth-submit-btn {
        width: 100%;
        padding: 16px;
        background: var(--dark);
        color: white;
        border: none;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 2px;
        cursor: pointer;
        transition: background 0.3s, transform 0.2s;
        text-transform: uppercase;
        font-weight: 600;
    }
    .auth-submit-btn:hover { background: var(--gold); }
    .auth-submit-btn:active { transform: scale(0.98); }
    .auth-switch-text {
        text-align: center;
        margin-top: 30px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #666;
    }
    .auth-switch-link {
        color: var(--dark);
        font-weight: 600;
        text-decoration: none;
        margin-left: 5px;
        transition: color 0.3s;
    }
    .auth-switch-link:hover { color: var(--gold); }
    .auth-back-home {
        position: absolute;
        top: 30px;
        left: 40px;
        color: var(--dark);
        text-decoration: none;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        letter-spacing: 1px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.3s;
    }
    .auth-back-home:hover { color: var(--gold); }

    /* ─── Login T&C Gate Modal ─── */
    .ltc-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(5,5,5,0.97);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Montserrat', sans-serif;
    }
    .ltc-container {
        width: 100%;
        max-width: 740px;
        max-height: 90vh;
        background: #0e0e0e;
        border: 1px solid rgba(197,160,89,0.3);
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 40px 80px rgba(0,0,0,0.9), 0 0 60px rgba(197,160,89,0.07);
        overflow: hidden;
    }
    .ltc-header {
        padding: 26px 32px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        flex-shrink: 0;
        background: linear-gradient(180deg, rgba(197,160,89,0.06) 0%, transparent 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .ltc-title {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: 2px;
        color: #fff;
    }
    .ltc-title span { color: var(--gold); }
    .ltc-subtitle { font-size: 0.7rem; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
    .ltc-scroll-hint {
        font-size: 0.7rem; color: rgba(197,160,89,0.7);
        display: flex; align-items: center; gap: 6px;
        animation: ltc-pulse 2s ease infinite;
    }
    @keyframes ltc-pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
    .ltc-body {
        flex: 1; overflow-y: auto; padding: 26px 32px;
        color: rgba(255,255,255,0.82); font-size: 0.87rem; line-height: 1.75;
    }
    .ltc-body::-webkit-scrollbar { width: 4px; }
    .ltc-body::-webkit-scrollbar-thumb { background: rgba(197,160,89,0.35); border-radius: 10px; }
    .ltc-section { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .ltc-section:last-child { border-bottom: none; margin-bottom: 0; }
    .ltc-section-title {
        font-family: 'Cinzel', serif; font-size: 0.92rem; color: var(--gold);
        margin-bottom: 14px; font-weight: 700; letter-spacing: 1.5px;
        display: flex; align-items: center; gap: 8px;
    }
    .ltc-section-title::before {
        content: ''; display: inline-block; width: 3px; height: 16px;
        background: var(--gold); border-radius: 2px; flex-shrink: 0;
    }
    .ltc-clause {
        margin-bottom: 10px; padding-left: 12px;
        border-left: 1px solid rgba(197,160,89,0.12);
        color: rgba(255,255,255,0.75); font-size: 0.85rem;
    }
    .ltc-clause-num { font-weight: 700; color: rgba(197,160,89,0.85); margin-right: 5px; }
    .ltc-bullet-list { list-style: none; padding: 0; margin-top: 8px; }
    .ltc-bullet-list li { padding: 4px 0 4px 20px; position: relative; color: rgba(255,255,255,0.68); font-size: 0.83rem; }
    .ltc-bullet-list li::before { content: '◆'; position: absolute; left: 0; color: rgba(197,160,89,0.5); font-size: 0.55rem; top: 7px; }
    .ltc-footer {
        padding: 20px 32px;
        border-top: 1px solid rgba(255,255,255,0.07);
        flex-shrink: 0; background: #0e0e0e;
    }
    .ltc-accept-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px;
        background: rgba(197,160,89,0.05);
        border: 1px solid rgba(197,160,89,0.2);
        border-radius: 8px; margin-bottom: 14px; cursor: pointer; transition: all 0.3s;
    }
    .ltc-accept-row.enabled:hover { border-color: rgba(197,160,89,0.5); background: rgba(197,160,89,0.09); }
    .ltc-accept-row.disabled { opacity: 0.4; cursor: not-allowed; }
    .ltc-accept-row input[type="checkbox"] { width: 17px; height: 17px; accent-color: var(--gold); cursor: inherit; flex-shrink: 0; }
    .ltc-accept-row span { font-size: 0.82rem; color: rgba(255,255,255,0.85); line-height: 1.5; }
    .ltc-scroll-progress { font-size: 0.7rem; color: rgba(197,160,89,0.6); text-align: center; margin-bottom: 10px; letter-spacing: 0.5px; }
    .ltc-btn-row { display: flex; gap: 10px; justify-content: flex-end; }
    .ltc-btn {
        padding: 11px 22px; font-family: 'Cinzel', serif; font-size: 0.75rem;
        letter-spacing: 2px; font-weight: 700; border: none; cursor: pointer;
        transition: all 0.3s; text-transform: uppercase; border-radius: 2px;
    }
    .ltc-btn--cancel { background: transparent; color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.15); }
    .ltc-btn--cancel:hover { color: white; border-color: rgba(255,255,255,0.4); }
    .ltc-btn--accept { background: var(--gold); color: #0c0c0c; box-shadow: 0 4px 15px rgba(197,160,89,0.25); }
    .ltc-btn--accept:hover:not(:disabled) { background: #e8c97a; transform: translateY(-1px); }
    .ltc-btn--accept:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
`;

function DesignerLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const successMsg = location.state?.successMessage;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user, role, loading: authLoading, logout, authError, setAuthError } = useAuth();
    const [justLoggedIn, setJustLoggedIn] = useState(false);

    // Clear any stale auth errors when the component unmounts
    useEffect(() => {
        return () => { if (setAuthError) setAuthError(null); };
    }, [setAuthError]);

    // T&C gate for existing designers who haven't accepted yet
    const [showTcGate, setShowTcGate] = useState(false);
    const [tcScrolled, setTcScrolled] = useState(false);
    const [tcChecked, setTcChecked] = useState(false);
    const [tcAccepting, setTcAccepting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Wait until login was attempted AND auth is no longer loading
        if (!justLoggedIn || authLoading) return;

        if (user === null) {
            // Check if AuthContext captured a specific account-status error from resolve-role
            if (authError?.accountBlocked) {
                setError('Your designer account has been blocked by admin. Please contact ASAT support.');
            } else {
                setError('Authentication failed. Please try again.');
            }
            if (setAuthError) setAuthError(null); // Clear so it doesn't persist
            setJustLoggedIn(false);
            return;
        }

        // role is still resolving from the backend — wait for it
        if (role === null) return;

        if (role === 'designer') {
            // Verify designer profile exists
            const verifyDesigner = async () => {
                try {
                    const designerData = await apiFetch('/api/designers/me');
                    if (designerData) {
                        // Check if terms have been accepted
                        if (!designerData.terms_accepted) {
                            // Show T&C gate before allowing access
                            setShowTcGate(true);
                            setTcScrolled(false);
                            setTcChecked(false);
                        } else {
                            navigate('/designer', { replace: true });
                        }
                    } else {
                        logout();
                        setError('Access denied. This account is not a designer.');
                    }
                } catch (err) {
                    console.error('Failed to fetch designer profile:', err);
                    logout();
                    setError('Unable to verify designer profile. Please try again.');
                }
            };
            verifyDesigner();
        } else {
            // User is logged in but not a designer
            logout();
            setError('Access denied. This account is not a designer.');
        }
        setJustLoggedIn(false);
    }, [justLoggedIn, authLoading, user, role, logout, navigate, authError, setAuthError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let loginEmail = identifier;
            if (!identifier.includes('@')) {
                // Look up email by username
                const data = await apiFetch(`/api/designers/${identifier.trim().toLowerCase()}`).catch(() => null);
                if (data && data.email) {
                    loginEmail = data.email;
                } else {
                    setError('No account found with this username.');
                    setLoading(false);
                    return;
                }
            }

            const { data: { user: supabaseUser, session }, error: signInError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });
            if (signInError) throw signInError;
            // Note: we do NOT set the auth token here; AuthContext will handle it via onAuthStateChange
            setJustLoggedIn(true);
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err.message || 'Sign in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTcScroll = (e) => {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) setTcScrolled(true);
    };

    const handleAcceptTcAndLogin = async () => {
        if (!tcChecked || tcAccepting) return;
        setTcAccepting(true);
        try {
            await apiFetch('/api/designers/me', {
                method: 'PUT',
                body: JSON.stringify({ terms_accepted: true, terms_accepted_at: new Date().toISOString() })
            });
            setShowTcGate(false);
            navigate('/designer', { replace: true });
        } catch (err) {
            console.error('Failed to save T&C acceptance:', err);
            // Allow navigation anyway since they've accepted
            setShowTcGate(false);
            navigate('/designer', { replace: true });
        } finally {
            setTcAccepting(false);
        }
    };

    const handleDeclineTc = () => {
        setShowTcGate(false);
        logout();
        setError('You must accept the Terms & Conditions to access your Designer account.');
    };

    return (
        <div className="auth-split-layout">
            <style>{styles}</style>

            {/* Left Side: Form */}
            <div className="auth-form-side">
                <Link to="/" className="auth-back-home">
                    <span>←</span> BACK TO HOME
                </Link>

                <div className="auth-form-container">
                    <h2 className="auth-title">As Simple as That</h2>
                    <p className="auth-subtitle">**A Designer Paradise** — sign in to your studio.</p>

                    {successMsg && (
                        <div style={{
                            color: '#1e7e34',
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '0.82rem',
                            marginBottom: '24px',
                            padding: '12px 16px',
                            background: '#eafaf1',
                            borderLeft: '4px solid #28a745',
                            borderRadius: '4px',
                            boxShadow: '0 2px 10px rgba(40, 167, 69, 0.05)',
                            lineHeight: '1.5'
                        }}>
                            ✦ {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Username or Email</label>
                            <input
                                type="text"
                                className="auth-input"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter your username or email"
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="auth-input"
                                    style={{ paddingRight: '45px' }}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    style={{
                                        position: 'absolute',
                                        right: '15px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox-label">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className="auth-forgot-link">Forgot Password?</a>
                        </div>

                        {error && (
                            <div style={{ color: '#c0392b', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: '#fef0ee', borderLeft: '3px solid #c0392b' }}>
                                {error}
                            </div>
                        )}
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing In…' : 'Enter the Paradise'}
                        </button>
                    </form>

                    <div className="auth-switch-text">
                        New here?
                        <Link to="/designer/register" className="auth-switch-link">Join the Paradise</Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Image Slideshow */}
            <div className="auth-image-side">
                {authImages.map((image, index) => (
                    <div
                        key={index}
                        className={`auth-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url('${image}')` }}
                    />
                ))}
                <div className="auth-image-overlay">
                    <h1 className="auth-brand-name">As Simple as That</h1>
                    <p className="auth-brand-tagline">**A Designer Paradise**</p>
                </div>
            </div>

            {/* ─── T&C Gate Modal for legacy accounts ─── */}
            {showTcGate && (
                <div className="ltc-overlay">
                    <div className="ltc-container">
                        <div className="ltc-header">
                            <div>
                                <div className="ltc-title">ASAT <span>DESIGNER</span> TERMS</div>
                                <div className="ltc-subtitle">One-time acceptance required to continue</div>
                            </div>
                            {!tcScrolled ? (
                                <div className="ltc-scroll-hint"><i className="fas fa-arrow-down"></i> Scroll to read</div>
                            ) : (
                                <div style={{ color: 'rgba(76,175,80,0.9)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fas fa-check-circle"></i> Fully read
                                </div>
                            )}
                        </div>

                        <div className="ltc-body" onScroll={handleTcScroll}>
                            <div className="ltc-section">
                                <div className="ltc-section-title">1. Eligibility &amp; Account Requirements</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">1.1</span>Any individual or legally registered business that wishes to sell fashion designs through the Platform may create a Designer Account by completing the registration process and accepting these Designer Terms &amp; Conditions and all applicable Platform Policies.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">1.2</span>By registering as a designer, you confirm that all information provided during registration is accurate, complete, and up to date. You agree to promptly update your information whenever any changes occur.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">1.3–1.6</span>The Platform reserves the right to verify identity, restrict or suspend accounts for violations, and each designer may maintain only one active account. Please refer to the full Terms &amp; Conditions on our <Link to="/designer/terms" style={{ color: 'var(--gold)' }}>Terms page</Link>.</div>
                            </div>
                            <div className="ltc-section">
                                <div className="ltc-section-title">2. Designer Responsibilities</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">2.1–2.3</span>Designers are solely responsible for all content published. Every design must be original creative work. All designs must comply with the Platform policies and applicable laws.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">2.4</span>Strictly <strong style={{ color: 'rgba(229,57,53,0.8)' }}>prohibited</strong>: AI-generated designs, copyrighted content without authorization, plagiarized work, religious/political content, fan art, hate speech, obscene or illegal content, or any design infringing third-party rights.</div>
                            </div>
                            <div className="ltc-section">
                                <div className="ltc-section-title">3. Marketplace Role &amp; 4. Payment Policy</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">3.1–3.5</span>ASAT operates as a technology-enabled fashion marketplace. The Platform manages manufacturing, shipping, and delivery. Designers receive design remuneration per completed order.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">4.1–4.9</span>Designers have a dedicated Wallet for earnings. Withdrawals are processed within 72 hours. No platform fees or deductions apply. Base currency is INR. Designers are responsible for their own taxes. The Platform may place holds for fraud investigations.</div>
                            </div>
                            <div className="ltc-section">
                                <div className="ltc-section-title">5. Intellectual Property Policy</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">5.1</span>All original designs remain the exclusive intellectual property of the designer. The Platform does not claim ownership.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">5.2</span>By uploading designs, you grant ASAT a limited license to display, manufacture, promote, and use designs in marketing materials related to the Platform.</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">5.3–5.7</span>Designers warrant they own or have rights to all uploaded designs. The Platform may remove infringing content. The designer authorizes use of their work in Platform marketing without additional compensation.</div>
                            </div>
                            <div className="ltc-section">
                                <div className="ltc-section-title">6. Product Appearance Policy</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">6.1–6.8</span>Designers must upload clear, accurate, high-quality images. AI-generated product images are allowed. Minor color, size, and fabric variations during manufacturing are normal and not considered defects. All images must accurately represent the original design.</div>
                            </div>
                            <div className="ltc-section">
                                <div className="ltc-section-title">7. Privacy Policy</div>
                                <div className="ltc-clause"><span className="ltc-clause-num">7.1–7.8</span>ASAT collects personal, business, payment, and order-related information to operate the Platform. Data is shared with service partners as needed for Platform operations. Designer personal information is not sold to third parties. Data is retained as long as legally required.</div>
                            </div>
                        </div>

                        <div className="ltc-footer">
                            {!tcScrolled && (
                                <div className="ltc-scroll-progress">↓ Please scroll down to read all sections before accepting</div>
                            )}
                            <div className={`ltc-accept-row ${tcScrolled ? 'enabled' : 'disabled'}`} onClick={() => { if (tcScrolled) setTcChecked(p => !p); }}>
                                <input type="checkbox" checked={tcChecked} disabled={!tcScrolled} onChange={e => e.stopPropagation()} />
                                <span>I have read and fully accept the ASAT Designer Terms &amp; Conditions, Platform Policies, and Privacy Policy.</span>
                            </div>
                            <div className="ltc-btn-row">
                                <button type="button" className="ltc-btn ltc-btn--cancel" onClick={handleDeclineTc}>Decline &amp; Sign Out</button>
                                <button type="button" className="ltc-btn ltc-btn--accept" disabled={!tcChecked || tcAccepting} onClick={handleAcceptTcAndLogin}>
                                    {tcAccepting ? 'Saving…' : 'Accept & Enter the Paradise'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DesignerLogin;