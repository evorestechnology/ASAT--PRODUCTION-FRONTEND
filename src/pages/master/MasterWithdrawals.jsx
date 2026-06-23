import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const localStyles = `
    .withdraw-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 30px;
    }
    @media (max-width: 900px) {
        .withdraw-stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 550px) {
        .withdraw-stats-grid {
            grid-template-columns: 1fr;
        }
    }
    .withdraw-stat-card {
        background: #18181b;
        border: 1px solid rgba(197, 160, 89, 0.2);
        border-radius: 8px;
        padding: 20px;
        color: white;
        transition: 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    .withdraw-stat-card:hover {
        border-color: var(--gold);
        transform: translateY(-2px);
    }
    .withdraw-stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #a1a1aa;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    .withdraw-stat-value {
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--gold);
    }
    
    .withdraw-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 20px;
    }
    .withdraw-search {
        background: #18181b;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px;
        padding: 10px 15px;
        color: white;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        min-width: 250px;
        transition: 0.3s;
    }
    .withdraw-search:focus {
        border-color: var(--gold);
    }
    
    .withdraw-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .withdraw-filter-btn {
        background: #18181b;
        border: 1px solid rgba(255,255,255,0.1);
        color: #ccc;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: 0.2s;
    }
    .withdraw-filter-btn:hover {
        border-color: var(--gold);
        color: white;
    }
    .withdraw-filter-btn--active {
        background: var(--gold);
        color: black !important;
        font-weight: 600;
        border-color: var(--gold);
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    }
    .modal-content {
        background: #1c1c1c;
        border: 1px solid rgba(197, 160, 89, 0.3);
        border-radius: 8px;
        padding: 30px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        color: #fff;
        font-family: 'Montserrat', sans-serif;
    }
    .modal-header h3 {
        margin: 0 0 15px 0;
        font-family: 'Cinzel', serif;
        color: var(--gold);
        font-size: 1.1rem;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 10px;
    }
    .modal-body {
        font-size: 0.85rem;
        color: #ccc;
        margin-bottom: 20px;
        line-height: 1.6;
    }
    .modal-body textarea {
        width: 100%;
        min-height: 80px;
        padding: 10px;
        background: #141414;
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        margin-top: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        box-sizing: border-box;
    }
    .modal-body textarea:focus {
        border-color: var(--gold);
        outline: none;
    }
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
`;

function MasterWithdrawals() {
    const { toasts, showToast } = useToast();
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Filter and search states
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Confirmation states
    const [pendingApprove, setPendingApprove] = useState(null); // withdrawal item
    const [pendingReject, setPendingReject] = useState(null);   // withdrawal item
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchWithdrawals = async () => {
        try {
            const data = await apiFetch('/api/wallets/withdrawals/all');

            const list = (data || []).map(w => ({
                id: w.id,
                userId: w.user_id,
                username: w.username,
                role: w.role,
                amount: Number(w.amount || 0),
                status: w.status,
                rejectionReason: w.rejection_reason,
                processedAt: w.processed_at,
                processedBy: w.processed_by,
                createdAt: w.created_at
            }));

            setWithdrawals(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching live withdrawals:', err);
            setError('Failed to fetch withdrawal requests.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const executeApprove = async () => {
        const w = pendingApprove;
        if (!w) return;
        
        setPendingApprove(null);
        try {
            setActionLoading(prev => ({ ...prev, [w.id]: true }));

            await apiFetch(`/api/wallets/withdrawals/${w.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'approved' })
            });

            showToast('Withdrawal request approved successfully!', 'success');
            fetchWithdrawals();
        } catch (err) {
            console.error('Error approving withdrawal request:', err);
            showToast('Failed to approve withdrawal request: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [w.id]: false }));
        }
    };

    const executeReject = async () => {
        const w = pendingReject;
        if (!w) return;
        if (!rejectionReason.trim()) {
            showToast('Rejection reason is required.', 'error');
            return;
        }

        setPendingReject(null);
        try {
            setActionLoading(prev => ({ ...prev, [w.id]: true }));
            await apiFetch(`/api/wallets/withdrawals/${w.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason.trim()
                })
            });
            showToast('Withdrawal request rejected.', 'success');
            setRejectionReason('');
            fetchWithdrawals();
        } catch (err) {
            console.error('Error rejecting withdrawal request:', err);
            showToast('Failed to reject withdrawal request: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [w.id]: false }));
        }
    };

    const formatDate = (createdAt) => {
        if (!createdAt) return '—';
        const date = new Date(createdAt);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'approved' || s === 'completed') return 'active';
        if (s === 'pending') return 'pending';
        if (s === 'rejected' || s === 'cancelled') return 'danger';
        return 'info';
    };

    // Calculate Summary Stats
    const totalPendingAmount = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

    const totalApprovedAmount = withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + w.amount, 0);

    const totalRejectedAmount = withdrawals
        .filter(w => w.status === 'rejected')
        .reduce((sum, w) => sum + w.amount, 0);

    // Apply Filter & Search
    const filteredWithdrawals = withdrawals.filter(w => {
        // Status filter
        const matchStatus = statusFilter === 'all' || w.status === statusFilter;
        // Role filter
        const matchRole = roleFilter === 'all' || w.role === roleFilter;
        // Search query
        const matchSearch = searchQuery.trim() === '' || 
            (w.username && w.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            w.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.id.toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchStatus && matchRole && matchSearch;
    });

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <style>{localStyles}</style>
            <ToastContainer toasts={toasts} />

            <BackButton />
            <h1 className="adm-page__title">WITHDRAWALS</h1>
            <p className="adm-page__subtitle">Review and clear payout withdrawal requests from designers and manufacturers</p>

            {/* Stats grid */}
            <div className="withdraw-stats-grid">
                <div className="withdraw-stat-card">
                    <div className="withdraw-stat-label">Pending Payouts</div>
                    <div className="withdraw-stat-value">₹{totalPendingAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="withdraw-stat-card">
                    <div className="withdraw-stat-label">Approved Payouts</div>
                    <div className="withdraw-stat-value">₹{totalApprovedAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="withdraw-stat-card">
                    <div className="withdraw-stat-label">Rejected Payouts</div>
                    <div className="withdraw-stat-value">₹{totalRejectedAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="withdraw-stat-card">
                    <div className="withdraw-stat-label">Total Requests</div>
                    <div className="withdraw-stat-value">{withdrawals.length}</div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="withdraw-controls">
                <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                    {/* Status Filter */}
                    <div className="withdraw-filters">
                        <span style={{ fontSize: '0.8rem', color: '#888', alignSelf: 'center', marginRight: 5 }}>Status:</span>
                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                            <button
                                key={s}
                                className={`withdraw-filter-btn ${statusFilter === s ? 'withdraw-filter-btn--active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Role Filter */}
                    <div className="withdraw-filters">
                        <span style={{ fontSize: '0.8rem', color: '#888', alignSelf: 'center', marginRight: 5 }}>Role:</span>
                        {['all', 'designer', 'mfg'].map(r => (
                            <button
                                key={r}
                                className={`withdraw-filter-btn ${roleFilter === r ? 'withdraw-filter-btn--active' : ''}`}
                                onClick={() => setRoleFilter(r)}
                            >
                                {r === 'all' ? 'ALL ROLES' : r === 'mfg' ? 'MANUFACTURER' : 'DESIGNER'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search by username..."
                    className="withdraw-search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading withdrawal requests...</p>
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
                                <th>Request ID</th>
                                <th>Requested By</th>
                                <th>Role</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="adm-table__empty">
                                        <i className="fas fa-wallet"></i>No withdrawal requests match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdrawals.map(w => (
                                    <tr key={w.id}>
                                        <td>{w.id}</td>
                                        <td>@{w.username || w.userId || '—'}</td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            <span className={`adm-badge adm-badge--${w.role === 'mfg' ? 'info' : 'warning'}`}>
                                                {w.role === 'mfg' ? 'mfg' : 'designer'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>₹{(w.amount || 0).toLocaleString('en-IN')}</td>
                                        <td>{formatDate(w.createdAt)}</td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(w.status)}`}>
                                                {w.status || 'pending'}
                                            </span>
                                            {w.status === 'rejected' && w.rejectionReason && (
                                                <div style={{ fontSize: '0.7rem', color: '#ff6b6b', marginTop: 4 }}>
                                                    Reason: {w.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {w.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--approve"
                                                        onClick={() => setPendingApprove(w)}
                                                        disabled={actionLoading[w.id]}
                                                    >
                                                        {actionLoading[w.id] ? '...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="adm-action-btn adm-action-btn--reject"
                                                        onClick={() => setPendingReject(w)}
                                                        disabled={actionLoading[w.id]}
                                                    >
                                                        {actionLoading[w.id] ? '...' : 'Reject'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approval Modal */}
            {pendingApprove && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Approve Payout</h3>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to approve the payout of <strong>₹{pendingApprove.amount.toLocaleString('en-IN')}</strong> to <strong>@{pendingApprove.username || pendingApprove.userId}</strong>? This action is immediate and will deduct funds from their balance.
                        </div>
                        <div className="modal-footer">
                            <button className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => setPendingApprove(null)}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: 'var(--gold)', color: '#000', marginTop: 0 }} onClick={executeApprove}>Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {pendingReject && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Reject Withdrawal</h3>
                        </div>
                        <div className="modal-body">
                            Specify the reason for rejecting the payout of <strong>₹{pendingReject.amount.toLocaleString('en-IN')}</strong> requested by <strong>@{pendingReject.username || pendingReject.userId}</strong>:
                            <textarea 
                                placeholder="Enter rejection reason..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => { setPendingReject(null); setRejectionReason(''); }}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: '#dc3545', color: '#fff', marginTop: 0 }} onClick={executeReject}>Reject Payout</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MasterWithdrawals;
