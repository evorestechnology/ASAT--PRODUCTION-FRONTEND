import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PLACEMENT MATRIX (matching MfgProducts PLACEMENT_MATRIX)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const PLACEMENT_MATRIX = {
    DTF: {
        "Tshirt Front": ["pocket", "a6", "a4", "a3", "14x16", "16x20"],
        "Tshirt Back":  ["a6", "a4", "a3", "14x16", "16x20"],
        "Pant Front":   ["right", "left", "right upper", "right lower", "left upper", "left lower"],
        "Pant Back":    ["right", "left", "right upper", "right lower", "left upper", "left lower"],
    },
    DTG: {
        "Tshirt Front": ["pocket", "a6", "a4", "a3", "14x16", "16x20"],
        "Tshirt Back":  ["a6", "a4", "a3", "14x16", "16x20"],
        "Pant Front":   ["right", "left", "right upper", "right lower", "left upper", "left lower"],
        "Pant Back":    ["right", "left", "right upper", "right lower", "left upper", "left lower"],
    },
    Embroidery: {
        "Tshirt Front": ["a6"],
        "Tshirt Back":  ["a6"],
        "Pant Front":   ["right upper", "left upper"],
        "Pant Back":    ["right upper", "left upper"],
    },
};

const PRINT_TYPES = ["DTF", "DTG", "Embroidery"];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SUMMARY CARD â€” compact view in the list
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StyleSummaryCard({ ps, idx, onEdit, onRemove }) {
    return (
        <div style={{
            background: '#1c1c1c',
            border: '1px solid #333',
            borderLeft: '4px solid white',
            borderRadius: 6,
            display: 'flex', alignItems: 'stretch',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            {/* Index strip */}
            <div style={{ width: 40, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'black', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>#{idx + 1}</span>
            </div>

            {/* Reference image */}
            {ps.imageUrl && (
                <div style={{ width: 72, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={ps.imageUrl} alt={ps.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                        onClick={() => window.open(ps.imageUrl, '_blank')} title="View reference image" />
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ps.name || 'Unnamed Method'}
                    </span>
                    <span style={{ flexShrink: 0, padding: '3px 8px', background: '#2c2c2c', border: '1px solid #444', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>
                        {ps.category || 'DTF'}
                    </span>
                </div>

                {/* Placement categories summary */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    {(ps.placementCategories || []).map((cat, i) => (
                        <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 20,
                            background: '#2c2c2c', border: '1px solid #444',
                            fontSize: '0.65rem', fontWeight: 700, color: '#ccc',
                        }}>
                            <i className="fas fa-map-marker-alt" style={{ fontSize: '0.55rem', color: 'white' }} />
                            {cat.category} ({cat.count})
                        </span>
                    ))}
                    {(!ps.placementCategories || ps.placementCategories.length === 0) && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#2c2c2c', fontSize: '0.65rem', color: '#555', fontStyle: 'italic' }}>
                            No placements configured
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '12px 14px', borderLeft: '1px solid #333', flexShrink: 0 }}>
                <button type="button" onClick={onEdit}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#2c2c2c', color: 'white', border: '1px solid #444', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'black'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2c2c2c'; e.currentTarget.style.color = 'white'; }}>
                    <i className="fas fa-pencil-alt" /> Edit
                </button>
                <button type="button" onClick={onRemove}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'none', color: '#dc3545', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#dc3545'; }}>
                    <i className="fas fa-trash-alt" /> Remove
                </button>
            </div>
        </div>
    );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ADD / EDIT MODAL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PrintStyleModal({ editingStyle, dbCategories = [], onSave, onClose, uploadFile: uploadFileFn, userId }) {
    const [name, setName] = useState(editingStyle?.name || '');
    const [category, setCategory] = useState(editingStyle?.category || '');
    const [cost, setCost] = useState(editingStyle?.cost !== undefined ? String(editingStyle.cost) : '');
    const [placementCategories, setPlacementCategories] = useState(editingStyle?.placementCategories || []); 
    // [{ category: 'Tshirt Front', placements: {pocket: {imageFile, imagePreview, price, darkPrice, lightPrice}} }]
    const [expandedCat, setExpandedCat] = useState(null);
    const [expandedOpt, setExpandedOpt] = useState(null);
    const [imageUrl, setImageUrl] = useState(editingStyle?.imageUrl || '');
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    const availableCategories = category ? Object.keys(PLACEMENT_MATRIX[category] || {}) : [];

    const allCategorySuggestions = React.useMemo(() => {
        const set = new Set();
        // 1. Presets from PLACEMENT_MATRIX for selected type
        if (category) {
            const matrixCats = Object.keys(PLACEMENT_MATRIX[category] || PLACEMENT_MATRIX[category.toUpperCase()] || {});
            matrixCats.forEach(c => set.add(c));
        }
        // 2. Categories from DB categories table
        dbCategories.forEach(c => {
            if (c.name) set.add(c.name);
        });
        return Array.from(set);
    }, [category, dbCategories]);

    const handleAddCategory = (cat) => {
        if (placementCategories.find(pc => pc.category === cat)) return;
        const options = {};
        const matrixOpts = PLACEMENT_MATRIX[category]?.[cat] || PLACEMENT_MATRIX[category.toUpperCase()]?.[cat] || [];
        matrixOpts.forEach(opt => {
            options[opt] = { imageFile: null, imagePreview: '', price: '', darkPrice: '', lightPrice: '' };
        });
        setPlacementCategories(prev => [...prev, { category: cat, placements: options }]);
        setExpandedCat(cat);
    };

    const handleRemoveCat = (cat) => {
        setPlacementCategories(prev => prev.filter(pc => pc.category !== cat));
        if (expandedCat === cat) setExpandedCat(null);
    };

    const updateOption = (cat, optName, field, value) => {
        setPlacementCategories(prev => prev.map(pc => {
            if (pc.category !== cat) return pc;
            return {
                ...pc,
                placements: {
                    ...pc.placements,
                    [optName]: { ...pc.placements[optName], [field]: value }
                }
            };
        }));
    };

    const isOptionValid = (opt) => {
        const hasImage = opt.imageFile || opt.imagePreview;
        if (!hasImage) return false;
        if (category === 'DTG') return opt.darkPrice !== '' && opt.lightPrice !== '';
        return opt.price !== '';
    };

    const handleSaveImage = async () => {
        if (!imageFile) return imageUrl;
        setUploading(true);
        try {
            const ext = imageFile.name.split('.').pop() || 'jpg';
            const filePath = `mfgPrintStyles/${userId}/${Date.now()}_ref.${ext}`;
            const url = await uploadFileFn(imageFile, filePath, "asat-uploads");
            setImageUrl(url);
            setImageFile(null);
            setUploading(false);
            return url;
        } catch (err) {
            setUploading(false);
            throw err;
        }
    };

    const handleSubmit = async () => {
        if (!category) { setError('Please select a print type.'); return; }
        setError('');
        setSaving(true);
        try {
            const finalImageUrl = await handleSaveImage();
            
            // Upload placement option images if they have a local file
            const updatedPlacementCategories = [];
            for (const pc of placementCategories) {
                const updatedPlacements = {};
                for (const [optName, v] of Object.entries(pc.placements)) {
                    if (isOptionValid(v)) {
                        let imgUrl = v.imagePreview;
                        if (v.imageFile) {
                            const ext = v.imageFile.name.split('.').pop() || 'jpg';
                            const filePath = `mfgPrintStyles/${userId}/placements/${Date.now()}_${pc.category.replace(/\s+/g, '_')}_${optName.replace(/\s+/g, '_')}.${ext}`;
                            imgUrl = await uploadFileFn(v.imageFile, filePath, "asat-uploads");
                        }
                        updatedPlacements[optName] = {
                            imagePreview: imgUrl,
                            price: parseFloat(v.price) || 0,
                            darkPrice: parseFloat(v.darkPrice) || 0,
                            lightPrice: parseFloat(v.lightPrice) || 0,
                        };
                    }
                }
                
                updatedPlacementCategories.push({
                    category: pc.category,
                    count: Object.keys(updatedPlacements).length,
                    placements: updatedPlacements
                });
            }

            const result = {
                name: category,
                category,
                cost: 0,
                imageUrl: finalImageUrl,
                placementCategories: updatedPlacementCategories
            };
            await onSave(result);
        } catch (err) {
            setError('Save failed: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    const handleCategoryTypeChange = (newType) => {
        if (placementCategories.length > 0) {
            if (!window.confirm('Changing print type will clear your placement configuration. Continue?')) return;
        }
        setCategory(newType);
        setPlacementCategories([]);
        setExpandedCat(null);
        setExpandedOpt(null);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#1c1c1c', border: '1px solid #444', borderRadius: 8, width: '540px', maxHeight: '88vh', overflowY: 'auto', color: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #333' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {editingStyle?.id ? 'Edit Print Style' : 'Add Printing Method'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>âœ•</button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {error && (
                        <div style={{ padding: '10px 14px', background: 'rgba(220,53,69,0.15)', border: '1px solid rgba(220,53,69,0.4)', borderRadius: 4, color: '#ff6b6b', fontSize: '0.82rem' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />{error}
                        </div>
                    )}


                    {/* Print Type */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={LABEL_ST}>Print Type *</label>
                        <select value={category} onChange={e => handleCategoryTypeChange(e.target.value)} style={INPUT_ST}>
                            <option value="" disabled>Select Type</option>
                            {PRINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Reference Image */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={LABEL_ST}><i className="fas fa-image" style={{ marginRight: 5, color: 'var(--gold)' }} />Reference Image (optional)</label>
                        {uploading ? (
                            <div style={{ padding: '9px 14px', background: '#2c2c2c', borderRadius: 4, fontSize: '0.75rem', color: '#aaa' }}>
                                <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Uploadingâ€¦
                            </div>
                        ) : imageUrl || imageFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {imageUrl && <img src={imageUrl} alt="ref" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #444', cursor: 'zoom-in' }} onClick={() => window.open(imageUrl, '_blank')} />}
                                {imageFile && <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{imageFile.name}</span>}
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button type="button" onClick={() => { fileRef.current.value = ''; fileRef.current.click(); }}
                                        style={{ padding: '5px 12px', background: '#2c2c2c', color: 'white', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem' }}>
                                        <i className="fas fa-upload" style={{ marginRight: 4 }} />Change
                                    </button>
                                    <button type="button" onClick={() => { setImageUrl(''); setImageFile(null); }}
                                        style={{ padding: '5px 12px', background: 'none', color: '#dc3545', border: '1px solid rgba(220,53,69,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem' }}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => { fileRef.current.value = ''; fileRef.current.click(); }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '9px 16px', background: '#252525', border: '2px dashed #444', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', color: '#888', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}>
                                <i className="fas fa-cloud-upload-alt" /> Click to upload reference image
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                            if (e.target.files[0]) {
                                setImageFile(e.target.files[0]);
                                setImageUrl(URL.createObjectURL(e.target.files[0]));
                            }
                        }} />
                    </div>

                    {/* Placement Categories */}
                    {category && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #333', paddingTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={LABEL_ST}><i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: 'white' }} />Placement Categories</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        id="newCatInput"
                                        list="dbCategories"
                                        placeholder="Category (e.g. Tshirt Front)"
                                        style={{ ...INPUT_ST, width: 160, padding: '5px 8px', fontSize: '0.75rem' }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                if (val) {
                                                    handleAddCategory(val);
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <datalist id="dbCategories">
                                        {allCategorySuggestions.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('newCatInput');
                                            const val = el?.value.trim();
                                            if (val) {
                                                handleAddCategory(val);
                                                el.value = '';
                                            }
                                        }}
                                        style={{ padding: '5px 10px', background: 'white', color: 'black', border: 'none', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {placementCategories.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                                    No placement categories added. Select or enter one above.
                                </p>
                            )}

                            {/* Accordion for each placement category */}
                            {placementCategories.map(pc => {
                                const configuredCount = Object.values(pc.placements).filter(isOptionValid).length;
                                const totalCount = Object.keys(pc.placements).length;
                                const isExpanded = expandedCat === pc.category;
                                return (
                                    <div key={pc.category} style={{ border: '1px solid #444', borderRadius: 6, overflow: 'hidden' }}>
                                        {/* Category header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isExpanded ? '#252525' : '#222', cursor: 'pointer' }}
                                            onClick={() => setExpandedCat(isExpanded ? null : pc.category)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{pc.category}</span>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: configuredCount > 0 ? 'rgba(40,167,69,0.2)' : '#333', color: configuredCount > 0 ? '#28a745' : '#888', borderRadius: 12 }}>
                                                    {configuredCount}/{totalCount} configured
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <button onClick={e => { e.stopPropagation(); handleRemoveCat(pc.category); }}
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                    <i className="fas fa-times" />
                                                </button>
                                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#888', fontSize: '0.7rem' }} />
                                            </div>
                                        </div>

                                        {/* Placement options */}
                                        {isExpanded && (
                                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, background: '#1a1a1a' }}>
                                                {/* Add custom placement position */}
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, borderBottom: '1px solid #222', paddingBottom: 10 }}>
                                                    <input
                                                        type="text"
                                                        id={`newOptInput_${pc.category.replace(/\s+/g, '_')}`}
                                                        placeholder="Add position (e.g. Left Sleeve, Collar)"
                                                        style={{ ...INPUT_ST, flex: 1, padding: '5px 8px', fontSize: '0.75rem' }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = e.target.value.trim();
                                                                if (val) {
                                                                    setPlacementCategories(prev => prev.map(pItem => {
                                                                        if (pItem.category !== pc.category) return pItem;
                                                                        return {
                                                                            ...pItem,
                                                                            placements: {
                                                                                ...pItem.placements,
                                                                                [val]: { imageFile: null, imagePreview: '', price: '', darkPrice: '', lightPrice: '' }
                                                                            }
                                                                        };
                                                                    }));
                                                                    e.target.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const el = document.getElementById(`newOptInput_${pc.category.replace(/\s+/g, '_')}`);
                                                            const val = el?.value.trim();
                                                            if (val) {
                                                                setPlacementCategories(prev => prev.map(pItem => {
                                                                    if (pItem.category !== pc.category) return pItem;
                                                                    return {
                                                                        ...pItem,
                                                                        placements: {
                                                                            ...pItem.placements,
                                                                            [val]: { imageFile: null, imagePreview: '', price: '', darkPrice: '', lightPrice: '' }
                                                                        }
                                                                    };
                                                                }));
                                                                el.value = '';
                                                            }
                                                        }}
                                                        style={{ padding: '5px 10px', background: 'white', color: 'black', border: 'none', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                                        + Add Position
                                                    </button>
                                                </div>

                                                {Object.keys(pc.placements).map((optName, oi) => {
                                                    const opt = pc.placements[optName];
                                                    const valid = isOptionValid(opt);
                                                    const isOptExpanded = expandedOpt === `${pc.category}_${optName}`;
                                                    const optKey = `${pc.category}_${optName}`;
                                                    return (
                                                        <div key={optName} style={{ border: `1px solid ${valid ? 'rgba(40,167,69,0.4)' : '#333'}`, borderRadius: 4, overflow: 'hidden' }}>
                                                            {/* Option row header */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#222', cursor: 'pointer' }}
                                                                onClick={() => setExpandedOpt(isOptExpanded ? null : optKey)}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ width: 16, height: 16, border: `2px solid ${valid ? '#28a745' : '#666'}`, borderRadius: '50%', background: valid ? '#28a745' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                                                        {valid && <div style={{ width: 4, height: 7, border: 'solid white', borderWidth: '0 1.5px 1.5px 0', transform: 'rotate(45deg)', marginBottom: 1 }} />}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.85rem', color: '#ccc', textTransform: 'capitalize' }}>{optName}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(`Remove position "${optName}"?`)) {
                                                                                setPlacementCategories(prev => prev.map(pItem => {
                                                                                    if (pItem.category !== pc.category) return pItem;
                                                                                    const updatedPlacements = { ...pItem.placements };
                                                                                    delete updatedPlacements[optName];
                                                                                    return {
                                                                                        ...pItem,
                                                                                        placements: updatedPlacements
                                                                                    };
                                                                                }));
                                                                            }
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}>
                                                                        <i className="fas fa-trash-alt" />
                                                                    </button>
                                                                    <i className={`fas fa-chevron-${isOptExpanded ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.65rem', transition: 'transform 0.2s' }} />
                                                                </div>
                                                            </div>

                                                            {/* Option expanded form */}
                                                            {isOptExpanded && (
                                                                <div style={{ padding: '12px', background: '#1c1c1c', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                    {/* Image area */}
                                                                    <div style={{ border: '1px dashed #555', borderRadius: 4, overflow: 'hidden', textAlign: 'center', background: '#222', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {opt.imagePreview ? (
                                                                            <img src={opt.imagePreview} alt="preview" style={{ maxHeight: 80, objectFit: 'contain' }} />
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>print position image</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <label style={{ ...LABEL_ST, margin: 0, width: 120, flexShrink: 0 }}>Reference Image:</label>
                                                                        <input type="file" accept="image/*" onChange={e => {
                                                                            if (e.target.files[0]) {
                                                                                updateOption(pc.category, optName, 'imagePreview', URL.createObjectURL(e.target.files[0]));
                                                                                updateOption(pc.category, optName, 'imageFile', e.target.files[0]);
                                                                            }
                                                                        }} style={{ flex: 1, fontSize: '0.75rem', color: '#aaa' }} />
                                                                    </div>

                                                                    {/* Prices */}
                                                                    {category === 'DTG' ? (
                                                                        <>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <label style={{ ...LABEL_ST, margin: 0, width: 120, flexShrink: 0 }}>Dark Garment (â‚¹):</label>
                                                                                <input type="number" min="0" value={opt.darkPrice} onChange={e => updateOption(pc.category, optName, 'darkPrice', e.target.value)}
                                                                                    style={{ flex: 1, padding: '6px 10px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }} />
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <label style={{ ...LABEL_ST, margin: 0, width: 120, flexShrink: 0 }}>Light Garment (â‚¹):</label>
                                                                                <input type="number" min="0" value={opt.lightPrice} onChange={e => updateOption(pc.category, optName, 'lightPrice', e.target.value)}
                                                                                    style={{ flex: 1, padding: '6px 10px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }} />
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <label style={{ ...LABEL_ST, margin: 0, width: 120, flexShrink: 0 }}>Set Price (â‚¹):</label>
                                                                            <input type="number" min="0" value={opt.price} onChange={e => updateOption(pc.category, optName, 'price', e.target.value)}
                                                                                style={{ flex: 1, padding: '6px 10px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #333' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        style={{ padding: '10px 24px', background: saving ? '#555' : '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                        {saving ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Savingâ€¦</> : 'Save Style'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Main Component
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function MfgPrintStyles() {
    const { user } = useAuth();
    const [styles, setStyles]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState(null); // null = new, or existing style object
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [dbCategories, setDbCategories] = useState([]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

    /* â”€â”€ Load â”€â”€ */
    const fetchStyles = async () => {
        if (!user) return;
        try {
            const data = await apiFetch(`/api/print-styles?mfg_id=${user.id}`);
            const list = (data || []).map(row => {
                let costVal = 0;
                let placementCategories = [];
                try {
                    const parsed = JSON.parse(row.description);
                    costVal = Number(parsed.cost) || 0;
                    placementCategories = parsed.placementCategories || [];
                } catch (e) {
                    costVal = 0;
                }
                return {
                    id: row.id,
                    name: row.name,
                    category: row.category || 'DTF',
                    cost: costVal,
                    imageUrl: row.image || '',
                    placementCategories,
                };
            });
            setStyles(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching print styles:', err);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await apiFetch('/api/categories');
            setDbCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStyles();
            fetchCategories();
        }
    }, [user]);

    /* â”€â”€ Open/Close Modal â”€â”€ */
    const openAddModal = () => { setEditingStyle(null); setModalOpen(true); };
    const openEditModal = (ps) => { setEditingStyle(ps); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingStyle(null); };

    /* â”€â”€ Save â”€â”€ */
    const handleSave = async (formData) => {
        const isEdit = editingStyle?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingStyle.id);
        const payload = {
            name: formData.name,
            category: formData.category,
            cost: formData.cost,
            placementCategories: formData.placementCategories,
            imageUrl: formData.imageUrl,
            active: true
        };

        if (isEdit) {
            await apiFetch(`/api/print-styles/${editingStyle.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Print style updated successfully!');
        } else {
            await apiFetch('/api/print-styles', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('Print style created successfully!');
        }

        closeModal();
        fetchStyles();
    };

    /* â”€â”€ Delete â”€â”€ */
    const executeDelete = async () => {
        const id = pendingDeleteId;
        if (!id) return;
        setPendingDeleteId(null);
        try {
            await apiFetch(`/api/print-styles/${id}`, { method: 'DELETE' });
            showToast('Print style deleted.');
            fetchStyles();
        } catch (err) {
            showToast('Failed to delete: ' + (err.error || err.message || err), 'error');
        }
    };

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">PRINT STYLES</h1>
            <p className="adm-page__subtitle">Define printing methods, costs, reference images and placement areas for each category.</p>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 18px', background: toast.type === 'error' ? '#fce8e6' : '#e6f4ea', color: toast.type === 'error' ? '#c5221f' : '#137333', borderLeft: `4px solid ${toast.type === 'error' ? '#dc3545' : '#34a853'}`, fontSize: '0.78rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', borderRadius: 4, maxWidth: 360 }}>
                    <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} style={{ marginRight: 8 }} />{toast.msg}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: '#888', fontSize: '0.8rem' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ color: 'var(--gold)' }} /> Loadingâ€¦
                </div>
            ) : (
                <div style={{ maxWidth: 860 }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                            {styles.length} method{styles.length !== 1 ? 's' : ''} configured
                        </span>
                        <button type="button" onClick={openAddModal}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', color: 'black', border: 'none', borderRadius: 4, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <i className="fas fa-plus" /> Add Printing Method
                        </button>
                    </div>

                    {/* Empty state */}
                    {styles.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', border: '2px dashed #333', borderRadius: 8, background: '#1a1a1a' }}>
                            <i className="fas fa-print" style={{ fontSize: '2.5rem', color: '#444', display: 'block', marginBottom: 14 }} />
                            <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>
                                No print styles yet. Click <strong style={{ color: 'white' }}>+ Add Printing Method</strong> to get started.
                            </p>
                        </div>
                    )}

                    {/* Styles list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {styles.map((ps, idx) => (
                            <StyleSummaryCard
                                key={ps.id}
                                ps={ps}
                                idx={idx}
                                onEdit={() => openEditModal(ps)}
                                onRemove={() => setPendingDeleteId(ps.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <PrintStyleModal
                    editingStyle={editingStyle}
                    dbCategories={dbCategories}
                    onSave={handleSave}
                    onClose={closeModal}
                    uploadFile={uploadFile}
                    userId={user?.id}
                />
            )}

            {/* Delete Confirmation Modal */}
            {pendingDeleteId && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Delete Print Style</h3></div>
                        <div className="modal-body">Are you sure you want to permanently delete this print style?</div>
                        <div className="modal-footer">
                            <button className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => setPendingDeleteId(null)}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: '#dc3545', color: '#fff', marginTop: 0 }} onClick={executeDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const LABEL_ST = { display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#aaa', marginBottom: 5 };
const INPUT_ST = { width: '100%', padding: '9px 11px', border: '1px solid #444', fontSize: '0.82rem', color: 'white', borderRadius: 4, outline: 'none', boxSizing: 'border-box', background: '#2c2c2c', transition: 'border-color 0.2s' };

