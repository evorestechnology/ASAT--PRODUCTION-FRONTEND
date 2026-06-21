import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiFetch } from '../api';

const authImages = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
];

const styles = `
    .auth-split-layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        background-color: var(--light);
    }

    /* Left Side: Image Slideshow */
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
        background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%);
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

    /* Right Side: Form */
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
        margin-bottom: 30px;
        letter-spacing: 1px;
    }

    .auth-input-group {
        margin-bottom: 20px;
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
        margin-bottom: 30px;
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
        right: 40px;
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

function UserRegister() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [getUpdates, setGetUpdates] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }
        setLoading(true);
        try {
            // First call our backend register to bypass email rate limits
            const res = await apiFetch('/api/users/register', {
                method: 'POST',
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            // Now sign in to get the JWT session on the client
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            localStorage.setItem('asat_user', JSON.stringify({ fullName, email }));
            navigate('/', { state: { welcomeMessage: `Welcome to ASAT, ${fullName}! Your account has been created successfully.` } });
        } catch (err) {
            console.error('Registration failed:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="auth-split-layout">
            <style>{styles}</style>
            
            {/* Left Side: Image Slideshow */}
            <div className="auth-image-side">
                {authImages.map((image, index) => (
                    <div
                        key={index}
                        className={`auth-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url('${image}')` }}
                    />
                ))}
                <div className="auth-image-overlay">
                    <h1 className="auth-brand-name">ASAT</h1>
                    <p className="auth-brand-tagline">"**A Designer Paradise**"</p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-side">
                <Link to="/" className="auth-back-home">
                    <span>←</span> BACK TO HOME
                </Link>

                <div className="auth-form-container">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Join our elite circle of fashion enthusiasts.</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="auth-input"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>

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
                                    placeholder="Create a password"
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

                        <div className="auth-input-group">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="auth-input"
                                    style={{ paddingRight: '45px' }}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
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
                                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={getUpdates}
                                    onChange={(e) => setGetUpdates(e.target.checked)}
                                /> 
                                Subscribe to exclusive collections
                            </label>
                        </div>
                        {error && (
                            <div style={{ color: '#c0392b', fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', marginBottom: '16px', padding: '10px 12px', background: '#fef0ee', borderLeft: '3px solid #c0392b' }}>
                                {error}
                            </div>
                        )}
                        
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creating Account…' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-switch-text">
                        Already have an account? 
                        <Link to="/login" className="auth-switch-link">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserRegister;
