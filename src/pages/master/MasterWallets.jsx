import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const modalStyles = `
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

function MasterWallets() {
    const { toasts, showToast } = useToast();
    const [wallet, setWallet] = useState({ totalIncome: 0, designerPayouts: 0, mfgPayouts: 0, platformEarnings: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Modal Confirmation states
    const [pendingApprove, setPendingApprove] = useState(null); // withdrawal item
    const [pendingReject, setPendingReject] = useState(null);   // withdrawal item
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchEarningsStats = async () => {
        try {
            const data = await apiFetch('/api/orders');
            const completed = (data || []).filter(o => o.status === 'completed');

            let income = 0;
            let designers = 0;
            let mfg = 0;

            completed.forEach(o => {
                income += Number(o.total_amount || 0);
                designers += Number(o.designer_earnings || 0);
                mfg += Number(o.mfg_earnings || 0);
            });

            setWallet({
                totalIncome: income,
                designerPayouts: designers,
                mfgPayouts: mfg,
                platformEarnings: income - designers - mfg
            });
        } catch (err) {
            console.error('Error fetching live order earnings:', err);
            setError('Failed to fetch financial stats.');
        }
    };

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
        fetchEarningsStats();
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
            fetchEarningsStats();
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

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <style>{modalStyles}</style>
            <ToastContainer toasts={toasts} />

            <BackButton />
            <h1 className="adm-page__title">WALLET</h1>
            <p className="adm-page__subtitle">Platform income, payouts, and withdrawal requests</p>

            <div className="adm-wallet-cards">
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Total Income</div>
                    <div className="adm-wallet-card__value">₹{wallet.totalIncome.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Designer Payouts</div>
                    <div className="adm-wallet-card__value">₹{wallet.designerPayouts.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Mfg Payouts</div>
                    <div className="adm-wallet-card__value">₹{wallet.mfgPayouts.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Platform Earnings</div>
                    <div className="adm-wallet-card__value">₹{wallet.platformEarnings.toLocaleString()}</div>
                </div>
            </div>

            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '1px', marginBottom: '16px' }}>WITHDRAWAL REQUESTS</h2>
            
            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time withdrawals...</p>
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
                            {withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="adm-table__empty">
                                        <i className="fas fa-wallet"></i>No withdrawal requests yet.
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map(w => (
                                    <tr key={w.id}>
                                        <td>{w.id}</td>
                                        <td>@{w.username || w.userId || '—'}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{w.role || 'designer'}</td>
                                        <td>₹{(w.amount || 0).toLocaleString()}</td>
                                        <td>{formatDate(w.createdAt || w.date)}</td>
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
                            Are you sure you want to approve the payout of <strong>₹{pendingApprove.amount.toLocaleString()}</strong> to <strong>@{pendingApprove.username || pendingApprove.userId}</strong>? This action is immediate and will deduct funds from their balance.
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
                            Specify the reason for rejecting the payout of <strong>₹{pendingReject.amount.toLocaleString()}</strong> requested by <strong>@{pendingReject.username || pendingReject.userId}</strong>:
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

export default MasterWallets;
