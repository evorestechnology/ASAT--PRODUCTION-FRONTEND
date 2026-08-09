import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';

const inlineStyles = `
    .profile-card {
        background: white;
        border: 1px solid var(--admin-border);
        padding: 40px;
        margin-top: 20px;
    }
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }
    .form-group label {
        display: block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--admin-muted);
        margin-bottom: 8px;
        font-weight: 600;
    }
    .form-group input, .form-group select {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--admin-border);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.3s;
    }
    .form-group input:focus, .form-group select:focus {
        border-color: var(--admin-gold);
    }
    .full-width {
        grid-column: span 2;
    }
    .profile-actions {
        display: flex;
        gap: 15px;
        margin-top: 20px;
    }
    .profile-actions button {
        margin-top: 0;
    }
`;

const countryCodes = ['+1', '+44', '+91', '+61', '+49', '+33', '+86', '+971', '+65', '+55'];

function MasterProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState(null);

    useEffect(() => {
        if (!user) return;
        
        const loadProfile = async () => {
            setLoading(true);
            try {
                const adminData = await apiFetch('/api/users/me');
                
                if (adminData) {
                    setUsername('admin');
                    setFullName(adminData.full_name || '');
                    setEmail(adminData.email || user.email || '');
                } else {
                    setEmail(user.email || '');
                }
            } catch (err) {
                console.error('Error loading admin profile:', err);
                setSaveStatus({ type: 'error', text: 'Error loading profile: ' + (err.error || err.message) });
            } finally {
                setLoading(false);
            }
        };
        
        loadProfile();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        setSaveStatus(null);
        try {
            await apiFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: fullName
                })
            });
            
            setSaveStatus({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Error updating admin profile:', err);
            setSaveStatus({ type: 'error', text: 'Failed to update profile: ' + (err.error || err.message) });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordStatus(null);

        if (!newPassword) {
            setPasswordStatus({ type: 'error', text: 'Please enter a new password.' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordStatus({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setPasswordLoading(true);
        try {
            // Update via backend API endpoint (reliable admin auth update)
            await apiFetch('/api/users/change-password', {
                method: 'POST',
                body: JSON.stringify({ new_password: newPassword })
            });

            setPasswordStatus({ type: 'success', text: 'Password changed successfully!' });
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordStatus(null), 5000);
        } catch (err) {
            // Fallback to client-side Supabase updateUser if endpoint error
            try {
                const { error: clientErr } = await supabase.auth.updateUser({ password: newPassword });
                if (clientErr) throw clientErr;
                setPasswordStatus({ type: 'success', text: 'Password changed successfully!' });
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPasswordStatus(null), 5000);
            } catch (fallbackErr) {
                console.error('Error updating password:', fallbackErr);
                setPasswordStatus({ type: 'error', text: 'Failed to update password: ' + (err.error || fallbackErr.message) });
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        setPasswordStatus(null);
        if (!email) {
            setPasswordStatus({ type: 'error', text: 'Please specify your email address.' });
            return;
        }
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setPasswordStatus({ type: 'success', text: `Password reset email sent to ${email}!` });
            setTimeout(() => setPasswordStatus(null), 5000);
        } catch (err) {
            console.error('Error sending password reset email:', err);
            setPasswordStatus({ type: 'error', text: 'Failed to send password reset: ' + err.message });
        }
    };

    if (loading) {
        return (
            <main className="adm-page">
                <div style={{ color: '#aaa', fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '20px 0' }}>
                    Loading profile from database…
                </div>
            </main>
        );
    }

    return (
        <main className="adm-page">
            <style>{inlineStyles}</style>
            <BackButton />
            <h1 className="adm-page__title">MASTER PROFILE</h1>
            <p className="adm-page__subtitle">Update your master administrator profile details and credentials</p>
            
            {saveStatus && (
                <div className={`save-toast save-toast--${saveStatus.type}`}>
                    {saveStatus.type === 'success' ? '✦ ' : '⚠️ '} {saveStatus.text}
                </div>
            )}

            {/* Profile Information Card */}
            <div className="profile-card">
                <h2 style={{ fontFamily: 'Cinzel', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '1px', color: 'var(--admin-dark)' }}>
                    Personal Details
                </h2>
                <form className="form-grid" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Full Name (as per Nationality)</label>
                        <input type="text" placeholder="Admin Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="admin@gmail.com" value={email} disabled style={{ background: '#f5f5f7', color: '#86868b' }} />
                    </div>
                    <div className="form-group">
                        <label>Contact Number</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select style={{ width: '30%' }} value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                                {countryCodes.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Number" style={{ width: '70%' }} value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>City/Town</label>
                        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Country</label>
                        <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Pincode</label>
                        <input type="text" placeholder="Zip Code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                    </div>
                    <div className="form-group full-width">
                        <label>Address</label>
                        <input type="text" placeholder="Full Office Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="profile-actions full-width">
                        <button type="submit" className="adm-settings__btn">UPDATE MASTER PROFILE</button>
                    </div>
                </form>
            </div>

            {/* Password & Security Card */}
            <div className="profile-card" style={{ marginTop: '30px' }}>
                <h2 style={{ fontFamily: 'Cinzel', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px', color: 'var(--admin-dark)' }}>
                    Security & Password
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '24px', fontFamily: 'Montserrat, sans-serif' }}>
                    Change your master login password or send a password reset link to your email.
                </p>

                {passwordStatus && (
                    <div className={`save-toast save-toast--${passwordStatus.type}`} style={{ marginBottom: '20px' }}>
                        {passwordStatus.type === 'success' ? '✦ ' : '⚠️ '} {passwordStatus.text}
                    </div>
                )}

                <form className="form-grid" onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password (min. 6 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#888',
                                    fontSize: '0.9rem',
                                    padding: 0
                                }}
                            >
                                <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#888',
                                    fontSize: '0.9rem',
                                    padding: 0
                                }}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="profile-actions full-width" style={{ marginTop: '10px' }}>
                        <button
                            type="submit"
                            className="adm-settings__btn"
                            disabled={passwordLoading}
                            style={{ background: 'var(--admin-gold)', color: '#000' }}
                        >
                            {passwordLoading ? 'UPDATING PASSWORD...' : 'CHANGE PASSWORD'}
                        </button>
                        <button
                            type="button"
                            className="adm-settings__btn"
                            style={{ background: '#3a3a3c', color: '#fff' }}
                            onClick={handlePasswordReset}
                        >
                            SEND RESET LINK TO EMAIL
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default MasterProfile;
