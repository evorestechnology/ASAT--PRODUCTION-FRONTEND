import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const exportCSV = (data, filename, columns) => {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row => columns.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export default function MfgReportEarnings() {
    const [orders, setOrders] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [ordersData, walletData, withdrawalsData] = await Promise.all([
                    apiFetch('/api/orders?history=true').catch(() => []),
                    apiFetch('/api/wallets/me').catch(() => null),
                    apiFetch('/api/wallets/withdrawals').catch(() => [])
                ]);
                setOrders(ordersData || []);
                setWallet(walletData || { balance: 0, pending_balance: 0, total_withdrawn: 0 });
                setWithdrawals(withdrawalsData || []);
            } catch (err) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredOrders = orders.filter(o => {
        const d = new Date(o.created_at).toISOString().split('T')[0];
        return d >= dateFrom && d <= dateTo;
    });

    const totalEarned = filteredOrders.reduce((sum, o) => sum + (Number(o.mfg_earnings) || 0), 0);

    const handleExport = () => {
        exportCSV(filteredOrders, 'mfg_earnings.csv', [
            { label: 'Order ID', key: 'id' },
            { label: 'Date', key: 'created_at' },
            { label: 'Earnings', key: 'mfg_earnings' },
            { label: 'Status', key: 'status' }
        ]);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/mfg/reports" style={{ textDecoration: 'none', color: '#C5A059', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Reports</Link>
            <h1 style={{ color: '#1a1a1a', marginBottom: '20px' }}>Earnings Report</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <button onClick={handleExport} style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Period Earnings</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{fmt(totalEarned)}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Wallet Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{fmt(wallet?.balance)}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Withdrawn</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{fmt(wallet?.total_withdrawn)}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Pending Withdrawal</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C5A059' }}>{fmt(wallet?.pending_balance)}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                        <th style={{ padding: '12px', color: '#666' }}>Order ID</th>
                        <th style={{ padding: '12px', color: '#666' }}>Date</th>
                        <th style={{ padding: '12px', color: '#666' }}>Items</th>
                        <th style={{ padding: '12px', color: '#666' }}>Earnings</th>
                        <th style={{ padding: '12px', color: '#666' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for this period</td></tr>
                    ) : (
                        filteredOrders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #E5E5E5' }}>
                                <td style={{ padding: '12px' }}>{o.id}</td>
                                <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                                <td style={{ padding: '12px' }}>{o.items?.length || 0}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{fmt(o.mfg_earnings)}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#FAFAF8', border: '1px solid #E5E5E5' }}>
                                        {o.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
