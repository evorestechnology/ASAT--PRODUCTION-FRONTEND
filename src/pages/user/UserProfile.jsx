import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import CustomDatePicker from '../../components/CustomDatePicker';

const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; }
    .container { flex: 1; max-width: 800px; margin: 50px auto; padding: 40px; background: white; border: 1px solid #eee; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group label { display: block; font-family: 'Cinzel', serif; margin-bottom: 8px; font-weight: bold; font-size: 0.8rem; }
    .form-group input { width: 100%; padding: 12px; border: 1px solid #ddd; font-family: 'Montserrat', sans-serif; box-sizing: border-box; }
    .full-width { grid-column: span 2; }
    .toast {
        padding: 12px;
        margin-bottom: 20px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        border-radius: 4px;
        text-align: center;
    }
    .toast--success {
        background: #eafaf1;
        color: #1e7e34;
        border: 1px solid #28a745;
    }
    .toast--error {
        background: #fef0ee;
        color: #c0392b;
        border: 1px solid #c0392b;
    }
    .profile-actions {
        display: flex;
        gap: 15px;
        grid-column: span 2;
    }
    .profile-actions button {
        flex: 1;
    }
    @media (max-width: 640px) {
        .container { margin: 20px auto; padding: 24px 18px; }
        .form-grid { grid-template-columns: 1fr; gap: 16px; }
        .full-width { grid-column: span 1; }
        .profile-actions { flex-direction: column; grid-column: span 1; }
        .profile-actions button { width: 100%; }
    }
    @media (max-width: 400px) {
        .container { padding: 18px 14px; }
        .form-group input { padding: 10px; font-size: 16px; }
    }
    .date-input-wrapper {
        position: relative;
        width: 100%;
    }
    .date-input-wrapper::after {
        content: '\\f133';
        font-family: 'Font Awesome 6 Free', 'Font Awesome 5 Free', sans-serif;
        font-weight: 900;
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: #888888;
        pointer-events: none;
        font-size: 1.1rem;
    }
    .date-input-wrapper input[type="date"] {
        background: #FFFFFF;
        border: 1px solid #ddd;
        padding: 12px 16px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        border-radius: 4px;
        color: #000000;
        outline: none;
        box-sizing: border-box;
    }
`;


function UserProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [dob, setDob] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!user) return;
        
        const loadProfile = async () => {
            setLoading(true);
            try {
                setEmail(user.email || '');
                setFullName(user.user_metadata?.full_name || '');
                setCountryCode(user.user_metadata?.country_code || '');
                setMobileNumber(user.user_metadata?.phone || '');
                setDob(user.user_metadata?.dob || '');

                const data = await apiFetch('/api/users/me');

                if (data) {
                    setFullName(data.full_name || user.user_metadata?.full_name || '');
                    if (data.phone) {
                        const parts = data.phone.split(' ');
                        if (parts.length > 1) {
                            setCountryCode(parts[0]);
                            setMobileNumber(parts.slice(1).join(' '));
                        } else {
                            setMobileNumber(data.phone);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load user profile:', err);
                setToast({ type: 'error', msg: 'Error loading user profile: ' + err.message });
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setToast(null);
        try {
            // Optional direct password change
            if (newPassword) {
                if (newPassword.length < 6) {
                    throw new Error('New password must be at least 6 characters long.');
                }
                if (newPassword !== confirmNewPassword) {
                    throw new Error('New passwords do not match.');
                }
                const { error: passError } = await supabase.auth.updateUser({
                    password: newPassword
                });
                if (passError) throw passError;
            }

            // 1. Update Auth Profile metadata
            await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    country_code: countryCode,
                    phone: mobileNumber,
                    dob: dob
                }
            });

            // 2. Update PostgreSQL users table
            const contactString = (countryCode && mobileNumber) ? `${countryCode} ${mobileNumber}` : (mobileNumber || '');
            await apiFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: fullName,
                    phone: contactString,
                    countryCode,
                    dob
                })
            });

            // Update localStorage & dispatch event to update Navbar greeting dynamically
            localStorage.setItem('asat_user', JSON.stringify({ fullName, email, countryCode, mobileNumber, dob }));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user_profile_updated'));

            setToast({ type: 'success', msg: 'Account updated successfully!' });
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            let errMsg = 'Failed to update account.';
            if (err) {
                if (typeof err === 'string') errMsg = err;
                else if (err.error && typeof err.error === 'string') errMsg = err.error;
                else if (err.message && typeof err.message === 'string') errMsg = err.message;
                else {
                    try {
                        errMsg = JSON.stringify(err);
                    } catch (_) {}
                }
            }
            setToast({ type: 'error', msg: errMsg });
        }
    };

    if (loading) {
        return (
            <main className="container">
                <div style={{ color: '#666', fontFamily: 'Montserrat', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>
                    Loading your profile details…
                </div>
            </main>
        );
    }

    return (
        <>
            <style>{styles}</style>

            <main style={{ flex: 1, padding: '10px 0', minHeight: '80vh', background: 'var(--bg, #FAFAF8)' }}>
                <div className="container">
                    <h2 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", textAlign: 'center', marginBottom: '30px' }}>ACCOUNT SETTINGS</h2>
                
                {toast && (
                    <div className={`toast toast--${toast.type}`}>
                        {toast.msg}
                    </div>
                )}

                <form className="form-grid" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" placeholder="Your Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} disabled style={{ background: '#f5f5f7', color: '#86868b', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group full-width">
                        <label>Contact Number</label>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input 
                                type="text" 
                                placeholder="+91" 
                                value={countryCode} 
                                onChange={(e) => setCountryCode(e.target.value)} 
                                style={{ width: '100px' }} 
                                required
                            />
                            <input 
                                type="tel" 
                                placeholder="Enter mobile number" 
                                value={mobileNumber} 
                                onChange={(e) => setMobileNumber(e.target.value)} 
                                style={{ flex: 1 }} 
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label>Date of Birth</label>
                        <CustomDatePicker
                            value={dob}
                            onChange={setDob}
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password (Optional)</label>
                        <input 
                            type="password" 
                            placeholder="Enter new password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input 
                            type="password" 
                            placeholder="Confirm new password" 
                            value={confirmNewPassword} 
                            onChange={(e) => setConfirmNewPassword(e.target.value)} 
                        />
                    </div>
                    <div className="profile-actions">
                        <button type="submit" className="cta-gold">UPDATE ACCOUNT</button>
                    </div>
                </form>
            </div>
        </main>
        </>
    );
}

export default UserProfile;
