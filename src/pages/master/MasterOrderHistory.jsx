import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';

function MasterOrderHistory() {
    const [filter, setFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchOrders = async () => {
        try {
            const data = await apiFetch('/api/orders');

            const list = (data || []).map(o => ({
                id: o.id,
                orderId: o.order_id,
                userId: o.user_id,
                customerName: o.customer_name,
                items: o.items,
                totalAmount: Number(o.total_amount || 0),
                designerEarnings: Number(o.designer_earnings || 0),
                mfgEarnings: Number(o.mfg_earnings || 0),
                platformEarnings: Number(o.platform_earnings || 0),
                designerId: o.designer_id,
                designerUsername: o.designer_username,
                mfgId: o.mfg_id,
                status: o.status,
                contact: o.contact,
                phone: o.phone,
                address: o.address,
                country: o.country,
                trackingId: o.tracking_id,
                statusHistory: o.status_history,
                shippedAt: o.shipped_at,
                completedAt: o.completed_at,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            }));

            setOrders(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Helper formatters
    const formatDate = (createdAt) => {
        if (!createdAt) return '—';
        const date = new Date(createdAt);
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatItems = (items) => {
        if (Array.isArray(items)) {
            return items.map(item => item.title || item.name || 'Garment').join(', ');
        }
        return items || '—';
    };

    const getQty = (o) => {
        if (o.qty) return o.qty;
        if (o.quantity) return o.quantity;
        if (Array.isArray(o.items)) {
            return o.items.reduce((acc, curr) => acc + (curr.qty || curr.quantity || 1), 0);
        }
        return 1;
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'completed' || s === 'active' || s === 'approved') return 'active';
        if (s === 'confirmed' || s === 'pending') return 'pending';
        if (s === 'cancelled' || s === 'rejected' || s === 'restricted' || s === 'suspended' || s === 'blocked') return 'danger';
        if (s === 'manufacturing' || s === 'shipping') return 'info';
        return 'info';
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'domestic' && o.country?.toLowerCase() !== 'india') return false;
        if (filter === 'global' && o.country?.toLowerCase() === 'india') return false;
        
        if (statusFilter !== 'all' && (o.status || 'pending').toLowerCase() !== statusFilter) return false;
        
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            const orderIdStr = (o.orderId || o.id || '').toLowerCase();
            const itemsStr = formatItems(o.items).toLowerCase();
            const designerStr = (o.designerUsername || '').toLowerCase();
            const statusStr = (o.status || '').toLowerCase();
            const customerStr = (o.userId || '').toLowerCase();
            const trackingStr = (o.trackId || o.trackingId || '').toLowerCase();
            
            return (
                orderIdStr.includes(q) ||
                itemsStr.includes(q) ||
                designerStr.includes(q) ||
                statusStr.includes(q) ||
                customerStr.includes(q) ||
                trackingStr.includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">ORDER HISTORY</h1>
            <p className="adm-page__subtitle">Complete order records with revenue breakdown</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Region:</span>
                        <div className="adm-page__filters" style={{ margin: 0 }}>
                            {['all', 'domestic', 'global'].map(f => (
                                <button key={f} className={`adm-page__filter-btn ${filter === f ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px 35px 10px 15px',
                                background: '#1c1c1c',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                color: 'white',
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '0.82rem',
                                width: '280px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}></i>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Status:</span>
                    <div className="adm-page__filters" style={{ margin: 0 }}>
                        {['all', 'pending', 'confirmed', 'manufacturing', 'shipping', 'completed', 'cancelled'].map(s => (
                            <button key={s} className={`adm-page__filter-btn ${statusFilter === s ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setStatusFilter(s)}>
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time order records...</p>
                </div>
            ) : error ? (
                <div className="adm-error-alert">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date & Time</th>
                                <th>Items</th>
                                <th>Qty</th>
                                <th>Total Revenue</th>
                                <th>Designer</th>
                                <th>Designer Earnings</th>
                                <th>Mfg Earnings</th>
                                <th>User</th>
                                <th>Contact</th>
                                <th>Address</th>
                                <th>Country</th>
                                <th>Status</th>
                                <th>Track ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="14" className="adm-table__empty">
                                        <i className="fas fa-inbox"></i>No matching orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(o => (
                                    <tr key={o.id}>
                                        <td>{o.orderId || o.id}</td>
                                        <td>{formatDate(o.createdAt)}</td>
                                        <td>{formatItems(o.items)}</td>
                                        <td>{getQty(o)}</td>
                                        <td>₹{(o.totalAmount || o.revenue || 0).toLocaleString()}</td>
                                        <td>@{o.designerUsername || o.designer || '—'}</td>
                                        <td>₹{(o.designerEarnings || 0).toLocaleString()}</td>
                                        <td>₹{(o.mfgEarnings || 0).toLocaleString()}</td>
                                        <td>{o.userId || o.user || '—'}</td>
                                        <td>{o.contact || o.userPhone || o.phone || '—'}</td>
                                        <td>{o.address || o.shippingAddress || '—'}</td>
                                        <td>{o.country || 'India'}</td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(o.status)}`}>
                                                {o.status || 'pending'}
                                            </span>
                                        </td>
                                        <td>{o.trackId || o.trackingId || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default MasterOrderHistory;
