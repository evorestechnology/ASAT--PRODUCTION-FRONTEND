import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

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
`;

function UserProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!user) return;
        
        const loadProfile = async () => {
            setLoading(true);
            try {
                setEmail(user.email || '');
                setFullName(user.user_metadata?.full_name || '');

                const data = await apiFetch('/api/users/me');

                if (data) {
                    setFullName(data.full_name || user.user_metadata?.full_name || '');
                    setContact(data.phone || '');
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
            // 1. Update Auth Profile metadata
            if (fullName !== user.user_metadata?.full_name) {
                await supabase.auth.updateUser({
                    data: { full_name: fullName }
                });
            }

            // 2. Update PostgreSQL users table
            await apiFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: fullName,
                    phone: contact
                })
            });

            setToast({ type: 'success', msg: 'Account updated successfully!' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setToast({ type: 'error', msg: 'Failed to update account: ' + err.message });
        }
    };

    const handlePasswordReset = async () => {
        setToast(null);
        if (!email) return;
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setToast({ type: 'success', msg: `Password reset email sent to ${email}!` });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error resetting password:', err);
            setToast({ type: 'error', msg: 'Failed to send password reset: ' + err.message });
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

            <main className="container">
                <BackButton />
                <h2 style={{ fontFamily: "'Cinzel', serif", textAlign: 'center', marginBottom: '30px' }}>ACCOUNT SETTINGS</h2>
                
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
                        <input type="text" placeholder="+1..." value={contact} onChange={(e) => setContact(e.target.value)} />
                    </div>
                    <div className="profile-actions">
                        <button type="submit" className="cta-gold">UPDATE ACCOUNT</button>
                        <button type="button" className="cta-gold" style={{ background: '#3a3a3c', color: '#fff', borderColor: '#3a3a3c' }} onClick={handlePasswordReset}>RESET PASSWORD</button>
                    </div>
                </form>
            </main>
        </>
    );
}

export default UserProfile;
