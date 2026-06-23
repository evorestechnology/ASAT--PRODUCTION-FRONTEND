import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';

function MfgOrderHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/orders?history=true');

            const list = (data || []).map(o => {
                return {
                    id: o.id,
                    orderId: o.order_id || o.id.slice(0, 8).toUpperCase(),
                    createdAt: o.created_at,
                    items: o.items || [],
                    mfgEarnings: Number(o.mfg_earnings) || 0,
                    country: o.country || 'India',
                    status: o.status,
                    customerName: o.customer_name,
                    customerEmail: o.items?.[0]?.customerEmail || '',
                    phone: o.phone || o.contact,
                    address: o.address,
                    totalAmount: Number(o.total_amount) || 0,
                    trackingId: o.tracking_id
                };
            });
            setOrders(list);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching order history:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchHistory();
    }, [user]);

    const formatOrderDate = (o) => {
        if (!o.createdAt) return 'N/A';
        const date = new Date(o.createdAt);
        return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const getItemsTotalQty = (items) => {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    };

    const filteredOrders = orders.filter(o => {
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            const orderIdStr = (o.orderId || o.id || '').toLowerCase();
            const customerStr = (o.customerName || '').toLowerCase();
            const itemsStr = (o.items || []).map(item => item.name || '').join(' ').toLowerCase();
            const statusStr = (o.status || '').toLowerCase();
            return (
                orderIdStr.includes(q) ||
                customerStr.includes(q) ||
                itemsStr.includes(q) ||
                statusStr.includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">ORDER HISTORY</h1>
            <p className="adm-page__subtitle">Completed and cancelled orders archive</p>

            {/* Search Input Bar */}
            {orders.length > 0 && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search archived orders..."
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
            )}

            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total Qty</th>
                            <th>Earnings</th>
                            <th>Country</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" className="adm-table__empty"><i className="fas fa-spinner fa-spin"></i> Loading order history...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="8" className="adm-table__empty"><i className="fas fa-history"></i> No order history yet.</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="8" className="adm-table__empty"><i className="fas fa-search"></i> No matching orders found.</td></tr>
                        ) : (
                            filteredOrders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{o.id.substring(0, 8)}...</td>
                                    <td style={{ fontSize: '0.75rem' }}>{formatOrderDate(o)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {(o.items || []).map((item, idx) => (
                                                <span key={idx} style={{ fontSize: '0.75rem' }}>
                                                    {item.name} ({item.size})
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{getItemsTotalQty(o.items)}</td>
                                    <td style={{ fontWeight: '600' }}>₹{Number(o.mfgEarnings || 0).toLocaleString('en-IN')}</td>
                                    <td>{o.country || 'India'}</td>
                                    <td>
                                        <span className={`adm-badge ${o.status === 'completed' ? 'adm-badge--active' : 'adm-badge--pending'}`} style={o.status === 'cancelled' ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' } : {}}>
                                            {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Completed'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => setSelectedOrder(o)}
                                            className="adm-action-btn"
                                            style={{ background: '#121212', color: '#fff' }}
                                        >
                                            <i className="fas fa-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detailed Order Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: 20
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: 650,
                        borderRadius: 12,
                        padding: 30,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: '#aaa'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h2 style={{ fontFamily: "'Montserrat'", fontSize: '1.4rem', fontWeight: 700, marginBottom: 5 }}>Order Details</h2>
                        <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: 20 }}>ID: {selectedOrder.id}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: '#C5A059', textTransform: 'uppercase', marginBottom: 8 }}>Customer Info</h3>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Name:</strong> {selectedOrder.customerName || 'N/A'}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Phone:</strong> {selectedOrder.phone || 'N/A'}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Address:</strong> {selectedOrder.address || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: '#C5A059', textTransform: 'uppercase', marginBottom: 8 }}>Order Info</h3>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Date:</strong> {formatOrderDate(selectedOrder)}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Mfg Earnings:</strong> ₹{Number(selectedOrder.mfgEarnings || 0).toLocaleString('en-IN')}</p>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Status:</strong> {selectedOrder.status?.toUpperCase()}</p>
                                {selectedOrder.trackingId && (
                                    <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Tracking ID:</strong> {selectedOrder.trackingId}</p>
                                )}
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                        <h3 style={{ fontSize: '0.9rem', color: '#C5A059', textTransform: 'uppercase', marginBottom: 12 }}>Items Ordered</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {(selectedOrder.items || []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 15, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                                    {item.image && (
                                        <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #eaeaea' }} />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 4px 0' }}>{item.name}</h4>
                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0' }}>Size: {item.size} | Qty: {item.qty}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0' }}>Unit Price: ₹{item.price?.toLocaleString('en-IN')}</p>
                                        {item.designerId && (
                                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '4px 0 0 0' }}>Designer ID: {item.designerId}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MfgOrderHistory;
