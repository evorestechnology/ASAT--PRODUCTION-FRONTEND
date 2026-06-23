import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const styles = `
    .orders-page {
        min-height: 80vh;
        background: var(--light);
        padding: 40px 5%;
        font-family: 'Montserrat', sans-serif;
    }
    .orders-container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .orders-title {
        font-family: 'Cinzel', serif;
        font-size: 2.2rem;
        letter-spacing: 3px;
        color: var(--dark);
        margin-bottom: 8px;
    }
    .orders-subtitle {
        font-size: 0.85rem;
        color: #666;
        letter-spacing: 1px;
        margin-bottom: 40px;
    }
    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        padding: 30px;
        margin-top: 20px;
    }
    .orders-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }
    .orders-table th {
        font-family: 'Cinzel', serif;
        padding: 18px 15px;
        border-bottom: 2px solid var(--dark);
        color: var(--dark);
        letter-spacing: 1.5px;
        font-size: 0.85rem;
        text-transform: uppercase;
    }
    .orders-table td {
        padding: 20px 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        font-size: 0.9rem;
        color: #333;
        vertical-align: middle;
    }
    .orders-table tr:hover {
        background: rgba(197, 160, 89, 0.02);
    }
    .status-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 50px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .status-badge.pending {
        background: #fff8e1;
        color: #b78103;
    }
    .status-badge.processing {
        background: #e3f2fd;
        color: #0d47a1;
    }
    .status-badge.manufacturing {
        background: #e8f5e9;
        color: #1b5e20;
    }
    .status-badge.shipped {
        background: #e0f2f1;
        color: #004d40;
    }
    .status-badge.completed {
        background: #ede7f6;
        color: #4a148c;
    }
    .track-btn {
        background: var(--dark);
        color: white;
        border: none;
        padding: 8px 16px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: 0.3s;
        border-radius: 4px;
    }
    .track-btn:hover {
        background: var(--gold);
    }
    .empty-orders {
        text-align: center;
        padding: 50px 20px;
    }
    .empty-orders i {
        font-size: 3.5rem;
        color: #ccc;
        margin-bottom: 15px;
    }
    .empty-orders h4 {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        letter-spacing: 2px;
        color: var(--dark);
        margin-bottom: 8px;
    }
    .empty-orders p {
        font-size: 0.85rem;
        color: #888;
        margin-bottom: 20px;
    }
    .shop-now-btn {
        background: var(--gold);
        color: white;
        border: none;
        padding: 12px 24px;
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: 0.3s;
    }
    .shop-now-btn:hover {
        background: var(--dark);
    }
    .loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;
    }
    .spinner {
        border: 3px solid rgba(197, 160, 89, 0.1);
        border-top: 3px solid var(--gold);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

function UserOrders() {
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                const data = await apiFetch('/api/orders');
                setOrders(data || []);
            } catch (err) {
                console.error('Error fetching user orders:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const formatDate = (createdAt) => {
        if (!createdAt) return 'Pending';
        const d = new Date(createdAt);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredOrders = orders.filter(o => {
        const q = searchTerm.toLowerCase();
        const orderIdStr = (o.order_id || o.id || '').toLowerCase();
        if (orderIdStr.includes(q)) return true;
        if ((o.status || 'pending').toLowerCase().includes(q)) return true;
        if (Array.isArray(o.items)) {
            return o.items.some(item => 
                (item.name || '').toLowerCase().includes(q) ||
                (item.color || '').toLowerCase().includes(q) ||
                (item.colorName || '').toLowerCase().includes(q)
            );
        }
        return false;
    });

    return (
        <>
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <div className="orders-page">
                <div className="orders-container">
                    <BackButton />
                    <h1 className="orders-title">YOUR ORDERS</h1>
                    <p className="orders-subtitle">Track your purchases and view historical details in real-time</p>

                    {/* Search Bar */}
                    {orders.length > 0 && (
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Search by Order ID, Product Name, Status..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '10px 35px 10px 15px',
                                        background: 'rgba(0,0,0,0.02)',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '4px',
                                        color: 'var(--dark)',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.82rem',
                                        width: '320px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                />
                                <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(0,0,0,0.4)', fontSize: '0.85rem' }}></i>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="glass-card loader">
                            <div className="spinner" />
                            <p style={{ fontSize: '0.85rem', color: '#666' }}>Fetching your live order feed...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="glass-card empty-orders">
                            <i className="fas fa-box-open" />
                            <h4>NO ORDERS FOUND</h4>
                            <p>You haven't placed any orders yet. Discover our premium designer creations.</p>
                            <button className="shop-now-btn" onClick={() => navigate('/products')}>DISCOVER STYLES</button>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '10px 20px', overflowX: 'auto' }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                                    <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '10px', color: '#ccc' }}></i>
                                    <p style={{ fontSize: '0.9rem' }}>No orders matching your search query.</p>
                                </div>
                            ) : (
                                <table className="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ fontWeight: '600', color: 'var(--dark)' }}>
                                                    {o.order_id || o.id.slice(0, 10).toUpperCase()}
                                                </td>
                                                <td>{formatDate(o.created_at)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {Array.isArray(o.items)
                                                            ? o.items.map((item, idx) => (
                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '6px', borderRadius: '6px' }}>
                                                                    {item.image && (
                                                                        <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                                                    )}
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--dark)' }}>{item.name}</span>
                                                                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Size: {item.size} | Color: {item.colorName || item.color || 'Standard'}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                            : 'Garment'}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '600', color: 'var(--gold)' }}>
                                                    {formatPrice(o.total_amount || 0)}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${o.status || 'pending'}`}>
                                                        {o.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="track-btn" onClick={() => navigate(`/tracking?id=${o.order_id || o.id}`)}>
                                                            Track
                                                        </button>
                                                        <button 
                                                            className="track-btn" 
                                                            style={{ background: '#25D366', border: 'none', color: '#fff' }} 
                                                            onClick={() => {
                                                                const trackUrl = `${window.location.origin}/tracking?id=${o.order_id || o.id}`;
                                                                const message = `Check out my order ${o.order_id || ''} on ASAT! Status: ${o.status || 'pending'}. Track delivery here: ${trackUrl}`;
                                                                
                                                                navigator.clipboard.writeText(message)
                                                                    .then(() => showToast('Order tracking link copied to clipboard!', 'success'))
                                                                    .catch(err => console.error('Failed to copy tracking link:', err));
                                                                
                                                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                                            }}
                                                        >
                                                            <i className="fab fa-whatsapp" style={{ marginRight: '4px' }}></i> Share
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserOrders;
