import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const PLACEMENT_LABELS = {
    // Front
    'front_pocket_logo': 'Front Pocket Logo',
    'front_a6': 'Front A6',
    'front_a4': 'Front A4',
    'front_a3': 'Front A3',
    'front_14x16': 'Front 14×16',
    'front_16x20': 'Front 16×20',
    // Back
    'back_a6': 'Back A6',
    'back_a4': 'Back A4',
    'back_a3': 'Back A3',
    'back_14x16': 'Back 14×16',
    'back_16x20': 'Back 16×20',
    'back_neck': 'Back Neck',
    'right_front_shoulder': 'Right Front Shoulder',
    'right_back_shoulder': 'Right Back Shoulder',
    'left_front_shoulder': 'Left Front Shoulder',
    'left_back_shoulder': 'Left Back Shoulder',
    'neck_logo': 'Neck Logo',
    // Pant
    'right_front_upper': 'Right Front Upper',
    'right_front_bottom': 'Right Front Bottom',
    'right_front_full': 'Right Front Full',
    'left_front_upper': 'Left Front Upper',
    'left_front_bottom': 'Left Front Bottom',
    'left_front_lower': 'Left Front Lower',
    'right_back_upper': 'Right Back Upper',
    'right_back_bottom': 'Right Back Bottom',
    'right_back_full': 'Right Back Full',
    'left_back_upper': 'Left Back Upper',
    'left_back_bottom': 'Left Back Bottom',
    'left_back_lower': 'Left Back Lower',
};

function MfgProducts() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
    const [products, setProducts] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_mfg_products');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [companyName, setCompanyName] = useState('Manufacturer');
    const [loading, setLoading] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_mfg_products');
            return saved ? false : true;
        } catch (e) {
            return true;
        }
    });
    const [error, setError] = useState(null);
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form inputs state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        cost: '',
        gender: 'Unisex',
        details: '',
        washCare: ''
    });

    const [colors, setColors] = useState([]);
    const [printingStyles, setPrintingStyles] = useState([]);

    // Size chart and manual sizes states
    const [sizeChartFile, setSizeChartFile] = useState(null);
    const [sizeChartPreview, setSizeChartPreview] = useState('');
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [customSizeInput, setCustomSizeInput] = useState('');
    const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

    // Categories database state
    const [dbCategories, setDbCategories] = useState([]);

    // Global print styles loaded from admin settings
    const [globalPrintStyles, setGlobalPrintStyles] = useState([]);

    // Dynamically compile categories list from database
    const categoriesList = useMemo(() => {
        const uniqueCats = new Set(
            dbCategories.map(c => c.name).filter(Boolean)
        );
        return Array.from(uniqueCats).sort();
    }, [dbCategories]);

    // Set of category names that are currently active (not deleted or inactive)
    const activeCategoryNames = useMemo(() => {
        return new Set(
            dbCategories
                .filter(c => c.active !== false)
                .map(c => c.name)
                .filter(Boolean)
        );
    }, [dbCategories]);

    // Helper: is a product truly available on the storefront?
    const isProductAvailable = (p) => {
        if (p.available === false) return false;
        if (!activeCategoryNames.has(p.category)) return false;
        return true;
    };

    // Fetch manufacturer profile to get name
    useEffect(() => {
        if (!user) return;
        const fetchMfgProfile = async () => {
            try {
                const data = await apiFetch('/api/manufacturers/me');
                if (data) {
                    setCompanyName(data.business_name || 'Manufacturer');
                }
            } catch (err) {
                console.error('Error fetching manufacturer profile:', err);
            }
        };
        fetchMfgProfile();
    }, [user]);

    const fetchProducts = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/products/mfg');
            const list = (data || []).map(row => ({
                id: row.id,
                title: row.title,
                category: row.category,
                cost: Number(row.cost) || 0,
                gender: row.gender,
                coverImage: row.cover_image,
                colors: row.colors,
                printingStyles: row.printing_styles,
                sizeChartImage: row.size_chart_image,
                sizes: row.sizes,
                mfgId: row.mfg_id,
                mfgName: row.mfg_name,
                available: row.available,
                details: row.details,
                washCare: row.wash_care
            }));
            setProducts(list);
            try {
                sessionStorage.setItem('asat_mfg_products', JSON.stringify(list));
            } catch (e) {}
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to fetch product catalogue.');
            setLoading(false);
        }
    };

    // Real-time products list
    useEffect(() => {
        if (!user) return;
        fetchProducts();
    }, [user]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiFetch('/api/categories');
                const list = (data || []).map(row => ({
                    id: row.id,
                    name: row.name,
                    slug: row.slug,
                    image: row.image,
                    description: row.description,
                    active: true
                }));
                setDbCategories(list);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchCategories();
    }, []);

    // Load this manufacturer's own print styles from Supabase
    useEffect(() => {
        if (!user) return;
        const loadPrintStyles = async () => {
            try {
                const data = await apiFetch(`/api/print-styles?mfg_id=${user.id}`);
                const list = (data || []).map(row => {
                    let costVal = 0;
                    let placementsVal = [];
                    let customPlacementsVal = [];
                    try {
                        const parsed = JSON.parse(row.description);
                        costVal = Number(parsed.cost) || 0;
                        placementsVal = parsed.placements || [];
                        customPlacementsVal = parsed.customPlacements || [];
                    } catch (e) {}
                    return {
                        id: row.id,
                        name: row.name,
                        cost: costVal,
                        imageUrl: row.image || '',
                        placements: placementsVal,
                        customPlacements: customPlacementsVal
                    };
                });
                setGlobalPrintStyles(list);
            } catch (err) {
                console.error('Error loading print styles:', err);
            }
        };
        loadPrintStyles();
    }, [user]);

    const handleAddClick = () => {
        setEditProduct(null);
        setFormData({
            title: '',
            category: categoriesList[0] || '',
            cost: '',
            gender: 'Unisex',
            details: '',
            washCare: '',
            available: true
        });
        setColors([]);
        setPrintingStyles([]);
        setSizeChartFile(null);
        setSizeChartPreview('');
        setSelectedSizes([]);
        setCustomSizeInput('');
        setIsModalOpen(true);
    };

    const handleEditClick = (p) => {
        setEditProduct(p);
        setFormData({
            title: p.title || '',
            category: p.category || categoriesList[0] || '',
            cost: p.cost || '',
            gender: p.gender || 'Unisex',
            details: (p.details || []).join('\n'),
            washCare: (p.washCare || []).join('\n'),
            available: p.available !== false
        });
        // Colors mapping
        setColors((p.colors || []).map((c, i) => ({
            id: i,
            color: c.color,
            colorName: c.colorName,
            frontFile: null,
            frontPreview: c.frontImage,
            backFile: null,
            backPreview: c.backImage
        })));
        // Printing styles mapping — now an array of selected style objects
        setPrintingStyles((p.printingStyles || []).map(s => ({
            style: s.style,
            placements: s.placements || []
        })));
        // Sizing prefill
        setSizeChartFile(null);
        setSizeChartPreview(p.sizeChartImage || '');
        setSelectedSizes(p.sizes || []);
        setCustomSizeInput('');
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        const productId = pendingDeleteProduct;
        if (!productId) return;
        setPendingDeleteProduct(null);
        try {
            await apiFetch(`/api/products/${productId}`, { method: 'DELETE' });
            showToast('Product deleted successfully!', 'success');
            fetchProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            showToast('Failed to delete product: ' + err.message, 'error');
        }
    };

    // Color Handlers
    const addColorField = () => {
        setColors(prev => [
            ...prev,
            {
                id: Date.now(),
                color: '#000000',
                colorName: '',
                frontFile: null,
                frontPreview: '',
                backFile: null,
                backPreview: ''
            }
        ]);
    };

    const removeColorField = (id) => {
        setColors(prev => prev.filter(c => c.id !== id));
    };

    const updateColorField = (id, field, value) => {
        setColors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleColorImageUpload = (id, side, file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setColors(prev => prev.map(c => c.id === id ? {
            ...c,
            [`${side}File`]: file,
            [`${side}Preview`]: previewUrl
        } : c));
    };

    // Helper to find the placement label
    const getPlacementLabel = (ps, pid) => {
        if (PLACEMENT_LABELS[pid]) return PLACEMENT_LABELS[pid];
        const custom = (ps.customPlacements || []).find(c => c.id === pid);
        if (custom) return custom.label;
        return pid.replace(/^custom_[a-z]+_\d+_/, '').replace(/_/g, ' ');
    };

    // Printing Style Toggle — selects/deselects a style name and default placements
    const togglePrintingStyle = (name) => {
        setPrintingStyles(prev => {
            const exists = prev.find(p => p.style === name);
            if (exists) {
                return prev.filter(p => p.style !== name);
            } else {
                const gps = globalPrintStyles.find(x => x.name === name);
                const defaultPlacements = gps?.placements || [];
                const mappedPlacements = defaultPlacements.map(pid => ({
                    id: pid,
                    label: getPlacementLabel(gps, pid)
                }));
                return [...prev, { style: name, placements: mappedPlacements }];
            }
        });
    };

    const togglePlacementForStyle = (styleName, placementId, label) => {
        setPrintingStyles(prev => prev.map(ps => {
            if (ps.style !== styleName) return ps;
            const exists = ps.placements.find(p => p.id === placementId);
            if (exists) {
                return { ...ps, placements: ps.placements.filter(p => p.id !== placementId) };
            } else {
                return { ...ps, placements: [...ps.placements, { id: placementId, label }] };
            }
        }));
    };

    // Sizing and Size Chart Handlers
    const handleSizeCheckboxChange = (size, checked) => {
        if (checked) {
            setSelectedSizes(prev => [...prev, size]);
        } else {
            setSelectedSizes(prev => prev.filter(s => s !== size));
        }
    };

    const handleAddCustomSize = (e) => {
        e.preventDefault();
        const trimmed = customSizeInput.trim().toUpperCase();
        if (!trimmed) return;
        if (selectedSizes.includes(trimmed)) {
            showToast('Size already added.', 'warning');
            return;
        }
        setSelectedSizes(prev => [...prev, trimmed]);
        setCustomSizeInput('');
    };

    const handleRemoveSize = (sizeToRemove) => {
        setSelectedSizes(prev => prev.filter(s => s !== sizeToRemove));
    };

    const handleSizeChartUpload = (file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setSizeChartFile(file);
        setSizeChartPreview(previewUrl);
    };

    // Save product
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        const savedCategory = formData.category;
        if (!savedCategory) {
            showToast('Please select or specify a category.', 'error');
            return;
        }

        if (colors.length === 0) {
            showToast('Please add at least one color configuration.', 'error');
            return;
        }

        // Validate size chart and sizes
        if (!sizeChartPreview) {
            showToast('Please upload a Size Chart image.', 'error');
            return;
        }

        if (selectedSizes.length === 0) {
            showToast('Please select or add at least one size.', 'error');
            return;
        }

        // Validate colors
        for (let i = 0; i < colors.length; i++) {
            const c = colors[i];
            if (!c.colorName.trim()) {
                showToast('All color names must be filled out.', 'error');
                return;
            }
            if (!c.frontPreview) {
                showToast(`Please upload a Front View image for the color "${c.colorName}".`, 'error');
                return;
            }
            if (!c.backPreview) {
                showToast(`Please upload a Back View image for the color "${c.colorName}".`, 'error');
                return;
            }
        }


        setIsSaving(true);

        try {
            // 0. Upload Size Chart image if a new file is chosen
            let finalSizeChartImage = sizeChartPreview;
            if (sizeChartFile) {
                const ext = sizeChartFile.name.split('.').pop() || 'jpg';
                const filePath = `products/${user.id}/size_charts/${Date.now()}_size_chart.${ext}`;
                finalSizeChartImage = await uploadFile('asat-uploads', filePath, sizeChartFile);
            }

            // 1. Upload Front/Back images for colors if new files selected
            const finalColors = [];
            for (let i = 0; i < colors.length; i++) {
                const c = colors[i];
                let frontUrl = c.frontPreview;
                let backUrl = c.backPreview;

                if (c.frontFile) {
                    const ext = c.frontFile.name.split('.').pop() || 'jpg';
                    const filePath = `products/${user.id}/${Date.now()}_front_${c.colorName.replace(/\s+/g, '_')}.${ext}`;
                    frontUrl = await uploadFile('asat-uploads', filePath, c.frontFile);
                }

                if (c.backFile) {
                    const ext = c.backFile.name.split('.').pop() || 'jpg';
                    const filePath = `products/${user.id}/${Date.now()}_back_${c.colorName.replace(/\s+/g, '_')}.${ext}`;
                    backUrl = await uploadFile('asat-uploads', filePath, c.backFile);
                }

                finalColors.push({
                    color: c.color,
                    colorName: c.colorName.trim(),
                    frontImage: frontUrl,
                    backImage: backUrl
                });
            }

            // 2. Compile payload (setting cover_image to colors[0].frontImage)
            const payload = {
                title: formData.title.trim(),
                category: savedCategory,
                cost: parseFloat(formData.cost) || 0,
                gender: formData.gender || 'Unisex',
                cover_image: finalColors[0]?.frontImage || '',
                colors: finalColors,
                printing_styles: printingStyles.map(ps => {
                    const g = globalPrintStyles.find(x => x.name === ps.style);
                    return { 
                        style: ps.style, 
                        cost: g ? Number(g.cost) : 0,
                        placements: ps.placements || []
                    };
                }),
                size_chart_image: finalSizeChartImage,
                sizes: selectedSizes,
                mfg_id: user.id,
                mfg_name: companyName,
                available: formData.available,
                details: formData.details ? formData.details.split('\n').map(s => s.trim()).filter(Boolean) : [],
                wash_care: formData.washCare ? formData.washCare.split('\n').map(s => s.trim()).filter(Boolean) : [],
                updated_at: new Date().toISOString()
            };

            if (editProduct) {
                await apiFetch(`/api/products/${editProduct.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            showToast(editProduct ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            console.error('Error saving product:', err);
            showToast('Failed to save product: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">PRODUCTS CATALOGUE</h1>
            <p className="adm-page__subtitle">Manage base products, colors, front/back images, and printing costs</p>

            <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="adm-settings__btn" style={{ marginTop: 0 }} onClick={handleAddClick}>
                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Base Product
                </button>
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time product list...</p>
                </div>
            ) : error ? (
                <div className="adm-error-alert">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            ) : products.length === 0 ? (
                <div className="adm-table-wrap">
                    <div className="adm-table__empty" style={{ padding: '60px 20px' }}>
                        <i className="fas fa-tshirt"></i>
                        No products created yet. Click "Add Base Product" to start.
                    </div>
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Cover</th>
                                <th>Product Title</th>
                                <th>Category</th>
                                <th>Base Cost</th>
                                <th>Colors Available</th>
                                <th>Printing Styles</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{
                                            width: 44,
                                            height: 54,
                                            background: `url(${p.coverImage || p.colors?.[0]?.frontImage || ''}) center/cover no-repeat`,
                                            borderRadius: 4,
                                            border: '1px solid #ddd'
                                        }}></div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                                    <td>{p.category}</td>
                                    <td>₹{(p.cost || 0).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                                            {(p.colors || []).map((c, i) => (
                                                <span
                                                    key={i}
                                                    title={c.colorName}
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '50%',
                                                        background: c.color,
                                                        display: 'inline-block',
                                                        border: '1px solid #ccc'
                                                    }}
                                                ></span>
                                            ))}
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>({(p.colors || []).length})</span>
                                        </div>
                                    </td>
                                    <td>
                                        {(p.printingStyles || []).length === 0 ? (
                                            <span style={{ color: '#aaa', fontSize: '0.75rem' }}>No custom printing</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {(p.printingStyles || []).map((s, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            background: '#eee',
                                                            color: '#333',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {s.style} (+₹{s.cost})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {isProductAvailable(p) ? (
                                            <span style={{
                                                background: 'rgba(40, 167, 69, 0.2)',
                                                color: '#28a745',
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(40, 167, 69, 0.4)'
                                            }}>Available</span>
                                        ) : (
                                            <span style={{
                                                background: 'rgba(220, 53, 69, 0.2)',
                                                color: '#dc3545',
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(220, 53, 69, 0.4)'
                                            }}>Not Available</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="adm-action-btn" onClick={() => handleEditClick(p)}>Edit</button>
                                            <button className="adm-action-btn adm-action-btn--reject" onClick={() => setPendingDeleteProduct(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Custom Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        background: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid var(--admin-gold)',
                        borderRadius: '8px',
                        padding: '30px',
                        width: '95%',
                        maxWidth: '700px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        fontFamily: "'Montserrat', sans-serif",
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'Cinzel', serif", color: 'var(--admin-gold)', fontSize: '1.4rem', margin: 0, textTransform: 'uppercase' }}>
                                {editProduct ? 'Edit Base Product' : 'Add Base Product'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ccc',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {isSaving && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '20px 0',
                                color: 'var(--admin-gold)',
                                fontWeight: 'bold'
                            }}>
                                <div className="adm-spinner" style={{ marginBottom: 12 }}></div>
                                <p>Saving product... uploading images to secure storage...</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: isSaving ? 'none' : 'block' }}>
                            {/* Product basic info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Product Title *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Premium Fleece Hoodie"
                                        value={formData.title}
                                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                        style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => {
                                            setFormData(p => ({ ...p, category: e.target.value }));
                                        }}
                                        style={{ padding: 10, background: 'rgba(18, 18, 18, 0.95)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none' }}
                                    >
                                        {categoriesList.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Target Gender *</label>
                                    <select
                                        value={formData.gender || 'Unisex'}
                                        onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                                        style={{ padding: 10, background: 'rgba(18, 18, 18, 0.95)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none' }}
                                    >
                                        <option value="Unisex">Unisex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Availability Status *</label>
                                    <select
                                        value={formData.available ? "true" : "false"}
                                        onChange={e => setFormData(p => ({ ...p, available: e.target.value === 'true' }))}
                                        style={{ padding: 10, background: 'rgba(18, 18, 18, 0.95)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none' }}
                                    >
                                        <option value="true">Available</option>
                                        <option value="false">Not Available</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Base Cost (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="e.g. 999"
                                        value={formData.cost}
                                        onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                                        style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Product Details (One point per line)</label>
                                    <textarea
                                        placeholder="e.g. 100% Cotton&#10;Premium Quality&#10;Oversized Fit"
                                        value={formData.details}
                                        onChange={e => setFormData(p => ({ ...p, details: e.target.value }))}
                                        rows="4"
                                        style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 6, fontWeight: 600 }}>Wash Care (One point per line)</label>
                                    <textarea
                                        placeholder="e.g. Machine wash cold&#10;Do not bleach&#10;Tumble dry low"
                                        value={formData.washCare}
                                        onChange={e => setFormData(p => ({ ...p, washCare: e.target.value }))}
                                        rows="4"
                                        style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: 4, color: 'white', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {/* COLORS SECTION */}
                            <div style={{ borderTop: '1px solid #333', paddingTop: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h4 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: 'var(--admin-gold)', fontSize: '0.95rem' }}>
                                        Colors & Swatch Views
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addColorField}
                                        style={{
                                            padding: '4px 10px',
                                            background: 'var(--admin-dark)',
                                            border: '1px solid var(--admin-gold)',
                                            borderRadius: 4,
                                            color: 'var(--admin-gold)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            fontFamily: "'Montserrat', sans-serif"
                                        }}
                                    >
                                        <i className="fas fa-plus"></i> Add Color
                                    </button>
                                </div>

                                {colors.length === 0 ? (
                                    <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                                        No colors configured. Please add at least one color view.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {colors.map((c, index) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid #333',
                                                    borderRadius: 6,
                                                    padding: 12
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Color #{index + 1}</span>
                                                    
                                                    {/* Color Picker */}
                                                    <input
                                                        type="color"
                                                        value={c.color}
                                                        onChange={e => updateColorField(c.id, 'color', e.target.value)}
                                                        style={{ width: 36, height: 26, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                                    />

                                                    {/* Color Name */}
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Color name (e.g. Jet Black)"
                                                        value={c.colorName}
                                                        onChange={e => updateColorField(c.id, 'colorName', e.target.value)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid #444',
                                                            borderRadius: 4,
                                                            color: 'white',
                                                            outline: 'none',
                                                            fontSize: '0.75rem',
                                                            flex: '1 1 120px'
                                                        }}
                                                    />

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColorField(c.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--admin-danger)',
                                                            fontSize: '0.9rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    {/* Front View */}
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 }}>
                                                        <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: 4, fontWeight: 600 }}>Front View Image *</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            {c.frontPreview && (
                                                                <div style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    background: `url(${c.frontPreview}) center/cover no-repeat`,
                                                                    borderRadius: 4,
                                                                    border: '1px solid #555'
                                                                }}></div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => handleColorImageUpload(c.id, 'front', e.target.files[0])}
                                                                style={{ fontSize: '0.7rem', color: '#ccc', width: '100%' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Back View */}
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 }}>
                                                        <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: 4, fontWeight: 600 }}>Back View Image *</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            {c.backPreview && (
                                                                <div style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    background: `url(${c.backPreview}) center/cover no-repeat`,
                                                                    borderRadius: 4,
                                                                    border: '1px solid #555'
                                                                }}></div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => handleColorImageUpload(c.id, 'back', e.target.files[0])}
                                                                style={{ fontSize: '0.7rem', color: '#ccc', width: '100%' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PRINTING STYLES */}
                            <div style={{ borderTop: '1px solid #333', paddingTop: 16, marginBottom: 24 }}>
                                <h4 style={{ margin: '0 0 12px 0', fontFamily: "'Cinzel', serif", color: 'var(--admin-gold)', fontSize: '0.95rem' }}>
                                    Printing Options &amp; Add-on Costs
                                </h4>
                                {globalPrintStyles.length === 0 ? (
                                    <div style={{ padding: '14px', textAlign: 'center', border: '1px dashed #444', borderRadius: 4 }}>
                                        <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', margin: '0 0 8px' }}>
                                            No print styles configured yet.
                                        </p>
                                        <span
                                            onClick={() => navigate('/mfg/print-styles')}
                                            style={{ fontSize: '0.72rem', color: 'var(--admin-gold)', textDecoration: 'underline', fontFamily: "'Montserrat', sans-serif", cursor: 'pointer' }}
                                        >
                                            → Go to Print Styles to set them up
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {globalPrintStyles.map(ps => {
                                            const selectedObj = printingStyles.find(p => p.style === ps.name);
                                            const isSelected = !!selectedObj;
                                            return (
                                                <div
                                                    key={ps.id}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column',
                                                        padding: '10px 14px',
                                                        background: isSelected ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${isSelected ? 'var(--admin-gold)' : '#333'}`,
                                                        borderRadius: 4, transition: 'all 0.15s',
                                                        marginBottom: 8
                                                    }}
                                                >
                                                    <div 
                                                        onClick={() => togglePrintingStyle(ps.name)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%' }}
                                                    >
                                                        {/* Custom checkbox */}
                                                        <span style={{
                                                            width: 16, height: 16, flexShrink: 0,
                                                            border: `2px solid ${isSelected ? 'var(--admin-gold)' : '#555'}`,
                                                            background: isSelected ? 'var(--admin-gold)' : 'transparent',
                                                            borderRadius: 3,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.15s',
                                                        }}>
                                                            {isSelected && (
                                                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                                    <path d="M1 3.5L3.5 6L8 1" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                        {/* Reference thumbnail */}
                                                        {ps.imageUrl && (
                                                            <img
                                                                src={ps.imageUrl}
                                                                alt={ps.name}
                                                                onClick={e => { e.stopPropagation(); window.open(ps.imageUrl, '_blank'); }}
                                                                style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, border: '1px solid #444', flexShrink: 0, cursor: 'zoom-in' }}
                                                                title="Click to view reference image"
                                                            />
                                                        )}
                                                        <span style={{ flex: 1, fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: isSelected ? '#fff' : '#ccc', fontWeight: 600 }}>
                                                            {ps.name}
                                                        </span>
                                                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', color: isSelected ? 'var(--admin-gold)' : '#666', fontWeight: 600 }}>
                                                            +₹{ps.cost}
                                                        </span>
                                                    </div>

                                                    {/* Placements for this style */}
                                                    {isSelected && ps.placements && ps.placements.length > 0 && (
                                                        <div style={{ marginTop: 12, borderTop: '1px solid #444', paddingTop: 8 }}>
                                                            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginBottom: 6 }}>Allowed Placements:</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                                                                {ps.placements.map(pid => {
                                                                    const label = getPlacementLabel(ps, pid);
                                                                    const isPlSel = selectedObj.placements.some(p => p.id === pid);
                                                                    return (
                                                                        <label 
                                                                            key={pid} 
                                                                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: isPlSel ? '#fff' : '#aaa', cursor: 'pointer', userSelect: 'none' }}
                                                                        >
                                                                            <input 
                                                                                type="checkbox"
                                                                                checked={isPlSel}
                                                                                onChange={() => togglePlacementForStyle(ps.name, pid, label)}
                                                                                style={{ accentColor: 'var(--admin-gold)' }}
                                                                            />
                                                                            {label}
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* SIZING & SIZE CHART */}
                            <div style={{ borderTop: '1px solid #333', paddingTop: 16, marginBottom: 24 }}>
                                <h4 style={{ margin: '0 0 12px 0', fontFamily: "'Cinzel', serif", color: 'var(--admin-gold)', fontSize: '0.95rem' }}>
                                    Sizing & Size Chart *
                                </h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    {/* Size Chart Image Upload */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#ccc', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                            Size Chart Image *
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {sizeChartPreview && (
                                                <div style={{ position: 'relative', width: '100%', maxHeight: '150px', overflow: 'hidden', borderRadius: 4, border: '1px solid #555' }}>
                                                    <img 
                                                        src={sizeChartPreview} 
                                                        alt="Size Chart Preview" 
                                                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} 
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSizeChartFile(null);
                                                            setSizeChartPreview('');
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            right: 6,
                                                            background: 'rgba(0,0,0,0.8)',
                                                            border: '1px solid var(--admin-danger)',
                                                            color: 'var(--admin-danger)',
                                                            borderRadius: '50%',
                                                            width: 24,
                                                            height: 24,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        title="Remove Image"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleSizeChartUpload(e.target.files[0])}
                                                style={{ fontSize: '0.75rem', color: '#ccc', width: '100%' }}
                                            />
                                            <span style={{ fontSize: '0.65rem', color: '#888' }}>Upload an image detailing measurements for each size.</span>
                                        </div>
                                    </div>

                                    {/* Sizes Configuration */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#ccc', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                                Available Sizes *
                                            </label>
                                            
                                            {/* Standard Sizes Checkboxes */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                                                {STANDARD_SIZES.map(size => (
                                                    <label key={size} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#ccc', cursor: 'pointer', userSelect: 'none' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSizes.includes(size)}
                                                            onChange={e => handleSizeCheckboxChange(size, e.target.checked)}
                                                            style={{ accentColor: 'var(--admin-gold)', cursor: 'pointer' }}
                                                        />
                                                        {size}
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Custom Size Field */}
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #333', paddingTop: 10 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Custom size (e.g. 30, XXL)"
                                                    value={customSizeInput}
                                                    onChange={e => setCustomSizeInput(e.target.value)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid #444',
                                                        borderRadius: 4,
                                                        color: 'white',
                                                        outline: 'none',
                                                        fontSize: '0.75rem',
                                                        flex: 1
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            handleAddCustomSize(e);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomSize}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'var(--admin-dark)',
                                                        border: '1px solid var(--admin-gold)',
                                                        borderRadius: 4,
                                                        color: 'var(--admin-gold)',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        fontFamily: "'Montserrat', sans-serif"
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {/* Selected Sizes Tags */}
                                        <div>
                                            {selectedSizes.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                                    {selectedSizes.map(size => (
                                                        <span key={size} style={{
                                                            background: 'rgba(212, 175, 55, 0.1)',
                                                            color: 'var(--admin-gold)',
                                                            border: '1px solid var(--admin-gold)',
                                                            padding: '2px 8px',
                                                            borderRadius: 12,
                                                            fontSize: '0.7rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            fontWeight: 500
                                                        }}>
                                                            {size}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSize(size)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: 'var(--admin-gold)',
                                                                    cursor: 'pointer',
                                                                    padding: 0,
                                                                    fontSize: '0.75rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit and Cancel buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #333', paddingTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'transparent',
                                        border: '1px solid #666',
                                        borderRadius: 4,
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="adm-settings__btn"
                                    style={{ padding: '10px 20px', borderRadius: 4, margin: 0, fontSize: '0.75rem' }}
                                >
                                    Save Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {pendingDeleteProduct && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Delete Product</h3>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to permanently delete this product?
                        </div>
                        <div className="modal-footer">
                            <button className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => setPendingDeleteProduct(null)}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: '#dc3545', color: '#fff', marginTop: 0 }} onClick={executeDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
        </main>
    );
}

export default MfgProducts;
