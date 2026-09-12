import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MasterDesigners() {
    const { toasts, showToast } = useToast();
    const { idToken } = useAuth();
    const [searchParams] = useSearchParams();
    const [designers, setDesigners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Detailed stats drawer states
    const [selectedDesignerId, setSelectedDesignerId] = useState(null);
    const [selectedDesignerDetails, setSelectedDesignerDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

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

    useEffect(() => {
        if (!selectedDesignerId) {
            setSelectedDesignerDetails(null);
            return;
        }
        const fetchDetails = async () => {
            setDetailsLoading(true);
            try {
                const data = await apiFetch(`/api/designers/${selectedDesignerId}/admin-details`);
                setSelectedDesignerDetails(data);
            } catch (err) {
                console.error("Error fetching designer details:", err);
                showToast("Failed to fetch detailed info.", "error");
                setSelectedDesignerId(null);
            } finally {
                setDetailsLoading(false);
            }
        };
        fetchDetails();
    }, [selectedDesignerId]);

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

    const filteredDesigners = designers.filter(d => {
        const q = searchTerm.toLowerCase();
        return (
            (d.fullName || '').toLowerCase().includes(q) ||
            (d.username || '').toLowerCase().includes(q) ||
            (d.email || '').toLowerCase().includes(q) ||
            (d.id || '').toLowerCase().includes(q)
        );
    });

    const formatDate = (createdAt) => {
        if (!createdAt) return '—';
        const d = new Date(createdAt);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

            {/* Search Input Bar */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <div className="adm-search-wrap">
                    <input
                        type="text"
                        placeholder="Search designers by name or username..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="adm-search-input"
                    />
                    <i className="fas fa-search adm-search-icon"></i>
                </div>
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
                            {filteredDesigners.length === 0 ? (
                                <tr><td colSpan="8" className="adm-table__empty"><i className="fas fa-users"></i>No designers found.</td></tr>
                            ) : (
                                filteredDesigners.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.id.substring(0, 8)}...</td>
                                        <td>
                                            <span 
                                                onClick={() => setSelectedDesignerId(d.id)} 
                                                style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 600, borderBottom: '1px dotted var(--gold)' }}
                                                title="View detailed statistics"
                                            >
                                                {d.fullName || '—'}
                                            </span>
                                        </td>
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', borderRadius: 14, padding: 30, width: '90%', maxWidth: 420, border: '1px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
                        <h3 style={{ fontFamily: "'Cinzel', serif", color: '#111114', fontSize: '1.1rem', margin: '0 0 8px', fontWeight: 700 }}>Reset Password</h3>
                        <p style={{ color: '#6b7280', fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', marginBottom: 20 }}>
                            Setting new password for <strong style={{ color: '#111114' }}>{editingPasswordUser.name}</strong>
                        </p>
                        <form onSubmit={handleUpdatePassword}>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="New password (min. 6 characters)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111114', fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', marginBottom: 18, boxSizing: 'border-box', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => { setEditingPasswordUser(null); setNewPassword(''); }}
                                    style={{ padding: '9px 18px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', fontWeight: 600 }}>Cancel</button>
                                <button type="submit" disabled={updatingPassword}
                                    style={{ padding: '9px 20px', background: '#111114', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
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

            {/* Detailed Info Drawer Overlay */}
            {selectedDesignerId && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setSelectedDesignerId(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(6px)',
                            zIndex: 1999
                        }}
                    ></div>

                    {/* Drawer Panel */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '520px',
                        maxWidth: '90%',
                        height: '100%',
                        background: '#ffffff',
                        borderLeft: '1px solid #e5e7eb',
                        boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.08)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: "'Montserrat', sans-serif",
                        color: '#111114',
                        overflowY: 'auto'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 20px',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontFamily: "'Cinzel', serif", margin: 0, color: '#111114', fontSize: '1.2rem', fontWeight: 700, letterSpacing: 1 }}>
                                    DESIGNER PROFILE
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                                    UID: {selectedDesignerId}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDesignerId(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#9ca3af',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#111114'}
                                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div style={{ margin: 'auto', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                <div className="adm-spinner" style={{ marginBottom: 15 }}></div>
                                Loading details...
                            </div>
                        ) : selectedDesignerDetails ? (
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* Info Section */}
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                    {selectedDesignerDetails.designer.avatar_url ? (
                                        <img 
                                            src={selectedDesignerDetails.designer.avatar_url} 
                                            alt="avatar" 
                                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} 
                                        />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#111114', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', fontFamily: "'Cinzel'" }}>
                                            {(selectedDesignerDetails.designer.full_name || 'D')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111114' }}>{selectedDesignerDetails.designer.full_name}</h4>
                                        <span style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>@{selectedDesignerDetails.designer.username}</span>
                                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}><i className="far fa-envelope" style={{ marginRight: 6 }}></i>{selectedDesignerDetails.designer.email}</span>
                                        {selectedDesignerDetails.designer.contact && (
                                            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}><i className="fas fa-phone-alt" style={{ marginRight: 6 }}></i>{selectedDesignerDetails.designer.contact}</span>
                                        )}
                                        {selectedDesignerDetails.designer.address && (
                                            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}><i className="fas fa-map-marker-alt" style={{ marginRight: 6 }}></i>{selectedDesignerDetails.designer.address}, {selectedDesignerDetails.designer.country}</span>
                                        )}
                                        {(selectedDesignerDetails.designer.description || selectedDesignerDetails.designer.bio) && (
                                            <div style={{ marginTop: '6px', padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.78rem', color: '#374151' }}>
                                                <strong style={{ color: '#b45309' }}>Bio: </strong>{selectedDesignerDetails.designer.description || selectedDesignerDetails.designer.bio}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                                            {selectedDesignerDetails.designer.instagram && (
                                                <a 
                                                    href={selectedDesignerDetails.designer.instagram.startsWith('http') ? selectedDesignerDetails.designer.instagram : `https://instagram.com/${selectedDesignerDetails.designer.instagram.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: '#E1306C', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <i className="fab fa-instagram"></i> {selectedDesignerDetails.designer.instagram}
                                                </a>
                                            )}
                                            {selectedDesignerDetails.designer.linkedin && (
                                                <a 
                                                    href={selectedDesignerDetails.designer.linkedin.startsWith('http') ? selectedDesignerDetails.designer.linkedin : `https://linkedin.com/in/${selectedDesignerDetails.designer.linkedin}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: '#0077B5', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <i className="fab fa-linkedin"></i> {selectedDesignerDetails.designer.linkedin}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Ledger / Financial Grid */}
                                <div>
                                    <h4 style={{ fontFamily: "'Cinzel', serif", color: '#111114', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: 1 }}>
                                        FINANCIAL LEDGER
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Total Income</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>₹{Number(selectedDesignerDetails.wallet.total_earnings || 0).toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Payouts</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>₹{Number(selectedDesignerDetails.wallet.total_withdrawn || 0).toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Balance</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111114' }}>₹{Number(selectedDesignerDetails.wallet.balance || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity / Metrics Grid */}
                                <div>
                                    <h4 style={{ fontFamily: "'Cinzel', serif", color: '#111114', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: 1 }}>
                                        PLATFORM ACTIVITY
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Designs Uploaded</div>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#111114' }}>{selectedDesignerDetails.designs.length}</div>
                                        </div>
                                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Sales Orders</div>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#111114' }}>{selectedDesignerDetails.orders.length}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Designs list */}
                                <div>
                                    <h4 style={{ fontFamily: "'Cinzel', serif", color: '#111114', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: 1 }}>
                                        DESIGNS ({selectedDesignerDetails.designs.length})
                                    </h4>
                                    {selectedDesignerDetails.designs.length === 0 ? (
                                        <div style={{ color: '#6b7280', fontSize: '0.8rem', padding: '10px 0' }}>No designs uploaded yet.</div>
                                    ) : (
                                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedDesignerDetails.designs.map(d => (
                                                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111114' }}>{d.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>ID: {d.id.substring(0,8)}...</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#111114', fontWeight: 700 }}>₹{d.price.toLocaleString()}</span>
                                                        <span className={`adm-badge adm-badge--${d.status === 'approved' ? 'active' : d.status === 'pending' ? 'pending' : 'danger'}`} style={{ fontSize: '0.62rem' }}>
                                                            {d.status || 'pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Orders list */}
                                <div>
                                    <h4 style={{ fontFamily: "'Cinzel', serif", color: '#111114', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: 1 }}>
                                        SALES ORDERS ({selectedDesignerDetails.orders.length})
                                    </h4>
                                    {selectedDesignerDetails.orders.length === 0 ? (
                                        <div style={{ color: '#6b7280', fontSize: '0.8rem', padding: '10px 0' }}>No sales recorded.</div>
                                    ) : (
                                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedDesignerDetails.orders.map(o => (
                                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111114' }}>Order #{o.order_id || o.id}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{formatDate(o.created_at)}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111114' }}>₹{Number(o.total_amount || 0).toLocaleString()}</span>
                                                            <span style={{ fontSize: '0.65rem', color: '#10b981' }}>Earned: ₹{Number(o.designer_earnings || 0).toLocaleString()}</span>
                                                        </div>
                                                        <span className={`adm-badge adm-badge--${o.status === 'completed' ? 'active' : o.status === 'cancelled' ? 'danger' : 'info'}`} style={{ fontSize: '0.62rem' }}>
                                                            {o.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ margin: 'auto', color: '#6b7280' }}>No details found.</div>
                        )}
                    </div>
                </>
            )}
        </main>
    );
}

export default MasterDesigners;
