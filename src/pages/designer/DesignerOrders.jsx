import React, { useState, useEffect } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 10;

function DesignerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [country, setCountry] = useState('All');
    const [expanded, setExpanded] = useState(null);
    const [page, setPage] = useState(1);

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/orders');

            const list = (data || []).map(o => {
                const dateVal = o.created_at ? new Date(o.created_at).getTime() : 0;

                // Gather properties of matching items
                let matchingItems = [];
                if (Array.isArray(o.items)) {
                    matchingItems = o.items.filter(item => item.designerId === user.id);
                }

                const totalQty = matchingItems.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
                const royalty = Number(o.designer_earnings) || matchingItems.reduce((sum, item) => sum + Math.round((Number(item.price) || 0) * (Number(item.qty) || 1) * 0.1), 0);

                const productLabel = matchingItems.map(item => item.name).join(', ') || 'Garment';
                const colors = matchingItems.map(item => item.color).filter(Boolean).join(', ') || 'Standard';
                const sizes = matchingItems.map(item => item.size).filter(Boolean).join(', ') || 'Standard';

                return {
                    id: o.id,
                    orderId: o.order_id || o.id.slice(0, 10).toUpperCase(),
                    date: dateVal,
                    dateStr: o.created_at ? o.created_at.split('T')[0] : '',
                    product: productLabel,
                    qty: totalQty || 1,
                    country: o.country || 'India',
                    royalty: royalty || 0,
                    color: colors,
                    size: sizes,
                    placement: 'Front / Back',
                    isMine: o.designer_id === user.id || matchingItems.length > 0
                };
            }).filter(o => o.isMine);

            setOrders(list);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching designer orders:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchOrders();
    }, [user]);

    const countries = ['All', ...new Set(orders.map(o => o.country))];
    const filtered = orders.filter(o => {
        if (country !== 'All' && o.country !== country) return false;
        if (dateFrom && o.dateStr < dateFrom) return false;
        if (dateTo && o.dateStr > dateTo) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <main className="dsn-orders">
            <BackButton />
            <div className="dsn-page-head">
                <h2 className="dsn-page-title">Orders</h2>
                <span className="dsn-page-count">{filtered.length} orders</span>
            </div>

            <div className="dsn-orders__filters">
                <div className="dsn-orders__filter-group">
                    <label>From</label>
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                </div>
                <div className="dsn-orders__filter-group">
                    <label>To</label>
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                </div>
                <div className="dsn-orders__filter-group">
                    <label>Country</label>
                    <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}>
                        {countries.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                {(dateFrom || dateTo || country !== 'All') && (
                    <button className="dsn-orders__clear" onClick={() => { setDateFrom(''); setDateTo(''); setCountry('All'); setPage(1); }}>
                        <i className="fas fa-times"></i> Clear
                    </button>
                )}
            </div>

            {loading ? (
                <div className="dsn-table-wrap" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="dsn-spinner" style={{ margin: '0 auto 15px' }} />
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', color: '#666' }}>Streaming real-time orders...</p>
                </div>
            ) : (
                <div className="dsn-table-wrap">
                    <table className="dsn-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Country</th>
                                <th>Royalty (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map(o => (
                                <React.Fragment key={o.id}>
                                    <tr className={`dsn-table__row ${expanded === o.id ? 'dsn-table__row--active' : ''}`} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                        <td className="dsn-table__id">#{o.orderId}</td>
                                        <td>{o.date ? new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                        <td>{o.product}</td>
                                        <td>{o.qty}</td>
                                        <td>{o.country}</td>
                                        <td className="dsn-table__royalty">₹{o.royalty.toLocaleString('en-IN')}</td>
                                    </tr>
                                    {expanded === o.id && (
                                        <tr className="dsn-table__detail-row">
                                            <td colSpan="6">
                                                <div className="dsn-orders__detail">
                                                    <div className="dsn-orders__detail-item"><strong>Color:</strong> {o.color}</div>
                                                    <div className="dsn-orders__detail-item"><strong>Size:</strong> {o.size}</div>
                                                    <div className="dsn-orders__detail-item"><strong>Placement:</strong> {o.placement}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="dsn-table__empty">
                                        <i className="fas fa-inbox" style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block', color: '#ddd' }}></i>
                                        No matching orders yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="dsn-pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="fas fa-chevron-left"></i> Prev</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next <i className="fas fa-chevron-right"></i></button>
                </div>
            )}
        </main>
    );
}

export default DesignerOrders;
