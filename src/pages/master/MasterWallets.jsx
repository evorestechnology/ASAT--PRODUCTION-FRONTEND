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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    }
    .modal-content {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 28px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        color: #111114;
        font-family: 'Montserrat', sans-serif;
    }
    .modal-header h3 {
        margin: 0 0 15px 0;
        font-family: 'Cinzel', serif;
        color: #111114;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 12px;
    }
    .modal-body {
        font-size: 0.85rem;
        color: #4b5563;
        margin-bottom: 20px;
        line-height: 1.6;
    }
    .modal-body textarea {
        width: 100%;
        min-height: 80px;
        padding: 10px 14px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        color: #111114;
        margin-top: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        box-sizing: border-box;
    }
    .modal-body textarea:focus {
        border-color: #C5A059;
        outline: none;
        box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.12);
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

    const [orderLedger, setOrderLedger] = useState([]);

    const fetchEarningsStats = async () => {
        try {
            const data = await apiFetch('/api/wallets/admin-stats');
            if (data) {
                setWallet({
                    totalIncome: Number(data.totalRevenue) || 0,
                    designerPayouts: Number(data.designerPayouts) || 0,
                    mfgPayouts: Number(data.mfgPayouts) || 0,
                    platformEarnings: Number(data.platformEarnings) || 0,
                    completed: data.completed || { revenue: 0, designer: 0, mfg: 0, platform: 0 },
                    pending: data.pending || { revenue: 0, designer: 0, mfg: 0, platform: 0 }
                });
                setOrderLedger(data.ledger || []);
            }
        } catch (err) {
            console.error('Error fetching live admin wallet stats:', err);
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
            <p className="adm-page__subtitle">Platform income, earnings, and withdrawal requests</p>

            <div className="adm-wallet-cards">
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Total Income</div>
                    <div className="adm-wallet-card__value">₹{wallet.totalIncome.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Designer Earnings</div>
                    <div className="adm-wallet-card__value">₹{wallet.designerPayouts.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Mfg Earnings</div>
                    <div className="adm-wallet-card__value">₹{wallet.mfgPayouts.toLocaleString()}</div>
                </div>
                <div className="adm-wallet-card">
                    <div className="adm-wallet-card__label">Platform Earnings</div>
                    <div className="adm-wallet-card__value">₹{wallet.platformEarnings.toLocaleString()}</div>
                </div>
            </div>

            {/* Realized vs Escrow Breakdown Ribbon */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
                <div style={{ flex: 1, minWidth: 260, background: '#ffffff', border: '1px solid rgba(46, 204, 113, 0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--admin-shadow)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: '1.25rem' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Settled (Completed / Delivered)</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-text)', marginTop: 3 }}>
                            Revenue: ₹{(wallet.completed?.revenue || 0).toLocaleString()} <span style={{ color: '#ccc', margin: '0 8px' }}>|</span> <span style={{ color: '#16a34a' }}>Profit: ₹{(wallet.completed?.platform || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 260, background: '#ffffff', border: '1px solid rgba(243, 156, 18, 0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--admin-shadow)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-hourglass-half" style={{ color: '#d97706', fontSize: '1.25rem' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>In Escrow (In Progress / Shipping)</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-text)', marginTop: 3 }}>
                            Revenue: ₹{(wallet.pending?.revenue || 0).toLocaleString()} <span style={{ color: '#ccc', margin: '0 8px' }}>|</span> <span style={{ color: '#d97706' }}>Mfg Escrow: ₹{(wallet.pending?.mfg || 0).toLocaleString()}</span>
                        </div>
                    </div>
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

            {/* Order Financial Ledger */}
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '1px', margin: '35px 0 16px 0' }}>
                ORDER FINANCIAL LEDGER & MARGINS
            </h2>
            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Total Charged</th>
                            <th>Mfg Payout</th>
                            <th>Designer Royalty</th>
                            <th>Platform Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderLedger.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="adm-table__empty">
                                    <i className="fas fa-file-invoice-dollar"></i>No order transactions recorded yet.
                                </td>
                            </tr>
                        ) : (
                            orderLedger.map(tx => (
                                <tr key={tx.id} style={tx.isCancelled ? { opacity: 0.6 } : {}}>
                                    <td><strong>{tx.orderId || tx.id}</strong></td>
                                    <td>{formatDate(tx.date)}</td>
                                    <td>{tx.customer}</td>
                                    <td>
                                        <span className={`adm-badge adm-badge--${getStatusType(tx.status)}`}>
                                            {tx.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>₹{tx.totalAmount.toLocaleString('en-IN')}</td>
                                    <td style={{ color: tx.isCancelled ? '#888' : '#e67e22' }}>
                                        {tx.isCancelled ? '₹0 (Cancelled)' : `₹${tx.mfgEarnings.toLocaleString('en-IN')}`}
                                    </td>
                                    <td style={{ color: tx.isCancelled ? '#888' : 'var(--gold)' }}>
                                        {tx.isCancelled ? '₹0 (Cancelled)' : `₹${tx.designerEarnings.toLocaleString('en-IN')}`}
                                    </td>
                                    <td style={{ fontWeight: 600, color: tx.isCancelled ? '#888' : '#2ecc71' }}>
                                        {tx.isCancelled ? '₹0 (Cancelled)' : `₹${tx.platformEarnings.toLocaleString('en-IN')}`}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Approval Modal */}
            {pendingApprove && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Approve Earnings Withdrawal</h3>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to approve the earnings withdrawal of <strong>₹{pendingApprove.amount.toLocaleString()}</strong> to <strong>@{pendingApprove.username || pendingApprove.userId}</strong>? This action is immediate and will deduct funds from their balance.
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
                            Specify the reason for rejecting the earnings withdrawal of <strong>₹{pendingReject.amount.toLocaleString()}</strong> requested by <strong>@{pendingReject.username || pendingReject.userId}</strong>:
                            <textarea 
                                placeholder="Enter rejection reason..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => { setPendingReject(null); setRejectionReason(''); }}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: '#dc3545', color: '#fff', marginTop: 0 }} onClick={executeReject}>Reject Withdrawal</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MasterWallets;
