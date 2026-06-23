import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MfgOrders() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tempTracking, setTempTracking] = useState({});
    const [savingTracking, setSavingTracking] = useState({});
    const [designCache, setDesignCache] = useState({});
    const [fetchingDesigns, setFetchingDesigns] = useState({});
    const [expandedTechPack, setExpandedTechPack] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [enlargedImage, setEnlargedImage] = useState(null);

    const handleDownloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            // Clean up filename
            const safeName = filename.replace(/[^a-z0-9_-]/gi, '_');
            link.download = `${safeName}.${blob.type.split('/')[1] || 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Direct download failed, opening in new tab:", err);
            window.open(url, '_blank');
        }
    };

    const toggleTechPack = async (item) => {
        let designId = item.id;

        if (!designId && item.designerId) {
            const resolveKey = `resolve_${item.designerId}_${item.name}`;
            setFetchingDesigns(prev => ({ ...prev, [resolveKey]: true }));
            try {
                const designs = await apiFetch(`/api/designs?designerId=${item.designerId}`);
                const matchedDesign = (designs || []).find(d => 
                    d.title?.trim().toLowerCase() === item.name?.trim().toLowerCase()
                );
                if (matchedDesign && matchedDesign.id) {
                    designId = matchedDesign.id;
                    item.id = designId; // mutate reference
                } else {
                    showToast("Could not find matching design details for this item.", "error");
                    return;
                }
            } catch (err) {
                console.error("Failed to resolve design ID for legacy order:", err);
                showToast("Failed to resolve design details.", "error");
                return;
            } finally {
                setFetchingDesigns(prev => ({ ...prev, [resolveKey]: false }));
            }
        }

        if (!designId || designId === 'undefined') {
            showToast("Design details are unavailable for this item.", "error");
            return;
        }

        if (expandedTechPack[designId]) {
            setExpandedTechPack(prev => ({ ...prev, [designId]: false }));
            return;
        }

        setExpandedTechPack(prev => ({ ...prev, [designId]: true }));

        if (!designCache[designId]) {
            setFetchingDesigns(prev => ({ ...prev, [designId]: true }));
            try {
                const data = await apiFetch(`/api/designs/${designId}`);
                if (data && data.description) {
                    try {
                        const parsedDesc = JSON.parse(data.description);
                        setDesignCache(prev => ({
                            ...prev,
                            [designId]: {
                                text: parsedDesc.text || '',
                                placements: parsedDesc.placements || {},
                                manufacturerRefs: parsedDesc.manufacturerRefs || {}
                            }
                        }));
                    } catch (err) {
                        console.error("Failed to parse design description:", err);
                        setDesignCache(prev => ({
                            ...prev,
                            [designId]: {
                                text: data.description,
                                placements: {},
                                manufacturerRefs: {}
                            }
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch design specifications:", err);
                showToast("Failed to fetch design specifications.", "error");
            } finally {
                setFetchingDesigns(prev => ({ ...prev, [designId]: false }));
            }
        }
    };

    const handleGoToDesign = async (item) => {
        let designId = item.id;

        if (!designId && item.designerId) {
            const resolveKey = `resolve_${item.designerId}_${item.name}`;
            setFetchingDesigns(prev => ({ ...prev, [resolveKey]: true }));
            try {
                const designs = await apiFetch(`/api/designs?designerId=${item.designerId}`);
                const matchedDesign = (designs || []).find(d => 
                    d.title?.trim().toLowerCase() === item.name?.trim().toLowerCase()
                );
                if (matchedDesign && matchedDesign.id) {
                    designId = matchedDesign.id;
                    item.id = designId; // mutate reference
                } else {
                    showToast("Could not find matching design details for this item.", "error");
                    return;
                }
            } catch (err) {
                console.error("Failed to resolve design ID for legacy order:", err);
                showToast("Failed to resolve design details.", "error");
                return;
            } finally {
                setFetchingDesigns(prev => ({ ...prev, [resolveKey]: false }));
            }
        }

        if (designId) {
            navigate(`/mfg/designs/${designId}`);
        } else {
            showToast("Design details are unavailable for this item.", "error");
        }
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            // Fetch active orders (not completed, not cancelled)
            const data = await apiFetch('/api/orders?history=false');

            const activeOrders = (data || []).map(o => {
                return {
                    id: o.id,
                    orderId: o.order_id || o.id.slice(0, 10).toUpperCase(),
                    createdAt: o.created_at,
                    items: o.items || [],
                    address: o.address,
                    phone: o.phone || o.contact,
                    customerName: o.customer_name,
                    totalAmount: Number(o.total_amount) || 0,
                    mfgEarnings: Number(o.mfg_earnings) || 0,
                    status: o.status || 'pending',
                    trackingId: o.tracking_id,
                    country: o.country || 'India',
                    mfgId: o.mfg_id
                };
            }).filter(o => {
                const isUnassigned = !o.mfgId;
                const isAssignedToMe = o.mfgId === user.id;
                return isUnassigned || isAssignedToMe;
            });

            // Sort by createdAt descending
            activeOrders.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });

            setOrders(activeOrders);

            // Populate tempTracking state with existing trackingIds
            const tracking = {};
            activeOrders.forEach(o => {
                tracking[o.id] = o.trackingId || '';
            });
            setTempTracking(prev => ({ ...tracking, ...prev }));
            setLoading(false);
        } catch (err) {
            console.error("Error fetching active orders:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchOrders();
    }, [user]);

    const handleStatusChange = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        try {
            await apiFetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            showToast(`Order status updated to ${newStatus}.`, 'success');
            fetchOrders();
        } catch (error) {
            console.error("Failed to update status: ", error);
            showToast("Error updating status. Please try again.", 'error');
        }
    };

    const handleTrackingSave = async (orderId) => {
        setSavingTracking(prev => ({ ...prev, [orderId]: true }));
        try {
            const value = tempTracking[orderId] || '';
            await apiFetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ tracking_id: value })
            });
            showToast('Tracking ID updated successfully!', 'success');
            fetchOrders();
        } catch (error) {
            console.error("Failed to update tracking ID: ", error);
            showToast("Error saving tracking ID.", 'error');
        } finally {
            setSavingTracking(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const formatOrderDate = (o) => {
        if (!o.createdAt) return 'N/A';
        const date = new Date(o.createdAt);
        return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const filteredOrders = orders.filter(o => {
        if (statusFilter !== 'all' && (o.status || 'pending').toLowerCase() !== statusFilter) return false;

        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            const orderIdStr = (o.orderId || o.id || '').toLowerCase();
            const customerStr = (o.customerName || '').toLowerCase();
            const addressStr = (o.address || '').toLowerCase();
            const itemsStr = (o.items || []).map(item => item.name || '').join(' ').toLowerCase();
            return (
                orderIdStr.includes(q) ||
                customerStr.includes(q) ||
                addressStr.includes(q) ||
                itemsStr.includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />

            <BackButton />
            <h1 className="adm-page__title">LIVE ORDERS</h1>
            <p className="adm-page__subtitle">Active orders currently in production queue</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div className="adm-page__filters" style={{ margin: 0 }}>
                    {['all', 'pending', 'manufacturing', 'shipping'].map(s => (
                        <button 
                            key={s} 
                            className={`adm-page__filter-btn ${statusFilter === s ? 'adm-page__filter-btn--active' : ''}`} 
                            onClick={() => setStatusFilter(s)}
                        >
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>

                {orders.length > 0 && (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search active orders..."
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
                )}
            </div>

            <div className="adm-table-wrap">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Shipping Address</th>
                            <th>Tracking ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="adm-table__empty"><i className="fas fa-spinner fa-spin"></i> Loading live orders...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="7" className="adm-table__empty"><i className="fas fa-bolt"></i> No active orders at the moment.</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" className="adm-table__empty"><i className="fas fa-search"></i> No matching orders found.</td></tr>
                        ) : (
                            filteredOrders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{o.id.substring(0, 8)}...</td>
                                    <td style={{ fontSize: '0.75rem' }}>{formatOrderDate(o)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {(o.items || []).map((item, idx) => (
                                                <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 2, borderBottom: idx < o.items.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: idx < o.items.length - 1 ? 4 : 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {item.image && (
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name} 
                                                                onClick={() => setEnlargedImage(item.image)}
                                                                style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, cursor: 'zoom-in' }} 
                                                            />
                                                        )}
                                                        <span style={{ fontWeight: 600 }}>{item.name} ({item.size}) x {item.qty}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: item.image ? 30 : 0, color: '#666', fontSize: '0.7rem' }}>
                                                        {item.color && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, border: '1px solid #ccc' }}></span>
                                                                {item.colorName || 'Selected'}
                                                            </span>
                                                        )}
                                                        {item.printStyle && (
                                                            <span>• Print: {item.printStyle}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: 200, fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        <div><strong>{o.customerName || 'Customer'}</strong></div>
                                        <div>{o.address}</div>
                                        <div>{o.phone}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <input 
                                                type="text" 
                                                placeholder="Tracking ID" 
                                                value={tempTracking[o.id] || ''}
                                                onChange={(e) => setTempTracking({ ...tempTracking, [o.id]: e.target.value })}
                                                style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #ddd', 
                                                    borderRadius: 4,
                                                    fontFamily: "'Montserrat'", 
                                                    fontSize: '0.75rem', 
                                                    width: 130 
                                                }} 
                                            />
                                            <button 
                                                onClick={() => handleTrackingSave(o.id)}
                                                className="adm-action-btn"
                                                style={{ padding: '6px 8px', background: '#C5A059', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                                                disabled={savingTracking[o.id]}
                                            >
                                                {savingTracking[o.id] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            value={o.status || 'pending'}
                                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid #C5A059',
                                                borderRadius: 4,
                                                background: '#fff',
                                                fontFamily: "'Montserrat'",
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                color: '#121212',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="manufacturing">Manufacturing</option>
                                            <option value="shipping">Shipping</option>
                                            <option value="completed">Completed</option>
                                        </select>
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
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                        <h3 style={{ fontSize: '0.9rem', color: '#C5A059', textTransform: 'uppercase', marginBottom: 12 }}>Items Ordered</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {(selectedOrder.items || []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 15, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                                    {item.image && (
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            onClick={() => setEnlargedImage(item.image)}
                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #eaeaea', cursor: 'zoom-in' }} 
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 4px 0' }}>{item.name}</h4>
                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0' }}>Size: {item.size} | Qty: {item.qty}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '2px 0' }}>Unit Price: ₹{item.price?.toLocaleString('en-IN')}</p>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.75rem', color: '#555' }}>
                                            {item.color && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <strong>Color:</strong>
                                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, border: '1px solid #ccc', verticalAlign: 'middle' }}></span>
                                                    {item.colorName || 'Selected'}
                                                </span>
                                            )}
                                            {item.printStyle && (
                                                <span><strong>Printing:</strong> {item.printStyle} (+₹{item.printCost || 0})</span>
                                            )}
                                        </div>

                                        {item.designerId && !item.isMfgProduct && (
                                             <>
                                                 <p style={{ fontSize: '0.75rem', color: '#999', margin: '6px 0 0 0' }}>Designer ID: {item.designerId}</p>
                                                 <div style={{ marginTop: 12 }}>
                                                     {item.id ? (
                                                         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => navigate(`/mfg/designs/${item.id}`)}
                                                                 style={{
                                                                     background: 'var(--admin-gold, #C5A059)',
                                                                     border: 'none',
                                                                     color: '#fff',
                                                                     padding: '4px 10px',
                                                                     borderRadius: 4,
                                                                     fontSize: '0.7rem',
                                                                     fontWeight: 600,
                                                                     fontFamily: "'Montserrat', sans-serif",
                                                                     cursor: 'pointer',
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: 6
                                                                 }}
                                                             >
                                                                 <i className="fas fa-external-link-alt"></i> Go to Design
                                                             </button>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => toggleTechPack(item)}
                                                                 style={{
                                                                     background: 'transparent',
                                                                     border: '1px solid var(--admin-gold, #C5A059)',
                                                                     color: 'var(--admin-gold, #C5A059)',
                                                                     padding: '4px 10px',
                                                                     borderRadius: 4,
                                                                     fontSize: '0.7rem',
                                                                     fontWeight: 600,
                                                                     fontFamily: "'Montserrat', sans-serif",
                                                                     cursor: 'pointer',
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: 6
                                                                 }}
                                                             >
                                                                 <i className={`fas ${expandedTechPack[item.id] ? 'fa-chevron-up' : 'fa-print'}`}></i>
                                                                 {expandedTechPack[item.id] ? 'Hide Tech Pack' : 'View Tech Pack & Files'}
                                                             </button>
                                                         </div>
                                                     ) : (
                                                         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => handleGoToDesign(item)}
                                                                 style={{
                                                                     background: 'var(--admin-gold, #C5A059)',
                                                                     border: 'none',
                                                                     color: '#fff',
                                                                     padding: '4px 10px',
                                                                     borderRadius: 4,
                                                                     fontSize: '0.7rem',
                                                                     fontWeight: 600,
                                                                     fontFamily: "'Montserrat', sans-serif",
                                                                     cursor: 'pointer',
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: 6
                                                                 }}
                                                                 disabled={fetchingDesigns[`resolve_${item.designerId}_${item.name}`]}
                                                             >
                                                                 {fetchingDesigns[`resolve_${item.designerId}_${item.name}`] ? (
                                                                     <>
                                                                         <i className="fas fa-spinner fa-spin"></i>
                                                                         Resolving Design...
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <i className="fas fa-external-link-alt"></i>
                                                                         Go to Design
                                                                     </>
                                                                 )}
                                                             </button>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => toggleTechPack(item)}
                                                                 style={{
                                                                     background: 'transparent',
                                                                     border: '1px solid var(--admin-gold, #C5A059)',
                                                                     color: 'var(--admin-gold, #C5A059)',
                                                                     padding: '4px 10px',
                                                                     borderRadius: 4,
                                                                     fontSize: '0.7rem',
                                                                     fontWeight: 600,
                                                                     fontFamily: "'Montserrat', sans-serif",
                                                                     cursor: 'pointer',
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: 6
                                                                 }}
                                                                 disabled={fetchingDesigns[`resolve_${item.designerId}_${item.name}`]}
                                                             >
                                                                 {fetchingDesigns[`resolve_${item.designerId}_${item.name}`] ? (
                                                                     <>
                                                                         <i className="fas fa-spinner fa-spin"></i>
                                                                         Resolving Design...
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <i className="fas fa-print"></i>
                                                                         View Tech Pack & Files
                                                                     </>
                                                                 )}
                                                             </button>
                                                         </div>
                                                     )}

                                                     {item.id && expandedTechPack[item.id] && (
                                                         <div style={{
                                                             marginTop: 10,
                                                             padding: 12,
                                                             background: '#fafafa',
                                                             border: '1px solid #ddd',
                                                             borderRadius: 6
                                                         }}>
                                                             {fetchingDesigns[item.id] ? (
                                                                 <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                                     <i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i> Loading tech pack...
                                                                 </div>
                                                             ) : designCache[item.id] ? (
                                                                 <div>
                                                                     {designCache[item.id].text && (
                                                                         <div style={{ 
                                                                             padding: '10px 12px', 
                                                                             backgroundColor: '#fff', 
                                                                             borderLeft: '3px solid var(--admin-gold, #C5A059)', 
                                                                             borderRadius: '0 6px 6px 0', 
                                                                             boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                                             marginBottom: 12
                                                                         }}>
                                                                             <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#C5A059', textTransform: 'uppercase', marginBottom: 4 }}>
                                                                                 Designer Instructions & Notes
                                                                             </div>
                                                                             <div style={{ fontSize: '0.75rem', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                                                                 {designCache[item.id].text}
                                                                             </div>
                                                                         </div>
                                                                     )}
                                                                     <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: '#333' }}>
                                                                         Printing Placements for {item.colorName || 'Default Color'}
                                                                     </div>
                                                                    
                                                                    {(() => {
                                                                        const colorKey = item.colorName || '';
                                                                        const placements = designCache[item.id].placements?.[colorKey] || [];
                                                                        const refs = designCache[item.id].manufacturerRefs?.[colorKey] || [];
                                                                        
                                                                        if (placements.length === 0 && refs.length === 0) {
                                                                            return <div style={{ fontSize: '0.72rem', color: '#888' }}>No specific printing specifications loaded for this color.</div>;
                                                                        }

                                                                        return (
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                                {placements.map((p, pIdx) => (
                                                                                    <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8, padding: 8, border: '1px solid #eee', borderRadius: 4, background: 'white' }}>
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 600 }}>Style & Zone:</div>
                                                                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111' }}>{p.style} on {p.placementLabel}</div>
                                                                                            
                                                                                            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                                                                                {p.designUrl && (
                                                                                                    <div style={{ textAlign: 'center' }}>
                                                                                                        <span style={{ fontSize: '0.55rem', color: '#888', display: 'block', marginBottom: 2 }}>Artwork:</span>
                                                                                                        <div 
                                                                                                            onClick={() => setEnlargedImage(p.designUrl)}
                                                                                                            style={{ width: 50, height: 50, border: '1px solid #ddd', borderRadius: 4, background: `url(${p.designUrl}) center/contain no-repeat #fff`, cursor: 'zoom-in' }}
                                                                                                        ></div>
                                                                                                    </div>
                                                                                                )}
                                                                                                {p.mockupUrl && (
                                                                                                    <div style={{ textAlign: 'center' }}>
                                                                                                        <span style={{ fontSize: '0.55rem', color: '#888', display: 'block', marginBottom: 2 }}>Mockup:</span>
                                                                                                        <div 
                                                                                                            onClick={() => setEnlargedImage(p.mockupUrl)}
                                                                                                            style={{ width: 50, height: 50, border: '1px solid #ddd', borderRadius: 4, background: `url(${p.mockupUrl}) center/contain no-repeat #fff`, cursor: 'zoom-in' }}
                                                                                                        ></div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                                            {p.designUrl && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleDownloadFile(p.designUrl, `${item.name}_${colorKey}_${p.placementLabel}_Artwork`)}
                                                                                                    style={{
                                                                                                        background: '#111',
                                                                                                        color: 'white',
                                                                                                        border: 'none',
                                                                                                        padding: '4px 8px',
                                                                                                        borderRadius: 2,
                                                                                                        fontSize: '0.62rem',
                                                                                                        fontWeight: 600,
                                                                                                        cursor: 'pointer',
                                                                                                        display: 'flex',
                                                                                                        alignItems: 'center',
                                                                                                        gap: 4
                                                                                                    }}
                                                                                                >
                                                                                                    <i className="fas fa-download"></i> Artwork
                                                                                                </button>
                                                                                            )}
                                                                                            {p.mockupUrl && (
                                                                                                <a
                                                                                                    href={p.mockupUrl}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    style={{
                                                                                                        background: '#fafafa',
                                                                                                        color: '#111',
                                                                                                        border: '1px solid #ddd',
                                                                                                        padding: '3px 7px',
                                                                                                        borderRadius: 2,
                                                                                                        fontSize: '0.62rem',
                                                                                                        fontWeight: 600,
                                                                                                        textDecoration: 'none',
                                                                                                        display: 'flex',
                                                                                                        alignItems: 'center',
                                                                                                        gap: 4
                                                                                                    }}
                                                                                                >
                                                                                                    <i className="fas fa-eye"></i> Mockup
                                                                                                </a>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}

                                                                                {refs.length > 0 && (
                                                                                    <div style={{ marginTop: 6 }}>
                                                                                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#555', marginBottom: 6 }}>Manufacturer Reference Images:</div>
                                                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                                            {refs.map((refUrl, rIdx) => (
                                                                                                <div 
                                                                                                    key={rIdx} 
                                                                                                    onClick={() => setEnlargedImage(refUrl)}
                                                                                                    style={{ position: 'relative', width: 60, height: 60, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', background: `url(${refUrl}) center/cover no-repeat`, cursor: 'zoom-in' }}
                                                                                                >
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(e) => { e.stopPropagation(); handleDownloadFile(refUrl, `${item.name}_${colorKey}_RefImage_${rIdx + 1}`); }}
                                                                                                        style={{
                                                                                                            position: 'absolute',
                                                                                                            bottom: 0,
                                                                                                            left: 0,
                                                                                                            right: 0,
                                                                                                            background: 'rgba(0,0,0,0.6)',
                                                                                                            color: 'white',
                                                                                                            border: 'none',
                                                                                                            fontSize: '0.5rem',
                                                                                                            padding: '2px 0',
                                                                                                            cursor: 'pointer',
                                                                                                            textAlign: 'center'
                                                                                                        }}
                                                                                                    >
                                                                                                        Download
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: '0.72rem', color: '#e74c3c' }}>Failed to load tech pack.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {item.isMfgProduct && item.mfgId && (
                                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '6px 0 0 0' }}>Manufacturer ID: {item.mfgId}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Enlargement Modal */}
            {enlargedImage && (
                <div 
                    onClick={() => setEnlargedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        cursor: 'zoom-out'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img 
                            src={enlargedImage} 
                            alt="Enlarged order view" 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '80vh', 
                                objectFit: 'contain', 
                                borderRadius: 8,
                                border: '3px solid #fff',
                                boxShadow: '0 5px 25px rgba(0,0,0,0.5)'
                            }} 
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEnlargedImage(null); }}
                            style={{
                                position: 'absolute',
                                top: -45,
                                right: 0,
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 600
                            }}
                        >
                            <i className="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MfgOrders;
