import React, { useState, useEffect } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function DesignerEarnings() {
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmt, setWithdrawAmt] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchWalletAndWithdrawals = async () => {
        if (!user) return;
        try {
            // 1. Fetch wallet
            const walletData = await apiFetch('/api/wallets/me').catch(() => null);
            if (walletData) {
                setWalletBalance(Number(walletData.balance) || 0);
                setTotalWithdrawn(Number(walletData.total_withdrawn) || 0);
            }

            // 2. Fetch withdrawals
            const withdrawalsData = await apiFetch('/api/wallets/withdrawals');

            const list = (withdrawalsData || []).map(w => {
                return {
                    id: w.id,
                    amount: Number(w.amount) || 0,
                    status: w.status || 'pending',
                    date: w.created_at ? new Date(w.created_at).getTime() : Date.now()
                };
            });
            setWithdrawals(list);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching earnings data:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchWalletAndWithdrawals();
    }, [user]);

    const handleWithdraw = async () => {
        const amt = parseInt(withdrawAmt);
        if (!amt || amt <= 0) {
            showToast('Please enter a valid amount.', 'warning');
            return;
        }
        if (amt > walletBalance) {
            showToast('Insufficient balance in wallet.', 'error');
            return;
        }

        try {
            await apiFetch('/api/wallets/withdraw', {
                method: 'POST',
                body: JSON.stringify({ amount: amt })
            });

            showToast(`Withdrawal request for ₹${amt.toLocaleString('en-IN')} submitted!`, 'success');
            setShowWithdraw(false);
            setWithdrawAmt('');
            fetchWalletAndWithdrawals();
        } catch (err) {
            console.error("Error processing withdrawal request:", err);
            showToast("Could not process withdrawal request. Please try again.", 'error');
        }
    };

    const statusClass = (s) => {
        const lower = s.toLowerCase();
        if (lower === 'paid' || lower === 'completed' || lower === 'approved') return 'dsn-status--paid';
        if (lower === 'rejected' || lower === 'cancelled' || lower === 'failed') return 'dsn-status--failed';
        return 'dsn-status--pending';
    };

    const totalEarnings = walletBalance + totalWithdrawn;

    return (
        <main className="dsn-earnings">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="dsn-spinner" style={{ margin: '0 auto 15px' }} />
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', color: '#666' }}>Fetching financial records...</p>
                </div>
            ) : (
                <>
                    <div className="dsn-earnings__cards">
                        <div className="dsn-earnings__card">
                            <div className="dsn-earnings__card-icon"><i className="fas fa-chart-line"></i></div>
                            <div>
                                <span className="dsn-earnings__card-label">Total Earnings</span>
                                <span className="dsn-earnings__card-amount">₹{totalEarnings.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="dsn-earnings__card">
                            <div className="dsn-earnings__card-icon"><i className="fas fa-wallet"></i></div>
                            <div>
                                <span className="dsn-earnings__card-label">Wallet Balance</span>
                                <span className="dsn-earnings__card-amount">₹{walletBalance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="dsn-earnings__action-row">
                        <button className="dsn-auth__btn" onClick={() => setShowWithdraw(true)}>
                            <span>Request Withdrawal</span><i className="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    {showWithdraw && (
                        <div className="dsn-modal-overlay" onClick={() => setShowWithdraw(false)}>
                            <div className="dsn-modal" onClick={e => e.stopPropagation()}>
                                <h3>Withdraw Funds</h3>
                                <p>Available balance: <strong>₹{walletBalance.toLocaleString('en-IN')}</strong></p>
                                <div className="dsn-auth__field">
                                    <span style={{ padding: '0 8px', color: 'var(--gold)', fontWeight: 600 }}>₹</span>
                                    <input type="number" placeholder="Enter amount" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} max={walletBalance} />
                                </div>
                                <div className="dsn-modal__actions">
                                    <button className="dsn-modal__cancel" onClick={() => setShowWithdraw(false)}>Cancel</button>
                                    <button className="dsn-auth__btn" onClick={handleWithdraw}><span>Confirm</span></button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="dsn-page-head" style={{ marginTop: 40 }}>
                        <h3 className="dsn-page-title">Withdrawal History</h3>
                    </div>
                    <div className="dsn-table-wrap">
                        <table className="dsn-table">
                            <thead><tr><th>Date</th><th>Royalty Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {withdrawals.length === 0 && (
                                    <tr><td colSpan="3" className="dsn-table__empty"><i className="fas fa-receipt" style={{fontSize:'1.5rem',marginBottom:8,display:'block',color:'#ddd'}}></i>No withdrawal history</td></tr>
                                )}
                                {withdrawals.sort((a,b) => b.date - a.date).map(w => (
                                    <tr key={w.id}>
                                        <td>{w.date ? new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                        <td className="dsn-table__royalty">₹{w.amount.toLocaleString('en-IN')}</td>
                                        <td><span className={`dsn-status ${statusClass(w.status)}`}>{w.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </main>
    );
}

export default DesignerEarnings;
