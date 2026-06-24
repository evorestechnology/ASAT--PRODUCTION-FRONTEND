import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import { useCurrency } from '../../context/CurrencyContext';

const styles = `
    .tracking-page {
        min-height: 80vh;
        background: var(--light);
        padding: 40px 5%;
        font-family: 'Montserrat', sans-serif;
    }
    .tracking-container {
        max-width: 800px;
        margin: 0 auto;
    }
    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        padding: 40px;
        margin-top: 20px;
    }
    .tracking-title {
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        letter-spacing: 2px;
        color: var(--dark);
        text-align: center;
        margin-bottom: 30px;
    }
    
    /* Progress Line System */
    .progress-track {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        margin: 40px 0 50px;
    }
    .progress-bar-back {
        position: absolute;
        height: 4px;
        width: 100%;
        background: #e0e0e0;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
    }
    .progress-bar-fill {
        position: absolute;
        height: 4px;
        background: var(--gold);
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2;
        transition: width 0.8s ease-in-out;
    }
    .progress-node {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: white;
        border: 3px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3;
        font-size: 0.75rem;
        color: #888;
        transition: 0.3s;
        position: relative;
    }
    .progress-node.active {
        border-color: var(--gold);
        background: var(--gold);
        color: white;
        box-shadow: 0 0 15px rgba(197, 160, 89, 0.4);
    }
    .progress-node.completed {
        border-color: var(--dark);
        background: var(--dark);
        color: white;
    }
    .node-label {
        position: absolute;
        top: 42px;
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #777;
        white-space: nowrap;
        text-align: center;
    }
    .progress-node.active .node-label {
        color: var(--gold);
        font-weight: 700;
    }
    .progress-node.completed .node-label {
        color: var(--dark);
    }

    .order-details-summary {
        border-top: 1px solid rgba(0,0,0,0.06);
        padding-top: 25px;
        margin-top: 25px;
    }
    .details-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 0.85rem;
    }
    .details-label {
        color: #777;
    }
    .details-value {
        font-weight: 600;
        color: var(--dark);
    }
    .tracking-status-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--gold);
        letter-spacing: 1.5px;
        text-transform: uppercase;
        text-align: center;
        margin-bottom: 20px;
    }
    .empty-tracking {
        text-align: center;
        padding: 40px 20px;
    }
    .empty-tracking i {
        font-size: 3rem;
        color: #ccc;
        margin-bottom: 15px;
    }
    .empty-tracking h4 {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        letter-spacing: 2px;
        color: var(--dark);
        margin-bottom: 8px;
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

function UserTracking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const orderIdParam = searchParams.get('id') || searchParams.get('orderId');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                if (orderIdParam) {
                    const data = await apiFetch(`/api/orders/${orderIdParam}`);
                    setOrder(data || null);
                } else {
                    // Fetch user's latest order
                    const data = await apiFetch('/api/orders');
                    setOrder(data && data.length > 0 ? data[0] : null);
                }
            } catch (err) {
                console.error('Error fetching order tracking:', err);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [user, orderIdParam]);

    // Calculate tracking state
    const statuses = ['pending', 'manufacturing', 'shipping', 'completed'];
    const activeIndex = statuses.indexOf(order?.status || 'pending');
    
    // Percent width of progress fill
    const fillPercent = activeIndex > -1 ? (activeIndex / (statuses.length - 1)) * 100 : 0;

    const getNodeClass = (nodeIndex) => {
        if (nodeIndex === activeIndex) return 'active';
        if (nodeIndex < activeIndex) return 'completed';
        return '';
    };

    const formatDate = (createdAt) => {
        if (!createdAt) return 'Pending';
        const d = new Date(createdAt);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <style>{styles}</style>
            <div className="tracking-page">
                <div className="tracking-container">
                    <BackButton />
                    
                    {loading ? (
                        <div className="glass-card loader">
                            <div className="spinner" />
                            <p style={{ fontSize: '0.85rem', color: '#666' }}>Connecting to delivery network...</p>
                        </div>
                    ) : !order ? (
                        <div className="glass-card empty-tracking">
                            <i className="fas fa-search-location" />
                            <h4>NO TRACKING INFO FOUND</h4>
                            <p>We couldn't find any orders to track. Ensure you are logged in or try looking at your orders.</p>
                            <button className="cta-gold" style={{ marginTop: '15px' }} onClick={() => navigate('/orders')}>GO TO MY ORDERS</button>
                        </div>
                    ) : (
                        <div className="glass-card tracking-card">
                            <div className="tracking-header">
                                <h3 className="tracking-title">ORDER TRACKING</h3>
                                <p className="order-id-label" style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>{order.order_id || order.id?.slice(0, 10).toUpperCase()}</p>
                            </div>
                            
                            <div className="progress-bar-container" style={{ position: 'relative', margin: '40px 0 50px' }}>
                                <div className="progress-bar-nodes" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                    <div className="progress-bar-back" style={{ position: 'absolute', height: '4px', width: '100%', background: '#e0e0e0', zIndex: 1 }} />
                                    <div className="progress-bar-fill" style={{ width: `${fillPercent}%`, position: 'absolute', height: '4px', background: 'var(--gold)', zIndex: 2, transition: 'width 0.8s ease-in-out' }} />
                                    
                                    <div className={`progress-node ${getNodeClass(0)}`}>
                                        <i className="fas fa-clipboard" />
                                        <span className="node-label">Pending</span>
                                    </div>
                                    <div className={`progress-node ${getNodeClass(1)}`}>
                                        <i className="fas fa-industry" />
                                        <span className="node-label">Mfg</span>
                                    </div>
                                    <div className={`progress-node ${getNodeClass(2)}`}>
                                        <i className="fas fa-shipping-fast" />
                                        <span className="node-label">Shipped</span>
                                    </div>
                                    <div className={`progress-node ${getNodeClass(3)}`}>
                                        <i className="fas fa-check-circle" />
                                        <span className="node-label">Delivered</span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-details-summary">
                                <div className="details-row">
                                    <span className="details-label">Order Date:</span>
                                    <span className="details-value">{formatDate(order.created_at)}</span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Total Amount:</span>
                                    <span className="details-value" style={{ color: 'var(--gold)' }}>
                                        {formatPrice(order.total_amount || 0)}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Items:</span>
                                    <span className="details-value">
                                        {Array.isArray(order.items)
                                            ? order.items.map(item => `${item.name} (${item.size}) × ${item.qty}`).join(', ')
                                            : 'Premium Garment'}
                                    </span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Shipping Address:</span>
                                    <span className="details-value">{order.address || 'Standard Delivery'}</span>
                                </div>
                                {order.tracking_id && (
                                    <div className="details-row">
                                        <span className="details-label">Tracking ID / Waybill:</span>
                                        <span className="details-value" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {order.tracking_id}
                                        </span>
                                    </div>
                                )}
                                
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <button 
                                        className="cta-gold" 
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                        onClick={() => {
                                            import('../../utils/invoiceGenerator').then(module => {
                                                module.generateInvoice({
                                                    ...order,
                                                    orderId: order.order_id || order.id?.slice(0, 10).toUpperCase(),
                                                    createdAt: order.created_at,
                                                    customerName: order.customer_name,
                                                    totalAmount: order.total_amount
                                                });
                                            }).catch(err => {
                                                console.error("Failed to load invoice generator:", err);
                                                // Using alert if toast isn't configured in Tracking
                                                alert("Failed to generate invoice.");
                                            });
                                        }}
                                    >
                                        <i className="fas fa-file-invoice" /> Download Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserTracking;
