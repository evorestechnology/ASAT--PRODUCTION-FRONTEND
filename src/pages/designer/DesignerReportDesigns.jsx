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

export default function DesignerReportDesigns() {
    const [stats, setStats] = useState([]);
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
                const [designsData, ordersData] = await Promise.all([
                    apiFetch('/api/designs/mine').catch(() => []),
                    apiFetch('/api/orders').catch(() => [])
                ]);

                // We'll filter orders dynamically by date below
                // Just map designs first
                const designMap = {};
                (designsData || []).forEach(d => {
                    designMap[d.id] = {
                        id: d.id,
                        name: d.title || d.name || 'Unnamed',
                        status: d.status || 'active',
                        totalOrders: 0,
                        revenue: 0,
                        lastOrdered: null
                    };
                });

                // Attach ALL relevant items to the design map so we can filter later
                (ordersData || []).forEach(o => {
                    (o.items || []).forEach(item => {
                        if (item.design_id && designMap[item.design_id]) {
                            if (!designMap[item.design_id].history) designMap[item.design_id].history = [];
                            designMap[item.design_id].history.push({
                                created_at: o.created_at,
                                earnings: Number(item.designer_earnings) || 0
                            });
                        }
                    });
                });

                setStats(Object.values(designMap));
            } catch (err) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Compute stats based on date range
    const filteredStats = stats.map(d => {
        const history = (d.history || []).filter(h => {
            const hDate = new Date(h.created_at).toISOString().split('T')[0];
            return hDate >= dateFrom && hDate <= dateTo;
        });
        
        let lastOrdered = null;
        if (history.length > 0) {
            history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            lastOrdered = history[0].created_at;
        }

        return {
            ...d,
            totalOrders: history.length,
            revenue: history.reduce((sum, h) => sum + h.earnings, 0),
            lastOrdered
        };
    }).sort((a, b) => b.totalOrders - a.totalOrders);

    const totalDesigns = filteredStats.length;
    const totalOrdersAcrossAll = filteredStats.reduce((sum, d) => sum + d.totalOrders, 0);
    const bestDesign = filteredStats[0] && filteredStats[0].totalOrders > 0 ? filteredStats[0].name : 'N/A';
    const avgOrders = totalDesigns > 0 ? (totalOrdersAcrossAll / totalDesigns).toFixed(1) : 0;

    const handleExport = () => {
        const exportData = filteredStats.map(d => ({
            ...d,
            lastOrderedFmt: d.lastOrdered ? new Date(d.lastOrdered).toLocaleDateString('en-IN') : 'Never'
        }));
        exportCSV(exportData, 'designer_designs.csv', [
            { label: 'Design Name', key: 'name' },
            { label: 'Status', key: 'status' },
            { label: 'Total Orders', key: 'totalOrders' },
            { label: 'Revenue', key: 'revenue' },
            { label: 'Last Ordered', key: 'lastOrderedFmt' }
        ]);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/designer/reports" style={{ textDecoration: 'none', color: '#C5A059', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Reports</Link>
            <h1 style={{ color: '#1a1a1a', marginBottom: '20px' }}>Design Performance</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <button onClick={handleExport} style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Designs</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{totalDesigns}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Orders</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{totalOrdersAcrossAll}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Best Design</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C5A059', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={bestDesign}>{bestDesign}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Avg Orders/Design</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{avgOrders}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                        <th style={{ padding: '12px', color: '#666' }}>Design Name</th>
                        <th style={{ padding: '12px', color: '#666' }}>Status</th>
                        <th style={{ padding: '12px', color: '#666' }}>Total Orders</th>
                        <th style={{ padding: '12px', color: '#666' }}>Revenue</th>
                        <th style={{ padding: '12px', color: '#666' }}>Last Ordered</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStats.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available</td></tr>
                    ) : (
                        filteredStats.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid #E5E5E5' }}>
                                <td style={{ padding: '12px' }}>{d.name}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#FAFAF8', border: '1px solid #E5E5E5' }}>
                                        {d.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>{d.totalOrders}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{fmt(d.revenue)}</td>
                                <td style={{ padding: '12px', color: '#666' }}>{d.lastOrdered ? new Date(d.lastOrdered).toLocaleDateString('en-IN') : 'Never'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
