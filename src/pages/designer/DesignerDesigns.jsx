import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

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
                    isHidden
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
                                        {(d.colors || []).map((c, i) => <span key={i} className="dsn-design-card__swatch" style={{ background: c }}></span>)}
                                    </div>
                                    <span className="dsn-design-card__price">₹{d.price?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="dsn-design-card__actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                    <button 
                                        className="dsn-design-card__action" 
                                        onClick={() => handleEditClick(d)}
                                        style={{ width: '50%', background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}
                                    >
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                    <button 
                                        className="dsn-design-card__action dsn-design-card__action--danger" 
                                        onClick={() => setDeleteConfirm(d.id)}
                                        style={{ width: '50%' }}
                                    >
                                        <i className="fas fa-trash-alt"></i> Delete
                                    </button>
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
                    <div className="dsn-modal" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Edit Design</h3>
                        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                                <input 
                                    type="text" 
                                    className="dsn-auth__input" 
                                    value={editModalData.title} 
                                    onChange={e => setEditModalData({...editModalData, title: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '6px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Designer Royalty / Cost (₹)</label>
                                <input 
                                    type="number" 
                                    step="1"
                                    min="0"
                                    className="dsn-auth__input" 
                                    style={{ background: 'white' }}
                                    value={editModalData.designerCost} 
                                    onChange={e => setEditModalData({...editModalData, designerCost: e.target.value})} 
                                    required 
                                />
                                <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Base Product Cost:</span>
                                        <span>₹{editModalData.baseCost.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Printing Cost:</span>
                                        <span>₹{editModalData.printingCost.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Markup (0%):</span>
                                        <span>₹{editModalData.markup}</span>
                                    </div>
                                    <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                        <span>Final Retail Price:</span>
                                        <span>₹{(
                                            editModalData.baseCost + 
                                            editModalData.printingCost + 
                                            (parseFloat(editModalData.designerCost) || 0) + 
                                            editModalData.markup
                                        ).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Description / Details</label>
                                <textarea 
                                    className="dsn-auth__input" 
                                    value={editModalData.text} 
                                    onChange={e => setEditModalData({...editModalData, text: e.target.value})} 
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Additional Image URLs (One per line)</label>
                                <textarea 
                                    className="dsn-auth__input" 
                                    value={editModalData.additionalImagesStr} 
                                    onChange={e => setEditModalData({...editModalData, additionalImagesStr: e.target.value})} 
                                    rows="3"
                                    placeholder="https://example.com/image1.png"
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                                <input 
                                    type="checkbox" 
                                    id="hideDesign"
                                    checked={editModalData.isHidden} 
                                    onChange={e => setEditModalData({...editModalData, isHidden: e.target.checked})} 
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="hideDesign" style={{ fontSize: '0.9rem', cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>
                                    Hide this design from the public storefront
                                </label>
                            </div>
                            
                            <div className="dsn-modal__actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="dsn-modal__cancel" onClick={() => setEditModalData(null)} disabled={editSaving}>Cancel</button>
                                <button type="submit" className="dsn-auth__btn" disabled={editSaving}>
                                    <span>{editSaving ? 'Saving...' : 'Save Changes'}</span>
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
