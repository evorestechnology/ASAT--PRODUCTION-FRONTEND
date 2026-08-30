import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiFetch } from '../api';
import TermsModal from './TermsModal';
import CustomDatePicker from './CustomDatePicker';

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

    /* Right Side: Form */
    .auth-form-side {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
        background: #FFFFFF;
    }

    .auth-form-container {
        width: 100%;
        max-width: 400px;
    }

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
        margin-bottom: 30px;
        letter-spacing: 0.5px;
    }

    .auth-input-group {
        margin-bottom: 18px;
    }

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

    .auth-input::placeholder {
        color: #999;
        font-size: 0.85rem;
    }

    .auth-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
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
        accent-color: #000000;
        cursor: pointer;
        width: 16px;
        height: 16px;
    }

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
    }

    .auth-submit-btn:hover {
        opacity: 0.85;
        transform: translateY(-1px);
    }

    .auth-submit-btn:active {
        transform: scale(0.98);
    }

    .auth-switch-text {
        text-align: center;
        margin-top: 28px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.85rem;
        color: #666;
    }

    .auth-switch-link {
        color: #000000;
        font-weight: 700;
        text-decoration: none;
        margin-left: 5px;
    }

    .auth-switch-link:hover {
        text-decoration: underline;
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
    const location = useLocation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [mobileNumber, setMobileNumber] = useState('');
    const [dob, setDob] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [getUpdates, setGetUpdates] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!acceptedTerms) {
            setError('You must accept the Terms & Conditions to create an account.');
            return;
        }
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
                    password,
                    countryCode,
                    mobileNumber,
                    dob
                })
            });

            // Now sign in to get the JWT session on the client
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            localStorage.setItem('asat_user', JSON.stringify({ fullName, email, countryCode, mobileNumber, dob }));

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
            navigate((from && from !== '/') ? from : '/', { state: { welcomeMessage: `Welcome to ASAT, ${fullName}! Your account has been created successfully.` } });
        } catch (err) {
            console.error('Registration failed:', err);
            let errMsg = 'Registration failed. Please try again.';
            if (err) {
                if (typeof err === 'string') errMsg = err;
                else if (err.error && typeof err.error === 'string') errMsg = err.error;
                else if (err.message && typeof err.message === 'string') errMsg = err.message;
                else if (err.errors) errMsg = Object.values(err.errors).join(', ');
                else {
                    try {
                        errMsg = JSON.stringify(err);
                    } catch (_) {}
                }
            }
            setError(errMsg);
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
                    <h1 className="auth-brand-name">
                        A<span style={{ display: 'inline-block', transform: 'scaleX(-1)', transformOrigin: 'center' }}>S</span>AT
                    </h1>
                    <p className="auth-brand-tagline">THE INDEPENDENT DESIGNER ATELIER</p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-side">
                <Link to="/" className="auth-back-home">
                    <span>←</span> BACK TO HOME
                </Link>

                <div className="auth-form-container">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Join and purchase your elite collection.</p>
                    
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
                        
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
                            <div style={{ width: '30%' }}>
                                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1px', color: '#000000', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Code</label>
                                <input
                                    type="text"
                                    className="auth-input"
                                    required
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    placeholder="+91"
                                />
                            </div>
                            <div style={{ width: '70%' }}>
                                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1px', color: '#000000', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Mobile Number</label>
                                <input
                                    type="tel"
                                    className="auth-input"
                                    required
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    placeholder="Enter mobile number"
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Date of Birth</label>
                            <CustomDatePicker
                                value={dob}
                                onChange={setDob}
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

                        <div className="auth-options" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                            <label className="auth-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                /> 
                                <span>I agree to the <span 
                                    onClick={() => setIsTermsOpen(true)}
                                    style={{ color: 'var(--dark)', textDecoration: 'underline', cursor: 'pointer' }}
                                >Terms and Conditions</span></span>
                            </label>
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
            
            <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
    );
}

export default UserRegister;
