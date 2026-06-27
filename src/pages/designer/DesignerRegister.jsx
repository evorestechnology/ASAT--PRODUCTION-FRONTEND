import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch, setAuthToken, uploadFile } from '../../api';

const authImages = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
];

const COUNTRY_CODES = ['+91 India','+1 USA','+44 UK','+971 UAE','+61 Australia','+81 Japan','+49 Germany','+33 France','+86 China','+55 Brazil','+27 South Africa','+82 South Korea'];
const COUNTRIES = ['India','United States','United Kingdom','United Arab Emirates','Australia','Japan','Germany','France','China','Brazil','South Africa','South Korea','Canada','Singapore','Italy','Spain','Netherlands','Sweden','Switzerland','Mexico'];



const styles = `
    .auth-split-layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        background-color: var(--light);
    }
    .auth-image-side {
        flex: 1;
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
    }
    .auth-form-side {
        flex: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
        overflow-y: auto;
    }
    .auth-form-container { width: 100%; max-width: 480px; }
    .auth-title {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        color: var(--dark);
        margin-bottom: 8px;
        font-weight: 700;
        letter-spacing: 2px;
    }
    .auth-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 28px;
        letter-spacing: 1px;
    }
    .auth-input-group { margin-bottom: 18px; }
    .auth-input-group label {
        display: block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        letter-spacing: 1.5px;
        color: var(--dark);
        margin-bottom: 6px;
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
    .auth-select {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.02);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem;
        color: var(--dark);
        outline: none;
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.3s ease;
    }
    .auth-select:focus {
        border-color: var(--gold);
        background: #fff;
        box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
    }
    .auth-row { display: flex; gap: 20px; }
    .auth-row .auth-input-group { flex: 1; }
    .auth-phone-row { display: flex; gap: 10px; align-items: stretch; }
    .auth-phone-row select {
        width: 140px;
        padding: 12px 16px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.02);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        cursor: pointer;
        transition: all 0.3s ease;
        box-sizing: border-box;
    }
    .auth-phone-row select:focus {
        border-color: var(--gold);
        background: #fff;
        box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
    }
    .auth-phone-row input { flex: 1; }
    .auth-checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        margin-top: 6px;
    }
    .auth-checkbox-label input {
        accent-color: var(--dark);
        cursor: pointer;
        width: 14px;
        height: 14px;
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
        margin-top: 10px;
    }
    .auth-submit-btn:hover { background: var(--gold); }
    .auth-submit-btn:active { transform: scale(0.98); }
    .auth-switch-text {
        text-align: center;
        margin-top: 24px;
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
    .auth-back-home:hover { color: var(--gold); }
    .auth-err {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.68rem;
        color: #e53935;
        margin-top: 4px;
    }

    /* ─── PPT Onboarding Overlay ─── */
    .ppt-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(10, 10, 10, 0.94);
        backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: white;
        font-family: 'Montserrat', sans-serif;
    }
    .ppt-container {
        width: 100%;
        max-width: 720px;
        background: #121212;
        border: 1px solid rgba(197, 160, 89, 0.25);
        border-radius: 12px;
        padding: 45px;
        position: relative;
        box-shadow: 0 30px 70px rgba(0,0,0,0.8), 0 0 50px rgba(197,160,89,0.06);
        display: flex;
        flex-direction: column;
        min-height: 520px;
        justify-content: space-between;
    }
    .ppt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 18px;
        margin-bottom: 25px;
    }
    .ppt-logo {
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        letter-spacing: 3px;
        font-weight: 700;
        color: #fff;
    }
    .ppt-logo span {
        color: var(--gold);
    }
    .ppt-steps {
        font-size: 0.78rem;
        color: rgba(255,255,255,0.4);
        letter-spacing: 1.5px;
        font-weight: 500;
        text-transform: uppercase;
    }
    .ppt-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-bottom: 30px;
        animation: ppt-fadein 0.4s ease both;
    }
    @keyframes ppt-fadein {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .ppt-slide-title {
        font-family: 'Cinzel', serif;
        font-size: 1.9rem;
        color: var(--gold);
        margin-bottom: 15px;
        font-weight: 600;
        letter-spacing: 1px;
        background: linear-gradient(135deg, #e8c97a, #C5A059, #a07830);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ppt-slide-desc {
        font-size: 0.95rem;
        line-height: 1.7;
        color: rgba(255,255,255,0.78);
        margin-bottom: 15px;
    }
    .ppt-bullet-list {
        margin-top: 15px;
        list-style: none;
        padding-left: 0;
    }
    .ppt-bullet-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
        font-size: 0.92rem;
        color: rgba(255,255,255,0.85);
        line-height: 1.5;
    }
    .ppt-bullet-icon {
        color: var(--gold);
        font-size: 1.1rem;
        margin-top: 1px;
        flex-shrink: 0;
    }
    .ppt-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255,255,255,0.08);
        padding-top: 25px;
        margin-top: 15px;
    }
    .ppt-indicators {
        display: flex;
        gap: 10px;
    }
    .ppt-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: rgba(255,255,255,0.18);
        transition: background 0.3s, transform 0.3s;
    }
    .ppt-dot.active {
        background: var(--gold);
        transform: scale(1.25);
        box-shadow: 0 0 8px rgba(197, 160, 89, 0.6);
    }
    .ppt-actions {
        display: flex;
        gap: 12px;
    }
    .ppt-btn {
        padding: 12px 24px;
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        letter-spacing: 2px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        border-radius: 2px;
    }
    .ppt-btn--prev {
        background: transparent;
        color: rgba(255,255,255,0.65);
        border: 1px solid rgba(255,255,255,0.15);
    }
    .ppt-btn--prev:hover {
        color: white;
        border-color: rgba(255,255,255,0.45);
        background: rgba(255,255,255,0.02);
    }
    .ppt-btn--next {
        background: var(--gold);
        color: #0c0c0c;
        box-shadow: 0 4px 15px rgba(197,160,89,0.25);
    }
    .ppt-btn--next:hover {
        background: #e8c97a;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(197,160,89,0.35);
    }
    .ppt-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
    }
    .ppt-terms-checkbox {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(197, 160, 89, 0.04);
        border: 1px solid rgba(197, 160, 89, 0.15);
        padding: 16px 22px;
        border-radius: 6px;
        margin-top: 22px;
        cursor: pointer;
        transition: border-color 0.3s, background 0.3s;
    }
    .ppt-terms-checkbox:hover {
        border-color: rgba(197, 160, 89, 0.35);
        background: rgba(197, 160, 89, 0.07);
    }
    .ppt-terms-checkbox input {
        width: 18px;
        height: 18px;
        accent-color: var(--gold);
        cursor: pointer;
        flex-shrink: 0;
    }
    .ppt-terms-checkbox span {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.85);
        line-height: 1.5;
        font-family: 'Montserrat', sans-serif;
    }
    .ppt-err {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem;
        color: #e53935;
        background: rgba(229, 57, 53, 0.08);
        border-left: 3px solid #e53935;
        padding: 10px 14px;
        margin-bottom: 20px;
        border-radius: 2px;
    }
`;

function DesignerRegister() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [form, setForm] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_registration');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.form) {
                    return {
                        ...parsed.form
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load saved form state:', e);
        }
        return {
            fullName: '', countryCode: '+91 India', contact: '', gmail: '', useAsRecovery: true,
            username: '', password: '', confirmPassword: '',
            gender: '', dob: '', address: '', country: ''
        };
    });
    const [errors, setErrors] = useState({});
    const [showPpt, setShowPpt] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [onboardingMedia, setOnboardingMedia] = useState(null);
    const [currentImageSlide, setCurrentImageSlide] = useState(0);
    const [videoLoading, setVideoLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile Photo States
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // OTP Verification States
    const [otpStep, setOtpStep] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_registration');
            if (saved) {
                const parsed = JSON.parse(saved);
                return !!parsed.otpStep;
            }
        } catch (e) {}
        return false;
    });
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_registration');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.otpStep && parsed.otpSentAt) {
                    const elapsed = Math.floor((Date.now() - parsed.otpSentAt) / 1000);
                    return Math.max(0, 45 - elapsed);
                }
            }
        } catch (e) {}
        return 0;
    });
    const [otpSending, setOtpSending] = useState(false);
    const [debugOtp, setDebugOtp] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_registration');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.debugOtp || '';
            }
        } catch (e) {}
        return '';
    });

    // Save registration state to sessionStorage on state changes
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_registration');
            let otpSentAt = null;
            if (saved) {
                const parsed = JSON.parse(saved);
                otpSentAt = parsed.otpSentAt;
            }
            if (otpStep && !otpSentAt) {
                otpSentAt = Date.now();
            } else if (!otpStep) {
                otpSentAt = null;
            }

            const dataToSave = {
                form: { ...form },
                otpStep,
                debugOtp,
                otpSentAt
            };
            sessionStorage.setItem('asat_designer_registration', JSON.stringify(dataToSave));
        } catch (e) {
            console.error('Failed to save registration state:', e);
        }
    }, [form, otpStep, debugOtp]);

    // Timer Countdown Effect
    useEffect(() => {
        if (otpTimer === 0) return;
        const timerId = setInterval(() => {
            setOtpTimer(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [otpTimer]);

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, avatar: 'Please select an image file.' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, avatar: 'File size must be under 5MB.' }));
            return;
        }
        
        setErrors(prev => ({ ...prev, avatar: null }));
        setAvatarFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const triggerSendOtp = async () => {
        if (otpSending) return;
        setOtpSending(true);
        setRegisterError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.gmail })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification code.');
            }
            
            if (data.debugOtp) {
                setDebugOtp(data.debugOtp);
            }
            
            setOtpTimer(45);
            setOtpStep(true);
        } catch (err) {
            console.error('Error sending OTP:', err);
            setRegisterError(err.message);
        } finally {
            setOtpSending(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const val = element.value;
        setOtpCode(prev => {
            const nextCode = [...prev];
            nextCode[index] = val;
            return nextCode;
        });
        if (val !== "" && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (otpCode[index] === "" && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
        }
    };

    useEffect(() => {
        const fetchOnboardingMedia = async () => {
            try {
                const data = await apiFetch('/api/settings');
                if (data && data.designer_onboarding_media) {
                    setOnboardingMedia(data.designer_onboarding_media.value || data.designer_onboarding_media);
                } else if (data && data.designer_onboarding_video && data.designer_onboarding_video.videoUrl) {
                    setOnboardingMedia({ type: 'video', urls: [data.designer_onboarding_video.videoUrl] });
                }
            } catch (err) {
                console.error("Failed to fetch onboarding media from database:", err);
            } finally {
                setVideoLoading(false);
            }
        };
        fetchOnboardingMedia();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % authImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.contact.trim()) e.contact = 'Contact number is required';
        if (!form.gmail.trim()) e.gmail = 'Gmail is required';
        else if (!form.gmail.endsWith('@gmail.com')) e.gmail = 'Must be a valid @gmail.com address';
        if (!form.username.trim()) e.username = 'Username is required';
        if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        if (!form.gender) e.gender = 'Select gender';
        if (!form.dob) e.dob = 'Date of birth is required';
        if (!form.address.trim()) e.address = 'Address is required';
        if (!form.country) e.country = 'Select country';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length === 0) {
            setShowPpt(true);
            setAgreedToTerms(false);
            setRegisterError('');
        }
    };

    const handleCompleteRegistration = async () => {
        if (!agreedToTerms || otpSending || registerLoading) return;
        await triggerSendOtp();
    };

   
    const handleVerifyAndRegister = async (e) => {
        if (e) e.preventDefault();
        if (registerLoading) return;
        
        const fullOtp = otpCode.join('');
        if (fullOtp.length < 6) {
            setRegisterError('Please enter the full 6-digit code.');
            return;
        }
        
        setRegisterLoading(true);
        setRegisterError('');
        
        try {
            // 1. Call the atomic registration endpoint on the backend
            const registerRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register-designer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.gmail,
                    password: form.password,
                    otp: fullOtp,
                    fullName: form.fullName,
                    username: form.username,
                    contact: form.contact,
                    countryCode: form.countryCode,
                    gender: form.gender,
                    dob: form.dob,
                    address: form.address,
                    country: form.country,
                })
            });
            
            const registerData = await registerRes.json();
            if (!registerRes.ok) {
                throw new Error(registerData.error || 'Registration failed.');
            }
            const uid = registerData.uid;

            // 2. Sign in the user programmatically to establish an authenticated session for file upload
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: form.gmail,
                password: form.password,
            });
            
            if (signInError) {
                console.error('Programmatic signin failed:', signInError);
            } else {
                if (signInData?.session) {
                    setAuthToken(signInData.session.access_token);
                }
                // 3. Upload avatar image if selected (user is now authenticated, so storage policy matches!)
                if (avatarFile) {
                    try {
                        const avatarUrl = await uploadFile(avatarFile, `avatars/${uid}/${avatarFile.name}`, 'asat-uploads');

                        // 4. Update the avatar_url in the designers profile
                        await apiFetch('/api/designers/me', {
                            method: 'PUT',
                            body: JSON.stringify({ avatar_url: avatarUrl })
                        });
                    } catch (uploadErr) {
                        console.error('Avatar upload failed:', uploadErr);
                    }
                }
                
                // Sign out to keep the session clean since they are redirected to the login page
                await supabase.auth.signOut();
                setAuthToken(null);
            }
            setOtpStep(false);
            setShowPpt(false);
            sessionStorage.removeItem('asat_designer_registration');
            navigate('/designer/login', { 
                state: { 
                    successMessage: `Welcome to the Paradise, ${form.fullName}! Your email was verified and your designer registration was completed successfully. Please sign in below.` 
                } 
            });
            
        } catch (err) {
            console.error('Verification/Registration failed:', err);
            setRegisterError(err.message || 'Registration failed. Please try again.');
        } finally {
            setRegisterLoading(false);
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
                    <h1 className="auth-brand-name">As Simple as That</h1>
                    <p className="auth-brand-tagline">**A Designer Paradise**</p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-side">
                <Link to="/" className="auth-back-home">
                    <span>←</span> BACK TO HOME
                </Link>

                <div className="auth-form-container">
                    <h2 className="auth-title">Join the Paradise</h2>
                    <p className="auth-subtitle">Create your designer account and start earning.</p>

                    <form onSubmit={handleSubmit}>
                        {/* Profile Photo Uploader */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                <div 
                                    className="designer-avatar-preview"
                                    style={{ 
                                        width: '100px', 
                                        height: '100px', 
                                        borderRadius: '50%', 
                                        border: '2px solid ' + (avatarPreview ? 'var(--gold)' : '#ccc'),
                                        backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#fafafa',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {!avatarPreview && <i className="fas fa-user-tie" style={{ fontSize: '2.5rem', color: '#ccc' }}></i>}
                                </div>
                                <label 
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: '0', 
                                        right: '0', 
                                        background: 'var(--dark)', 
                                        border: '1px solid var(--gold)',
                                        color: 'var(--gold)',
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--gold)';
                                        e.currentTarget.style.color = 'var(--dark)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'var(--dark)';
                                        e.currentTarget.style.color = 'var(--gold)';
                                    }}
                                >
                                    <i className="fas fa-camera" style={{ fontSize: '0.8rem' }}></i>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleAvatarSelect} 
                                        style={{ display: 'none' }} 
                                    />
                                </label>
                            </div>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', letterSpacing: '1px', color: '#666', marginTop: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                                Upload Profile Photo (Optional)
                            </span>
                            {errors.avatar && <div className="auth-err" style={{ textAlign: 'center' }}>{errors.avatar}</div>}
                        </div>

                        <div className="auth-row">
                            <div className="auth-input-group">
                                <label>Full Name</label>
                                <input type="text" className="auth-input" placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                                {errors.fullName && <div className="auth-err">{errors.fullName}</div>}
                            </div>
                            <div className="auth-input-group">
                                <label>Username</label>
                                <input type="text" className="auth-input" placeholder="Choose a username" value={form.username} onChange={e => set('username', e.target.value)} />
                                {errors.username && <div className="auth-err">{errors.username}</div>}
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Contact Number</label>
                            <div className="auth-phone-row">
                                <select value={form.countryCode} onChange={e => set('countryCode', e.target.value)}>
                                    {COUNTRY_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="tel" className="auth-input" placeholder="Phone number" value={form.contact} onChange={e => set('contact', e.target.value)} />
                            </div>
                            {errors.contact && <div className="auth-err">{errors.contact}</div>}
                        </div>

                        <div className="auth-input-group">
                            <label>Gmail Address</label>
                            <input type="email" className="auth-input" placeholder="you@gmail.com" value={form.gmail} onChange={e => set('gmail', e.target.value)} />
                            <label className="auth-checkbox-label">
                                <input type="checkbox" checked={form.useAsRecovery} onChange={e => set('useAsRecovery', e.target.checked)} />
                                Use as recovery email
                            </label>
                            {errors.gmail && <div className="auth-err">{errors.gmail}</div>}
                        </div>

                        <div className="auth-row">
                            <div className="auth-input-group">
                                <label>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        className="auth-input" 
                                        style={{ paddingRight: '45px' }}
                                        placeholder="Min 6 characters" 
                                        value={form.password} 
                                        onChange={e => set('password', e.target.value)} 
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
                                {errors.password && <div className="auth-err">{errors.password}</div>}
                            </div>
                            <div className="auth-input-group">
                                <label>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        className="auth-input" 
                                        style={{ paddingRight: '45px' }}
                                        placeholder="Re-enter password" 
                                        value={form.confirmPassword} 
                                        onChange={e => set('confirmPassword', e.target.value)} 
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
                                {errors.confirmPassword && <div className="auth-err">{errors.confirmPassword}</div>}
                            </div>
                        </div>

                        <div className="auth-row">
                            <div className="auth-input-group">
                                <label>Gender</label>
                                <select className="auth-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                    <option value="">Select gender</option>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                                {errors.gender && <div className="auth-err">{errors.gender}</div>}
                            </div>
                            <div className="auth-input-group">
                                <label>Date of Birth</label>
                                <input type="date" className="auth-input" value={form.dob} onChange={e => set('dob', e.target.value)} />
                                {errors.dob && <div className="auth-err">{errors.dob}</div>}
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Address</label>
                            <input type="text" className="auth-input" placeholder="Street address" value={form.address} onChange={e => set('address', e.target.value)} />
                            {errors.address && <div className="auth-err">{errors.address}</div>}
                        </div>

                        <div className="auth-input-group">
                            <label>Country</label>
                            <select className="auth-select" value={form.country} onChange={e => set('country', e.target.value)}>
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            {errors.country && <div className="auth-err">{errors.country}</div>}
                        </div>

                        <button type="submit" className="auth-submit-btn">Join the Paradise</button>
                    </form>

                    <div className="auth-switch-text">
                        Already in Paradise?
                        <Link to="/designer/login" className="auth-switch-link">Sign In</Link>
                    </div>
                </div>
            </div>

            {/* ─── Media Onboarding Modal Overlay ─── */}
            {showPpt && (
                <div className="ppt-overlay">
                    <div className="ppt-container" style={{ maxWidth: '800px', minHeight: 'auto' }}>
                        <div className="ppt-header">
                            <div className="ppt-logo">
                                ASAT <span>STUDIO</span>
                            </div>
                            <div className="ppt-steps">
                                Onboarding Training
                            </div>
                        </div>

                        <div className="ppt-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            {videoLoading ? (
                                <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '10px' }}></i>
                                    <p style={{ fontFamily: 'Montserrat, sans-serif' }}>Loading onboarding training...</p>
                                </div>
                            ) : onboardingMedia && onboardingMedia.urls && onboardingMedia.urls.length > 0 ? (
                                <div style={{ width: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
                                    {onboardingMedia.type === 'video' ? (
                                        <video 
                                            src={onboardingMedia.urls[0]} 
                                            controls 
                                            style={{ width: '100%', display: 'block', maxHeight: '420px' }}
                                            autoPlay
                                        />
                                    ) : onboardingMedia.type === 'document' ? (
                                        <iframe 
                                            src={onboardingMedia.urls[0]} 
                                            style={{ width: '100%', height: '500px', border: 'none', display: 'block' }}
                                            title="Onboarding Document"
                                        />
                                    ) : (
                                        <div style={{ position: 'relative', width: '100%', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img 
                                                src={onboardingMedia.urls[currentImageSlide]} 
                                                alt={`Slide ${currentImageSlide + 1}`} 
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                            {onboardingMedia.urls.length > 1 && (
                                                <>
                                                    <button 
                                                        onClick={() => setCurrentImageSlide(p => Math.max(0, p - 1))}
                                                        disabled={currentImageSlide === 0}
                                                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: currentImageSlide === 0 ? 'not-allowed' : 'pointer', fontSize: '1.2rem', opacity: currentImageSlide === 0 ? 0.3 : 1 }}
                                                    >❮</button>
                                                    <button 
                                                        onClick={() => setCurrentImageSlide(p => Math.min(onboardingMedia.urls.length - 1, p + 1))}
                                                        disabled={currentImageSlide === onboardingMedia.urls.length - 1}
                                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: currentImageSlide === onboardingMedia.urls.length - 1 ? 'not-allowed' : 'pointer', fontSize: '1.2rem', opacity: currentImageSlide === onboardingMedia.urls.length - 1 ? 0.3 : 1 }}
                                                    >❯</button>
                                                    <div style={{ position: 'absolute', bottom: '15px', background: 'rgba(0,0,0,0.7)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontFamily: 'Montserrat' }}>
                                                        {currentImageSlide + 1} / {onboardingMedia.urls.length}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
                                    <i className="fas fa-eye-slash" style={{ fontSize: '2rem', color: '#666', marginBottom: '10px' }}></i>
                                    <p style={{ fontFamily: 'Montserrat, sans-serif' }}>No onboarding training configured. Please contact support.</p>
                                </div>
                            )}

                            <div className="ppt-terms-checkbox" style={{ width: '100%' }} onClick={() => setAgreedToTerms(prev => !prev)}>
                                <input 
                                    type="checkbox" 
                                    checked={agreedToTerms} 
                                    onChange={(e) => e.stopPropagation()} 
                                />
                                <span>I have completed the onboarding training and fully accept the ASAT Designer Terms and Conditions.</span>
                            </div>
                        </div>

                        {registerError && (
                            <div className="ppt-err" style={{ marginTop: '15px', marginBottom: 0 }}>
                                {registerError}
                            </div>
                        )}

                        <div className="ppt-footer" style={{ marginTop: '20px' }}>
                            <button 
                                type="button" 
                                className="ppt-btn ppt-btn--prev"
                                onClick={() => setShowPpt(false)}
                                disabled={registerLoading}
                            >
                                Cancel
                            </button>

                            <button 
                                type="button" 
                                className="ppt-btn ppt-btn--next"
                                disabled={!agreedToTerms || registerLoading || otpSending || !onboardingMedia || !onboardingMedia.urls || onboardingMedia.urls.length === 0}
                                onClick={handleCompleteRegistration}
                            >
                                {otpSending ? 'Sending Code…' : (registerLoading ? 'Creating Account…' : 'Register & Join')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── OTP Verification Modal Overlay ─── */}
            {otpStep && (
                <div className="ppt-overlay">
                    <div className="ppt-container" style={{ maxWidth: '480px', minHeight: 'auto' }}>
                        <div className="ppt-header" style={{ marginBottom: '15px' }}>
                            <div className="ppt-logo">
                                ASAT <span>VERIFY</span>
                            </div>
                            <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}
                                onClick={() => setOtpStep(false)}
                                disabled={registerLoading}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="ppt-body" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(197, 160, 89, 0.1)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '1.8rem', marginBottom: '20px' }}>
                                <i className="fas fa-envelope-open-text"></i>
                            </div>
                            <h3 className="ppt-slide-title" style={{ fontSize: '1.4rem', marginBottom: '10px' }}>
                                Verify Your Email
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 20px' }}>
                                We've sent a 6-digit verification code to <strong style={{ color: '#fff' }}>{form.gmail}</strong>. Please enter the code below to finalize your signup.
                            </p>

                            {/* {debugOtp && (
                                <div style={{
                                    padding: '10px 16px',
                                    background: 'rgba(197, 160, 89, 0.15)',
                                    border: '1px dashed var(--gold)',
                                    borderRadius: '8px',
                                    color: 'var(--gold)',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    margin: '10px auto 25px',
                                    maxWidth: '300px',
                                    display: 'inline-block',
                                    fontFamily: 'Montserrat, sans-serif'
                                }}>
                                    Development OTP: <span style={{ letterSpacing: '2px', fontWeight: 'bold', color: '#fff', marginLeft: '5px' }}>{debugOtp}</span>
                                </div>
                            )} */}

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '20px 0' }}>
                                {otpCode.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        style={{
                                            width: '45px',
                                            height: '50px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(197,160,89,0.3)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '1.4rem',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            fontFamily: 'Montserrat, sans-serif',
                                            outline: 'none',
                                            transition: 'border-color 0.3s, background 0.3s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(197,160,89,0.3)'}
                                        value={data}
                                        onChange={e => handleOtpChange(e.target, index)}
                                        onKeyDown={e => handleOtpKeyDown(e, index)}
                                    />
                                ))}
                            </div>


                        </div>

                        {registerError && (
                            <div className="ppt-err" style={{ marginBottom: '20px' }}>
                                {registerError}
                            </div>
                        )}

                        <div className="ppt-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '14px' }}>
                                <button 
                                    type="button" 
                                    className="ppt-btn ppt-btn--next"
                                    style={{ width: '100%', padding: '14px' }}
                                    disabled={otpCode.join('').length < 6 || registerLoading}
                                    onClick={handleVerifyAndRegister}
                                >
                                    {registerLoading ? 'Verifying & Registering...' : 'Verify & Complete Signup'}
                                </button>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Didn't receive the email?</span>
                                    {otpTimer > 0 ? (
                                        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Resend in {otpTimer}s</span>
                                    ) : (
                                        <button 
                                            type="button" 
                                            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', padding: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                            onClick={triggerSendOtp}
                                            disabled={otpSending}
                                        >
                                            {otpSending ? 'Sending...' : 'Resend Code'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DesignerRegister;
