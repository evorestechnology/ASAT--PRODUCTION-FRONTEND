import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MasterDesigners() {
    const { toasts, showToast } = useToast();
    const { idToken } = useAuth();
    const [designers, setDesigners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Delete confirmation state
    const [pendingDeleteDesigner, setPendingDeleteDesigner] = useState(null);

    // Create designer modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFullName, setCreateFullName] = useState('');
    const [createUsername, setCreateUsername] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [creating, setCreating] = useState(false);

    // Password editing states
    const [editingPasswordUser, setEditingPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!newPassword.trim() || newPassword.trim().length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }
        setUpdatingPassword(true);
        try {
            await apiFetch('/api/master/update-password', {
                method: 'POST',
                body: JSON.stringify({ uid: editingPasswordUser.uid, newPassword: newPassword.trim() })
            });
            showToast(`Password for ${editingPasswordUser.name} updated!`, 'success');
            setEditingPasswordUser(null);
            setNewPassword('');
        } catch (err) {
            showToast(err.error || err.message || 'Failed to update password', 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    const fetchDesigners = async () => {
        try {
            const data = await apiFetch('/api/designers');
            
            // Map snake_case to camelCase
            const list = (data || []).map(d => ({
                id: d.id,
                fullName: d.full_name,
                username: d.username,
                email: d.email,
                designsCount: d.designs_count,
                totalEarnings: Number(d.total_earnings || 0),
                points: d.points,
                status: d.status,
            }));

            const sorted = [...list].sort((a, b) => b.totalEarnings - a.totalEarnings);
            setDesigners(list.map(d => ({
                ...d,
                rank: sorted.findIndex(x => x.id === d.id) + 1 || '—'
            })));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching designers:', err);
            setError('Failed to load designers directory.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesigners();
    }, []);

    const handleStatusChange = async (designerId, newStatus) => {
        try {
            await apiFetch(`/api/designers/${designerId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            showToast(`Designer status updated to ${newStatus}.`, 'success');
            fetchDesigners();
        } catch (err) {
            showToast('Failed to update status: ' + (err.error || err.message), 'error');
        }
    };

    const handleDeleteDesigner = async (designerId, name) => {
        try {
            await apiFetch(`/api/designers/${designerId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'deleted' })
            });
            showToast(`Designer "${name}" has been deleted.`, 'success');
            fetchDesigners();
        } catch (err) {
            showToast('Failed to delete: ' + (err.error || err.message), 'error');
        } finally {
            setPendingDeleteDesigner(null);
        }
    };

    const handleCreateDesigner = async (e) => {
        e.preventDefault();
        if (!createFullName.trim() || !createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
            showToast('All fields are required.', 'error'); return;
        }
        if (createPassword.length < 6) {
            showToast('Password must be at least 6 characters.', 'error'); return;
        }
        setCreating(true);
        try {
            await apiFetch('/api/master/create-user', {
                method: 'POST',
                body: JSON.stringify({
                    email: createEmail.trim(),
                    password: createPassword,
                    role: 'designer',
                    fullName: createFullName.trim(),
                    username: createUsername.trim().toLowerCase(),
                })
            });

            showToast(`Designer "${createFullName}" created successfully!`, 'success');
            setShowCreateModal(false);
            setCreateFullName(''); setCreateUsername(''); setCreateEmail(''); setCreatePassword('');
            fetchDesigners();
        } catch (err) {
            showToast('Failed to create designer: ' + (err.error || err.message), 'error');
        } finally {
            setCreating(false);
        }
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'active') return 'active';
        if (s === 'pending') return 'pending';
        if (s === 'suspended' || s === 'blocked') return 'danger';
        return 'info';
    };

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 className="adm-page__title">DESIGNERS</h1>
                    <p className="adm-page__subtitle">Manage designer accounts, earnings, and access</p>
                </div>
                <button
                    className="adm-settings__btn"
                    style={{ background: '#C5A059', color: '#121212', fontWeight: 600, padding: '12px 20px' }}
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Create Designer
                </button>
            </div>

            {loading ? (
                <div className="adm-loading"><div className="adm-spinner"></div><p>Loading designers...</p></div>
            ) : error ? (
                <div className="adm-error-alert"><i className="fas fa-exclamation-triangle"></i> {error}</div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Designer ID</th>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Designs</th>
                                <th>Earnings</th>
                                <th>Rank</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {designers.length === 0 ? (
                                <tr><td colSpan="8" className="adm-table__empty"><i className="fas fa-users"></i>No designers registered yet.</td></tr>
                            ) : (
                                designers.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.id.substring(0, 8)}...</td>
                                        <td>{d.fullName || '—'}</td>
                                        <td>@{d.username || '—'}</td>
                                        <td>{d.designsCount || 0}</td>
                                        <td>₹{(d.totalEarnings || d.earnings || 0).toLocaleString()}</td>
                                        <td>#{d.rank}</td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(d.status)}`}>
                                                {d.status || 'pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select
                                                    className="adm-action-btn"
                                                    style={{ padding: '4px 8px', outline: 'none' }}
                                                    value={d.status || 'active'}
                                                    onChange={(e) => handleStatusChange(d.id, e.target.value)}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspend</option>
                                                    <option value="blocked">Block</option>
                                                </select>
                                                <button
                                                    className="adm-action-btn"
                                                    style={{ padding: '4px 10px', background: '#333', color: '#C5A059', border: '1px solid #C5A059', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => setEditingPasswordUser({ uid: d.id, name: d.fullName || d.username || 'Designer', role: 'Designer' })}
                                                    title="Edit Password"
                                                >
                                                    <i className="fas fa-key"></i> Key
                                                </button>
                                                {pendingDeleteDesigner === d.id ? (
                                                    <>
                                                        <span style={{ fontSize: '0.7rem', color: '#ff6b6b', whiteSpace: 'nowrap' }}>Delete?</span>
                                                        <button className="adm-action-btn adm-action-btn--reject" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleDeleteDesigner(d.id, d.fullName || d.username)}>Yes</button>
                                                        <button className="adm-action-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => setPendingDeleteDesigner(null)}>No</button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="adm-action-btn adm-action-btn--reject"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                        onClick={() => setPendingDeleteDesigner(d.id)}
                                                        title="Delete designer"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Password Reset Modal */}
            {editingPasswordUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e1e1e', borderRadius: 8, padding: 32, width: '90%', maxWidth: 400, border: '1px solid #333' }}>
                        <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--admin-gold)', fontSize: '1rem', margin: '0 0 8px' }}>Reset Password</h3>
                        <p style={{ color: '#aaa', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', marginBottom: 20 }}>
                            Setting new password for <strong style={{ color: 'white' }}>{editingPasswordUser.name}</strong>
                        </p>
                        <form onSubmit={handleUpdatePassword}>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="New password (min. 6 characters)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: 'white', fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', marginBottom: 16, boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => { setEditingPasswordUser(null); setNewPassword(''); }}
                                    style={{ padding: '9px 18px', background: '#333', color: '#aaa', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem' }}>Cancel</button>
                                <button type="submit" disabled={updatingPassword}
                                    style={{ padding: '9px 18px', background: 'var(--admin-gold)', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 700 }}>
                                    {updatingPassword ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Designer Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 32, width: '90%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: 'var(--admin-dark)', margin: 0 }}>Create Designer Account</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateDesigner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Full Name', value: createFullName, set: setCreateFullName, placeholder: 'e.g. Rahul Sharma', type: 'text' },
                                { label: 'Username', value: createUsername, set: setCreateUsername, placeholder: 'e.g. rahul_design', type: 'text' },
                                { label: 'Email Address', value: createEmail, set: setCreateEmail, placeholder: 'designer@email.com', type: 'email' },
                                { label: 'Initial Password', value: createPassword, set: setCreatePassword, placeholder: 'Min. 6 characters', type: 'password' },
                            ].map(f => (
                                <div key={f.label}>
                                    <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>{f.label}</label>
                                    <input
                                        type={f.type}
                                        required
                                        placeholder={f.placeholder}
                                        value={f.value}
                                        onChange={e => f.set(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" onClick={() => setShowCreateModal(false)}
                                    style={{ padding: '10px 20px', background: '#f5f5f7', color: '#555', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem' }}>Cancel</button>
                                <button type="submit" disabled={creating}
                                    style={{ padding: '10px 24px', background: '#C5A059', color: '#000', border: 'none', borderRadius: 4, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 700 }}>
                                    {creating ? 'Creating…' : 'Create Designer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MasterDesigners;
