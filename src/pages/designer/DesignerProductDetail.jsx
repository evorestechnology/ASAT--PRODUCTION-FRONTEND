import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer } from '../../components/useToast';

const downloadImage = async (url, filename) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Failed to download image:', error);
        window.open(url, '_blank');
    }
};

function DesignerProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !id) return;
        setLoading(true);
        apiFetch(`/api/products/${id}?cb=${Date.now()}`)
            .then(data => {
                if (data) {
                    setProduct({
                        id: data.id,
                        title: data.title || 'Unnamed Product',
                        coverImage: data.cover_image || data.coverImage || '',
                        colors: data.colors || [],
                        mfgName: data.mfg_name || 'Manufacturer',
                        category: data.category || 'General',
                        cost: data.cost || 0,
                        sizes: data.sizes || [],
                        gender: data.gender || 'Unisex',
                        details: data.details || [],
                        washCare: data.wash_care || data.washCare || [],
                        printingStyles: data.printing_styles || data.printingStyles || [],
                        sizeChartImage: data.size_chart_image || data.sizeChartImage || ''
                    });
                } else {
                    showToast('Product details not found.', 'error');
                }
            })
            .catch(err => {
                console.error('Error fetching product details:', err);
                showToast('Failed to load product details.', 'error');
            })
            .finally(() => setLoading(false));
    }, [user, id]);

    const handleCreateDesign = () => {
        if (!product) return;
        navigate(`/designer/designs/upload?productId=${product.id}&category=${encodeURIComponent(product.category)}`);
    };

    if (loading) {
        return (
            <main className="dsn-upload" style={{ minHeight: 'calc(100vh - 140px)', padding: '40px 5%', textAlign: 'center' }}>
                <ToastContainer toasts={toasts} />
                <BackButton />
                <div style={{ padding: '80px 0', color: '#999' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--gold)', marginBottom: 16, display: 'block' }} />
                    Retrieving product details...
                </div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="dsn-upload" style={{ minHeight: 'calc(100vh - 140px)', padding: '40px 5%', textAlign: 'center' }}>
                <ToastContainer toasts={toasts} />
                <BackButton />
                <div style={{
                    padding: '60px 20px',
                    border: '1px dashed #e0e0e0',
                    borderRadius: 8,
                    color: '#777',
                    marginTop: 20
                }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: 14, display: 'block' }} />
                    <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>Product details could not be found or loaded.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="dsn-upload" style={{ minHeight: 'calc(100vh - 140px)', padding: '40px 5%' }}>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* Main Content Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.4fr)',
                gap: 40,
                marginTop: 20
            }}>
                {/* Left Column: Cover Image & Size Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Cover Photo */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e5e5e5',
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        padding: 10
                    }}>
                        {product.coverImage ? (
                            <img
                                src={product.coverImage}
                                alt={product.title}
                                style={{ width: '100%', borderRadius: 6, objectFit: 'contain', display: 'block', maxHeight: 400 }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#ccc', background: '#fafafa', borderRadius: 6 }}>
                                <i className="fas fa-tshirt" style={{ fontSize: '4rem' }} />
                            </div>
                        )}
                    </div>

                    {/* Size Chart Card */}
                    {product.sizeChartImage && (
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid rgba(212,175,55,0.15)',
                            borderRadius: 8,
                            padding: 20,
                            boxShadow: '0 4px 15px rgba(212,175,55,0.04)'
                        }}>
                            <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: 'var(--gold)', margin: '0 0 12px', letterSpacing: 0.5 }}>
                                ðŸ“ Size Chart Reference
                            </h4>
                            <img
                                src={product.sizeChartImage}
                                alt="Size chart"
                                style={{ width: '100%', borderRadius: 4, objectFit: 'contain', maxHeight: 300 }}
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Spec Specifications & CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {/* Header Spec */}
                    <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{
                                padding: '3px 10px', background: 'rgba(212,175,55,0.12)', color: 'var(--gold)',
                                borderRadius: 12, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5
                            }}>
                                {product.category}
                            </span>
                            <span style={{
                                padding: '3px 10px', background: '#f5f5f5', color: '#555',
                                borderRadius: 12, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5
                            }}>
                                {product.gender}
                            </span>
                        </div>

                        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.7rem', color: '#1c1c1c', margin: '0 0 4px', fontWeight: 700 }}>
                            {product.title}
                        </h1>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#777', margin: '0 0 16px' }}>
                            by {product.mfgName}
                        </p>
{/* 
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                            <span style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Manufacturer Base Cost</span>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)' }}>
                                â‚¹{(product.cost || 0).toLocaleString()}
                            </span>
                        </div> */}
                    </div>

                    {/* Description Details */}
                    {product.details && product.details.length > 0 && (
                        <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                                Product Details
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {product.details.map((d, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                                        <span style={{ color: 'var(--gold)' }}>â€¢</span>
                                        <span>{d}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wash Care Details */}
                    {product.washCare && product.washCare.length > 0 && (
                        <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                                Wash Care
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {product.washCare.map((w, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                                        <span style={{ color: 'var(--gold)' }}>â€¢</span>
                                        <span>{w}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Colors & Sizes Panel */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16
                    }}>
                        {/* Colors */}
                        <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', padding: 20, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                                Color Variants
                            </h4>
                            {product.colors && product.colors.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {product.colors.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '4px 0', borderBottom: i < product.colors.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{
                                                    width: 14, height: 14, borderRadius: '50%',
                                                    background: c.color || '#ccc', border: '1px solid #ccc',
                                                    display: 'inline-block', flexShrink: 0
                                                }} />
                                                <span style={{ fontSize: '0.82rem', color: c.available !== false ? '#333' : '#888', textTransform: 'capitalize', textDecoration: c.available !== false ? 'none' : 'line-through' }}>
                                                    {c.colorName} {c.available === false && '(Unavailable)'}
                                                </span>
                                            </div>
                                            {c.available !== false && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {c.frontImage && (
                                                        <button
                                                            onClick={() => downloadImage(c.frontImage, `${product.title.replace(/\s+/g, '_')}_${c.colorName}_front.jpg`)}
                                                            title="Download Front Mockup"
                                                            style={{
                                                                background: 'none', border: 'none', color: 'var(--gold)',
                                                                cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px',
                                                                display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'underline'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.color = '#b2904b'}
                                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
                                                        >
                                                            <i className="fas fa-download" style={{ fontSize: '0.65rem' }} /> Front
                                                        </button>
                                                    )}
                                                    {c.backImage && (
                                                        <button
                                                            onClick={() => downloadImage(c.backImage, `${product.title.replace(/\s+/g, '_')}_${c.colorName}_back.jpg`)}
                                                            title="Download Back Mockup"
                                                            style={{
                                                                background: 'none', border: 'none', color: 'var(--gold)',
                                                                cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px',
                                                                display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'underline'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.color = '#b2904b'}
                                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
                                                        >
                                                            <i className="fas fa-download" style={{ fontSize: '0.65rem' }} /> Back
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>No colors defined</span>
                            )}
                        </div>

                        {/* Sizes */}
                        <div style={{ background: '#ffffff', border: '1px solid #e8e8e8', padding: 20, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                                Available Sizes
                            </h4>
                            {product.sizes && product.sizes.length > 0 ? (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {product.sizes.map(size => (
                                        <span key={size} style={{
                                            fontSize: '0.78rem', padding: '3px 10px',
                                            background: '#fcfcfc', border: '1px solid #e0e0e0',
                                            color: '#333', borderRadius: 4, fontWeight: 600
                                        }}>{size}</span>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>No sizes defined</span>
                            )}
                        </div>
                    </div>

                    {/* Configured Printing Styles */}
                    <div style={{ background: '#ffffff', border: '1px solid rgba(212,175,55,0.18)', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(212,175,55,0.03)' }}>
                        <h4 style={{ margin: '0 0 14px', fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                            ðŸ–¨ï¸ Printing Methods Configuration
                        </h4>
                        {product.printingStyles && product.printingStyles.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {product.printingStyles.map((ps, idx) => {
                                    const activePlacements = (ps.placements || []).filter(pl => pl.active !== false);
                                    return (
                                        <div key={idx} style={{ paddingBottom: idx < product.printingStyles.length - 1 ? 14 : 0, borderBottom: idx < product.printingStyles.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#222', textTransform: 'uppercase', marginBottom: 6 }}>
                                                {ps.style === 'dtf' ? 'Direct to Film (DTF)' : ps.style === 'dtg' ? 'Direct to Garment (DTG)' : ps.style === 'embrio' ? 'Embroidery' : ps.style}
                                            </div>
                                            {activePlacements.length > 0 ? (
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {activePlacements.map(pl => {
                                                        const id = pl.id || '';
                                                        const label = pl.label || id || '';
                                                        
                                                        // Extract category name from placement id and label
                                                        let categoryName = '';
                                                        if (id) {
                                                            const opt = label || '';
                                                            if (opt && id.endsWith('_' + opt)) {
                                                                categoryName = id.substring(0, id.length - opt.length - 1);
                                                            } else if (id.includes('_')) {
                                                                const idx = id.lastIndexOf('_');
                                                                categoryName = id.substring(0, idx);
                                                            } else {
                                                                categoryName = id;
                                                            }
                                                        }
                                                        
                                                        const formattedCategory = categoryName
                                                            ? categoryName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                                            : '';
                                                        const formattedLabel = label ? label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
                                                        const displayLabel = formattedCategory 
                                                            ? `${formattedCategory} - ${formattedLabel}` 
                                                            : formattedLabel;

                                                        return (
                                                            <span key={pl.id} style={{
                                                                fontSize: '0.7rem', padding: '2px 8px',
                                                                background: '#fafafa', border: '1px solid #eee',
                                                                color: '#666', borderRadius: 12, textTransform: 'capitalize'
                                                            }}>
                                                                {displayLabel} (â‚¹{pl.price || 0})
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>No active placements configured</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>No print styles configured.</span>
                        )}
                    </div>

                    {/* CTA Creation Button */}
                    <button
                        type="button"
                        onClick={handleCreateDesign}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'var(--gold)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            boxShadow: '0 4px 15px rgba(197,160,89,0.3)',
                            transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#b2904b';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(197,160,89,0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--gold)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(197,160,89,0.3)';
                        }}
                    >
                        <i className="fas fa-palette" /> Create Design on this Product
                    </button>
                </div>
            </div>
        </main>
    );
}

export default DesignerProductDetail;

