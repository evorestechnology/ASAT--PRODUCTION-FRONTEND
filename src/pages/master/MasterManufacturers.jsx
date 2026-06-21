import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MasterManufacturers() {
    const { toasts, showToast } = useToast();
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal and form states
    const [showModal, setShowModal] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [creating, setCreating] = useState(false);

    // Delete confirmation state
    const [pendingDeleteMfg, setPendingDeleteMfg] = useState(null);

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

            showToast(`Password for manufacturer "${editingPasswordUser.name}" updated successfully!`, 'success');
            setEditingPasswordUser(null);
            setNewPassword('');
        } catch (err) {
            console.error("Error updating manufacturer password:", err);
            showToast(err.error || err.message || 'Failed to update password', 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    // Fetch manufacturers
    const fetchManufacturers = async () => {
        try {
            const data = await apiFetch('/api/manufacturers');
            // Filter out 'deleted' status manufacturers
            setManufacturers((data || []).filter(m => m.status !== 'deleted'));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching manufacturers:', err);
            setError('Failed to load manufacturers directory.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManufacturers();
    }, []);

    // Handle manufacturer status toggle
    const handleStatusChange = async (mfgId, newStatus) => {
        try {
            await apiFetch(`/api/manufacturers/${mfgId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            showToast(`Manufacturer status updated to ${newStatus} successfully.`, 'success');
            fetchManufacturers();
        } catch (err) {
            console.error('Error changing manufacturer status:', err);
            showToast('Failed to update status: ' + (err.error || err.message), 'error');
        }
    };

    // Permanently delete a manufacturer (soft-delete: marks as deleted)
    const handleDeleteMfg = async (mfgId, name) => {
        try {
            await apiFetch(`/api/manufacturers/${mfgId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'deleted' })
            });
            showToast(`Manufacturer "${name}" has been deleted.`, 'success');
            fetchManufacturers();
        } catch (err) {
            console.error('Error deleting manufacturer:', err);
            showToast('Failed to delete: ' + (err.error || err.message), 'error');
        } finally {
            setPendingDeleteMfg(null);
        }
    };

    // Create a new manufacturer securely via backend API
    const handleCreateMfg = async (e) => {
        e.preventDefault();

        if (!companyName.trim() || !username.trim() || !email.trim() || !password.trim()) {
            showToast('All fields are required.', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/api/master/create-user', {
                method: 'POST',
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    role: 'mfg',
                    businessName: companyName.trim(),
                    username: username.trim().toLowerCase()
                })
            });

            showToast(`Manufacturer "${companyName}" created successfully!`, 'success');
            setShowModal(false);

            // Clear form
            setCompanyName('');
            setUsername('');
            setEmail('');
            setPassword('');
            fetchManufacturers();
        } catch (err) {
            console.error("Error creating manufacturer:", err);
            showToast('Failed to create manufacturer: ' + (err.error || err.message), 'error');
        } finally {
            setCreating(false);
        }
    };

    const getStatusType = (status) => {
        if (!status) return 'active';
        const s = status.toLowerCase();
        if (s === 'active') return 'active';
        if (s === 'suspended') return 'pending';
        if (s === 'blocked') return 'danger';
        return 'info';
    };

    const formatDate = (mfg) => {
        if (!mfg.created_at) return '—';
        return new Date(mfg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />

            <BackButton />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 className="adm-page__title">MANUFACTURERS</h1>
                    <p className="adm-page__subtitle">Manage and provision fabricators, printers, and suppliers</p>
                </div>
                <button 
                    className="adm-settings__btn" 
                    style={{ background: '#C5A059', color: '#121212', fontWeight: 600, padding: '12px 20px' }}
                    onClick={() => setShowModal(true)}
                >
                    <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Manufacturer
                </button>
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time manufacturers directory...</p>
                </div>
            ) : error ? (
                <div className="adm-error-alert">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Manufacturer ID</th>
                                <th>Company Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Created At</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manufacturers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="adm-table__empty">
                                        <i className="fas fa-industry"></i>No manufacturers registered yet.
                                    </td>
                                </tr>
                            ) : (
                                manufacturers.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: '600' }}>{m.id.substring(0, 8)}...</td>
                                        <td>{m.business_name || m.companyName || '—'}</td>
                                        <td>@{m.username || '—'}</td>
                                        <td>{m.email || '—'}</td>
                                        <td>{formatDate(m)}</td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(m.status)}`}>
                                                {m.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select
                                                    className="adm-action-btn"
                                                    style={{ padding: '4px 8px', outline: 'none' }}
                                                    value={m.status || 'active'}
                                                    onChange={(e) => handleStatusChange(m.id, e.target.value)}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspend</option>
                                                    <option value="blocked">Block</option>
                                                </select>
                                                <button
                                                    className="adm-action-btn"
                                                    style={{ padding: '4px 10px', background: '#333', color: '#C5A059', border: '1px solid #C5A059', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => setEditingPasswordUser({ uid: m.id, name: m.business_name || m.username || 'Manufacturer', role: 'Manufacturer' })}
                                                    title="Edit Password"
                                                >
                                                    <i className="fas fa-key"></i> Key
                                                </button>
                                                {pendingDeleteMfg === m.id ? (
                                                    <>
                                                        <span style={{ fontSize: '0.7rem', color: '#ff6b6b', whiteSpace: 'nowrap' }}>Delete?</span>
                                                        <button
                                                            className="adm-action-btn adm-action-btn--reject"
                                                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                            onClick={() => handleDeleteMfg(m.id, m.business_name || m.username)}
                                                        >Yes</button>
                                                        <button
                                                            className="adm-action-btn"
                                                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                            onClick={() => setPendingDeleteMfg(null)}
                                                        >No</button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="adm-action-btn adm-action-btn--reject"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                        onClick={() => setPendingDeleteMfg(m.id)}
                                                        title="Delete manufacturer"
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

            {/* Create Manufacturer Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#121212',
                        border: '1px solid #C5A059',
                        width: '100%',
                        maxWidth: '480px',
                        borderRadius: '12px',
                        padding: '30px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        position: 'relative',
                        color: '#fff'
                    }}>
                        <button 
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: '#aaa'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#C5A059', fontSize: '1.4rem', marginBottom: '8px', letterSpacing: '1px' }}>
                            CREATE MANUFACTURER
                        </h2>
                        <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '24px' }}>
                            Provision a new manufacturer account instantly.
                        </p>

                        <form onSubmit={handleCreateMfg}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#C5A059', letterSpacing: '0.5px' }}>
                                    COMPANY NAME
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Royal Textiles" 
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #333', 
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.85rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#C5A059', letterSpacing: '0.5px' }}>
                                    USERNAME
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. royaltextiles" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #333', 
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.85rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#C5A059', letterSpacing: '0.5px' }}>
                                    EMAIL ADDRESS
                                </label>
                                <input 
                                    type="email" 
                                    placeholder="e.g. royal@textiles.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #333', 
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.85rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#C5A059', letterSpacing: '0.5px' }}>
                                    INITIAL PASSWORD
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="Minimum 6 characters" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #333', 
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.85rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="adm-settings__btn"
                                style={{ 
                                    width: '100%', 
                                    background: '#C5A059', 
                                    color: '#121212', 
                                    fontWeight: 600,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    letterSpacing: '1px'
                                }}
                                disabled={creating}
                            >
                                {creating ? <i className="fas fa-spinner fa-spin"></i> : 'CREATE ACCOUNT'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Password Reset Modal */}
            {editingPasswordUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#121212',
                        border: '1px solid #C5A059',
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '12px',
                        padding: '30px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        position: 'relative',
                        color: '#fff',
                        fontFamily: "'Montserrat', sans-serif"
                    }}>
                        <button 
                            onClick={() => { setEditingPasswordUser(null); setNewPassword(''); }}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: '#aaa'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#C5A059', fontSize: '1.2rem', marginBottom: '8px', letterSpacing: '1px' }}>
                            CHANGE PASSWORD
                        </h2>
                        <p style={{ color: '#aaa', fontSize: '0.78rem', marginBottom: '24px' }}>
                            Update password for {editingPasswordUser.role} <strong>{editingPasswordUser.name}</strong>.
                        </p>

                        <form onSubmit={handleUpdatePassword}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#C5A059', letterSpacing: '0.5px' }}>
                                    NEW PASSWORD
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="Minimum 6 characters" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #333', 
                                        borderRadius: '6px',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.85rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="adm-settings__btn"
                                style={{ 
                                    width: '100%', 
                                    background: '#C5A059', 
                                    color: '#121212', 
                                    fontWeight: 600,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    letterSpacing: '1px'
                                }}
                                disabled={updatingPassword}
                            >
                                {updatingPassword ? <i className="fas fa-spinner fa-spin"></i> : 'UPDATE PASSWORD'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MasterManufacturers;
