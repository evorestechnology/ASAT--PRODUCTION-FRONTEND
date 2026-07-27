import React, { useState, useEffect } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function DesignerEarnings() {
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const [designerProfile, setDesignerProfile] = useState(null);
    const [payoutId, setPayoutId] = useState('');
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

    const fetchWalletAndWithdrawals = async () => {
        if (!user) return;
        try {
            // 1. Fetch profile for payout info & country
            const prof = await apiFetch('/api/designers/me').catch(() => null);
            if (prof) setDesignerProfile(prof);

            // 2. Fetch wallet
            const walletData = await apiFetch('/api/wallets/me').catch(() => null);
            if (walletData) {
                setWalletBalance(Number(walletData.balance) || 0);
                setTotalWithdrawn(Number(walletData.total_withdrawn) || 0);
            }

            // 3. Fetch withdrawals
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

    const handleOpenWithdrawModal = () => {
        const isIndia = !designerProfile?.country || (designerProfile?.country || '').trim().toLowerCase() === 'india';
        const existingId = isIndia ? (designerProfile?.upi_id || '') : (designerProfile?.paypal_id || '');
        setPayoutId(existingId);
        setShowWithdraw(true);
    };

    const isIndia = !designerProfile?.country || (designerProfile?.country || '').trim().toLowerCase() === 'india';

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
        if (!payoutId.trim()) {
            showToast(isIndia ? 'UPI ID is required for payout.' : 'PayPal ID is required for payout.', 'warning');
            return;
        }

        setSubmittingWithdraw(true);
        try {
            // Save/update payout ID on profile
            const updatePayload = isIndia ? { upi_id: payoutId.trim() } : { paypal_id: payoutId.trim() };
            await apiFetch('/api/designers/me', {
                method: 'PUT',
                body: JSON.stringify(updatePayload)
            }).catch(e => console.error('Failed to update payout ID on profile:', e));

            await apiFetch('/api/wallets/withdraw', {
                method: 'POST',
                body: JSON.stringify({
                    amount: amt,
                    paymentMethod: isIndia ? 'upi' : 'paypal',
                    paymentId: payoutId.trim()
                })
            });

            showToast(`Withdrawal request for ₹${amt.toLocaleString('en-IN')} submitted!`, 'success');
            setShowWithdraw(false);
            setWithdrawAmt('');
            fetchWalletAndWithdrawals();
        } catch (err) {
            console.error("Error processing withdrawal request:", err);
            showToast("Could not process withdrawal request. Please try again.", 'error');
        } finally {
            setSubmittingWithdraw(false);
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
                        <button className="dsn-auth__btn" onClick={handleOpenWithdrawModal}>
                            <span>Request Withdrawal</span><i className="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    {showWithdraw && (
                        <div className="dsn-modal-overlay" onClick={() => !submittingWithdraw && setShowWithdraw(false)}>
                            <div className="dsn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                                <h3>Withdraw Funds</h3>
                                <p>Available balance: <strong>₹{walletBalance.toLocaleString('en-IN')}</strong></p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: 6, fontFamily: 'Montserrat' }}>
                                            Withdrawal Amount *
                                        </label>
                                        <div className="dsn-auth__field">
                                            <span style={{ padding: '0 8px', color: 'var(--gold)', fontWeight: 600 }}>₹</span>
                                            <input type="number" placeholder="Enter amount" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} max={walletBalance} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: 6, fontFamily: 'Montserrat' }}>
                                            {isIndia ? 'UPI ID (for payout) *' : 'PayPal ID / Email (for payout) *'}
                                        </label>
                                        <div className="dsn-auth__field">
                                            <i className={isIndia ? "fas fa-mobile-alt" : "fab fa-paypal"} style={{ padding: '0 8px', color: 'var(--gold)' }}></i>
                                            <input 
                                                type={isIndia ? "text" : "email"} 
                                                placeholder={isIndia ? "e.g. username@upi or phone@okaxis" : "e.g. designer@example.com"} 
                                                value={payoutId} 
                                                onChange={e => setPayoutId(e.target.value)} 
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: '#888', fontFamily: 'Montserrat', display: 'block', marginTop: 4 }}>
                                            {isIndia ? 'Your earnings will be transferred directly to this UPI ID.' : 'Your earnings will be transferred to this PayPal email.'}
                                        </span>
                                    </div>
                                </div>

                                <div className="dsn-modal__actions" style={{ marginTop: 22 }}>
                                    <button className="dsn-modal__cancel" onClick={() => setShowWithdraw(false)} disabled={submittingWithdraw}>Cancel</button>
                                    <button className="dsn-auth__btn" onClick={handleWithdraw} disabled={submittingWithdraw}>
                                        <span>{submittingWithdraw ? 'Submitting...' : 'Confirm'}</span>
                                    </button>
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
