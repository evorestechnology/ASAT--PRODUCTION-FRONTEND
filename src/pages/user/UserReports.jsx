import React, { useState, useEffect } from 'react';
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

const styles = `
    .user-reports-page {
        min-height: 80vh;
        background: #FFFFFF;
        padding: 40px 5%;
        font-family: 'Montserrat', sans-serif;
    }
    .user-reports-container {
        max-width: 900px;
        margin: 0 auto;
    }
    .reports-title {
        font-family: 'Cormorant Garamond', 'Cinzel', serif;
        font-size: 2.2rem;
        letter-spacing: 2px;
        color: #000000;
        margin-bottom: 8px;
    }
    .reports-subtitle {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 40px;
    }
    .kpi-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 40px;
    }
    .kpi-card {
        padding: 20px;
        background: #FAFAF8;
        border: 1px solid #E5E5E5;
        border-radius: 8px;
    }
    .kpi-label {
        font-size: 0.8rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    .kpi-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #000000;
    }
    .section-title {
        font-family: 'Cormorant Garamond', 'Cinzel', serif;
        font-size: 1.5rem;
        color: #000000;
        margin-bottom: 15px;
        border-bottom: 1px solid #E5E5E5;
        padding-bottom: 10px;
    }
    .status-bar {
        display: flex;
        height: 24px;
        border-radius: 12px;
        overflow: hidden;
        background: #E5E5E5;
        margin-bottom: 15px;
    }
    .status-legend {
        display: flex;
        gap: 20px;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 40px;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    .reports-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        margin-bottom: 40px;
    }
    .reports-table th {
        padding: 12px;
        border-bottom: 2px solid #000000;
        color: #000000;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .reports-table td {
        padding: 15px 12px;
        border-bottom: 1px solid #E5E5E5;
        font-size: 0.95rem;
        color: #333;
    }
    .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        background: #FAFAF8;
        border: 1px solid #E5E5E5;
    }
    .list-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 40px;
    }
    .list-item {
        background: #FAFAF8;
        padding: 15px;
        border: 1px solid #E5E5E5;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    @media (max-width: 768px) {
        .kpi-row {
            grid-template-columns: repeat(2, 1fr);
        }
        .list-grid {
            grid-template-columns: 1fr;
        }
    }
`;

export default function UserReports() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const ordersData = await apiFetch('/api/orders');
                const sorted = (ordersData || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setOrders(sorted);
            } catch (err) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // KPIs
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? (totalSpent / totalOrders) : 0;
    
    let totalSavings = 0;
    const promoMap = {};
    orders.forEach(o => {
        if (o.status_history && o.status_history[0] && o.status_history[0].pricing) {
            const pricing = o.status_history[0].pricing;
            if (pricing.discount_amount && Number(pricing.discount_amount) > 0) {
                const discount = Number(pricing.discount_amount);
                totalSavings += discount;
                
                const code = pricing.promo_code || 'PROMO';
                promoMap[code] = (promoMap[code] || 0) + discount;
            }
        }
    });

    // Status breakdown
    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    // Recent orders (last 10)
    const recentOrders = orders.slice(0, 10);

    // Designs purchased
    const designMap = {};
    orders.forEach(o => {
        (o.items || []).forEach(i => {
            if (i.design_name) {
                designMap[i.design_name] = (designMap[i.design_name] || 0) + (i.quantity || 1);
            }
        });
    });
    const uniqueDesigns = Object.entries(designMap).sort((a, b) => b[1] - a[1]);

    // Countries delivered to
    const countryMap = {};
    orders.forEach(o => {
        if (o.shipping_address && o.shipping_address.country) {
            countryMap[o.shipping_address.country] = true;
        }
    });
    const uniqueCountries = Object.keys(countryMap).sort();

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>{error}</div>;

    return (
        <div className="user-reports-page">
            <style>{styles}</style>
            <div className="user-reports-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                    <div>
                        <h1 className="reports-title" style={{ margin: 0 }}>My Spending Summary</h1>
                        <p className="reports-subtitle" style={{ margin: '6px 0 0 0' }}>An overview of your purchases and savings on ASAT Paradise</p>
                    </div>
                    {orders.length > 0 && (
                        <button 
                            onClick={() => {
                                const exportData = orders.map(o => ({
                                    id: o.id,
                                    date: new Date(o.created_at).toLocaleDateString('en-IN'),
                                    items_count: o.items?.length || 0,
                                    total_amount: o.total_amount || 0,
                                    status: o.status || 'unknown'
                                }));
                                exportCSV(exportData, 'my-order-history.csv', [
                                    { label: 'Order ID', key: 'id' },
                                    { label: 'Date', key: 'date' },
                                    { label: 'Item Count', key: 'items_count' },
                                    { label: 'Total (INR)', key: 'total_amount' },
                                    { label: 'Status', key: 'status' }
                                ]);
                            }}
                            style={{
                                background: '#000000',
                                color: '#FFFFFF',
                                border: '1px solid #000000',
                                padding: '10px 18px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            ⬇ Export History (CSV)
                        </button>
                    )}
                </div>
                <div style={{ height: '24px' }}></div>

                <div className="kpi-row">
                    <div className="kpi-card">
                        <div className="kpi-label">Total Orders</div>
                        <div className="kpi-value">{totalOrders}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Total Spent</div>
                        <div className="kpi-value">{fmt(totalSpent)}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Avg Order Value</div>
                        <div className="kpi-value">{fmt(avgOrderValue)}</div>
                    </div>
                    <div className="kpi-card" style={{ borderLeft: '4px solid #C5A059' }}>
                        <div className="kpi-label">Total Savings</div>
                        <div className="kpi-value" style={{ color: '#C5A059' }}>{fmt(totalSavings)}</div>
                    </div>
                </div>

                {totalOrders > 0 && (
                    <>
                        <h2 className="section-title">Order Status Breakdown</h2>
                        <div className="status-bar">
                            {Object.entries(statusCounts).map(([status, count]) => {
                                const width = `${(count / totalOrders) * 100}%`;
                                const bg = status.includes('deliver') || status.includes('complet') ? '#15803d' : 
                                           status.includes('cancel') ? '#b91c1c' : '#000000';
                                return <div key={status} style={{ width, background: bg }} title={`${status}: ${count}`} />;
                            })}
                        </div>
                        <div className="status-legend">
                            <div className="legend-item"><div className="legend-dot" style={{ background: '#15803d' }}></div> Delivered / Completed</div>
                            <div className="legend-item"><div className="legend-dot" style={{ background: '#000000' }}></div> In Progress</div>
                            <div className="legend-item"><div className="legend-dot" style={{ background: '#b91c1c' }}></div> Cancelled</div>
                        </div>
                    </>
                )}

                <h2 className="section-title">Recent Orders</h2>
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No orders found</td></tr>
                        ) : (
                            recentOrders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: '500' }}>{o.id}</td>
                                    <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                                    <td>{o.items?.length || 0}</td>
                                    <td style={{ fontWeight: '600' }}>{fmt(o.total_amount)}</td>
                                    <td><span className="status-badge">{o.status}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {uniqueDesigns.length > 0 && (
                    <>
                        <h2 className="section-title">Designs Purchased</h2>
                        <div className="list-grid">
                            {uniqueDesigns.map(([name, qty]) => (
                                <div key={name} className="list-item">
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Qty: {qty}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {Object.keys(promoMap).length > 0 && (
                    <>
                        <h2 className="section-title">Savings Summary</h2>
                        <div className="list-grid">
                            {Object.entries(promoMap).map(([code, saved]) => (
                                <div key={code} className="list-item" style={{ borderLeft: '4px solid #C5A059' }}>
                                    <span>Code: <strong style={{ color: '#000' }}>{code}</strong></span>
                                    <span style={{ color: '#C5A059', fontWeight: 'bold' }}>Saved: {fmt(saved)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {uniqueCountries.length > 0 && (
                    <>
                        <h2 className="section-title">Countries Delivered To</h2>
                        <div className="list-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {uniqueCountries.map(country => (
                                <div key={country} className="list-item" style={{ justifyContent: 'center' }}>
                                    {country}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
