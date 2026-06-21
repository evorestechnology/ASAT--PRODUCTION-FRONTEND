import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiFetch, setAuthToken } from '../api';

const authImages = [
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=1000&q=80',
];

const styles = `
    .auth-split-layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        background-color: var(--light);
    }

    /* Right Side: Image Slideshow */
    .auth-image-side {
        flex: 1.2;
        position: relative;
        overflow: hidden;
        display: none;
    }

    @media (min-width: 900px) {
        .auth-image-side {
            display: block;
        }
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

    /* Left Side: Form */
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
        font-family: 'Cinzel', serif;
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

    .auth-input::placeholder {
        color: #999;
        font-size: 0.85rem;
    }

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

    .auth-forgot-link:hover {
        color: var(--gold);
    }

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

    .auth-submit-btn:hover {
        background: var(--gold);
    }

    .auth-submit-btn:active {
        transform: scale(0.98);
    }

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

    .auth-switch-link:hover {
        color: var(--gold);
    }

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

    .auth-back-home:hover {
        color: var(--gold);
    }
`;

function UserLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [forgotStatus, setForgotStatus] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotStatus(null);
        setError('');
        if (!email) {
            setForgotStatus({ type: 'error', text: 'Please enter your email address first.' });
            return;
        }
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setForgotStatus({ type: 'success', text: `Password reset email sent to ${email}!` });
        } catch (err) {
            console.error('Password reset error:', err);
            setForgotStatus({ type: 'error', text: 'Failed to send reset email: ' + err.message });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setForgotStatus(null);
        setLoading(true);
        try {
            // Note: Remember Me config / session persistence is managed by Supabase Client initialization options
            const { data: { user: supabaseUser, session }, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;
            
            if (session) {
                setAuthToken(session.access_token);
            }

            // Check the user's role via the backend API
            let roleInfo = null;
            try {
                roleInfo = await apiFetch('/api/auth/resolve-role');
            } catch (err) {
                console.error('Role resolution error:', err);
            }

            if (!roleInfo || roleInfo.role !== 'user') {
                await supabase.auth.signOut();
                setAuthToken(null);
                const roleLabel = roleInfo?.role === 'admin' ? 'Admin' :
                                  roleInfo?.role === 'designer' ? 'Designer' :
                                  roleInfo?.role === 'mfg' ? 'Manufacturer' : null;
                if (roleLabel) {
                    setError(`This account belongs to a ${roleLabel}. Please use the ${roleLabel} login portal instead.`);
                } else {
                    setError('No customer account found. Please register first or use the correct login portal.');
                }
                return;
            }

            const from = location.state?.from;
            const destination = (from && from !== '/') ? from : '/';
            navigate(destination, { state: { welcomeMessage: 'Signed in successfully! Welcome back.' } });
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
            
            {/* Left Side: Form */}
            <div className="auth-form-side">
                <Link to="/" className="auth-back-home">
                    <span>←</span> BACK TO HOME
                </Link>

                <div className="auth-form-container">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to access your elite collection.</p>
                    
                    {location.state?.message && (
                        <div style={{ 
                            background: 'rgba(197, 160, 89, 0.08)', 
                            borderLeft: '3px solid var(--gold)', 
                            color: 'var(--dark)', 
                            padding: '12px 16px', 
                            fontSize: '0.8rem', 
                            fontFamily: 'Montserrat, sans-serif', 
                            marginBottom: '25px',
                            letterSpacing: '0.5px',
                            lineHeight: '1.4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fa-solid fa-circle-info" style={{ color: 'var(--gold)' }}></i>
                            <span>{location.state.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="auth-input"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
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
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe} 
                                    onChange={(e) => setRememberMe(e.target.checked)} 
                                /> Remember me
                            </label>
                            <button 
                                type="button" 
                                className="auth-forgot-link" 
                                onClick={handleForgotPassword}
                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                        
                        {forgotStatus && (
                            <div style={{ color: forgotStatus.type === 'error' ? '#c0392b' : '#1e7e34', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: forgotStatus.type === 'error' ? '#fef0ee' : '#eafaf1', borderLeft: `3px solid ${forgotStatus.type === 'error' ? '#c0392b' : '#28a745'}` }}>
                                {forgotStatus.text}
                            </div>
                        )}
                        
                        {error && (
                            <div style={{ color: '#c0392b', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: '#fef0ee', borderLeft: '3px solid #c0392b' }}>
                                {error}
                            </div>
                        )}
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing In…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-switch-text">
                        Don't have an account? 
                        <Link to="/register" className="auth-switch-link">Create Account</Link>
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
        </div>
    );
}

export default UserLogin;
