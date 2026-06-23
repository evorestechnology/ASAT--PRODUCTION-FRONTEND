import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';

function MasterDesigns() {
    const [tab, setTab] = useState('pending');
    const [allDesigns, setAllDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectComment, setRejectComment] = useState({});
    const [actionLoading, setActionLoading] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const { toasts, showToast } = useToast();
    const { packingCost, operatingCost } = useCurrency();

    const fetchDesigns = async () => {
        try {
            const data = await apiFetch('/api/designs/all');
            setAllDesigns(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching designs:', err);
            setError('Failed to load submissions.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesigns();
    }, []);

    const handleApprove = async (designId) => {
        try {
            setActionLoading(prev => ({ ...prev, [designId]: true }));
            await apiFetch(`/api/designs/${designId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'approved' })
            });
            showToast('Design approved and published successfully.', 'success');
            fetchDesigns();
        } catch (err) {
            console.error('Error approving design:', err);
            showToast('Failed to approve design: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [designId]: false }));
        }
    };

    const handleRejectOrRestrict = async (d) => {
        const comment = rejectComment[d.id] || '';
        if (!comment.trim()) {
            showToast('Please enter a rejection reason in the Comment field first.', 'warning');
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [d.id]: true }));
            await apiFetch(`/api/designs/${d.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'restricted',
                    rejection_reason: comment
                })
            });
            showToast('Design has been restricted.', 'success');
            setRejectComment(prev => ({ ...prev, [d.id]: '' }));
            fetchDesigns();
        } catch (err) {
            console.error('Error restricting design:', err);
            showToast('Failed to restrict design: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [d.id]: false }));
        }
    };

    const handleRevoke = async (designId) => {
        try {
            setActionLoading(prev => ({ ...prev, [designId]: true }));
            await apiFetch(`/api/designs/${designId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'approved' })
            });
            showToast('Design restriction revoked. It is now published.', 'success');
            fetchDesigns();
        } catch (err) {
            console.error('Error revoking restriction:', err);
            showToast('Failed to revoke: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [designId]: false }));
        }
    };

    const handleDelete = async (designId) => {
        if (!window.confirm('Are you sure you want to permanently delete this design? This action cannot be undone.')) return;
        try {
            setActionLoading(prev => ({ ...prev, [designId]: true }));
            await apiFetch(`/api/designs/${designId}`, {
                method: 'DELETE'
            });
            showToast('Design deleted permanently.', 'success');
            fetchDesigns();
        } catch (err) {
            console.error('Error deleting design:', err);
            showToast('Failed to delete: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [designId]: false }));
        }
    };

    const getImages = (d) => {
        if (Array.isArray(d.images)) return d.images;
        if (d.images) return [d.images];
        if (d.imageUrl) return [d.imageUrl];
        if (d.image) return [d.image];
        return [];
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'approved' || s === 'active') return 'active';
        if (s === 'pending') return 'pending';
        if (s === 'restricted' || s === 'rejected') return 'danger';
        return 'info';
    };

    const designs = allDesigns.filter(d => {
        if (tab === 'pending' && d.status !== 'pending') return false;
        if (tab === 'restricted' && d.status !== 'restricted') return false;
        if (tab === 'approved' && d.status !== 'approved') return false;

        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            return (
                (d.id || '').toLowerCase().includes(q) ||
                (d.title || '').toLowerCase().includes(q) ||
                (d.designer_username || '').toLowerCase().includes(q) ||
                (d.designer_id || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />
            <h1 className="adm-page__title">DESIGNS</h1>
            <p className="adm-page__subtitle">Approve, reject, or restrict designer submissions</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div className="adm-page__filters" style={{ margin: 0 }}>
                    <button
                        className={`adm-page__filter-btn ${tab === 'pending' ? 'adm-page__filter-btn--active' : ''}`}
                        onClick={() => setTab('pending')}
                    >
                        Pending Approvals
                    </button>
                    <button
                        className={`adm-page__filter-btn ${tab === 'approved' ? 'adm-page__filter-btn--active' : ''}`}
                        onClick={() => setTab('approved')}
                    >
                        Published Designs
                    </button>
                    <button
                        className={`adm-page__filter-btn ${tab === 'restricted' ? 'adm-page__filter-btn--active' : ''}`}
                        onClick={() => setTab('restricted')}
                    >
                        Restricted
                    </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search designs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px 35px 10px 15px',
                            background: '#1c1c1c',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: 'white',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '0.82rem',
                            width: '280px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}></i>
                </div>
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time submissions...</p>
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
                                <th>Design ID</th>
                                <th>Design Images</th>
                                <th>Designer</th>
                                <th>Product / Title</th>
                                <th>Pricing Breakdown</th>
                                <th>Status</th>
                                <th>{tab === 'pending' ? 'Action' : 'Restrict'}</th>
                                <th>Rejection Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {designs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="adm-table__empty">
                                        <i className="fas fa-palette"></i>No {tab} designs found.
                                    </td>
                                </tr>
                            ) : (
                                designs.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.id}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {getImages(d).slice(0, 3).map((img, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            background: `url(${img}) center/cover`,
                                                            borderRadius: 4,
                                                            border: '1px solid #eee'
                                                        }}
                                                    ></div>
                                                ))}
                                                {getImages(d).length === 0 && (
                                                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No image</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>@{d.designer_username || d.designerUsername || d.designer || '—'}</td>
                                        <td>{d.title || d.product || '—'}</td>
                                        <td>
                                            {(() => {
                                                try {
                                                    const desc = d.description && typeof d.description === 'string' && d.description.startsWith('{') ? JSON.parse(d.description) : null;
                                                    const pricing = desc?.pricing;
                                                    if (pricing) {
                                                        const bCost = pricing.baseCost || 0;
                                                        const pCost = pricing.printingCost || 0;
                                                        const dCost = pricing.designerCost || 0;
                                                        const oCost = operatingCost || 0;
                                                        const pkCost = packingCost || 0;
                                                        const totalSelling = d.price || 0;
                                                        const rawTotal = bCost + pCost + dCost + oCost + pkCost;
                                                        const calculatedMarkup = Math.max(0, totalSelling - rawTotal);

                                                        return (
                                                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px', width: '140px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Base:</span>
                                                                    <span>₹{bCost.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Print:</span>
                                                                    <span>₹{pCost.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Designer:</span>
                                                                    <span>₹{dCost.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Operating:</span>
                                                                    <span>₹{oCost.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Packing:</span>
                                                                    <span>₹{pkCost.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#888' }}>Markup:</span>
                                                                    <span style={{ color: '#C5A059' }}>₹{calculatedMarkup.toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '4px', marginTop: '2px', fontWeight: 'bold' }}>
                                                                    <span>Total:</span>
                                                                    <span>₹{totalSelling.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                } catch (e) {}
                                                return <span style={{ fontWeight: 'bold' }}>Total: ₹{(d.price || 0).toLocaleString()}</span>;
                                            })()}
                                        </td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(d.status)}`}>
                                                {d.status || 'pending'}
                                            </span>
                                        </td>
                                        <td>
                                            {tab === 'pending' ? (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--approve"
                                                        onClick={() => handleApprove(d.id)}
                                                        disabled={actionLoading[d.id]}
                                                    >
                                                        {actionLoading[d.id] ? '...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--reject"
                                                        onClick={() => handleRejectOrRestrict(d)}
                                                        disabled={actionLoading[d.id]}
                                                    >
                                                        {actionLoading[d.id] ? '...' : 'Reject'}
                                                    </button>
                                                </div>
                                            ) : tab === 'restricted' ? (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--approve"
                                                        onClick={() => handleRevoke(d.id)}
                                                        disabled={actionLoading[d.id]}
                                                    >
                                                        {actionLoading[d.id] ? '...' : 'Revoke'}
                                                    </button>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--reject"
                                                        onClick={() => handleDelete(d.id)}
                                                        disabled={actionLoading[d.id]}
                                                    >
                                                        {actionLoading[d.id] ? '...' : 'Delete'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="adm-action-btn adm-action-btn--reject"
                                                    onClick={() => handleRejectOrRestrict(d)}
                                                    disabled={actionLoading[d.id]}
                                                >
                                                    {actionLoading[d.id] ? '...' : 'Restrict'}
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            {tab !== 'restricted' ? (
                                                <input
                                                    type="text"
                                                    placeholder="Rejection reason (required)..."
                                                    value={rejectComment[d.id] || ''}
                                                    onChange={e => setRejectComment(p => ({ ...p, [d.id]: e.target.value }))}
                                                    style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: '0.85rem', color: '#d44', maxWidth: '200px', wordWrap: 'break-word' }}>
                                                    {d.rejection_reason || 'No reason provided.'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default MasterDesigns;
