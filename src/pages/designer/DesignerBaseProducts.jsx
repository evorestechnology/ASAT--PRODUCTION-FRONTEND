import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer } from '../../components/useToast';

function DesignerBaseProducts() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMfg, setSelectedMfg] = useState('');
    const [selectedCat, setSelectedCat] = useState('');

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        apiFetch(`/api/products?cb=${Date.now()}`)
            .then(data => {
                const list = (data || []).map(p => {
                    const details = Array.isArray(p.details) ? p.details : [];
                    const isSoftDeleted = details.includes('__DELETED__');
                    return {
                        id: p.id,
                        title: p.title || 'Unnamed Product',
                        coverImage: p.cover_image || p.coverImage || '',
                        colors: p.colors || [],
                        mfgName: p.mfg_name || 'Manufacturer',
                        category: p.category || 'General',
                        cost: p.cost || 0,
                        sizes: p.sizes || [],
                        gender: p.gender || 'Unisex',
                        isSoftDeleted
                    };
                }).filter(p => !p.isSoftDeleted); // Exclude deleted base products
                setProducts(list);
            })
            .catch(err => {
                console.error('Error fetching base products:', err);
                showToast('Failed to load base products.', 'error');
            })
            .finally(() => setLoading(false));
    }, [user]);

    // Derive filter options dynamically
    const manufacturers = useMemo(() => {
        const unique = new Set(products.map(p => p.mfgName).filter(Boolean));
        return Array.from(unique).sort();
    }, [products]);

    const categories = useMemo(() => {
        const unique = new Set(products.map(p => p.category).filter(Boolean));
        return Array.from(unique).sort();
    }, [products]);

    // Filtered products list
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mfgName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesMfg = !selectedMfg || p.mfgName === selectedMfg;
            const matchesCat = !selectedCat || p.category === selectedCat;
            return matchesSearch && matchesMfg && matchesCat;
        });
    }, [products, searchTerm, selectedMfg, selectedCat]);

    return (
        <main className="dsn-upload" style={{ minHeight: 'calc(100vh - 140px)', padding: '40px 5%' }}>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <div>
                    <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.6rem', color: '#1c1c1c', margin: 0, letterSpacing: '0.5px' }}>
                        Base Products Directory
                    </h2>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#777', margin: '4px 0 0' }}>
                        Browse manufacturer product catalogs, view detailed specifications, and start designing directly.
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div style={{
                background: '#ffffff',
                border: '1px solid rgba(212,175,55,0.15)',
                padding: '20px 24px',
                borderRadius: 8,
                boxShadow: '0 4px 15px rgba(212,175,55,0.04)',
                marginBottom: 30,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
            }}>
                {/* Search */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>Search</label>
                    <input
                        type="text"
                        className="dsn-upload__input"
                        placeholder="Search title, manufacturer..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Manufacturer Filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>Manufacturer</label>
                    <select
                        className="dsn-upload__select"
                        value={selectedMfg}
                        onChange={e => setSelectedMfg(e.target.value)}
                    >
                        <option value="">All Manufacturers</option>
                        {manufacturers.map(mfg => <option key={mfg} value={mfg}>{mfg}</option>)}
                    </select>
                </div>

                {/* Category Filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>Category</label>
                    <select
                        className="dsn-upload__select"
                        value={selectedCat}
                        onChange={e => setSelectedCat(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Loading Indicator */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '0.9rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: 12, display: 'block' }} />
                    Loading available base products...
                </div>
            ) : (
                <>
                    {/* Empty State */}
                    {filteredProducts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: '#ffffff',
                            border: '1px dashed rgba(212,175,55,0.25)',
                            borderRadius: 8,
                            color: '#777'
                        }}>
                            <i className="fas fa-tshirt" style={{ fontSize: '2.5rem', color: '#ccc', marginBottom: 14, display: 'block' }} />
                            <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>No base products match your search or filter criteria.</p>
                        </div>
                    ) : (
                        /* Products Grid */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 24
                        }}>
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/designer/base-products/${p.id}`)}
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #e5e5e5',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--gold)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,175,55,0.08)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#e5e5e5';
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                                    }}
                                >
                                    {/* Cover Image */}
                                    <div style={{ height: 220, background: '#fafafa', overflow: 'hidden', position: 'relative' }}>
                                        {p.coverImage ? (
                                            <img
                                                src={p.coverImage}
                                                alt={p.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.target.style.transform = 'none'}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
                                                <i className="fas fa-tshirt" style={{ fontSize: '3rem' }} />
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        <span style={{
                                            position: 'absolute', top: 12, right: 12,
                                            padding: '3px 10px', background: 'rgba(212,175,55,0.9)', color: '#ffffff',
                                            borderRadius: 12, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5
                                        }}>
                                            {p.category}
                                        </span>
                                    </div>

                                    {/* Content Info */}
                                    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#1c1c1c', fontWeight: 700 }}>
                                            {p.title}
                                        </h4>
                                        <div style={{ fontSize: '0.72rem', color: '#777', marginBottom: 12 }}>
                                            by {p.mfgName} &nbsp;·&nbsp; <span style={{ textTransform: 'capitalize' }}>{p.gender}</span>
                                        </div>

                                        {/* Color Swatches */}
                                        {p.colors && p.colors.length > 0 && (
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                                {p.colors.map((c, i) => (
                                                    <span
                                                        key={i}
                                                        title={c.colorName}
                                                        style={{
                                                            width: 12, height: 12, borderRadius: '50%',
                                                            background: c.color || '#ccc', border: '1px solid #ddd',
                                                            display: 'inline-block'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Sizes available */}
                                        {p.sizes && p.sizes.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                                                {p.sizes.slice(0, 5).map(size => (
                                                    <span key={size} style={{
                                                        fontSize: '0.6rem', padding: '1px 5px',
                                                        background: '#f2f2f2', border: '1px solid #e0e0e0',
                                                        color: '#555', borderRadius: 3
                                                    }}>{size}</span>
                                                ))}
                                                {p.sizes.length > 5 && (
                                                    <span style={{ fontSize: '0.6rem', color: '#999', alignSelf: 'center' }}>
                                                        +{p.sizes.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Price and CTA */}
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            marginTop: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: 14
                                        }}>
                                            <div>
                                                <span style={{ fontSize: '0.65rem', color: '#888', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Base Cost</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)' }}>
                                                    ₹{(p.cost || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)',
                                                display: 'flex', alignItems: 'center', gap: 4
                                            }}>
                                                View Details <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem' }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default DesignerBaseProducts;
