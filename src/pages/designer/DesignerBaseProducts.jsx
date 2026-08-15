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
                    const rawSizes = Array.isArray(p.sizes) ? p.sizes : [];
                    const sizes = rawSizes.map(s => (typeof s === 'object' && s !== null ? (s.size || s.name || '') : String(s))).filter(Boolean);
                    return {
                        id: p.id,
                        title: p.title || 'Unnamed Product',
                        coverImage: p.cover_image || p.coverImage || '',
                        colors: p.colors || [],
                        mfgName: p.mfg_name || 'Manufacturer',
                        category: p.category || 'General',
                        cost: p.cost || 0,
                        sizes,
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

    const styles = `
        .dsn-base-page {
            min-height: calc(100vh - 140px);
            padding: 40px 5%;
            max-width: 1400px;
            margin: 0 auto;
        }
        .dsn-base-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            padding-bottom: 16px;
        }
        .dsn-base-title {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            color: #000000;
            margin: 0;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .dsn-base-subtitle {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.82rem;
            color: #666;
            margin: 4px 0 0;
        }
        .dsn-filters-card {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.02);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .dsn-filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .dsn-filter-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #000000;
        }
        .dsn-filter-input, .dsn-filter-select {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.45);
            font-family: 'Montserrat', sans-serif;
            font-size: 0.9rem;
            color: #000000;
            transition: all 0.25s ease;
            outline: none;
            box-sizing: border-box;
        }
        .dsn-filter-input:focus, .dsn-filter-select:focus {
            border-color: #000000;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }
        .dsn-prod-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
        }
        .dsn-prod-card {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.02);
        }
        .dsn-prod-card:hover {
            transform: translateY(-6px);
            border-color: rgba(0, 0, 0, 0.12);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
        }
        .dsn-prod-img-wrap {
            height: 240px;
            background: rgba(0, 0, 0, 0.02);
            overflow: hidden;
            position: relative;
        }
        .dsn-prod-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }
        .dsn-prod-card:hover .dsn-prod-img {
            transform: scale(1.04);
        }
        .dsn-prod-cat-badge {
            position: absolute;
            top: 14px;
            right: 14px;
            padding: 4px 10px;
            background: #000000;
            color: #ffffff;
            border-radius: 20px;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.6rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .dsn-prod-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .dsn-prod-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            color: #000000;
            margin: 0 0 4px;
        }
        .dsn-prod-gender {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.72rem;
            color: #777;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .dsn-prod-colors {
            display: flex;
            gap: 6px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .dsn-prod-color-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid rgba(0, 0, 0, 0.12);
            display: inline-block;
        }
        .dsn-prod-sizes {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .dsn-prod-size-badge {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.6rem;
            font-weight: 700;
            padding: 2px 6px;
            background: rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(0, 0, 0, 0.06);
            color: #555;
            border-radius: 4px;
        }
        .dsn-prod-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            padding-top: 16px;
        }
        .dsn-prod-cost-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.65rem;
            color: #888;
            display: block;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .dsn-prod-cost {
            font-family: 'Cinzel', serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: #000000;
        }
        .dsn-prod-link {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.74rem;
            font-weight: 700;
            color: #000000;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: transform 0.2s ease;
        }
        .dsn-prod-card:hover .dsn-prod-link {
            transform: translateX(4px);
        }
        .dsn-prod-empty {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            border: 1px dashed rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            color: #555;
        }
    `;

    return (
        <main className="dsn-base-page">
            <style>{styles}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* Section Header */}
            <div className="dsn-base-head">
                <div>
                    <h2 className="dsn-base-title">Base Products Directory</h2>
                    <p className="dsn-base-subtitle">
                        Browse base product catalogs, view detailed specifications, and start designing directly.
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="dsn-filters-card">
                {/* Search */}
                <div className="dsn-filter-group">
                    <label className="dsn-filter-label">Search</label>
                    <input
                        type="text"
                        className="dsn-filter-input"
                        placeholder="Search title..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <div className="dsn-filter-group">
                    <label className="dsn-filter-label">Category</label>
                    <select
                        className="dsn-filter-select"
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
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#000000', marginBottom: 12, display: 'block' }} />
                    Loading available base products...
                </div>
            ) : (
                <>
                    {/* Empty State */}
                    {filteredProducts.length === 0 ? (
                        <div className="dsn-prod-empty">
                            <i className="fas fa-tshirt" style={{ fontSize: '2.5rem', color: '#ccc', marginBottom: 14, display: 'block' }} />
                            <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>No base products match your search or filter criteria.</p>
                        </div>
                    ) : (
                        /* Products Grid */
                        <div className="dsn-prod-grid">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/designer/base-products/${p.id}`)}
                                    className="dsn-prod-card"
                                >
                                    {/* Cover Image */}
                                    <div className="dsn-prod-img-wrap">
                                        {p.coverImage ? (
                                            <img
                                                src={p.coverImage}
                                                alt={p.title}
                                                className="dsn-prod-img"
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
                                                <i className="fas fa-tshirt" style={{ fontSize: '3rem' }} />
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        <span className="dsn-prod-cat-badge">
                                            {p.category}
                                        </span>
                                    </div>

                                    {/* Content Info */}
                                    <div className="dsn-prod-content">
                                        <h4 className="dsn-prod-title">
                                            {p.title}
                                        </h4>
                                        <div className="dsn-prod-gender">
                                            <span>{p.gender}</span>
                                        </div>

                                        {/* Color Swatches */}
                                        {p.colors && p.colors.length > 0 && (
                                            <div className="dsn-prod-colors">
                                                {p.colors.map((c, i) => (
                                                    <span
                                                        key={i}
                                                        title={c.colorName}
                                                        className="dsn-prod-color-dot"
                                                        style={{ background: c.color || '#ccc' }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Sizes available */}
                                        {p.sizes && p.sizes.length > 0 && (
                                            <div className="dsn-prod-sizes">
                                                {p.sizes.slice(0, 5).map(size => (
                                                    <span key={size} className="dsn-prod-size-badge">{size}</span>
                                                ))}
                                                {p.sizes.length > 5 && (
                                                    <span style={{ fontSize: '0.6rem', color: '#999', alignSelf: 'center', fontFamily: 'Montserrat' }}>
                                                        +{p.sizes.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Price and CTA */}
                                        <div className="dsn-prod-footer">
                                            <div>
                                                <span className="dsn-prod-cost-label">Base Cost</span>
                                                <span className="dsn-prod-cost">
                                                    ₹{(p.cost || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <span className="dsn-prod-link">
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
