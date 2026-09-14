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

export default function DesignerReportCustomers() {
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
                const ordersData = await apiFetch('/api/orders').catch(() => []);
                
                // Only orders with at least one item from this designer
                const relevantOrders = (ordersData || []).filter(o => {
                    return (o.items || []).some(i => Number(i.designer_earnings) > 0);
                });
                
                setOrders(relevantOrders);
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

    const customersMap = {};
    const countryMap = {};
    
    filteredOrders.forEach(o => {
        // Obfuscate email, use name or anonymous
        let custKey = o.user_id || o.email || 'guest';
        let name = o.shipping_address?.name || o.name || 'Anonymous Buyer';
        let country = o.shipping_address?.country || 'Unknown';
        
        let designerSpentInOrder = 0;
        (o.items || []).forEach(i => {
            if (Number(i.designer_earnings) > 0) {
                designerSpentInOrder += (Number(i.price) * (i.quantity || 1));
            }
        });
        
        if (!customersMap[custKey]) {
            customersMap[custKey] = {
                name,
                country,
                orders: 0,
                spent: 0
            };
        }
        customersMap[custKey].orders += 1;
        customersMap[custKey].spent += designerSpentInOrder;

        countryMap[country] = (countryMap[country] || 0) + 1;
    });

    const customersList = Object.values(customersMap).sort((a, b) => b.spent - a.spent);
    
    const totalBuyers = customersList.length;
    const uniqueCountries = Object.keys(countryMap).length;
    const repeatBuyers = customersList.filter(c => c.orders > 1).length;
    
    const sortedCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);
    const topCountry = sortedCountries.length > 0 ? sortedCountries[0][0] : 'N/A';
    const top5Countries = sortedCountries.slice(0, 5);

    const handleExport = () => {
        exportCSV(customersList, 'designer_customers.csv', [
            { label: 'Customer Name', key: 'name' },
            { label: 'Country', key: 'country' },
            { label: 'Orders', key: 'orders' },
            { label: 'Total Spent on Your Designs', key: 'spent' }
        ]);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/designer/reports" style={{ textDecoration: 'none', color: '#C5A059', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Reports</Link>
            <h1 style={{ color: '#1a1a1a', marginBottom: '20px' }}>Customer Insights</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                <button onClick={handleExport} style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Total Buyers</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{totalBuyers}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Repeat Buyers</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{repeatBuyers}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Unique Countries</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{uniqueCountries}</div>
                </div>
                <div style={{ background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Top Country</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C5A059', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={topCountry}>{topCountry}</div>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#1a1a1a', marginBottom: '10px' }}>Top Countries (Orders)</h3>
                <div style={{ display: 'flex', gap: '15px', background: '#FAFAF8', padding: '15px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
                    {top5Countries.length === 0 ? (
                        <div style={{ color: '#666' }}>No data</div>
                    ) : (
                        top5Countries.map(([country, count]) => {
                            const max = top5Countries[0][1];
                            const width = `${(count / max) * 100}%`;
                            return (
                                <div key={country} style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#1a1a1a', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{country}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, background: '#E5E5E5', height: '8px', borderRadius: '4px' }}>
                                            <div style={{ width, background: '#C5A059', height: '100%', borderRadius: '4px' }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', minWidth: '20px' }}>{count}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                        <th style={{ padding: '12px', color: '#666' }}>Customer Name</th>
                        <th style={{ padding: '12px', color: '#666' }}>Country</th>
                        <th style={{ padding: '12px', color: '#666' }}>Orders</th>
                        <th style={{ padding: '12px', color: '#666' }}>Spent on Your Designs</th>
                    </tr>
                </thead>
                <tbody>
                    {customersList.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for this period</td></tr>
                    ) : (
                        customersList.map((c, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #E5E5E5' }}>
                                <td style={{ padding: '12px' }}>{c.name}</td>
                                <td style={{ padding: '12px' }}>{c.country}</td>
                                <td style={{ padding: '12px' }}>{c.orders}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{fmt(c.spent)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
