import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch, uploadFile } from '../../api';
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
    
    /* Query Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(6px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .modal-card {
        width: 550px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        padding: 30px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0,0,0,0.06);
        padding-bottom: 15px;
    }
    .modal-title {
        font-family: 'Cinzel', serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--dark);
        letter-spacing: 1px;
    }
    .close-modal-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #888;
        transition: 0.2s;
    }
    .close-modal-btn:hover {
        color: #d32f2f;
    }
    .file-upload-section {
        border: 1px dashed rgba(0,0,0,0.15);
        background: rgba(0,0,0,0.01);
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: 0.3s;
    }
    .file-upload-section:hover {
        border-color: var(--gold);
        background: rgba(197, 160, 89, 0.02);
    }
    .file-preview-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        border: 1px solid #eee;
        padding: 8px 12px;
        border-radius: 6px;
        margin-top: 8px;
        font-size: 0.8rem;
    }
    .remove-file-btn {
        background: transparent;
        border: none;
        color: #d32f2f;
        cursor: pointer;
        font-size: 0.95rem;
    }

    /* ── Table mobile: horizontal scroll wrapper ── */
    .orders-table-wrap {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    .orders-table { min-width: 640px; }

    @media (max-width: 768px) {
        .orders-page { padding: 24px 4%; }
        .orders-title { font-size: 1.6rem; letter-spacing: 2px; }
        .orders-subtitle { font-size: 0.78rem; margin-bottom: 24px; }
        .glass-card { padding: 20px; margin-top: 14px; }
        .orders-table th { padding: 14px 10px; font-size: 0.75rem; letter-spacing: 1px; }
        .orders-table td { padding: 14px 10px; font-size: 0.82rem; }
        .modal-card { padding: 20px; }
    }
    @media (max-width: 480px) {
        .orders-title { font-size: 1.3rem; }
        .glass-card { padding: 14px; }
        .track-btn { padding: 7px 12px; font-size: 0.7rem; }
        .status-badge { padding: 5px 10px; font-size: 0.65rem; }
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
    
    // Support query states
    const [queryOrder, setQueryOrder] = useState(null);
    const [queryCategory, setQueryCategory] = useState('Product not yet received');
    const [queryDesc, setQueryDesc] = useState('');
    const [unboxingVideo, setUnboxingVideo] = useState(null);
    const [productPhotos, setProductPhotos] = useState([]);
    const [submittingQuery, setSubmittingQuery] = useState(false);

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

    const handleOpenQueryModal = (order) => {
        setQueryOrder(order);
        setQueryCategory('Product not yet received');
        setQueryDesc('');
        setUnboxingVideo(null);
        setProductPhotos([]);
    };

    const handleCloseQueryModal = () => {
        setQueryOrder(null);
    };

    const handleUploadQuery = async (e) => {
        e.preventDefault();
        if (!queryOrder) return;
        
        // Validation based on category
        if (queryCategory === 'Wrong item received' && !unboxingVideo) {
            showToast("Unboxing video is required for wrong item queries.", "warning");
            return;
        }
        if (queryCategory === 'Missing item(s) in order' && !unboxingVideo) {
            showToast("Unboxing video is required for missing items queries.", "warning");
            return;
        }
        if (queryCategory === 'Damaged/Broken product received') {
            if (!unboxingVideo) {
                showToast("Unboxing video is required for damaged product queries.", "warning");
                return;
            }
            if (productPhotos.length === 0) {
                showToast("Please upload at least one image showing the damage.", "warning");
                return;
            }
        }
        if (!queryDesc.trim()) {
            showToast("Please describe the issue in detail.", "warning");
            return;
        }

        setSubmittingQuery(true);
        try {
            let videoUrl = null;
            const photoUrls = [];
            const orderIdForPath = queryOrder.order_id || queryOrder.id;

            // Upload unboxing video if present
            if (unboxingVideo) {
                const videoPath = `tickets/evidence/${orderIdForPath}/${Date.now()}_video_${unboxingVideo.name}`;
                videoUrl = await uploadFile(unboxingVideo, videoPath);
            }

            // Upload product photos if present
            if (productPhotos.length > 0) {
                for (let i = 0; i < productPhotos.length; i++) {
                    const photo = productPhotos[i];
                    const photoPath = `tickets/evidence/${orderIdForPath}/${Date.now()}_photo_${i}_${photo.name}`;
                    const url = await uploadFile(photo, photoPath);
                    photoUrls.push(url);
                }
            }

            // Construct final ticket description text
            let finalDescription = queryDesc.trim();
            if (videoUrl || photoUrls.length > 0) {
                finalDescription += "\n\n--- EVIDENCE ATTACHED ---";
                if (videoUrl) {
                    finalDescription += `\nUnboxing Video: ${videoUrl}`;
                }
                if (photoUrls.length > 0) {
                    finalDescription += "\nProduct Photos:\n" + photoUrls.map(url => `- ${url}`).join('\n');
                }
            }

            // Submit ticket
            await apiFetch('/api/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    subject: `${queryCategory} - Order #${orderIdForPath.slice(0, 10).toUpperCase()}`,
                    category: queryCategory,
                    order_id: orderIdForPath,
                    description: finalDescription
                })
            });

            showToast("Query raised successfully! Live chat initiated.", "success");
            handleCloseQueryModal();
        } catch (err) {
            console.error("Error raising order query:", err);
            showToast("Failed to raise query. Please try again.", "error");
        } finally {
            setSubmittingQuery(false);
        }
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
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                                                        <button 
                                                            className="track-btn" 
                                                            style={{ background: '#333', border: 'none', color: '#fff' }} 
                                                            onClick={() => {
                                                                import('../../utils/invoiceGenerator').then(module => {
                                                                    module.generateInvoice({
                                                                        ...o,
                                                                        orderId: o.order_id || o.id.slice(0, 10).toUpperCase(),
                                                                        createdAt: o.created_at,
                                                                        customerName: o.customer_name,
                                                                        totalAmount: o.total_amount
                                                                    });
                                                                }).catch(err => {
                                                                    console.error("Failed to load invoice generator:", err);
                                                                    showToast("Failed to generate invoice.", "error");
                                                                });
                                                            }}
                                                        >
                                                            <i className="fas fa-file-invoice" style={{ marginRight: '4px' }}></i> Invoice
                                                        </button>
                                                        {o.status === 'completed' && (
                                                            <button 
                                                                className="track-btn" 
                                                                style={{ background: '#d32f2f', border: 'none', color: '#fff' }} 
                                                                onClick={() => handleOpenQueryModal(o)}
                                                            >
                                                                <i className="fas fa-question-circle" style={{ marginRight: '4px' }}></i> Raise Query
                                                            </button>
                                                        )}
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

            {/* Query Modal Overlay */}
            {queryOrder && (
                <div className="modal-overlay" onClick={handleCloseQueryModal}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">RAISE ORDER QUERY</h3>
                            <button className="close-modal-btn" onClick={handleCloseQueryModal}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUploadQuery} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ fontSize: '0.82rem', color: '#666', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '6px' }}>
                                <strong>Order ID:</strong> {queryOrder.order_id || queryOrder.id} <br />
                                <strong>Date:</strong> {formatDate(queryOrder.created_at)}
                            </div>

                            <div className="field-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark)' }}>Issue Category</label>
                                <select 
                                    className="field-select"
                                    value={queryCategory}
                                    onChange={e => setQueryCategory(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="Product not yet received">Product not yet received</option>
                                    <option value="Wrong item received">Wrong item received</option>
                                    <option value="Damaged/Broken product received">Damaged/Broken product received</option>
                                    <option value="Missing item(s) in order">Missing item(s) in order</option>
                                </select>
                            </div>

                            {/* Conditional Evidence Upload Section */}
                            {queryCategory !== 'Product not yet received' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', margin: '0 0 5px 0', color: 'var(--dark)', letterSpacing: '0.5px' }}>
                                        REQUIRED EVIDENCE
                                    </h4>
                                    
                                    {/* Unboxing Video Upload */}
                                    <div className="field-group">
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>
                                            Unboxing Video <span style={{ color: '#d32f2f' }}>*</span>
                                        </label>
                                        <div className="file-upload-section" onClick={() => document.getElementById('video-input').click()}>
                                            <i className="fas fa-video" style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '8px', display: 'block' }}></i>
                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                {unboxingVideo ? unboxingVideo.name : "Select or drag unboxing video here"}
                                            </span>
                                            <input 
                                                id="video-input"
                                                type="file"
                                                accept="video/*"
                                                onChange={e => setUnboxingVideo(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Product Photos Upload (Only for Damaged/Broken) */}
                                    {queryCategory === 'Damaged/Broken product received' && (
                                        <div className="field-group">
                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>
                                                Damage Photos <span style={{ color: '#d32f2f' }}>*</span>
                                            </label>
                                            <div className="file-upload-section" onClick={() => document.getElementById('photos-input').click()}>
                                                <i className="fas fa-camera" style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '8px', display: 'block' }}></i>
                                                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                    Upload photos showing the damage
                                                </span>
                                                <input 
                                                    id="photos-input"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={e => setProductPhotos(Array.from(e.target.files))}
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                            {productPhotos.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                                                    {productPhotos.map((f, idx) => (
                                                        <div key={idx} className="file-preview-item">
                                                            <span>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                            <button 
                                                                type="button" 
                                                                className="remove-file-btn"
                                                                onClick={() => setProductPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="field-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark)' }}>Elaborate the Issue</label>
                                <textarea 
                                    className="field-textarea"
                                    rows="4"
                                    placeholder="Describe what's wrong with the order..."
                                    value={queryDesc}
                                    onChange={e => setQueryDesc(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn" 
                                disabled={submittingQuery}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {submittingQuery ? (
                                    <>
                                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></div>
                                        Submitting Query...
                                    </>
                                ) : "SUBMIT QUERY"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default UserOrders;
