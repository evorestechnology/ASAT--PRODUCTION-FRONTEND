import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer } from '../../components/useToast';
import '../../styles/admin.css';

export default function MfgDesignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toasts, showToast } = useToast();
    
    const bookedColor = searchParams.get('color') || '';
    const bookedSize = searchParams.get('size') || '';
    
    const [design, setDesign] = useState(null);
    const [baseProduct, setBaseProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeColorTab, setActiveColorTab] = useState('');
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [financeRules, setFinanceRules] = useState(null);

    useEffect(() => {
        apiFetch('/api/settings')
            .then(data => setFinanceRules(data))
            .catch(() => {});
    }, []);

    const resolvePlacementCost = (p) => {
        if (!baseProduct || !baseProduct.colors) return 0;
        const styleObj = (baseProduct.printing_styles || []).find(
            x => x.style?.toLowerCase() === p.style?.toLowerCase()
        );
        if (!styleObj || !styleObj.placements) return 0;
        const plObj = styleObj.placements.find(
            x => x.label?.toLowerCase() === p.placementLabel?.toLowerCase()
        );
        if (!plObj) return 0;

        const activeColorObj = baseProduct.colors.find(c => c.colorName === activeColorTab);
        const mode = activeColorObj?.mode || 'dark';
        if (mode === 'dark') {
            return plObj.cost_dark || plObj.price || 0;
        } else {
            return plObj.cost_light || plObj.price || 0;
        }
    };

    useEffect(() => {
        const loadDetails = async () => {
            try {
                setLoading(true);
                // 1. Fetch design details
                const designData = await apiFetch(`/api/designs/${id}`);
                if (!designData) {
                    showToast("Design not found.", "error");
                    setLoading(false);
                    return;
                }
                setDesign(designData);

                // Parse description to check for colors and base product ID
                let parsedDesc = {};
                if (designData.description) {
                    try {
                        parsedDesc = JSON.parse(designData.description);
                    } catch (e) {
                        console.error("Failed to parse design description:", e);
                    }
                }

                // Set initial active color tab (match bookedColor if passed)
                const colors = designData.colors || [];
                if (colors.length > 0) {
                    let matchedColor = colors[0]?.colorName || colors[0] || '';
                    if (bookedColor) {
                        const found = colors.find(c => {
                            const cName = (c?.colorName || c || '').toString().toLowerCase();
                            const cVal = (c?.color || '').toString().toLowerCase();
                            const target = bookedColor.toLowerCase();
                            return cName === target || cVal === target;
                        });
                        if (found) {
                            matchedColor = found.colorName || found || '';
                        }
                    }
                    setActiveColorTab(matchedColor);
                }

                // 2. Fetch base product if linked
                const bpId = designData.base_product_id || parsedDesc.baseProductId;
                if (bpId) {
                    try {
                        const productData = await apiFetch(`/api/products/${bpId}`);
                        if (productData) {
                            setBaseProduct(productData);
                        }
                    } catch (err) {
                        console.error("Failed to fetch base product:", err);
                    }
                }
            } catch (err) {
                console.error("Failed to load design details:", err);
                showToast("Failed to load design details.", "error");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadDetails();
        }
    }, [id]);

    const handleDownloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            
            // Clean filename
            const cleanName = filename.replace(/[^a-z0-9_-]/gi, '_');
            const ext = blob.type.split('/')[1] || 'png';
            link.download = `${cleanName}.${ext}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Direct download failed, opening in new tab:", err);
            window.open(url, '_blank');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', fontFamily: "'Montserrat', sans-serif" }}>
                <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#C5A059', marginBottom: 15 }}></i>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading design specifications...</p>
            </div>
        );
    }

    if (!design) {
        return (
            <div style={{ padding: '40px 5%', fontFamily: "'Montserrat', sans-serif" }}>
                <BackButton />
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <i className="fas fa-exclamation-circle fa-3x" style={{ color: '#e74c3c', marginBottom: 15 }}></i>
                    <h3>Design Not Found</h3>
                    <p style={{ color: '#666' }}>The requested design could not be loaded or does not exist.</p>
                </div>
            </div>
        );
    }

    // Parse description details
    let parsedDesc = { text: '', placements: {}, manufacturerRefs: {}, customerImages: {}, pricing: {} };
    if (design.description) {
        try {
            parsedDesc = JSON.parse(design.description);
        } catch (e) {
            parsedDesc.text = design.description;
        }
    }

    // Collect all downloadable images for bulk download or listing
    const colors = design.colors || [];
    const colorKey = activeColorTab || '';
    
    const activePlacements = parsedDesc.placements?.[colorKey] || [];
    const activeRefs = parsedDesc.manufacturerRefs?.[colorKey] || [];
    const rawCustomerMockups = parsedDesc.customerImages?.[colorKey] || [];
    const customerMockups = Array.isArray(rawCustomerMockups)
        ? rawCustomerMockups.filter(Boolean)
        : (typeof rawCustomerMockups === 'object' && rawCustomerMockups !== null)
            ? Object.values(rawCustomerMockups).filter(Boolean)
            : [];
    
    // Size list
    const sizeList = design.sizes || (baseProduct ? baseProduct.sizes : []) || [];

    const totalPrintingPrice = activePlacements.reduce((sum, p) => sum + resolvePlacementCost(p), 0);
    const packingCost = financeRules?.general?.packing_cost ?? 50;
    const shippingMumbai = financeRules?.finance_shipping_rules?.mumbai ?? 100;
    const shippingIndia = financeRules?.finance_shipping_rules?.india ?? 200;
    const shippingRow = financeRules?.finance_shipping_rules?.row ?? 5000;

    return (
        <div style={{ padding: '30px 5%', fontFamily: "'Montserrat', sans-serif", background: '#fcfcfc', minHeight: '100vh' }}>
            <ToastContainer toasts={toasts} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottom: '1px solid #eaeaea', paddingBottom: 15 }}>
                <div>
                    <BackButton />
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '10px 0 0 0', color: '#111' }}>{design.title}</h1>
                    <div style={{ color: '#C5A059', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
                        Designer: {design.designer_username ? `@${design.designer_username}` : 'ASAT Designer'}
                    </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
                    <div>Design ID: {design.id}</div>
                    <div style={{ marginTop: 4 }}>Status: <span style={{ fontWeight: 600, color: design.status === 'approved' ? '#2ecc71' : '#f39c12' }}>{design.status?.toUpperCase()}</span></div>
                </div>
            </div>

            {(bookedColor || bookedSize) && (
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    color: '#fff',
                    padding: '15px 20px',
                    borderRadius: 8,
                    marginBottom: 25,
                    boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: "'Montserrat', sans-serif"
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <i className="fas fa-shopping-bag" style={{ fontSize: '1.5rem', color: '#60a5fa' }}></i>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: '#93c5fd' }}>Customer Order Specifications</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 2 }}>
                                Size Booked: <span style={{ color: '#facc15' }}>{bookedSize || 'N/A'}</span>
                                <span style={{ margin: '0 10px', color: '#93c5fd' }}>|</span>
                                Color Booked: <span style={{ color: '#facc15', textTransform: 'capitalize' }}>{bookedColor || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 4, fontWeight: 600 }}>
                        <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i> Showing specs for "{activeColorTab}"
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 30, alignItems: 'start' }}>
                
                {/* ─── LEFT COLUMN: DETAILS & SPECS ─── */}
                <div>
                    {/* Designer Notes & Instructions */}
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 24, marginBottom: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', borderBottom: '2px solid #C5A059', paddingBottom: 8, marginBottom: 15, textTransform: 'uppercase' }}>
                            <i className="fas fa-file-alt" style={{ marginRight: 8, color: '#C5A059' }}></i> Designer Instructions & Notes
                        </h2>
                        <div style={{ fontSize: '0.88rem', color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {parsedDesc.text || design.description || "No instructions provided."}
                        </div>
                    </div>

                    {/* Base Product Specifications */}
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 24, marginBottom: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', borderBottom: '2px solid #C5A059', paddingBottom: 8, marginBottom: 15, textTransform: 'uppercase' }}>
                            <i className="fas fa-tshirt" style={{ marginRight: 8, color: '#C5A059' }}></i> Base Product Specifications
                        </h2>
                        {baseProduct ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Product Title:</span>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>{baseProduct.title}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Category:</span>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>{baseProduct.category}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Target Gender:</span>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>{baseProduct.gender || 'Unisex'}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Fabric / Material Cost:</span>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>₹{baseProduct.cost?.toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                                {baseProduct.details && baseProduct.details.length > 0 && (
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Material & Fabric Details:</span>
                                        <ul style={{ margin: '5px 0 0 0', paddingLeft: 18, fontSize: '0.8rem', color: '#555', lineHeight: '1.4' }}>
                                            {baseProduct.details.map((detail, index) => (
                                                <li key={index}>{detail}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {baseProduct.size_chart_image && (
                                    <div style={{ marginTop: 10 }}>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Size Chart Image:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img 
                                                src={baseProduct.size_chart_image} 
                                                alt="Size Chart" 
                                                onClick={() => setEnlargedImage(baseProduct.size_chart_image)}
                                                style={{ width: 100, height: 70, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4, background: '#f9f9f9', cursor: 'zoom-in' }} 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadFile(baseProduct.size_chart_image, `${baseProduct.title}_Size_Chart`)}
                                                className="adm-action-btn"
                                                style={{ padding: '5px 10px', background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                                            >
                                                <i className="fas fa-download" style={{ marginRight: 5 }}></i> Download Size Chart
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
                                No base product catalog information linked.
                            </div>
                        )}
                    </div>

                    {/* Production Costs & Pricing */}
                    {baseProduct && (
                        <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 24, marginBottom: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', borderBottom: '2px solid #C5A059', paddingBottom: 8, marginBottom: 15, textTransform: 'uppercase' }}>
                                <i className="fas fa-coins" style={{ marginRight: 8, color: '#C5A059' }}></i> Production Cost Details
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>Fabric / Material Cost:</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>₹{baseProduct.cost?.toLocaleString('en-IN')}</span>
                                </div>
                                
                                {activePlacements.length > 0 && (
                                    <div style={{ borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Printing Placements Breakdown:</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {activePlacements.map((p, idx) => {
                                                const cost = resolvePlacementCost(p);
                                                return (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#333', paddingLeft: 10 }}>
                                                        <span>• {p.placementLabel} ({p.style.toUpperCase()})</span>
                                                        <span style={{ fontWeight: 600 }}>₹{cost.toLocaleString('en-IN')}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>Total Printing Price:</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>₹{totalPrintingPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                                    <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>Packing Cost:</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>₹{packingCost.toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Shipping Rates Reference:</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 10, fontSize: '0.78rem', color: '#555' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Mumbai Local:</span>
                                            <span style={{ fontWeight: 600 }}>₹{shippingMumbai.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>India (Domestic):</span>
                                            <span style={{ fontWeight: 600 }}>₹{shippingIndia.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>International (Rest of World):</span>
                                            <span style={{ fontWeight: 600 }}>₹{shippingRow.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Adjustment Helper Banner */}
                                <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px dashed #C5A059', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <span style={{ fontSize: '0.78rem', color: '#666' }}>
                                        <i className="fas fa-info-circle" style={{ color: '#C5A059', marginRight: 6 }}></i> Need extra cost adjustment for live orders of this item?
                                    </span>
                                    <button 
                                        onClick={() => navigate('/mfg/orders')}
                                        style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
                                    >
                                        <i className="fas fa-coins" style={{ marginRight: 4 }}></i> Request Cost Adjustment in Orders
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sizing & Colors Specifications */}
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', borderBottom: '2px solid #C5A059', paddingBottom: 8, marginBottom: 15, textTransform: 'uppercase' }}>
                            <i className="fas fa-palette" style={{ marginRight: 8, color: '#C5A059' }}></i> Design Colors & Sizing
                        </h2>
                        <div style={{ marginBottom: 20 }}>
                            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: 8 }}>Available Size Ranges:</span>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                                {sizeList.map((sz, index) => {
                                    const isBooked = bookedSize && sz.trim().toLowerCase() === bookedSize.trim().toLowerCase();
                                    return (
                                        <span 
                                            key={index} 
                                            style={{ 
                                                padding: '6px 14px', 
                                                border: isBooked ? '2px solid #C5A059' : '1px solid #ddd', 
                                                borderRadius: 6, 
                                                fontSize: '0.8rem', 
                                                background: isBooked ? 'rgba(197, 160, 89, 0.1)' : '#f9f9f9', 
                                                color: isBooked ? '#C5A059' : '#333',
                                                fontWeight: isBooked ? 700 : 600,
                                                position: 'relative',
                                                boxShadow: isBooked ? '0 2px 6px rgba(197, 160, 89, 0.15)' : 'none'
                                            }}
                                        >
                                            {sz}
                                            {isBooked && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: -10,
                                                    right: -10,
                                                    background: '#C5A059',
                                                    color: '#fff',
                                                    fontSize: '0.55rem',
                                                    padding: '2px 4px',
                                                    borderRadius: 10,
                                                    fontWeight: 800,
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    BOOKED
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, display: 'block', marginBottom: 8 }}>Design Colors:</span>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                                {colors.map((col, index) => {
                                    const colName = col.colorName || (typeof col === 'string' ? col : '');
                                    const colHex = (() => {
                                        if (col && col.color) return col.color;
                                        if (baseProduct && baseProduct.colors && Array.isArray(baseProduct.colors)) {
                                            const found = baseProduct.colors.find(bc => bc.colorName === colName);
                                            if (found) return found.color;
                                        }
                                        return getColorHexByName(colName);
                                    })();
                                    const isBooked = bookedColor && (colName.trim().toLowerCase() === bookedColor.trim().toLowerCase() || colHex.trim().toLowerCase() === bookedColor.trim().toLowerCase());
                                    return (
                                        <div 
                                            key={index} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 8, 
                                                padding: '6px 14px', 
                                                border: isBooked ? '2px solid #C5A059' : '1px solid #ddd', 
                                                borderRadius: 8, 
                                                background: isBooked ? 'rgba(197, 160, 89, 0.1)' : '#fcfcfc',
                                                position: 'relative'
                                            }}
                                        >
                                            <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colHex, border: '1px solid #bbb', display: 'inline-block' }}></span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: isBooked ? 700 : 500, color: isBooked ? '#C5A059' : '#333' }}>{colName}</span>
                                            {isBooked && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: -10,
                                                    right: -10,
                                                    background: '#C5A059',
                                                    color: '#fff',
                                                    fontSize: '0.55rem',
                                                    padding: '2px 4px',
                                                    borderRadius: 10,
                                                    fontWeight: 800,
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    BOOKED
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: ASSETS & DOWNLOADS ─── */}
                <div>
                    {/* Color Swatch Tab Switcher */}
                    {colors.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 15, paddingBottom: 5 }}>
                            {colors.map((col, index) => {
                                const colName = col.colorName || (typeof col === 'string' ? col : '');
                                const isActive = activeColorTab === colName;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setActiveColorTab(colName)}
                                        style={{
                                            padding: '6px 12px',
                                            border: isActive ? '1px solid #C5A059' : '1px solid #ddd',
                                            borderRadius: 20,
                                            background: isActive ? '#C5A059' : '#fff',
                                            color: isActive ? '#fff' : '#555',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {colName}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Assets Box */}
                    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', borderBottom: '2px solid #C5A059', paddingBottom: 8, marginBottom: 20, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                                <i className="fas fa-download" style={{ marginRight: 8, color: '#C5A059' }}></i> Design Artworks & Mockups
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#C5A059', textTransform: 'none' }}>
                                Color: {activeColorTab || 'Default'}
                            </span>
                        </h2>

                        {/* 1. Printing Placements Artworks */}
                        <div style={{ marginBottom: 25 }}>
                            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>
                                <i className="fas fa-image" style={{ marginRight: 6 }}></i> Placement Artworks
                            </h3>
                            {activePlacements.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                    {activePlacements.map((p, idx) => (
                                        <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#fafafa' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eaeaea', paddingBottom: 8 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{p.placementLabel}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#666' }}>
                                                    Print Style: <span style={{ fontWeight: 600, color: '#C5A059', textTransform: 'uppercase' }}>{p.style || 'Printed'}</span>
                                                    {' | '}
                                                    Price: <span style={{ fontWeight: 600, color: '#C5A059' }}>₹{resolvePlacementCost(p).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                {p.designUrl && (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: 4, fontWeight: 600 }}>Artwork File:</span>
                                                        <div 
                                                            onClick={() => setEnlargedImage(p.designUrl)}
                                                            style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 4, height: 120, background: `url(${p.designUrl}) center/contain no-repeat #fff`, overflow: 'hidden', cursor: 'zoom-in' }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(p.designUrl, `${design.title}_${activeColorTab}_${p.placementLabel}_Artwork`); }}
                                                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '0.6rem', padding: '3px 0', cursor: 'pointer', fontWeight: 600 }}
                                                            >
                                                                <i className="fas fa-download"></i> Download Artwork
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {p.mockupUrl && (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: 4, fontWeight: 600 }}>Placement Mockup:</span>
                                                        <div 
                                                            onClick={() => setEnlargedImage(p.mockupUrl)}
                                                            style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 4, height: 120, background: `url(${p.mockupUrl}) center/contain no-repeat #fff`, overflow: 'hidden', cursor: 'zoom-in' }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(p.mockupUrl, `${design.title}_${activeColorTab}_${p.placementLabel}_Mockup`); }}
                                                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '0.6rem', padding: '3px 0', cursor: 'pointer', fontWeight: 600 }}
                                                            >
                                                                <i className="fas fa-download"></i> Download Mockup
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', paddingLeft: 5 }}>No print placement artworks registered for this color.</div>
                            )}
                        </div>

                        {/* 2. Customer Mockup Previews */}
                        <div style={{ marginBottom: 25 }}>
                            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>
                                <i className="fas fa-store" style={{ marginRight: 6 }}></i> Customer Previews (Storefront Mockups)
                            </h3>
                            {customerMockups && customerMockups.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                                    {customerMockups.map((imgUrl, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setEnlargedImage(imgUrl)}
                                            style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden', background: '#fafafa', position: 'relative', height: 110, cursor: 'zoom-in' }}
                                        >
                                            <div style={{ width: '100%', height: '100%', background: `url(${imgUrl}) center/cover no-repeat` }}></div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(imgUrl, `${design.title}_${activeColorTab}_CustomerPreview_${idx + 1}`); }}
                                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '0.6rem', padding: '3px 0', cursor: 'pointer', textAlign: 'center', fontWeight: 500 }}
                                            >
                                                <i className="fas fa-download" style={{ marginRight: 4 }}></i> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', paddingLeft: 5 }}>No storefront mockup images registered for this color.</div>
                            )}
                        </div>

                        {/* 3. Manufacturer Reference Images */}
                        <div>
                            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>
                                <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i> Manufacturer Reference Files
                            </h3>
                            {activeRefs && activeRefs.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                                    {activeRefs.map((imgUrl, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setEnlargedImage(imgUrl)}
                                            style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden', background: '#fafafa', position: 'relative', height: 110, cursor: 'zoom-in' }}
                                        >
                                            <div style={{ width: '100%', height: '100%', background: `url(${imgUrl}) center/cover no-repeat` }}></div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(imgUrl, `${design.title}_${activeColorTab}_RefImage_${idx + 1}`); }}
                                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '0.6rem', padding: '3px 0', cursor: 'pointer', textAlign: 'center', fontWeight: 500 }}
                                            >
                                                <i className="fas fa-download" style={{ marginRight: 4 }}></i> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', paddingLeft: 5 }}>No additional manufacturer reference files uploaded for this color.</div>
                            )}
                        </div>

                    </div>
                </div>

            </div>

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
                            alt="Enlarged design spec" 
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
        </div>
    );
}

const getColorHexByName = (name, fallback = '#ccc') => {
    if (!name || typeof name !== 'string') return fallback;
    const lower = name.toLowerCase().trim();
    if (lower.startsWith('#') || lower.startsWith('rgb') || lower.startsWith('hsl')) return name;
    
    if (lower.includes('jet black') || lower === 'black' || lower === 'blk') return '#000000';
    if (lower.includes('off white') || lower.includes('cream') || lower.includes('ivory')) return '#faf6ee';
    if (lower === 'white' || lower === 'wht') return '#ffffff';
    if (lower.includes('navy') || lower.includes('dark blue')) return '#000080';
    if (lower.includes('royal blue')) return '#4169e1';
    if (lower.includes('blue')) return '#1a73e8';
    if (lower.includes('grey') || lower.includes('gray') || lower.includes('melange')) return '#808080';
    if (lower.includes('olive')) return '#556b2f';
    if (lower.includes('green') || lower.includes('khaki')) return '#008000';
    if (lower.includes('red') || lower.includes('maroon') || lower.includes('burgundy')) return '#800000';
    if (lower.includes('yellow') || lower.includes('gold')) return '#ffd700';
    if (lower.includes('orange')) return '#ffa500';
    if (lower.includes('pink') || lower.includes('rose')) return '#ffc0cb';
    if (lower.includes('purple') || lower.includes('lavender') || lower.includes('violet')) return '#800080';
    if (lower.includes('brown') || lower.includes('tan') || lower.includes('beige')) return '#d2b48c';
    
    return name;
};
