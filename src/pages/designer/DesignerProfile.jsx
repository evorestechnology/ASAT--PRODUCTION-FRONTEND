import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const COUNTRIES = ['India','United States','United Kingdom','United Arab Emirates','Australia','Japan','Germany','France','China','Brazil','South Africa','South Korea','Canada','Singapore','Italy','Spain'];

function DesignerProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState({
        fullName: '', contact: '', address: '',
        country: '', gender: '', dob: '', profilePhoto: null
    });
    const [username, setUsername] = useState('');
    const [toast, setToast] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [rankBadge, setRankBadge] = useState('');
    const [loading, setLoading] = useState(true);

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            try {
                const data = await apiFetch('/api/designers/me');

                if (data) {
                    setForm({
                        fullName: data.full_name || '',
                        contact: data.contact || '',
                        address: data.address || '',
                        country: data.country || '',
                        gender: data.gender || '',
                        dob: data.dob || '',
                        profilePhoto: data.avatar_url || null
                    });
                    setUsername(data.username || '');
                    setRankBadge(data.points >= 5000 ? 'Gold Designer' : data.points >= 1500 ? 'Silver Designer' : 'Bronze Designer');
                    
                    if (data.created_at) {
                        const date = new Date(data.created_at);
                        setJoinDate(date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
                    } else {
                        setJoinDate('June 2026');
                    }
                } else {
                    setForm(p => ({
                        ...p,
                        fullName: user.user_metadata?.full_name || ''
                    }));
                    setUsername(user.user_metadata?.username || '');
                    setRankBadge('Bronze Designer');
                    setJoinDate('June 2026');
                }
            } catch (err) {
                console.error('Error loading designer profile:', err);
                showToast('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const daysUntilUnlock = () => 0;
    const usernameLocked = false; // Always unlocked in this DB schema implementation

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        showToast('Uploading profile photo...');
        try {
            const downloadUrl = await uploadFile(file, `avatars/${user.id}/${file.name}`, 'asat-uploads');
            set('profilePhoto', downloadUrl);
            await apiFetch('/api/designers/me', {
                method: 'PUT',
                body: JSON.stringify({ avatar_url: downloadUrl })
            });
            showToast('Profile photo updated!');
        } catch (err) {
            console.error('Error uploading photo:', err);
            showToast('Failed to upload photo: ' + err.message);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            await apiFetch('/api/designers/me', {
                method: 'PUT',
                body: JSON.stringify({
                    full_name: form.fullName,
                    contact: form.contact,
                    address: form.address,
                    country: form.country,
                    gender: form.gender,
                    dob: form.dob,
                    username
                })
            });

            showToast('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating designer profile:', err);
            showToast('Failed to save changes: ' + err.message);
        }
    };

    const handlePasswordReset = async () => {
        if (!user || !user.email) return;
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            showToast('Password reset link sent to your registered Gmail!');
        } catch (err) {
            console.error('Error sending reset link:', err);
            showToast('Failed to send reset link: ' + err.message);
        }
    };

    if (loading) {
        return (
            <main className="dsn-profile">
                <div style={{ color: '#aaa', fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                    Loading profile from database…
                </div>
            </main>
        );
    }

    return (
        <main className="dsn-profile">
            <BackButton />
            {toast && <div className="dsn-toast"><i className="fas fa-check-circle"></i> {toast}</div>}

            <div className="dsn-profile__header-card">
                <div className="dsn-profile__photo-wrap">
                    <div className="dsn-profile__photo" style={form.profilePhoto ? { backgroundImage: `url(${form.profilePhoto})` } : {}}>
                        {!form.profilePhoto && <i className="fas fa-camera"></i>}
                    </div>
                    <label className="dsn-profile__photo-edit">
                        <i className="fas fa-pencil-alt"></i>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                    </label>
                </div>
                <div className="dsn-profile__header-info">
                    <h2>{username ? `@${username}` : 'Set your username'}</h2>
                    <div className="dsn-profile__meta">
                        {joinDate && <span><i className="far fa-calendar-alt"></i> Joined {joinDate}</span>}
                        {form.country && <span><i className="fas fa-globe-americas"></i> {form.country}</span>}
                        {rankBadge && <span className="dsn-profile__rank-badge"><i className="fas fa-award"></i> {rankBadge}</span>}
                    </div>
                </div>
            </div>

            <form className="dsn-profile__form" onSubmit={handleSave}>
                <h3 className="dsn-profile__section-title">Account Details</h3>
                <div className="dsn-profile__grid">
                    <div className="dsn-profile__group">
                        <label>Username</label>
                        <div className="dsn-auth__field"><i className="fas fa-at"></i>
                            <input type="text" value={username} onChange={e => !usernameLocked && setUsername(e.target.value)} disabled={usernameLocked} placeholder="Choose a username" />
                        </div>
                        {usernameLocked && <span className="dsn-profile__lock"><i className="fas fa-lock"></i> Locked. Change available in {daysUntilUnlock()} days</span>}
                    </div>
                    <div className="dsn-profile__group">
                        <label>Full Name</label>
                        <div className="dsn-auth__field"><i className="far fa-user"></i>
                            <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your full name" />
                        </div>
                    </div>
                    <div className="dsn-profile__group">
                        <label>Contact Number</label>
                        <div className="dsn-auth__field"><i className="fas fa-phone"></i>
                            <input type="tel" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                        </div>
                    </div>
                    <div className="dsn-profile__group">
                        <label>Gender</label>
                        <div className="dsn-auth__field"><i className="fas fa-venus-mars"></i>
                            <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="dsn-profile__group">
                        <label>Date of Birth</label>
                        <div className="dsn-auth__field"><i className="far fa-calendar-alt"></i>
                            <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                        </div>
                    </div>
                    <div className="dsn-profile__group">
                        <label>Country</label>
                        <div className="dsn-auth__field"><i className="fas fa-globe-americas"></i>
                            <select value={form.country} onChange={e => set('country', e.target.value)}>
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="dsn-profile__group dsn-profile__group--full">
                        <label>Address</label>
                        <div className="dsn-auth__field"><i className="fas fa-map-marker-alt"></i>
                            <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
                        </div>
                    </div>
                </div>

                <h3 className="dsn-profile__section-title">Security</h3>
                <div className="dsn-profile__security-row">
                    <div className="dsn-profile__security-info">
                        <i className="fas fa-shield-alt"></i>
                        <div>
                            <strong>Password</strong>
                            <p>To change your password, a reset link will be sent to your registered Gmail.</p>
                        </div>
                    </div>
                    <button type="button" className="dsn-profile__pass-btn" onClick={handlePasswordReset}>
                        Request Password Change
                    </button>
                </div>

                <button type="submit" className="dsn-auth__btn dsn-auth__btn--wide dsn-profile__save">
                    <span>Save Changes</span><i className="fas fa-check"></i>
                </button>
            </form>
        </main>
    );
}

export default DesignerProfile;
