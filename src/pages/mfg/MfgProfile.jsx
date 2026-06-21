import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import '../../styles/admin.css';

function MfgProfile() {
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [companyName, setCompanyName] = useState('');
    const [username, setUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            try {
                const data = await apiFetch('/api/manufacturers/me');
                if (data) {
                    setCompanyName(data.business_name || '');
                    setUsername(data.business_name || '');
                }
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSave = async () => {
        if (!companyName.trim()) {
            showToast('Company Name cannot be empty.', 'warning');
            return;
        }
        try {
            await apiFetch('/api/manufacturers/me', {
                method: 'PUT',
                body: JSON.stringify({ business_name: companyName.trim() })
            });
            showToast('Company details updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast("Error updating profile: " + error.message, 'error');
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword) {
            showToast('Please enter a new password.', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters long.', 'warning');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            showToast('Password changed successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password change error:', error);
            showToast('Failed to change password: ' + error.message, 'error');
        }
    };

    if (loading) {
        return (
            <main className="adm-page">
                <BackButton />
                <h1 className="adm-page__title">PROFILE</h1>
                <p className="adm-page__subtitle">Loading manufacturer settings...</p>
            </main>
        );
    }

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />
            <h1 className="adm-page__title">PROFILE</h1>
            <p className="adm-page__subtitle">Manufacturer account settings</p>

            <div className="adm-settings__section">
                <h3>Company Details</h3>
                <div className="mfg-profile__form">
                    <div className="mfg-profile__group">
                        <label>Company Name</label>
                        <input 
                            className="mfg-profile__input" 
                            type="text" 
                            placeholder="Enter company name" 
                            value={companyName} 
                            onChange={e => setCompanyName(e.target.value)} 
                        />
                    </div>
                    <div className="mfg-profile__group">
                        <label>Username</label>
                        <input 
                            className="mfg-profile__input" 
                            type="text" 
                            placeholder="Enter username" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                        />
                    </div>
                    <button className="mfg-profile__btn" onClick={handleSave}>Save Changes</button>
                </div>
            </div>

            <div className="adm-settings__section">
                <h3>Change Password</h3>
                <div className="mfg-profile__form">
                    <div className="mfg-profile__group">
                        <label>New Password</label>
                        <input 
                            className="mfg-profile__input" 
                            type="password" 
                            placeholder="Enter new password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                        />
                    </div>
                    <div className="mfg-profile__group">
                        <label>Confirm Password</label>
                        <input 
                            className="mfg-profile__input" 
                            type="password" 
                            placeholder="Confirm new password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                        />
                    </div>
                    <button className="mfg-profile__btn" onClick={handlePasswordChange}>Update Password</button>
                </div>
            </div>
        </main>
    );
}

export default MfgProfile;
