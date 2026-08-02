import React, { useState, useEffect } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const COLOR_NAME_TO_HEX = {
    'jet black': '#121212',
    'black': '#000000',
    'white': '#ffffff',
    'off white': '#faf0e6',
    'snow white': '#fffafa',
    'navy': '#0b192c',
    'navy blue': '#0b192c',
    'blue': '#1e3a8a',
    'red': '#b91c1c',
    'maroon': '#800000',
    'green': '#15803d',
    'forest green': '#14532d',
    'olive': '#556b2f',
    'yellow': '#eab308',
    'gold': '#c5a059',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'charcoal': '#374151',
    'heather grey': '#9ca3af',
    'light grey': '#d1d5db',
    'dark grey': '#4b5563',
    'beige': '#f5f5dc',
    'brown': '#78350f',
    'pink': '#ec4899',
    'purple': '#7e22ce',
    'lavender': '#e6e6fa',
    'orange': '#f97316'
};

const resolveColorHex = (item) => {
    if (!item) return '#121212';
    const hexProp = item.colorHex || item.hex || item.color_hex;
    if (hexProp && typeof hexProp === 'string' && hexProp.startsWith('#')) return hexProp;
    if (item.color && typeof item.color === 'string' && item.color.startsWith('#')) return item.color;
    const rawName = (item.colorName || item.color || '').toString().trim().toLowerCase();
    if (COLOR_NAME_TO_HEX[rawName]) return COLOR_NAME_TO_HEX[rawName];
    if (rawName && !rawName.includes(' ')) return rawName;
    return '#121212';
};

function DesignerEarnings() {
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'withdrawals'
    const [designerProfile, setDesignerProfile] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [withdrawals, setWithdrawals] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmt, setWithdrawAmt] = useState('');
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
            const withdrawalsData = await apiFetch('/api/wallets/withdrawals').catch(() => []);
            const wList = (withdrawalsData || []).map(w => ({
                id: w.id,
                amount: Number(w.amount) || 0,
                status: w.status || 'pending',
                date: w.created_at ? new Date(w.created_at).getTime() : Date.now()
            }));
            setWithdrawals(wList);

            // 4. Fetch sales history
            const salesData = await apiFetch('/api/wallets/sales-history').catch(() => []);
            setSalesHistory(salesData || []);

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
        const lower = (s || '').toLowerCase();
        if (lower === 'paid' || lower === 'completed' || lower === 'delivered' || lower === 'approved') return 'dsn-status--paid';
        if (lower === 'rejected' || lower === 'cancelled' || lower === 'failed') return 'dsn-status--failed';
        return 'dsn-status--pending';
    };

    const totalEarnings = walletBalance + totalWithdrawn;

    const filteredSales = salesHistory.filter(item => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            (item.title || '').toLowerCase().includes(q) ||
            (item.orderId || '').toLowerCase().includes(q) ||
            (item.color || '').toLowerCase().includes(q) ||
            (item.size || '').toLowerCase().includes(q)
        );
    });

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
                                <span className="dsn-earnings__card-label">Available Balance</span>
                                <span className="dsn-earnings__card-amount">₹{walletBalance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="dsn-earnings__card">
                            <div className="dsn-earnings__card-icon"><i className="fas fa-shopping-bag"></i></div>
                            <div>
                                <span className="dsn-earnings__card-label">Designs Sold</span>
                                <span className="dsn-earnings__card-amount">{salesHistory.length} Items</span>
                            </div>
                        </div>
                    </div>

                    <div className="dsn-earnings__action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 20px', flexWrap: 'wrap', gap: 12 }}>
                        {/* Subpage / Tab Navigation */}
                        <div style={{ display: 'flex', gap: 10, background: '#f4f4f5', padding: 4, borderRadius: 8, border: '1px solid #e4e4e7' }}>
                            <button
                                onClick={() => setActiveTab('sales')}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: 6,
                                    border: 'none',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    fontFamily: 'Montserrat',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: activeTab === 'sales' ? '#fff' : 'transparent',
                                    color: activeTab === 'sales' ? 'var(--gold, #C5A059)' : '#666',
                                    boxShadow: activeTab === 'sales' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                <i className="fas fa-box-open" style={{ marginRight: 6 }}></i>
                                Sold Designs History ({salesHistory.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('withdrawals')}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: 6,
                                    border: 'none',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    fontFamily: 'Montserrat',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: activeTab === 'withdrawals' ? '#fff' : 'transparent',
                                    color: activeTab === 'withdrawals' ? 'var(--gold, #C5A059)' : '#666',
                                    boxShadow: activeTab === 'withdrawals' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                <i className="fas fa-history" style={{ marginRight: 6 }}></i>
                                Withdrawal History ({withdrawals.length})
                            </button>
                        </div>

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

                    {/* ── TAB 1: SOLD DESIGNS & ROYALTY HISTORY ── */}
                    {activeTab === 'sales' && (
                        <div>
                            <div className="dsn-page-head" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h3 className="dsn-page-title" style={{ margin: 0 }}>Design Sales History</h3>
                                </div>
                                <div style={{ position: 'relative', width: 240 }}>
                                    <input
                                        type="text"
                                        placeholder="Search design, order..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px 8px 32px',
                                            borderRadius: 6,
                                            border: '1px solid #ddd',
                                            fontSize: '0.8rem',
                                            fontFamily: 'Montserrat',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.75rem' }}></i>
                                </div>
                            </div>

                            <div className="dsn-table-wrap" style={{ marginTop: 16 }}>
                                <table className="dsn-table">
                                    <thead>
                                        <tr>
                                            <th>ORDER DETAILS</th>
                                            <th>ITEMS</th>
                                            <th>VARIANT</th>
                                            <th>ROYALTY</th>
                                            <th>TOTAL ROYALTY</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="dsn-table__empty">
                                                    <i className="fas fa-shopping-cart" style={{ fontSize: '1.8rem', marginBottom: 8, display: 'block', color: '#ddd' }}></i>
                                                    No design sales recorded yet
                                                </td>
                                            </tr>
                                        )}
                                        {filteredSales.map((s, idx) => (
                                            <tr key={s.id || idx}>
                                                <td>
                                                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--dark, #121212)' }}>Order #{String(s.orderId).slice(0, 14)}</span>
                                                        <span style={{ fontSize: '0.72rem', color: '#666' }}>
                                                            Order Date: {s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {s.image ? (
                                                            <img src={s.image} alt={s.title} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                                                        ) : (
                                                            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>
                                                                <i className="fas fa-tshirt"></i>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <strong style={{ fontSize: '0.85rem', color: '#222', display: 'block' }}>{s.title}</strong>
                                                            <span style={{ fontSize: '0.72rem', color: '#777' }}>Qty: {s.quantity}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#555' }}>
                                                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: resolveColorHex(s), border: '1px solid rgba(0,0,0,0.25)' }}></span>
                                                        <span>{s.color}</span>
                                                        <span style={{ color: '#aaa' }}>|</span>
                                                        <span>Size: {s.size}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#444' }}>
                                                    ₹{s.royaltyPerItem?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="dsn-table__royalty" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold, #C5A059)' }}>
                                                    ₹{s.totalEarned?.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: WITHDRAWAL HISTORY ── */}
                    {activeTab === 'withdrawals' && (
                        <div>
                            <div className="dsn-page-head" style={{ marginTop: 10 }}>
                                <h3 className="dsn-page-title">Withdrawal History</h3>
                                <p style={{ fontSize: '0.78rem', color: '#666', marginTop: 4 }}>
                                    History of royalty payout requests and transfers to your account
                                </p>
                            </div>
                            <div className="dsn-table-wrap" style={{ marginTop: 16 }}>
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
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default DesignerEarnings;
