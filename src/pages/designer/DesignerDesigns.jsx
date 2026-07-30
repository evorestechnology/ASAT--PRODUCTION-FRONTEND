import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
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

const resolveColorHex = (c) => {
    if (!c) return '#121212';
    if (typeof c === 'object' && c !== null) {
        const hex = c.color || c.colorHex || c.hex || c.color_hex;
        if (hex && typeof hex === 'string' && hex.startsWith('#')) return hex;
        const name = (c.colorName || c.name || '').toString().trim().toLowerCase();
        if (COLOR_NAME_TO_HEX[name]) return COLOR_NAME_TO_HEX[name];
        if (name && !name.includes(' ')) return name;
        return '#121212';
    }
    const str = String(c).trim();
    if (str.startsWith('#')) return str;
    const lower = str.toLowerCase();
    if (COLOR_NAME_TO_HEX[lower]) return COLOR_NAME_TO_HEX[lower];
    if (lower && !lower.includes(' ')) return lower;
    return '#121212';
};

function DesignerDesigns() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editModalData, setEditModalData] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDesigns = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/designs/mine');

            const list = (data || []).map(d => {
                // Map database columns to UI properties
                const imageUrl = (Array.isArray(d.images) && d.images[0]?.frontImage) || 
                                 (Array.isArray(d.images) && d.images[0]) || 
                                 d.images || '';
                let isHidden = false;
                try {
                    if (d.description && typeof d.description === 'string' && d.description.startsWith('{')) {
                        isHidden = JSON.parse(d.description).isHidden || false;
                    }
                } catch(e) {}

                const pDetails = d.products?.details || [];
                const isProductUnavailable = d.products ? (d.products.available === false || pDetails.includes('__DELETED__')) : false;

                return {
                    id: d.id,
                    name: d.title || 'Untitled Design',
                    price: Number(d.price) || 0,
                    status: d.status || 'pending', // 'pending' | 'approved' | 'restricted'
                    image: imageUrl,
                    colors: d.colors || [],
                    product: d.collection || 'Garment',
                    restrictionComment: d.rejection_reason || '',
                    descriptionRaw: d.description,
                    isHidden,
                    isProductUnavailable
                };
            });
            setDesigns(list);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching designs:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchDesigns();
    }, [user]);

    const statusClass = (s) => {
        const status = s.toLowerCase();
        if (status === 'approved' || status === 'live' || status === 'active') return 'dsn-design-status--live';
        if (status === 'restricted' || status === 'rejected') return 'dsn-design-status--draft';
        return 'dsn-design-status--review';
    };

    const formatStatusLabel = (s) => {
        const status = s.toLowerCase();
        if (status === 'approved' || status === 'active' || status === 'live') return 'Live';
        if (status === 'restricted') return 'Restricted';
        return 'In Review';
    };

    const handleDelete = async (id) => {
        try {
            await apiFetch(`/api/designs/${id}`, { method: 'DELETE' });
            setDeleteConfirm(null);
            showToast("Design deleted successfully.", 'success');
            fetchDesigns();
        } catch (err) {
            console.error("Error deleting design:", err);
            showToast("Could not delete design. Please try again.", 'error');
        }
    };

    const handleEditClick = (design) => {
        let descText = design.descriptionRaw || '';
        let additionalImagesStr = '';
        let descObj = {};

        if (descText && typeof descText === 'string' && descText.startsWith('{')) {
            try {
                descObj = JSON.parse(descText);
                descText = descObj.text || '';
                if (descObj.additionalImages && Array.isArray(descObj.additionalImages)) {
                    additionalImagesStr = descObj.additionalImages.join('\n');
                }
            } catch (e) {
                // Not JSON or parse error, treat as raw text
            }
        }

        setEditModalData({
            id: design.id,
            title: design.name,
            designerCost: descObj.pricing?.designerCost !== undefined ? descObj.pricing.designerCost : design.price,
            baseCost: descObj.pricing?.baseCost || 0,
            printingCost: descObj.pricing?.printingCost || 0,
            markup: descObj.pricing?.markup || 0,
            text: descText,
            additionalImagesStr: additionalImagesStr,
            isHidden: design.isHidden,
            rawDescObj: descObj
        });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setEditSaving(true);
        try {
            const newPricing = {
                baseCost: editModalData.baseCost,
                printingCost: editModalData.printingCost,
                designerCost: parseFloat(editModalData.designerCost) || 0,
                markup: editModalData.markup
            };
            const calculatedPrice = newPricing.baseCost + newPricing.printingCost + newPricing.designerCost + newPricing.markup;

            // Re-build description JSON
            const newDescObj = {
                ...editModalData.rawDescObj,
                text: editModalData.text,
                isHidden: editModalData.isHidden,
                pricing: newPricing,
                additionalImages: editModalData.additionalImagesStr.split('\n').map(u => u.trim()).filter(Boolean)
            };

            const payload = {
                title: editModalData.title,
                price: calculatedPrice,
                description: JSON.stringify(newDescObj)
            };

            await apiFetch(`/api/designs/${editModalData.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            showToast("Design updated successfully.", 'success');
            setEditModalData(null);
            fetchDesigns();
        } catch (err) {
            console.error("Error updating design:", err);
            showToast("Failed to update design. Please try again.", 'error');
        } finally {
            setEditSaving(false);
        }
    };

    const filteredDesigns = designs.filter(d => {
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            return (
                (d.name || '').toLowerCase().includes(q) ||
                (d.product || '').toLowerCase().includes(q) ||
                (d.id || '').toLowerCase().includes(q) ||
                (d.status || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <main className="dsn-designs">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />
            <div className="dsn-page-head" style={{ marginBottom: '20px' }}>
                <h2 className="dsn-page-title">Your Designs</h2>
                <button className="dsn-auth__btn" onClick={() => navigate('/designer/designs/upload')}>
                    <i className="fas fa-plus"></i><span>Upload New Design</span>
                </button>
            </div>

            {/* Search Bar */}
            {designs.length > 0 && (
                <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search portfolio..."
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="dsn-spinner" style={{ margin: '0 auto 15px' }} />
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', color: '#666' }}>Fetching your designs portfolio...</p>
                </div>
            ) : designs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#bbb' }}>
                    <i className="fas fa-palette" style={{ fontSize: '3rem', marginBottom: 16, display: 'block', color: '#ddd' }}></i>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: '#999', marginBottom: 8 }}>No designs yet</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem' }}>Upload your first design to start earning royalties</p>
                </div>
            ) : filteredDesigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
                    <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', color: '#666' }}></i>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem' }}>No designs matched your search.</p>
                </div>
            ) : (
                <div className="dsn-designs__grid">
                    {filteredDesigns.map(d => (
                        <div className="dsn-design-card" key={d.id}>
                            <div 
                                className="dsn-design-card__img" 
                                style={{ backgroundImage: `url(${d.image || 'https://via.placeholder.com/300x400?text=No+Image'})` }}
                            >
                                <span className={`dsn-design-card__status ${statusClass(d.status)}`}>
                                    {formatStatusLabel(d.status)}
                                </span>
                                {d.isHidden && (
                                    <span className="dsn-design-card__status" style={{ background: '#333', color: '#fff', marginLeft: '6px' }}>
                                        Hidden
                                    </span>
                                )}
                                {d.isProductUnavailable && (
                                    <span className="dsn-design-card__status" style={{ background: '#ff4d4d', color: '#fff', marginLeft: '6px' }}>
                                        Product Unavailable
                                    </span>
                                )}
                            </div>
                            <div className="dsn-design-card__body">
                                <span className="dsn-design-card__type">{d.product}</span>
                                <h4 className="dsn-design-card__name">{d.name}</h4>
                                
                                {d.status.toLowerCase() === 'restricted' && d.restrictionComment && (
                                    <div style={{ fontSize: '0.72rem', color: '#d32f2f', margin: '4px 0 10px', background: '#ffebee', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #d32f2f' }}>
                                        <strong>Reason:</strong> {d.restrictionComment}
                                    </div>
                                )}

                                <div className="dsn-design-card__row">
                                     <div className="dsn-design-card__colors">
                                         {(d.colors || []).map((c, i) => {
                                             const hex = resolveColorHex(c);
                                             const name = typeof c === 'object' ? (c.colorName || c.name || '') : c;
                                             return (
                                                 <span 
                                                     key={i} 
                                                     className="dsn-design-card__swatch" 
                                                     title={name}
                                                     style={{ 
                                                         background: hex,
                                                         border: '1px solid rgba(0,0,0,0.25)',
                                                         boxShadow: '0 0 2px rgba(0,0,0,0.15)'
                                                     }}
                                                 />
                                             );
                                         })}
                                     </div>
                                    <span className="dsn-design-card__price">₹{d.price?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="dsn-design-card__actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        className="dsn-design-card__action"
                                        onClick={() => navigate('/designer/designs/' + d.id)}
                                        style={{ width: '100%', background: 'linear-gradient(135deg,#1a1a0a,#2a2500)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.3)' }}
                                    >
                                        <i className="fas fa-expand-alt"></i> View Details
                                    </button>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="dsn-design-card__action"
                                            onClick={() => handleEditClick(d)}
                                            style={{ flex: 1, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}
                                        >
                                            <i className="fas fa-edit"></i> Edit
                                        </button>
                                        <button
                                            className="dsn-design-card__action dsn-design-card__action--danger"
                                            onClick={() => setDeleteConfirm(d.id)}
                                            style={{ flex: 1 }}
                                        >
                                            <i className="fas fa-trash-alt"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteConfirm && (
                <div className="dsn-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="dsn-modal" onClick={e => e.stopPropagation()}>
                        <h3>Delete Design?</h3>
                        <p>This action cannot be undone. All associated data will be permanently removed.</p>
                        <div className="dsn-modal__actions">
                            <button className="dsn-modal__cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="dsn-auth__btn dsn-auth__btn--danger" onClick={() => handleDelete(deleteConfirm)}><span>Delete</span></button>
                        </div>
                    </div>
                </div>
            )}

            {editModalData && (
                <div className="dsn-modal-overlay" onClick={() => !editSaving && setEditModalData(null)}>
                    <div
                        className="dsn-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: 520, maxWidth: '94vw', padding: 0,
                            borderRadius: 18, overflow: 'hidden', border: 'none',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(180,140,60,0.18)',
                            background: '#fff',
                        }}
                    >
                        {/* ── Dark Header ─────────────────────────────────────── */}
                        <div style={{
                            background: 'linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)',
                            padding: '22px 28px 18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 11,
                                    background: 'linear-gradient(135deg,#c9a84c,#f0d080)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <i className="fas fa-pen" style={{ color: '#1a1a1a', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700, letterSpacing: 0.4 }}>Edit Design</h3>
                                    <p style={{ margin: 0, color: '#999', fontSize: '0.7rem', marginTop: 2 }}>Update your design details below</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => !editSaving && setEditModalData(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.13)',
                                    color: '#ccc', width: 32, height: 32, borderRadius: 8,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.78rem', flexShrink: 0,
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* ── Form Body ───────────────────────────────────────── */}
                        <form onSubmit={handleEditSave} style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Title */}
                            <div>
                                <label style={{
                                    display: 'block', fontSize: '0.66rem', fontWeight: 700,
                                    letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 7,
                                }}>Design Title</label>
                                <input
                                    type="text"
                                    value={editModalData.title}
                                    onChange={e => setEditModalData({ ...editModalData, title: e.target.value })}
                                    required
                                    style={{
                                        width: '100%', padding: '11px 14px', fontSize: '0.93rem',
                                        border: '1.5px solid #e8e8e8', borderRadius: 10, outline: 'none',
                                        background: '#fafafa', color: '#1a1a1a', fontWeight: 500,
                                        boxSizing: 'border-box', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                    onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                                />
                            </div>

                            {/* Pricing Card */}
                            <div style={{
                                background: 'linear-gradient(135deg,#fffdf5 0%,#fdf8e8 100%)',
                                border: '1.5px solid #f0e4b0', borderRadius: 12, padding: '18px 20px',
                            }}>
                                <label style={{
                                    display: 'block', fontSize: '0.66rem', fontWeight: 700,
                                    letterSpacing: '1px', textTransform: 'uppercase', color: '#b8922a', marginBottom: 10,
                                }}>
                                    <i className="fas fa-rupee-sign" style={{ marginRight: 5 }} />
                                    Your Royalty / Cost
                                </label>
                                <input
                                    type="number"
                                    step="1" min="0"
                                    value={editModalData.designerCost}
                                    onChange={e => setEditModalData({ ...editModalData, designerCost: e.target.value })}
                                    required
                                    style={{
                                        width: '100%', padding: '11px 14px', fontSize: '1rem',
                                        border: '1.5px solid #e0cc80', borderRadius: 9, outline: 'none',
                                        background: '#fff', color: '#1a1a1a', fontWeight: 600,
                                        boxSizing: 'border-box', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                    onBlur={e => e.target.style.borderColor = '#e0cc80'}
                                />

                                {/* Breakdown */}
                                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                        <span>Base Product Cost</span>
                                        <span style={{ fontWeight: 600, color: '#555' }}>₹{editModalData.baseCost.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                        <span>Printing Cost</span>
                                        <span style={{ fontWeight: 600, color: '#555' }}>₹{editModalData.printingCost.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#c9a84c' }}>
                                        <span>Your Royalty</span>
                                        <span style={{ fontWeight: 600 }}>₹{(parseFloat(editModalData.designerCost) || 0).toLocaleString()}</span>
                                    </div>
                                    <div style={{
                                        borderTop: '1.5px dashed #e0cc80', marginTop: 4, paddingTop: 10,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>Customer Pays</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#b8922a' }}>
                                            ₹{(
                                                editModalData.baseCost +
                                                editModalData.printingCost +
                                                (parseFloat(editModalData.designerCost) || 0)
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{
                                    display: 'block', fontSize: '0.66rem', fontWeight: 700,
                                    letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 7,
                                }}>Description / Details</label>
                                <textarea
                                    value={editModalData.text}
                                    onChange={e => setEditModalData({ ...editModalData, text: e.target.value })}
                                    rows="3"
                                    style={{
                                        width: '100%', padding: '11px 14px', fontSize: '0.88rem',
                                        border: '1.5px solid #e8e8e8', borderRadius: 10, outline: 'none',
                                        background: '#fafafa', color: '#333', resize: 'vertical',
                                        fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                    onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                                />
                            </div>

                            {/* Hide Toggle */}
                            <label
                                htmlFor="hideDesign"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                    padding: '12px 16px', borderRadius: 10,
                                    background: editModalData.isHidden ? '#fff8f0' : '#f8f8f8',
                                    border: `1.5px solid ${editModalData.isHidden ? '#f0c080' : '#ececec'}`,
                                    transition: 'all 0.2s',
                                }}>
                                <input
                                    type="checkbox"
                                    id="hideDesign"
                                    checked={editModalData.isHidden}
                                    onChange={e => setEditModalData({ ...editModalData, isHidden: e.target.checked })}
                                    style={{ display: 'none' }}
                                />
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                    background: editModalData.isHidden ? 'linear-gradient(135deg,#c9a84c,#f0d080)' : '#fff',
                                    border: `2px solid ${editModalData.isHidden ? '#c9a84c' : '#ccc'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}>
                                    {editModalData.isHidden && <i className="fas fa-check" style={{ fontSize: '0.55rem', color: '#1a1a1a' }} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>Hide from public storefront</div>
                                    <div style={{ fontSize: '0.72rem', color: '#999', marginTop: 1 }}>Customers won't see this design until you re-enable it</div>
                                </div>
                            </label>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                <button
                                    type="button"
                                    onClick={() => setEditModalData(null)}
                                    disabled={editSaving}
                                    style={{
                                        flex: 1, padding: '12px', fontSize: '0.88rem', fontWeight: 600,
                                        border: '1.5px solid #e0e0e0', borderRadius: 10, background: '#fff',
                                        color: '#555', cursor: editSaving ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    style={{
                                        flex: 2, padding: '12px', fontSize: '0.88rem', fontWeight: 700,
                                        border: 'none', borderRadius: 10,
                                        background: editSaving ? '#e0e0e0' : 'linear-gradient(135deg,#c9a84c 0%,#f0d080 50%,#c9a84c 100%)',
                                        color: editSaving ? '#aaa' : '#1a1a1a',
                                        cursor: editSaving ? 'not-allowed' : 'pointer',
                                        letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {editSaving
                                        ? <><i className="fas fa-circle-notch fa-spin" /> Saving…</>
                                        : <><i className="fas fa-check" /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default DesignerDesigns;
