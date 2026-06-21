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

    const handlePasswordReset = async () => {
        setSaveStatus(null);
        if (!email) {
            setSaveStatus({ type: 'error', text: 'Please specify your email address.' });
            return;
        }
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setSaveStatus({ type: 'success', text: `Password reset email sent to ${email}!` });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Error sending password reset email:', err);
            setSaveStatus({ type: 'error', text: 'Failed to send password reset: ' + err.message });
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

            <div className="profile-card">
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
                        <button type="button" className="adm-settings__btn" style={{ background: '#3a3a3c' }} onClick={handlePasswordReset}>SEND PASSWORD RESET EMAIL</button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default MasterProfile;
