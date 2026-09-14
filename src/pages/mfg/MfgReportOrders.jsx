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

export default function MfgReportOrders() {
    const [orders, setOrders] = useState([]);
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
                const [historyOrders, activeOrders] = await Promise.all([
                    apiFetch('/api/orders?history=true').catch(() => []),
                    apiFetch('/api/orders').catch(() => [])
                ]);
                
                const all = [...(historyOrders || []), ...(activeOrders || [])];
                const uniqueOrders = Array.from(new Map(all.map(o => [o.id, o])).values());
                uniqueOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                setOrders(uniqueOrders);
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

    const statusCounts = filteredOrders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    const totalOrders = filteredOrders.length;
    const completed = statusCounts['delivered'] || statusCounts['completed'] || 0;
    const cancelled = statusCounts['cancelled'] || 0;
    const inProgress = totalOrders - completed - cancelled;

    const handleExport = () => {
        exportCSV(filteredOrders, 'mfg_orders.csv', [
            { label: 'Order ID', key: 'id' },
            { label: 'Date', key: 'created_at' },
            { label: 'Status', key: 'status' },
            { label: 'Total Value', key: 'total_amount' }
        ]);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/mfg/reports" style={{ textDecoration: 'none', color: '#C5A059', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Reports</Link>
            <h1 style={{ color: '#1a1a1a', marginBottom: '20px' }}>Order Performance</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <button onClick={handleExport} style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Orders</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{totalOrders}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Completed</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{completed}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>In Progress</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C5A059' }}>{inProgress}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Cancelled</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c' }}>{cancelled}</div>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#1a1a1a', marginBottom: '10px' }}>Status Breakdown</h3>
                <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: '#E5E5E5' }}>
                    {totalOrders > 0 && Object.entries(statusCounts).map(([status, count]) => {
                        const width = `${(count / totalOrders) * 100}%`;
                        const bg = status.includes('deliver') || status.includes('complet') ? '#15803d' : 
                                   status.includes('cancel') ? '#b91c1c' : '#C5A059';
                        return <div key={status} style={{ width, background: bg }} title={`${status}: ${count}`} />;
                    })}
                </div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#15803d', borderRadius: '50%' }}></span> Completed</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#C5A059', borderRadius: '50%' }}></span> In Progress</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#b91c1c', borderRadius: '50%' }}></span> Cancelled</span>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                        <th style={{ padding: '12px', color: '#666' }}>Order ID</th>
                        <th style={{ padding: '12px', color: '#666' }}>Date</th>
                        <th style={{ padding: '12px', color: '#666' }}>Items</th>
                        <th style={{ padding: '12px', color: '#666' }}>Total Value</th>
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
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{fmt(o.total_amount)}</td>
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
