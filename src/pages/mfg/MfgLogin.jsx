import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

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
        background: var(--dark);
    }
    @media (min-width: 900px) {
        .auth-image-side { display: flex; }
    }
    .auth-image-side__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 60px;
        text-align: center;
    }
    .auth-image-side__icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid var(--gold);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30px;
        color: var(--gold);
        font-size: 1.8rem;
    }
    .auth-brand-name {
        font-family: 'Cinzel', serif;
        font-size: 2.5rem;
        letter-spacing: 4px;
        font-weight: 700;
        color: white;
        margin-bottom: 12px;
    }
    .auth-brand-tagline {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        letter-spacing: 3px;
        color: var(--gold);
        text-transform: uppercase;
    }
    .auth-brand-role {
        margin-top: 24px;
        padding: 6px 24px;
        border: 1px solid rgba(197,160,89,0.3);
        border-radius: 20px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.6rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.4);
    }
    .auth-form-side {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
    }
    .auth-form-container { width: 100%; max-width: 400px; }
    .auth-title {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
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
    .auth-input-group { margin-bottom: 25px; }
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
        justify-content: flex-end;
        margin-bottom: 35px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
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
`;

function MfgLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user, role, loading: authLoading, logout } = useAuth();
    const [justLoggedIn, setJustLoggedIn] = useState(false);

    useEffect(() => {
        // Wait until login was attempted AND auth is no longer loading
        if (!justLoggedIn || authLoading) return;

        if (user === null) {
            setError('Authentication failed. Please try again.');
            setJustLoggedIn(false);
            return;
        }

        // role is still resolving from the backend — wait for it
        if (role === null) return;

        if (role === 'mfg') {
            // Verify manufacturer profile exists
            const verifyManufacturer = async () => {
                try {
                    const mfgData = await apiFetch('/api/manufacturers/me');
                    if (mfgData) {
                        navigate('/mfg', { replace: true });
                    } else {
                        logout();
                        setError('Access denied. This account is not a manufacturer.');
                    }
                } catch (err) {
                    console.error('Failed to fetch manufacturer profile:', err);
                    logout();
                    setError('Unable to verify manufacturer profile. Please try again.');
                }
            };
            verifyManufacturer();
        } else {
            // User is logged in but not a manufacturer
            logout();
            setError('Access denied. This account is not a manufacturer.');
        }
        setJustLoggedIn(false);
    }, [justLoggedIn, authLoading, user, role, logout, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let loginEmail = username;
            if (!username.includes('@')) {
                const data = await apiFetch(`/api/manufacturers/by-name/${encodeURIComponent(username)}`).catch(() => null);
                if (data && data.email) {
                    loginEmail = data.email;
                } else {
                    setError('No account found with this business name/email.');
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

    return (
        <div className="auth-split-layout">
            <style>{styles}</style>

            {/* Left Side: Dark branded panel */}
            <div className="auth-image-side">
                <div className="auth-image-side__content">
                    <div className="auth-image-side__icon"><i className="fas fa-industry"></i></div>
                    <h1 className="auth-brand-name">As Simple as That</h1>
                    <p className="auth-brand-tagline">**A Designer Paradise**</p>
                    <div className="auth-brand-role">Manufacturer</div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-side">
                <div className="auth-form-container">
                    <h2 className="auth-title">Manufacturer Portal</h2>
                    <p className="auth-subtitle">Sign in to manage orders and production.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Username or Email</label>
                            <input type="text" className="auth-input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username or email" />
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
                                    placeholder="Enter password"
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
                            <a href="#" className="auth-forgot-link">Forgot Password?</a>
                        </div>

                        {error && (
                            <div style={{ color: '#c0392b', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: '#fef0ee', borderLeft: '3px solid #c0392b' }}>
                                {error}
                            </div>
                        )}
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing In…' : 'Enter Portal'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MfgLogin;