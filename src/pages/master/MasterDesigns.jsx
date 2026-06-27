import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';

/* ── Detail Drawer Styles ───────────────────────────────── */
const DRAWER_CSS = `
.dsn-drawer-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.72);
    z-index: 1200; display: flex; justify-content: flex-end;
    animation: fadeInOverlay 0.2s ease;
}
@keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
.dsn-drawer {
    width: min(780px, 95vw); height: 100vh; background: #111;
    overflow-y: auto; display: flex; flex-direction: column;
    border-left: 1px solid #2a2a2a;
    animation: slideInDrawer 0.25s cubic-bezier(.4,0,.2,1);
}
@keyframes slideInDrawer { from { transform: translateX(100%) } to { transform: translateX(0) } }
.dsn-drawer__header {
    position: sticky; top: 0; z-index: 10;
    background: #111; border-bottom: 1px solid #222;
    padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;
}
.dsn-drawer__close {
    background: none; border: none; color: #aaa; font-size: 1.4rem;
    cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: color 0.15s;
}
.dsn-drawer__close:hover { color: white; }
.dsn-drawer__body { padding: 24px; display: flex; flex-direction: column; gap: 28px; flex: 1; }
.dsn-drawer__section-title {
    font-size: 0.7rem; font-weight: 700; color: #555;
    text-transform: uppercase; letter-spacing: 1.5px;
    border-bottom: 1px solid #1e1e1e; padding-bottom: 8px; margin-bottom: 12px;
}
.dsn-drawer__img-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;
}
.dsn-drawer__img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 6px; border: 1px solid #2a2a2a;
    cursor: pointer; transition: transform 0.15s, border-color 0.15s;
}
.dsn-drawer__img:hover { transform: scale(1.03); border-color: var(--gold); }
.dsn-drawer__kv { display: flex; justify-content: space-between; align-items: flex-start;
    padding: 8px 0; border-bottom: 1px solid #1a1a1a; font-size: 0.85rem; }
.dsn-drawer__kv:last-child { border-bottom: none; }
.dsn-drawer__kv-key { color: #666; }
.dsn-drawer__kv-val { color: #ddd; font-weight: 600; text-align: right; max-width: 60%; }
.dsn-drawer__color-row {
    background: #1a1a1a; border: 1px solid #252525; border-radius: 8px;
    padding: 14px; display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-start;
}
.dsn-drawer__color-swatch {
    width: 22px; height: 22px; border-radius: 50%; border: 2px solid #333; flex-shrink: 0; margin-top: 2px;
}
.dsn-drawer__mockup-pair { display: flex; gap: 10px; flex-wrap: wrap; }
.dsn-drawer__mockup-img {
    width: 80px; height: 80px; object-fit: cover;
    border-radius: 6px; border: 1px solid #2a2a2a; cursor: pointer;
}
.dsn-drawer__actions {
    position: sticky; bottom: 0; background: #111;
    border-top: 1px solid #222; padding: 18px 24px;
    display: flex; gap: 12px; flex-wrap: wrap;
}
.dsn-drawer__btn {
    padding: 10px 20px; border-radius: 6px; border: none;
    font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
    font-family: 'Montserrat', sans-serif;
}
.dsn-drawer__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dsn-drawer__btn--approve { background: #1a7a3c; color: white; }
.dsn-drawer__btn--reject { background: #7a1a1a; color: white; }
.dsn-drawer__btn--revoke { background: #1a4a7a; color: white; }
.dsn-drawer__btn--delete { background: #5a1a1a; color: #ff8888; }
.dsn-drawer__btn--neutral { background: #2a2a2a; color: #ccc; }
.dsn-drawer__reject-input {
    flex: 1; min-width: 200px; padding: 10px 14px;
    background: #1a1a1a; border: 1px solid #333; border-radius: 6px;
    color: white; font-size: 0.82rem; font-family: 'Montserrat', sans-serif; outline: none;
}
.dsn-drawer__reject-input:focus { border-color: var(--gold); }
.dsn-drawer__status-badge {
    display: inline-block; padding: 4px 12px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
}
.dsn-drawer__lightbox {
    position: fixed; inset: 0; background: rgba(0,0,0,0.92);
    z-index: 1400; display: flex; justify-content: center; align-items: center;
    cursor: zoom-out;
}
.dsn-drawer__lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
`;

function DesignDrawer({ design, onClose, onAction, actionLoading, rejectComment, setRejectComment, tab }) {
    const { packingCost, operatingCost, applyMarkup } = useCurrency();
    const [lightboxImg, setLightboxImg] = useState(null);

    const d = design;

    // Parse description JSON
    let pricing = null;
    let designerNote = '';
    let colorMockups = {};
    let printingSelections = {};

    try {
        if (d.description && typeof d.description === 'string' && d.description.startsWith('{')) {
            const desc = JSON.parse(d.description);
            pricing = desc.pricing || null;
            designerNote = desc.designerNote || desc.designer_note || '';
            colorMockups = desc.colorMockups || {};
            printingSelections = desc.printingSelections || {};
        }
    } catch (e) {}

    const getImages = () => {
        if (Array.isArray(d.images)) return d.images;
        if (d.images) return [d.images];
        if (d.imageUrl) return [d.imageUrl];
        if (d.image) return [d.image];
        return [];
    };

    const statusColors = {
        pending: { bg: 'rgba(255,165,0,0.15)', color: '#ffaa00' },
        approved: { bg: 'rgba(30,200,80,0.15)', color: '#22cc55' },
        restricted: { bg: 'rgba(220,50,50,0.15)', color: '#ff5555' },
    };
    const sc = statusColors[d.status] || statusColors.pending;

    const bCost = pricing?.baseCost || 0;
    const pCost = pricing?.printingCost || 0;
    const dCost = pricing?.designerCost || 0;
    const oCost = operatingCost || 0;
    const pkCost = packingCost || 0;

    // d.price in DB = bCost + pCost + dCost (subtotal, before packing/operating/markup)
    // applyMarkup() adds oCost + pkCost internally then divides by (1 - markup%)
    const subtotal = bCost + pCost + dCost;
    const customerSellingPrice = Math.round(applyMarkup(subtotal));
    const markup = Math.max(0, customerSellingPrice - (subtotal + oCost + pkCost));

    const comment = rejectComment[d.id] || '';
    const isLoading = actionLoading[d.id];

    // Color mockup entries
    const colorMockupEntries = Object.entries(colorMockups);
    // Printing technique selections
    const techEntries = Object.entries(printingSelections);

    return (
        <>
            {lightboxImg && (
                <div className="dsn-drawer__lightbox" onClick={() => setLightboxImg(null)}>
                    <img src={lightboxImg} alt="Full view" />
                </div>
            )}
            <div className="dsn-drawer-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="dsn-drawer">
                    {/* Header */}
                    <div className="dsn-drawer__header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                                {d.title || 'Untitled Design'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#555' }}>ID: {d.id}</span>
                        </div>
                        <div style={{ display: 'flex', align: 'center', gap: 12 }}>
                            <span className="dsn-drawer__status-badge" style={{ background: sc.bg, color: sc.color }}>
                                {d.status || 'pending'}
                            </span>
                            <button className="dsn-drawer__close" onClick={onClose} title="Close">✕</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="dsn-drawer__body">

                        {/* Designer & Product Info */}
                        <div>
                            <div className="dsn-drawer__section-title">Design & Designer Info</div>
                            <div className="dsn-drawer__kv">
                                <span className="dsn-drawer__kv-key">Designer</span>
                                <span className="dsn-drawer__kv-val">@{d.designer_username || d.designerUsername || '—'}</span>
                            </div>
                            <div className="dsn-drawer__kv">
                                <span className="dsn-drawer__kv-key">Base Product</span>
                                <span className="dsn-drawer__kv-val">{d.base_product_id || '—'}</span>
                            </div>
                            <div className="dsn-drawer__kv">
                                <span className="dsn-drawer__kv-key">Gender</span>
                                <span className="dsn-drawer__kv-val" style={{ textTransform: 'capitalize' }}>{d.gender || '—'}</span>
                            </div>
                            <div className="dsn-drawer__kv">
                                <span className="dsn-drawer__kv-key">Sizes</span>
                                <span className="dsn-drawer__kv-val">
                                    {Array.isArray(d.sizes) && d.sizes.length > 0
                                        ? d.sizes.join(', ')
                                        : '—'}
                                </span>
                            </div>
                            <div className="dsn-drawer__kv">
                                <span className="dsn-drawer__kv-key">Submitted</span>
                                <span className="dsn-drawer__kv-val">{d.created_at ? new Date(d.created_at).toLocaleString('en-IN') : '—'}</span>
                            </div>
                            {designerNote && (
                                <div className="dsn-drawer__kv" style={{ flexDirection: 'column', gap: 6 }}>
                                    <span className="dsn-drawer__kv-key">Designer Note</span>
                                    <span style={{ color: '#bbb', fontSize: '0.82rem', lineHeight: 1.5 }}>{designerNote}</span>
                                </div>
                            )}
                            {d.rejection_reason && (
                                <div className="dsn-drawer__kv" style={{ flexDirection: 'column', gap: 6 }}>
                                    <span className="dsn-drawer__kv-key" style={{ color: '#ff6666' }}>Rejection Reason</span>
                                    <span style={{ color: '#ff9999', fontSize: '0.82rem' }}>{d.rejection_reason}</span>
                                </div>
                            )}
                        </div>

                        {/* Cover / Design Images */}
                        {getImages().length > 0 && (
                            <div>
                                <div className="dsn-drawer__section-title">Cover Image{getImages().length > 1 ? 's' : ''}</div>
                                <div className="dsn-drawer__img-grid">
                                    {getImages().map((img, i) => (
                                        <img key={i} src={img} alt={`Design ${i+1}`}
                                            className="dsn-drawer__img"
                                            onClick={() => setLightboxImg(img)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Mockups */}
                        {colorMockupEntries.length > 0 && (
                            <div>
                                <div className="dsn-drawer__section-title">Color Mockups</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {colorMockupEntries.map(([colorName, mockup]) => (
                                        <div key={colorName} className="dsn-drawer__color-row">
                                            <div className="dsn-drawer__color-swatch"
                                                style={{ background: colorName.toLowerCase() === 'white' ? '#f0f0f0' : colorName.toLowerCase() === 'black' ? '#111' : colorName }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ccc', marginBottom: 8, textTransform: 'capitalize' }}>
                                                    {colorName}
                                                </div>
                                                <div className="dsn-drawer__mockup-pair">
                                                    {mockup.front && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                            <img src={mockup.front} alt={`${colorName} front`}
                                                                className="dsn-drawer__mockup-img"
                                                                onClick={() => setLightboxImg(mockup.front)} />
                                                            <span style={{ fontSize: '0.65rem', color: '#555' }}>Front</span>
                                                        </div>
                                                    )}
                                                    {mockup.back && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                            <img src={mockup.back} alt={`${colorName} back`}
                                                                className="dsn-drawer__mockup-img"
                                                                onClick={() => setLightboxImg(mockup.back)} />
                                                            <span style={{ fontSize: '0.65rem', color: '#555' }}>Back</span>
                                                        </div>
                                                    )}
                                                    {/* Extra mockup images */}
                                                    {Array.isArray(mockup.images) && mockup.images.map((img, i) => (
                                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                            <img src={img} alt={`mockup ${i+1}`}
                                                                className="dsn-drawer__mockup-img"
                                                                onClick={() => setLightboxImg(img)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Printing / Placement Selections */}
                        {techEntries.length > 0 && (
                            <div>
                                <div className="dsn-drawer__section-title">Printing & Placement Selections</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {techEntries.map(([tech, placements]) => (
                                        <div key={tech} style={{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: 6, padding: '10px 14px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {tech}
                                            </span>
                                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {Array.isArray(placements) ? placements.map((p, i) => (
                                                    <div key={i} style={{ fontSize: '0.8rem', color: '#aaa', display: 'flex', gap: 8 }}>
                                                        <span>•</span>
                                                        <span>{typeof p === 'object' ? (p.label || p.id || JSON.stringify(p)) : p}</span>
                                                    </div>
                                                )) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                                        {typeof placements === 'object' ? JSON.stringify(placements) : String(placements)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Colors selected */}
                        {Array.isArray(d.colors) && d.colors.length > 0 && (
                            <div>
                                <div className="dsn-drawer__section-title">Selected Colors</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {d.colors.map((c, i) => {
                                        const cName = typeof c === 'object' ? (c.name || c.color || '') : c;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20 }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: cName.toLowerCase() === 'white' ? '#f0f0f0' : cName.toLowerCase() === 'black' ? '#111' : cName, border: '1px solid #444' }} />
                                                <span style={{ fontSize: '0.8rem', color: '#ccc', textTransform: 'capitalize' }}>{cName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pricing Breakdown */}
                        <div>
                            <div className="dsn-drawer__section-title">Pricing Breakdown</div>
                            {pricing ? (
                                <>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">Base Product Cost</span>
                                        <span className="dsn-drawer__kv-val">₹{bCost.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">Printing Cost</span>
                                        <span className="dsn-drawer__kv-val">₹{pCost.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">Designer Royalty</span>
                                        <span className="dsn-drawer__kv-val" style={{ color: 'var(--gold)' }}>₹{dCost.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv" style={{ borderBottom: '1px dashed #222', paddingBottom: 8, marginBottom: 2 }}>
                                        <span className="dsn-drawer__kv-key" style={{ fontStyle: 'italic' }}>Subtotal</span>
                                        <span className="dsn-drawer__kv-val">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">Operating Cost</span>
                                        <span className="dsn-drawer__kv-val">₹{oCost.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">Packing Cost</span>
                                        <span className="dsn-drawer__kv-val">₹{pkCost.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv">
                                        <span className="dsn-drawer__kv-key">ASAT Markup</span>
                                        <span className="dsn-drawer__kv-val" style={{ color: '#C5A059' }}>₹{markup.toLocaleString()}</span>
                                    </div>
                                    <div className="dsn-drawer__kv" style={{ borderTop: '2px solid #2a2a2a', paddingTop: 10, marginTop: 4 }}>
                                        <span style={{ color: 'white', fontWeight: 700 }}>Customer Selling Price</span>
                                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>₹{customerSellingPrice.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="dsn-drawer__kv">
                                    <span className="dsn-drawer__kv-key">Stored Price</span>
                                    <span className="dsn-drawer__kv-val" style={{ color: 'white', fontWeight: 700 }}>₹{(d.price || 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Actions */}
                    <div className="dsn-drawer__actions">
                        {(tab === 'pending' || tab === 'restricted') && (
                            <input
                                type="text"
                                className="dsn-drawer__reject-input"
                                placeholder="Rejection / restriction reason..."
                                value={comment}
                                onChange={e => setRejectComment(prev => ({ ...prev, [d.id]: e.target.value }))}
                            />
                        )}

                        {tab === 'pending' && (
                            <>
                                <button className="dsn-drawer__btn dsn-drawer__btn--approve"
                                    disabled={isLoading} onClick={() => onAction('approve', d)}>
                                    {isLoading ? '...' : '✓ Approve'}
                                </button>
                                <button className="dsn-drawer__btn dsn-drawer__btn--reject"
                                    disabled={isLoading} onClick={() => onAction('reject', d)}>
                                    {isLoading ? '...' : '✕ Reject'}
                                </button>
                            </>
                        )}
                        {tab === 'approved' && (
                            <button className="dsn-drawer__btn dsn-drawer__btn--reject"
                                disabled={isLoading} onClick={() => onAction('restrict', d)}>
                                {isLoading ? '...' : '⊘ Restrict'}
                            </button>
                        )}
                        {tab === 'restricted' && (
                            <>
                                <button className="dsn-drawer__btn dsn-drawer__btn--revoke"
                                    disabled={isLoading} onClick={() => onAction('revoke', d)}>
                                    {isLoading ? '...' : '↩ Revoke Restriction'}
                                </button>
                                <button className="dsn-drawer__btn dsn-drawer__btn--delete"
                                    disabled={isLoading} onClick={() => onAction('delete', d)}>
                                    {isLoading ? '...' : '🗑 Delete'}
                                </button>
                            </>
                        )}
                        <button className="dsn-drawer__btn dsn-drawer__btn--neutral" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════════ */
function MasterDesigns() {
    const [tab, setTab] = useState('pending');
    const [allDesigns, setAllDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectComment, setRejectComment] = useState({});
    const [actionLoading, setActionLoading] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDesign, setSelectedDesign] = useState(null);
    const { toasts, showToast } = useToast();

    const fetchDesigns = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/api/designs/all');
            setAllDesigns(data || []);
        } catch (err) {
            console.error('Error fetching designs:', err);
            setError('Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDesigns(); }, [fetchDesigns]);

    const handleAction = async (action, d) => {
        const comment = rejectComment[d.id] || '';

        if ((action === 'reject' || action === 'restrict') && !comment.trim()) {
            showToast('Please enter a reason in the rejection field first.', 'warning');
            return;
        }
        if (action === 'delete' && !window.confirm('Permanently delete this design? This cannot be undone.')) return;

        try {
            setActionLoading(prev => ({ ...prev, [d.id]: true }));

            if (action === 'approve' || action === 'revoke') {
                await apiFetch(`/api/designs/${d.id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'approved' })
                });
                showToast(action === 'revoke' ? 'Restriction revoked — design is now published.' : 'Design approved and published.', 'success');
            } else if (action === 'reject' || action === 'restrict') {
                await apiFetch(`/api/designs/${d.id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'restricted', rejection_reason: comment })
                });
                showToast('Design restricted.', 'success');
                setRejectComment(prev => ({ ...prev, [d.id]: '' }));
            } else if (action === 'delete') {
                await apiFetch(`/api/designs/${d.id}`, { method: 'DELETE' });
                showToast('Design deleted permanently.', 'success');
                setSelectedDesign(null);
            }

            await fetchDesigns();
            // Keep drawer open but refresh its data
            if (action !== 'delete') {
                setSelectedDesign(prev => prev?.id === d.id ? { ...prev, status: action === 'approve' || action === 'revoke' ? 'approved' : 'restricted' } : prev);
            }
        } catch (err) {
            console.error('Error:', err);
            showToast('Action failed: ' + (err.error || err.message), 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [d.id]: false }));
        }
    };

    const getImages = (d) => {
        if (Array.isArray(d.images)) return d.images;
        if (d.images) return [d.images];
        if (d.imageUrl) return [d.imageUrl];
        if (d.image) return [d.image];
        return [];
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'approved' || s === 'active') return 'active';
        if (s === 'pending') return 'pending';
        if (s === 'restricted' || s === 'rejected') return 'danger';
        return 'info';
    };

    const designs = allDesigns.filter(d => {
        if (tab === 'pending' && d.status !== 'pending') return false;
        if (tab === 'restricted' && d.status !== 'restricted') return false;
        if (tab === 'approved' && d.status !== 'approved') return false;
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            return (
                (d.id || '').toLowerCase().includes(q) ||
                (d.title || '').toLowerCase().includes(q) ||
                (d.designer_username || '').toLowerCase().includes(q) ||
                (d.designer_id || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}{DRAWER_CSS}</style>
            <ToastContainer toasts={toasts} />

            {selectedDesign && (
                <DesignDrawer
                    design={selectedDesign}
                    tab={tab}
                    onClose={() => setSelectedDesign(null)}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                    rejectComment={rejectComment}
                    setRejectComment={setRejectComment}
                />
            )}

            <BackButton />
            <h1 className="adm-page__title">DESIGNS</h1>
            <p className="adm-page__subtitle">Approve, reject, or restrict designer submissions</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div className="adm-page__filters" style={{ margin: 0 }}>
                    {[['pending', 'Pending Approvals'], ['approved', 'Published'], ['restricted', 'Restricted']].map(([key, label]) => (
                        <button key={key}
                            className={`adm-page__filter-btn ${tab === key ? 'adm-page__filter-btn--active' : ''}`}
                            onClick={() => { setTab(key); setSelectedDesign(null); }}>
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="Search designs..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 35px 10px 15px', background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', width: '280px', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }} />
                </div>
            </div>

            {loading ? (
                <div className="adm-loading"><div className="adm-spinner" /><p>Loading submissions...</p></div>
            ) : error ? (
                <div className="adm-error-alert"><i className="fas fa-exclamation-triangle" /> {error}</div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Title</th>
                                <th>Designer</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {designs.length === 0 ? (
                                <tr><td colSpan={7} className="adm-table__empty"><i className="fas fa-palette" />No {tab} designs found.</td></tr>
                            ) : designs.map(d => (
                                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDesign(d)}>
                                    <td>
                                        {getImages(d)[0] ? (
                                            <div style={{ width: 48, height: 48, background: `url(${getImages(d)[0]}) center/cover`, borderRadius: 6, border: '1px solid #2a2a2a' }} />
                                        ) : (
                                            <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="fas fa-image" style={{ color: '#444' }} />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'white' }}>{d.title || '—'}</td>
                                    <td style={{ color: '#aaa' }}>@{d.designer_username || d.designer || '—'}</td>
                                    <td style={{ fontWeight: 700 }}>₹{(d.price || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`adm-badge adm-badge--${getStatusType(d.status)}`}>
                                            {d.status || 'pending'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#666', fontSize: '0.78rem' }}>
                                        {d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td>
                                        <button
                                            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
                                            onClick={e => { e.stopPropagation(); setSelectedDesign(d); }}>
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default MasterDesigns;
