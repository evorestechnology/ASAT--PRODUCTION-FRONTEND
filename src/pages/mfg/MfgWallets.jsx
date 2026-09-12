import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import '../../styles/admin.css';

function MfgWallets() {
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawn: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [companyName, setCompanyName] = useState('Manufacturer');
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [withdrawAmt, setWithdrawAmt] = useState('');
    const [requesting, setRequesting] = useState(false);

    const fetchMfgProfile = async () => {
        try {
            const data = await apiFetch('/api/manufacturers/me');
            if (data) {
                setCompanyName(data.business_name || 'Manufacturer');
            }
        } catch (err) {
            console.error("Error fetching mfg profile:", err);
        }
    };

    const fetchWallet = async () => {
        try {
            const data = await apiFetch('/api/wallets/me');
            if (data) {
                setWallet({
                    balance: Number(data.balance) || 0,
                    pendingBalance: Number(data.pending_balance) || 0,
                    totalEarnings: Number(data.total_earnings) || 0,
                    totalWithdrawn: Number(data.total_withdrawn) || 0
                });
            }
        } catch (err) {
            console.error("Error fetching wallet:", err);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const data = await apiFetch('/api/wallets/withdrawals');
            const list = (data || []).map(row => ({
                id: row.id,
                amount: Number(row.amount) || 0,
                status: row.status || 'pending',
                date: row.created_at ? new Date(row.created_at).getTime() : Date.now()
            }));
            setWithdrawals(list);
        } catch (err) {
            console.error("Error fetching withdrawals:", err);
        }
    };

    const fetchLedger = async () => {
        try {
            const data = await apiFetch('/api/wallets/ledger');
            setLedger(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching mfg ledger:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchMfgProfile();
        fetchWallet();
        fetchWithdrawals();
        fetchLedger();
    }, [user]);

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();
        const amt = parseInt(withdrawAmt, 10);
        if (!amt || amt <= 0) {
            showToast('Please enter a valid amount.', 'warning');
            return;
        }
        if (amt > wallet.balance) {
            showToast('Insufficient withdrawable balance.', 'error');
            return;
        }

        setRequesting(true);
        try {
            await apiFetch('/api/wallets/withdraw', {
                method: 'POST',
                body: JSON.stringify({ amount: amt })
            });

            showToast(`Withdrawal request for ₹${amt.toLocaleString('en-IN')} submitted!`, 'success');
            setShowModal(false);
            setWithdrawAmt('');
            fetchWallet();
            fetchWithdrawals();
        } catch (error) {
            console.error("Error submitting withdrawal request:", error);
            showToast("Error: " + (error.error || error.message || "Failed to submit request"), 'error');
        } finally {
            setRequesting(false);
        }
    };

    const formatDate = (timeMs) => {
        if (!timeMs) return 'N/A';
        return new Date(timeMs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />
            <h1 className="adm-page__title">WALLET</h1>
            <p className="adm-page__subtitle">Withdrawable balance, in-production pending escrow, and withdrawal requests</p>

            <div className="adm-wallet-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 25 }}>
                <div className="adm-wallet-card" style={{ background: '#ffffff', color: '#111114', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '4px solid #16a34a' }}>
                    <div className="adm-wallet-card__label" style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Withdrawable Balance</div>
                    <div className="adm-wallet-card__value" style={{ color: '#16a34a', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>₹{wallet.balance.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Available for immediate withdrawal</div>
                </div>
                <div className="adm-wallet-card" style={{ background: '#ffffff', color: '#111114', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '4px solid #d97706' }}>
                    <div className="adm-wallet-card__label" style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending / In Production</div>
                    <div className="adm-wallet-card__value" style={{ color: '#d97706', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>₹{wallet.pendingBalance.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Credited upon order delivery</div>
                </div>
                <div className="adm-wallet-card" style={{ background: '#ffffff', color: '#111114', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '4px solid #111114' }}>
                    <div className="adm-wallet-card__label" style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Lifetime Settled Earnings</div>
                    <div className="adm-wallet-card__value" style={{ color: '#111114', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>₹{wallet.totalEarnings.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Total completed orders earnings</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <button className="adm-settings__btn" style={{ background: '#111114', color: '#ffffff', fontWeight: 600, padding: '11px 22px', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} onClick={() => setShowModal(true)}>
                    <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i> Request Withdrawal
                </button>
            </div>

            {/* Order Earnings Ledger */}
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '1px', marginBottom: '16px' }}>ORDER EARNINGS & PRODUCTION LEDGER</h2>
            <div className="adm-table-wrap" style={{ marginBottom: 35 }}>
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Your Payout</th>
                            <th>Production Status</th>
                            <th>Wallet Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="adm-table__empty"><i className="fas fa-spinner fa-spin"></i> Loading order ledger...</td></tr>
                        ) : ledger.length === 0 ? (
                            <tr><td colSpan="7" className="adm-table__empty"><i className="fas fa-box-open"></i> No assigned orders found.</td></tr>
                        ) : (
                            ledger.map(row => (
                                <tr key={row.id} style={row.isCancelled ? { opacity: 0.5 } : {}}>
                                    <td style={{ fontWeight: 600 }}>{row.orderId || row.id}</td>
                                    <td>{formatDate(row.date)}</td>
                                    <td>{row.customer}</td>
                                    <td>{row.itemsCount} pcs</td>
                                    <td style={{ fontWeight: 700, color: row.isCancelled ? '#888' : '#e67e22' }}>
                                        {row.isCancelled ? '₹0 (Cancelled)' : `₹${row.amount.toLocaleString('en-IN')}`}
                                    </td>
                                    <td>
                                        <span className={`adm-badge ${
                                            row.status === 'completed' || row.status === 'delivered' ? 'adm-badge--active' :
                                            row.status === 'cancelled' ? 'adm-badge--pending' : 'adm-badge--pending'
                                        }`} style={row.status === 'cancelled' ? { color: '#ef4444', borderColor: '#ef4444' } : {}}>
                                            {row.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: row.isCancelled ? '#888' : row.isDelivered ? '#2ecc71' : '#f39c12'
                                        }}>
                                            {row.settlementStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '1px', marginBottom: '16px' }}>WITHDRAWAL HISTORY</h2>
            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="adm-table__empty"><i className="fas fa-spinner fa-spin"></i> Loading withdrawal history...</td></tr>
                        ) : withdrawals.length === 0 ? (
                            <tr><td colSpan="4" className="adm-table__empty"><i className="fas fa-wallet"></i> No withdrawal history.</td></tr>
                        ) : (
                            withdrawals.map(w => (
                                <tr key={w.id}>
                                    <td style={{ fontWeight: '600' }}>{w.id.substring(0, 8)}...</td>
                                    <td>₹{w.amount.toLocaleString('en-IN')}</td>
                                    <td>{formatDate(w.date)}</td>
                                    <td>
                                        <span className={`adm-badge ${
                                            w.status === 'approved' ? 'adm-badge--active' : 
                                            w.status === 'rejected' ? 'adm-badge--pending' : 'adm-badge--pending'
                                        }`} style={
                                            w.status === 'rejected' ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' } : 
                                            w.status === 'approved' ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: '#10b981' } : 
                                            { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: '#f59e0b' }
                                        }>
                                            {w.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Withdrawal Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: 20
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 12,
                        padding: 30,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: '#aaa'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h2 style={{ fontFamily: "'Montserrat'", fontSize: '1.25rem', fontWeight: 700, marginBottom: 10 }}>Request Withdrawal</h2>
                        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 20 }}>
                            Available balance: <strong>₹{wallet.balance.toLocaleString('en-IN')}</strong>
                        </p>

                        <form onSubmit={handleWithdrawRequest}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 8, color: '#333' }}>Amount (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="Enter amount to withdraw" 
                                    value={withdrawAmt}
                                    onChange={(e) => setWithdrawAmt(e.target.value)}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: 6,
                                        fontFamily: "'Montserrat'", 
                                        fontSize: '0.9rem', 
                                        boxSizing: 'border-box'
                                    }} 
                                    max={wallet.balance}
                                    min="1"
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
                                    padding: '12px',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                }}
                                disabled={requesting}
                            >
                                {requesting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MfgWallets;
