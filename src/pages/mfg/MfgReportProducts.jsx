import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';

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

export default function MfgReportProducts() {
    const [productStats, setProductStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [historyOrders, activeOrders, products] = await Promise.all([
                    apiFetch('/api/orders?history=true').catch(() => []),
                    apiFetch('/api/orders').catch(() => []),
                    apiFetch('/api/products').catch(() => [])
                ]);
                
                const allOrders = [...(historyOrders || []), ...(activeOrders || [])];
                const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());

                const stats = {};
                uniqueOrders.forEach(o => {
                    (o.items || []).forEach(item => {
                        const pid = item.product_id;
                        if (!stats[pid]) {
                            stats[pid] = {
                                id: pid,
                                name: item.product_name || 'Unknown Product',
                                timesOrdered: 0,
                                totalQty: 0,
                                colors: new Set()
                            };
                        }
                        stats[pid].timesOrdered += 1;
                        stats[pid].totalQty += (item.quantity || 1);
                        if (item.color) stats[pid].colors.add(item.color);
                    });
                });

                // Attach any base product names if available from /api/products
                const productsMap = new Map((products || []).map(p => [p.id, p]));
                
                const formattedStats = Object.values(stats).map(s => {
                    const p = productsMap.get(s.id);
                    return {
                        ...s,
                        name: p ? p.name : s.name,
                        colorsList: Array.from(s.colors).join(', ')
                    };
                });
                
                formattedStats.sort((a, b) => b.totalQty - a.totalQty);
                setProductStats(formattedStats);
                
            } catch (err) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalUniqueProducts = productStats.length;
    const mostPopular = productStats.length > 0 ? productStats[0].name : 'N/A';
    const totalItemsProduced = productStats.reduce((sum, p) => sum + p.totalQty, 0);

    const handleExport = () => {
        exportCSV(productStats, 'mfg_products.csv', [
            { label: 'Product Name', key: 'name' },
            { label: 'Times Ordered', key: 'timesOrdered' },
            { label: 'Total Quantity', key: 'totalQty' },
            { label: 'Colours Used', key: 'colorsList' }
        ]);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/mfg/reports" style={{ textDecoration: 'none', color: '#C5A059', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Reports</Link>
            <h1 style={{ color: '#1a1a1a', marginBottom: '20px' }}>Product Demand</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <button onClick={handleExport} style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Unique Products</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{totalUniqueProducts}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Most Popular</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C5A059', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mostPopular}>{mostPopular}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Items Produced</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{totalItemsProduced}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                        <th style={{ padding: '12px', color: '#666' }}>Product Name</th>
                        <th style={{ padding: '12px', color: '#666' }}>Times Ordered</th>
                        <th style={{ padding: '12px', color: '#666' }}>Total Qty</th>
                        <th style={{ padding: '12px', color: '#666' }}>Colours Used</th>
                    </tr>
                </thead>
                <tbody>
                    {productStats.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No product data available</td></tr>
                    ) : (
                        productStats.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #E5E5E5' }}>
                                <td style={{ padding: '12px' }}>{p.name}</td>
                                <td style={{ padding: '12px' }}>{p.timesOrdered}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.totalQty}</td>
                                <td style={{ padding: '12px' }}>{p.colorsList}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
