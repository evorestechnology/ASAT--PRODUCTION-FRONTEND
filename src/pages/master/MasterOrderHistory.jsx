import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MasterOrderHistory() {
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
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
                updatedAt: o.updated_at,
                costAdjustmentStatus: o.cost_adjustment_status,
                costAdjustmentAmount: o.cost_adjustment_amount,
                costAdjustmentReason: o.cost_adjustment_reason
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

    const handleReviewCostAdjustment = async (order, action) => {
        const actionLabel = action === 'accept' ? 'Accept & Credit Wallet' : 'Reject';
        if (!window.confirm(`Are you sure you want to ${actionLabel} for Order #${order.orderId || order.id}?`)) {
            return;
        }

        try {
            const res = await apiFetch(`/api/orders/${order.id}/cost-adjustment/review`, {
                method: 'POST',
                body: JSON.stringify({ action })
            });

            alert(res.message || `Cost adjustment ${action}ed successfully.`);
            fetchOrders();
        } catch (err) {
            console.error(`Failed to ${action} cost adjustment:`, err);
            alert(`Failed to ${action} cost adjustment. Please try again.`);
        }
    };

    // Helper formatters
    const formatDate = (createdAt) => {
        if (!createdAt) return '—';
        const date = new Date(createdAt);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getCompletedDate = (order) => {
        if (!order) return null;
        if (order.completedAt || order.completed_at) return order.completedAt || order.completed_at;
        if (order.deliveredAt || order.delivered_at) return order.deliveredAt || order.delivered_at;
        
        const history = order.statusHistory || order.status_history;
        if (Array.isArray(history)) {
            const completedEntry = history.slice().reverse().find(h => 
                h && (h.status === 'completed' || h.status === 'delivered')
            );
            if (completedEntry && (completedEntry.time || completedEntry.timestamp || completedEntry.date)) {
                return completedEntry.time || completedEntry.timestamp || completedEntry.date;
            }
        }

        if (order.status === 'completed' || order.status === 'delivered') {
            return order.updatedAt || order.updated_at || null;
        }
        return null;
    };

    const formatItemsAsLinks = (items) => {
        if (!Array.isArray(items)) return <span>{items || '—'}</span>;
        return (
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {items.map((item, idx) => {
                    const name = item.title || item.name || 'Garment';
                    const designId = item.id;
                    return designId ? (
                        <span
                            key={idx}
                            onClick={() => navigate(`/master/designs/${designId}`)}
                            style={{ color: '#C5A059', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600, fontSize: '0.8rem' }}
                            title={`View design: ${name}`}
                        >
                            {name}{idx < items.length - 1 ? ',' : ''}
                        </span>
                    ) : (
                        <span key={idx} style={{ fontSize: '0.8rem' }}>{name}{idx < items.length - 1 ? ',' : ''}</span>
                    );
                })}
            </span>
        );
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

    const [terminateOrder, setTerminateOrder] = useState(null);
    const [terminateReason, setTerminateReason] = useState('Order terminated due to manufacturing constraint. Full refund has been initiated.');
    const [terminating, setTerminating] = useState(false);

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'completed' || s === 'active' || s === 'approved') return 'active';
        if (s === 'confirmed' || s === 'pending') return 'pending';
        if (s === 'cancelled' || s === 'rejected' || s === 'restricted' || s === 'suspended' || s === 'blocked' || s === 'issue_reported' || s === 'cant_be_done_requested') return 'danger';
        if (s === 'manufacturing' || s === 'shipping') return 'info';
        return 'info';
    };

    const handleConfirmTerminate = async () => {
        if (!terminateOrder) return;
        setTerminating(true);
        try {
            await apiFetch(`/api/orders/${terminateOrder.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'cancelled',
                    termination_reason: terminateReason.trim()
                })
            });
            setTerminateOrder(null);
            fetchOrders();
            alert(`Order #${terminateOrder.orderId || terminateOrder.id} has been terminated and customer notified.`);
        } catch (err) {
            console.error('Error terminating order:', err);
            alert('Failed to terminate order. Please try again.');
        } finally {
            setTerminating(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'domestic' && o.country?.toLowerCase() !== 'india') return false;
        if (filter === 'global' && o.country?.toLowerCase() === 'india') return false;
        
        if (statusFilter === 'cost_adjustment') {
            if (o.costAdjustmentStatus !== 'requested') return false;
        } else if (statusFilter !== 'all' && (o.status || 'pending').toLowerCase() !== statusFilter) {
            return false;
        }
        
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            const orderIdStr = (o.orderId || o.id || '').toLowerCase();
            const itemsStr = formatItems(o.items).toLowerCase();
            const designerStr = (o.designerUsername || '').toLowerCase();
            const statusStr = (o.status || '').toLowerCase();
            const customerStr = (o.userId || '').toLowerCase();
            const trackingStr = (o.trackId || o.trackingId || '').toLowerCase();
            const costAdjStr = (o.costAdjustmentReason || '').toLowerCase();
            
            return (
                orderIdStr.includes(q) ||
                itemsStr.includes(q) ||
                designerStr.includes(q) ||
                statusStr.includes(q) ||
                customerStr.includes(q) ||
                trackingStr.includes(q) ||
                costAdjStr.includes(q)
            );
        }
        return true;
    });

    return (
        <>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
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
                        {['all', 'cost_adjustment', 'issue_reported', 'pending', 'confirmed', 'manufacturing', 'shipping', 'completed', 'cancelled'].map(s => (
                            <button key={s} className={`adm-page__filter-btn ${statusFilter === s ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setStatusFilter(s)}>
                                {s === 'cost_adjustment' ? "💰 COST ADJUSTMENT" : s === 'issue_reported' ? "🚨 ISSUE REPORTED" : s.toUpperCase()}
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
                                <th>Order Date</th>
                                <th>Completed Date</th>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="16" className="adm-table__empty">
                                        <i className="fas fa-inbox"></i>No matching orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(o => (
                                    <tr key={o.id}>
                                        <td>{o.orderId || o.id}</td>
                                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</td>
                                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                            {(() => {
                                                const cDate = getCompletedDate(o);
                                                if (cDate) {
                                                    return <span style={{ color: '#2e7d32', fontWeight: 600 }}>{formatDate(cDate)}</span>;
                                                }
                                                if (o.status === 'completed' || o.status === 'delivered') {
                                                    return <span style={{ color: '#2e7d32', fontWeight: 600 }}>{formatDate(o.updatedAt)}</span>;
                                                }
                                                if (o.status === 'cancelled') {
                                                    return <span style={{ color: '#c62828', fontStyle: 'italic' }}>Cancelled</span>;
                                                }
                                                return <span style={{ color: '#888' }}>—</span>;
                                            })()}
                                        </td>
                                        <td>{formatItemsAsLinks(o.items)}</td>
                                        <td>{getQty(o)}</td>
                                        <td>₹{(o.totalAmount || o.revenue || 0).toLocaleString()}</td>
                                        <td>
                                            {o.designerUsername ? (
                                                <span
                                                    onClick={() => navigate(`/master/designers?search=${encodeURIComponent(o.designerUsername)}`)}
                                                    style={{ color: '#C5A059', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                                                    title={`View designer profile: @${o.designerUsername}`}
                                                >
                                                    @{o.designerUsername}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td>₹{(o.designerEarnings || 0).toLocaleString()}</td>
                                        <td>₹{(o.mfgEarnings || 0).toLocaleString()}</td>
                                        <td>{o.userId || o.user || '—'}</td>
                                        <td>{o.contact || o.userPhone || o.phone || '—'}</td>
                                        <td>{o.address || o.shippingAddress || '—'}</td>
                                        <td>{o.country || 'India'}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {o.status === 'issue_reported' ? (
                                                    <span className="adm-badge adm-badge--danger" style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', fontWeight: 700 }}>
                                                        🚨 CAN'T BE DONE REPORTED
                                                    </span>
                                                ) : (
                                                    <span className={`adm-badge adm-badge--${getStatusType(o.status)}`}>
                                                        {o.status || 'pending'}
                                                    </span>
                                                )}

                                                {o.costAdjustmentStatus === 'requested' && (
                                                    <span className="adm-badge" style={{ background: '#fff8e1', color: '#b78103', border: '1px solid #ffe082', fontWeight: 700, fontSize: '0.68rem' }} title={`Reason: ${o.costAdjustmentReason || 'No details provided'}`}>
                                                        💰 ADJ REQUESTED: ₹{o.costAdjustmentAmount}
                                                    </span>
                                                )}
                                                {o.costAdjustmentStatus === 'approved' && (
                                                    <span className="adm-badge" style={{ background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9', fontWeight: 700, fontSize: '0.68rem' }}>
                                                        ✅ ADJ APPROVED (+₹{o.costAdjustmentAmount})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{o.trackId || o.trackingId || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                {(o.status === 'issue_reported' || o.status === 'cant_be_done') && (
                                                    <button
                                                        className="adm-action-btn"
                                                        style={{ background: '#28a745', color: '#fff', fontSize: '0.72rem', padding: '4px 10px', fontWeight: 600 }}
                                                        onClick={async () => {
                                                            if (!window.confirm(`Approve cancellation request for Order #${o.orderId || o.id}? This will notify customer & process refund.`)) return;
                                                            try {
                                                                const res = await apiFetch(`/api/orders/${o.id}/approve-cancellation`, {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({ reason: 'Manufacturer cannot fulfill order. Approved by Master.' })
                                                                });
                                                                showToast(res.message || 'Cancellation approved & customer notified!', 'success');
                                                                fetchOrders();
                                                            } catch (err) {
                                                                console.error('Error approving cancellation:', err);
                                                                showToast('Failed to approve cancellation: ' + err.message, 'error');
                                                            }
                                                        }}
                                                        title="Approve manufacturer cancellation request & refund customer"
                                                    >
                                                        <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i> Approve Cancellation
                                                    </button>
                                                )}

                                                {o.costAdjustmentStatus === 'requested' && (
                                                    <>
                                                        <button
                                                            className="adm-action-btn"
                                                            style={{ background: '#28a745', color: '#fff', fontSize: '0.72rem', padding: '4px 8px' }}
                                                            onClick={() => handleReviewCostAdjustment(o, 'accept')}
                                                            title={`Accept ₹${o.costAdjustmentAmount} cost adjustment & credit manufacturer wallet`}
                                                        >
                                                            <i className="fas fa-check"></i> Accept ₹{o.costAdjustmentAmount}
                                                        </button>
                                                        <button
                                                            className="adm-action-btn"
                                                            style={{ background: '#dc3545', color: '#fff', fontSize: '0.72rem', padding: '4px 8px' }}
                                                            onClick={() => handleReviewCostAdjustment(o, 'reject')}
                                                            title="Reject cost adjustment request"
                                                        >
                                                            <i className="fas fa-times"></i> Reject
                                                        </button>
                                                    </>
                                                )}

                                                <button 
                                                    className="adm-action-btn"
                                                    onClick={() => {
                                                        import('../../utils/invoiceGenerator').then(module => {
                                                            module.generateInvoice({
                                                                ...o,
                                                                orderId: o.orderId || o.id,
                                                                createdAt: o.createdAt || o.created_at,
                                                                customerName: o.userId || o.user,
                                                                address: o.address || o.shippingAddress,
                                                                totalAmount: o.totalAmount || o.revenue
                                                            });
                                                        }).catch(err => {
                                                            console.error("Failed to load invoice generator:", err);
                                                            if(window.showToast) window.showToast("Failed to generate invoice.", "error");
                                                        });
                                                    }}
                                                    title="Download Invoice"
                                                >
                                                    <i className="fas fa-file-invoice"></i>
                                                </button>

                                                {o.status !== 'cancelled' && (
                                                    <button
                                                        className="adm-action-btn"
                                                        style={{ background: '#dc3545', color: '#fff' }}
                                                        onClick={() => setTerminateOrder(o)}
                                                        title="Terminate & Cancel Order"
                                                    >
                                                        <i className="fas fa-ban"></i> Terminate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Master Terminate Order Modal */}
            {terminateOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 8, padding: '24px 30px',
                        maxWidth: 500, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setTerminateOrder(null)}
                            style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' }}
                        >
                            &times;
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#dc3545' }}>
                            <i className="fas fa-ban" style={{ fontSize: '1.6rem' }}></i>
                            <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: '#121212' }}>Terminate & Cancel Order</h3>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#444', marginBottom: 12, lineHeight: 1.5 }}>
                            You are terminating Order <strong>#{terminateOrder.orderId || terminateOrder.id}</strong>. This will set order status to CANCELLED and send an alert notification to the customer.
                        </p>

                        <div style={{ marginBottom: 16, background: '#fff8f8', padding: '12px', borderRadius: 4, border: '1px solid #ffcdd2', fontSize: '0.78rem' }}>
                            <strong>Customer:</strong> {terminateOrder.userId || 'User'}<br />
                            <strong>Total Amount:</strong> ₹{(terminateOrder.totalAmount || 0).toLocaleString()}
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Message / Cancellation Notice for Customer *
                            </label>
                            <textarea
                                rows={3}
                                value={terminateReason}
                                onChange={(e) => setTerminateReason(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 4,
                                    border: '1px solid #ccc', fontSize: '0.82rem', fontFamily: "'Montserrat', sans-serif",
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                onClick={() => setTerminateOrder(null)}
                                style={{ padding: '10px 18px', background: '#eee', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmTerminate}
                                disabled={terminating}
                                style={{ padding: '10px 18px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {terminating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                                Confirm Termination
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
        </>
    );
}

export default MasterOrderHistory;
