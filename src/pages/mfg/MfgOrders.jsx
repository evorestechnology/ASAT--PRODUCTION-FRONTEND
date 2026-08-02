import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const COLOR_NAME_TO_HEX = {
    'jet black': '#121212',
    'black': '#000000',
    'white': '#ffffff',
    'off white': '#faf0e6',
    'snow white': '#fffafa',
    'navy': '#0b192c',
    'navy blue': '#0b192c',
    'blue': '#1e3a8a',
    'red': '#b91c1c',
    'maroon': '#800000',
    'green': '#15803d',
    'forest green': '#14532d',
    'olive': '#556b2f',
    'yellow': '#eab308',
    'gold': '#c5a059',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'charcoal': '#374151',
    'heather grey': '#9ca3af',
    'light grey': '#d1d5db',
    'dark grey': '#4b5563',
    'beige': '#f5f5dc',
    'brown': '#78350f',
    'pink': '#ec4899',
    'purple': '#7e22ce',
    'lavender': '#e6e6fa',
    'orange': '#f97316'
};

const resolveColorHex = (item) => {
    if (!item) return '#121212';
    const hexProp = item.colorHex || item.hex || item.color_hex;
    if (hexProp && typeof hexProp === 'string' && hexProp.startsWith('#')) {
        return hexProp;
    }
    if (item.color && typeof item.color === 'string' && item.color.startsWith('#')) {
        return item.color;
    }
    const rawName = (item.colorName || item.color || '').toString().trim().toLowerCase();
    if (COLOR_NAME_TO_HEX[rawName]) {
        return COLOR_NAME_TO_HEX[rawName];
    }
    if (rawName && !rawName.includes(' ')) {
        return rawName;
    }
    return '#121212';
};

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
    const [neckLogoGenItem, setNeckLogoGenItem] = useState(null);
    const neckLogoRef = useRef(null);
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

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
                                manufacturerRefs: parsedDesc.manufacturerRefs || {},
                                designerName: data.designers?.full_name || data.designer_username || data.designers?.username || 'Designer'
                            }
                        }));
                    } catch (err) {
                        console.error("Failed to parse design description:", err);
                        setDesignCache(prev => ({
                            ...prev,
                            [designId]: {
                                text: data.description,
                                placements: {},
                                manufacturerRefs: {},
                                designerName: data.designers?.full_name || data.designer_username || data.designers?.username || 'Designer'
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
            navigate(`/mfg/designs/${designId}?color=${encodeURIComponent(item.colorName || item.color || '')}&size=${encodeURIComponent(item.size || '')}`);
        } else {
            showToast("Design details are unavailable for this item.", "error");
        }
    };

    const handleDownloadNeckLogo = async () => {
        if (!neckLogoRef.current || !neckLogoGenItem) return;
        setIsGeneratingLogo(true);
        try {
            const canvas = await html2canvas(neckLogoRef.current, {
                backgroundColor: null,
                useCORS: true,
                scale: 3
            });
            const link = document.createElement('a');
            link.download = `neck-logo-${neckLogoGenItem.designerUsername || 'designer'}-${neckLogoGenItem.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast("Neck logo downloaded successfully!", "success");
        } catch (err) {
            console.error("Failed to generate neck logo:", err);
            showToast("Failed to generate neck logo.", "error");
        } finally {
            setIsGeneratingLogo(false);
        }
    };

    const [selectedPartner, setSelectedPartner] = useState({});
    const [customPartner, setCustomPartner] = useState({});
    const [cantBeDoneOrder, setCantBeDoneOrder] = useState(null);
    const [cantBeDoneReason, setCantBeDoneReason] = useState('Out of Stock / Material Unavailable');
    const [cantBeDoneNotes, setCantBeDoneNotes] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    // Cost adjustment states
    const [costAdjustmentOrder, setCostAdjustmentOrder] = useState(null);
    const [costAdjustmentAmountInput, setCostAdjustmentAmountInput] = useState('');
    const [costAdjustmentReasonInput, setCostAdjustmentReasonInput] = useState('');
    const [submittingCostAdjustment, setSubmittingCostAdjustment] = useState(false);

    const STANDARD_PARTNERS = ['DTDC', 'FedEx', 'Delhivery', 'Blue Dart', 'India Post', 'DHL'];

    const parseTrackingString = (rawTracking) => {
        if (!rawTracking) return { partner: 'DTDC', customPartner: '', code: '' };
        if (rawTracking.startsWith('[')) {
            const idx = rawTracking.indexOf(']');
            if (idx !== -1) {
                const pName = rawTracking.substring(1, idx).trim();
                const code = rawTracking.substring(idx + 1).trim();
                if (STANDARD_PARTNERS.includes(pName)) {
                    return { partner: pName, customPartner: '', code };
                } else {
                    return { partner: 'Others', customPartner: pName, code };
                }
            }
        }
        return { partner: 'DTDC', customPartner: '', code: rawTracking };
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
                    customerEmail: o.users?.email || o.contact || 'N/A',
                    totalAmount: Number(o.total_amount) || 0,
                    mfgEarnings: Number(o.mfg_earnings) || 0,
                    status: o.status || 'pending',
                    trackingId: o.tracking_id,
                    country: o.country || 'India',
                    mfgId: o.mfg_id,
                    statusHistory: o.status_history || [],
                    costAdjustmentStatus: o.cost_adjustment_status,
                    costAdjustmentAmount: o.cost_adjustment_amount,
                    costAdjustmentReason: o.cost_adjustment_reason
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

            // Populate tracking & partner states
            const tracking = {};
            const partners = {};
            const customPartners = {};
            activeOrders.forEach(o => {
                const parsed = parseTrackingString(o.trackingId);
                tracking[o.id] = parsed.code;
                partners[o.id] = parsed.partner;
                customPartners[o.id] = parsed.customPartner;
            });
            setTempTracking(prev => ({ ...tracking, ...prev }));
            setSelectedPartner(prev => ({ ...partners, ...prev }));
            setCustomPartner(prev => ({ ...customPartners, ...prev }));
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
            const partnerVal = selectedPartner[orderId] === 'Others' 
                ? (customPartner[orderId] || 'Others') 
                : (selectedPartner[orderId] || 'DTDC');
            const codeVal = tempTracking[orderId] || '';

            await apiFetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    shipping_partner: partnerVal,
                    tracking_id: codeVal 
                })
            });
            showToast(`Tracking ID & Shipping Partner (${partnerVal}) updated!`, 'success');
            fetchOrders();
        } catch (error) {
            console.error("Failed to update tracking ID: ", error);
            showToast("Error saving tracking details.", 'error');
        } finally {
            setSavingTracking(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleReportCantBeDoneSubmit = async () => {
        if (!cantBeDoneOrder) return;
        setSubmittingReport(true);
        try {
            const fullReason = `${cantBeDoneReason}${cantBeDoneNotes.trim() ? ` - ${cantBeDoneNotes.trim()}` : ''}`;
            await apiFetch(`/api/orders/${cantBeDoneOrder.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'issue_reported',
                    cant_be_done_reason: fullReason
                })
            });
            showToast('Report submitted to Master Admin. Order flagged for termination.', 'success');
            setCantBeDoneOrder(null);
            setCantBeDoneNotes('');
            fetchOrders();
        } catch (err) {
            console.error('Error reporting issue:', err);
            showToast('Failed to submit report. Please try again.', 'error');
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleCostAdjustmentSubmit = async () => {
        if (!costAdjustmentOrder) return;
        const numAmt = Number(costAdjustmentAmountInput);
        if (isNaN(numAmt) || numAmt <= 0) {
            showToast("Please enter a valid extra cost amount.", "warning");
            return;
        }

        setSubmittingCostAdjustment(true);
        try {
            await apiFetch(`/api/orders/${costAdjustmentOrder.id}/cost-adjustment`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: numAmt,
                    reason: costAdjustmentReasonInput.trim()
                })
            });
            showToast(`Cost adjustment request of ₹${numAmt} sent to Master Admin!`, 'success');
            setCostAdjustmentOrder(null);
            setCostAdjustmentAmountInput('');
            setCostAdjustmentReasonInput('');
            fetchOrders();
        } catch (err) {
            console.error("Failed to submit cost adjustment request:", err);
            showToast("Failed to submit request. Please try again.", 'error');
        } finally {
            setSubmittingCostAdjustment(false);
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
                                                         {(item.color || item.colorName) && (
                                                             <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                 <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: resolveColorHex(item), border: '1px solid rgba(0,0,0,0.25)', boxShadow: '0 0 2px rgba(0,0,0,0.15)' }}></span>
                                                                 {item.colorName || item.color}
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
                                        <div><a href={`mailto:${o.customerEmail}`} style={{color: '#C5A059', textDecoration: 'none'}}>{o.customerEmail}</a></div>
                                        <div>{o.address}</div>
                                        <div>{o.phone}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 170 }}>
                                            {/* Shipping Partner Dropdown */}
                                            <select
                                                value={selectedPartner[o.id] || 'DTDC'}
                                                onChange={(e) => setSelectedPartner({ ...selectedPartner, [o.id]: e.target.value })}
                                                style={{
                                                    padding: '5px 8px',
                                                    border: '1px solid #C5A059',
                                                    borderRadius: 4,
                                                    fontSize: '0.72rem',
                                                    fontFamily: "'Montserrat'",
                                                    background: '#fff',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <option value="DTDC">DTDC</option>
                                                <option value="FedEx">FedEx</option>
                                                <option value="Delhivery">Delhivery</option>
                                                <option value="Blue Dart">Blue Dart</option>
                                                <option value="India Post">India Post</option>
                                                <option value="DHL">DHL</option>
                                                <option value="Others">Others (Custom)</option>
                                            </select>

                                            {/* Dynamic Custom Partner Textbox */}
                                            {selectedPartner[o.id] === 'Others' && (
                                                <input
                                                    type="text"
                                                    placeholder="Enter Shipping Partner"
                                                    value={customPartner[o.id] || ''}
                                                    onChange={(e) => setCustomPartner({ ...customPartner, [o.id]: e.target.value })}
                                                    style={{
                                                        padding: '4px 8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: 4,
                                                        fontSize: '0.72rem',
                                                        fontFamily: "'Montserrat'"
                                                    }}
                                                />
                                            )}

                                            {/* Tracking ID & Save Button */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Tracking ID" 
                                                    value={tempTracking[o.id] || ''}
                                                    onChange={(e) => setTempTracking({ ...tempTracking, [o.id]: e.target.value })}
                                                    style={{ 
                                                        padding: '5px 8px', 
                                                        border: '1px solid #ddd', 
                                                        borderRadius: 4,
                                                        fontFamily: "'Montserrat'", 
                                                        fontSize: '0.72rem', 
                                                        width: '100%'
                                                    }} 
                                                />
                                                <button 
                                                    onClick={() => handleTrackingSave(o.id)}
                                                    className="adm-action-btn"
                                                    style={{ padding: '5px 8px', background: '#C5A059', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                                    disabled={savingTracking[o.id]}
                                                    title="Save Shipping Partner & Tracking ID"
                                                >
                                                    {savingTracking[o.id] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                                </button>
                                            </div>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', minWidth: 120 }}>
                                            <button 
                                                onClick={() => setSelectedOrder(o)}
                                                className="adm-action-btn"
                                                style={{ background: '#121212', color: '#fff', width: '100%', justifyContent: 'center' }}
                                            >
                                                <i className="fas fa-eye"></i> View
                                            </button>

                                            {/* Cost Adjustment Request Button & Badges */}
                                            {o.costAdjustmentStatus === 'requested' ? (
                                                <span style={{ fontSize: '0.65rem', color: '#b78103', background: '#fff8e1', padding: '4px 6px', borderRadius: 4, border: '1px solid #ffe082', fontWeight: 700, width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                                                    <i className="fas fa-hourglass-half"></i> Adj: ₹{o.costAdjustmentAmount} (Pending)
                                                </span>
                                            ) : o.costAdjustmentStatus === 'approved' ? (
                                                <span style={{ fontSize: '0.65rem', color: '#1b5e20', background: '#e8f5e9', padding: '4px 6px', borderRadius: 4, border: '1px solid #c8e6c9', fontWeight: 700, width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                                                    <i className="fas fa-check-circle"></i> Adj: +₹{o.costAdjustmentAmount} Approved
                                                </span>
                                            ) : o.costAdjustmentStatus === 'rejected' ? (
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                    <span style={{ fontSize: '0.62rem', color: '#b91c1c', background: '#ffebee', padding: '2px 4px', borderRadius: 4, border: '1px solid #ffcdd2', fontWeight: 700, textAlign: 'center' }}>
                                                        <i className="fas fa-times-circle"></i> Adj Rejected
                                                    </span>
                                                    <button 
                                                        onClick={() => { setCostAdjustmentOrder(o); setCostAdjustmentAmountInput(o.costAdjustmentAmount || ''); setCostAdjustmentReasonInput(''); }}
                                                        className="adm-action-btn"
                                                        style={{ background: '#28a745', color: '#fff', fontSize: '0.65rem', padding: '3px 6px', width: '100%', justifyContent: 'center' }}
                                                        title="Request cost adjustment again from Master"
                                                    >
                                                        <i className="fas fa-redo"></i> Re-request Cost
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => { setCostAdjustmentOrder(o); setCostAdjustmentAmountInput(''); setCostAdjustmentReasonInput(''); }}
                                                    className="adm-action-btn"
                                                    style={{ background: '#28a745', color: '#fff', fontSize: '0.68rem', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                                                    title="Request extra manufacturing cost amount from Master Admin"
                                                >
                                                    <i className="fas fa-coins"></i> Cost Adjustment
                                                </button>
                                            )}
                                            
                                            {o.status === 'issue_reported' ? (
                                                <span style={{ fontSize: '0.65rem', color: '#dc3545', fontWeight: 700, padding: '2px 4px', background: '#fff0f0', borderRadius: 4, border: '1px solid #ffcdd2', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                                                    <i className="fas fa-exclamation-circle"></i> Reported Can't Be Done
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => setCantBeDoneOrder(o)}
                                                    className="adm-action-btn"
                                                    style={{ background: '#dc3545', color: '#fff', fontSize: '0.68rem', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                                                    title="Report to Master Admin that this order cannot be fulfilled"
                                                >
                                                    <i className="fas fa-exclamation-triangle"></i> Can't Be Done
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
                                            {(item.color || item.colorName) && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <strong>Color:</strong>
                                                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: resolveColorHex(item), border: '1px solid rgba(0,0,0,0.25)', boxShadow: '0 0 2px rgba(0,0,0,0.15)', verticalAlign: 'middle' }}></span>
                                                    {item.colorName || item.color}
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
                                                             >
                                                                 <i className="fas fa-external-link-alt"></i> Go to Design
                                                             </button>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setNeckLogoGenItem(item)}
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
                                                                 <i className="fas fa-tag"></i> Generate Neck Logo
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
                                                                 onClick={() => setNeckLogoGenItem(item)}
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
                                                                 <i className="fas fa-tag"></i> Generate Neck Logo
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
                                                                                            <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 600 }}>Print Style & Zone:</div>
                                                                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>{p.style} on {p.placementLabel}</div>
                                                                                            {/* Print Price */}
                                                                                            <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                                                {p.price != null && p.price !== '' && (
                                                                                                    <span style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.4)', borderRadius: 4, padding: '2px 7px', fontSize: '0.68rem', fontWeight: 700, color: '#a07820' }}>
                                                                                                        ₹{Number(p.price).toLocaleString('en-IN')}
                                                                                                    </span>
                                                                                                )}
                                                                                                {p.darkPrice != null && p.darkPrice !== '' && (
                                                                                                    <span style={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 4, padding: '2px 7px', fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>
                                                                                                        Dark ₹{Number(p.darkPrice).toLocaleString('en-IN')}
                                                                                                    </span>
                                                                                                )}
                                                                                                {p.lightPrice != null && p.lightPrice !== '' && (
                                                                                                    <span style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: '2px 7px', fontSize: '0.68rem', fontWeight: 700, color: '#333' }}>
                                                                                                        Light ₹{Number(p.lightPrice).toLocaleString('en-IN')}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            
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

            {/* Neck Logo Generator Modal */}
            {neckLogoGenItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: 20
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 12,
                        padding: 30,
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        border: '1px solid #333',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <button 
                            onClick={() => setNeckLogoGenItem(null)}
                            style={{
                                position: 'absolute',
                                top: 15,
                                right: 15,
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: '#aaa'
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h2 style={{ fontFamily: "'Montserrat'", fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: 20, width: '100%', textAlign: 'center' }}>
                            Generate Neck Logo
                        </h2>

                        {/* Capture Area */}
                        <div 
                            ref={neckLogoRef}
                            style={{
                                width: '220px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '15px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        >
                            <img 
                                src="/ast-logo.jpg" 
                                alt="AST Logo" 
                                style={{
                                    width: '80px',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                            <div style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 600,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                color: '#000',
                                letterSpacing: '0.05em',
                                textAlign: 'center'
                            }}>
                                By {designCache[neckLogoGenItem.id]?.designerName || neckLogoGenItem.designerUsername || 'Designer'}
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadNeckLogo}
                            disabled={isGeneratingLogo}
                            style={{
                                marginTop: 30,
                                background: 'var(--admin-gold, #C5A059)',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: 6,
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                fontFamily: "'Montserrat', sans-serif",
                                cursor: isGeneratingLogo ? 'not-allowed' : 'pointer',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'background 0.2s'
                            }}
                        >
                            {isGeneratingLogo ? (
                                <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                            ) : (
                                <><i className="fas fa-download"></i> Download PNG</>
                            )}
                        </button>
                    </div>
                </div>
            )}
            {/* Report Can't Be Done Modal */}
            {cantBeDoneOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 8, padding: '24px 30px',
                        maxWidth: 480, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setCantBeDoneOrder(null)}
                            style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' }}
                        >
                            &times;
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#dc3545' }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.5rem' }}></i>
                            <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: '#121212' }}>Report Order Issue</h3>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                            Report to Master Admin that Order <strong>#{cantBeDoneOrder.orderId || cantBeDoneOrder.id}</strong> cannot be fulfilled. Master will review and terminate the order.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Select Reason *
                            </label>
                            <select
                                value={cantBeDoneReason}
                                onChange={(e) => setCantBeDoneReason(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 4,
                                    border: '1px solid #ccc', fontSize: '0.82rem', fontFamily: "'Montserrat', sans-serif"
                                }}
                            >
                                <option value="Out of Stock / Material Unavailable">Out of Stock / Material Unavailable</option>
                                <option value="Unprintable Design Specification">Unprintable Design Specification</option>
                                <option value="Garment Sizing / Pattern Defect">Garment Sizing / Pattern Defect</option>
                                <option value="Equipment / Facility Breakdown">Equipment / Facility Breakdown</option>
                                <option value="Other Manufacturing Constraint">Other Manufacturing Constraint</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Additional Details (Optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Explain why this order cannot be manufactured..."
                                value={cantBeDoneNotes}
                                onChange={(e) => setCantBeDoneNotes(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 4,
                                    border: '1px solid #ccc', fontSize: '0.82rem', fontFamily: "'Montserrat', sans-serif",
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                onClick={() => setCantBeDoneOrder(null)}
                                style={{ padding: '10px 18px', background: '#eee', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReportCantBeDoneSubmit}
                                disabled={submittingReport}
                                style={{ padding: '10px 18px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {submittingReport ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                Submit Report to Master
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Manufacturer Cost Adjustment Request Modal */}
            {costAdjustmentOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 8, padding: '24px 30px',
                        maxWidth: 480, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setCostAdjustmentOrder(null)}
                            style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' }}
                        >
                            &times;
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#28a745' }}>
                            <i className="fas fa-coins" style={{ fontSize: '1.5rem', color: '#C5A059' }}></i>
                            <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: '#121212' }}>Request Cost Adjustment</h3>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                            Request extra manufacturing cost for Order <strong>#{costAdjustmentOrder.orderId || costAdjustmentOrder.id}</strong>. Master Admin will review your request and credit your wallet upon approval.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Extra Cost Amount (₹) *
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span style={{ position: 'absolute', left: 12, fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter extra amount, e.g. 250"
                                    value={costAdjustmentAmountInput}
                                    onChange={(e) => setCostAdjustmentAmountInput(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 12px 10px 28px', borderRadius: 4,
                                        border: '1px solid #ccc', fontSize: '0.88rem', fontFamily: "'Montserrat', sans-serif",
                                        fontWeight: 600
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Reason / Justification for Master *
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Explain why extra cost is needed (e.g. Special thread, fabric weight difference, intricate placement)..."
                                value={costAdjustmentReasonInput}
                                onChange={(e) => setCostAdjustmentReasonInput(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 4,
                                    border: '1px solid #ccc', fontSize: '0.82rem', fontFamily: "'Montserrat', sans-serif",
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                onClick={() => setCostAdjustmentOrder(null)}
                                style={{ padding: '10px 18px', background: '#eee', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCostAdjustmentSubmit}
                                disabled={submittingCostAdjustment}
                                style={{ padding: '10px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {submittingCostAdjustment ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                Submit Request to Master
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MfgOrders;
