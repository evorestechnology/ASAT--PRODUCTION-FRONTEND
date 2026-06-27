import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const PLACEMENT_MATRIX = {
    dtf: {
        "tshirt front": ["pocket", "a6", "a4", "a3", "14x16", "16x20"],
        "tshirt back": ["a6", "a4", "a3", "14x16", "16x20"],
        "pant front": ["right", "left", "right upper", "right lower", "left upper", "left lower"],
        "pant back": ["right", "left", "right upper", "right lower", "left upper", "left lower"]
    },
    dtg: {
        "tshirt front": ["pocket", "a6", "a4", "a3", "14x16", "16x20"],
        "tshirt back": ["a6", "a4", "a3", "14x16", "16x20"],
        "pant front": ["right", "left", "right upper", "right lower", "left upper", "left lower"],
        "pant back": ["right", "left", "right upper", "right lower", "left upper", "left lower"]
    },
    embrio: {
        "tshirt front": ["a6"],
        "tshirt back": ["a6"],
        "pant front": ["right upper", "left upper"],
        "pant back": ["right upper", "left upper"]
    }
};

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

function MfgProducts() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [companyName, setCompanyName] = useState('Manufacturer');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dbCategories, setDbCategories] = useState([]);
    const [dbPrintStyles, setDbPrintStyles] = useState([]);

    // Workflow state
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

    // Form inputs state
    const [editProductId, setEditProductId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        cost: '',
        gender: 'unisex',
        details: '',
        washCare: '',
        referenceFile: null,
        referencePreview: ''
    });

    const [colors, setColors] = useState([]); // [{id, color, colorName, mode, frontFile, frontPreview, backFile, backPreview}]
    
    // UI state for color panel
    const [showColorPanel, setShowColorPanel] = useState(false);
    const [pickerSwatch, setPickerSwatch] = useState('#000000');
    const [pickerName, setPickerName] = useState('');
    const [pickerMode, setPickerMode] = useState('dark');
    const [pickerFrontFile, setPickerFrontFile] = useState(null);
    const [pickerBackFile, setPickerBackFile] = useState(null);
    
    // Print Methods UI State (Replacing old selectedDesigns)
    const [printMethods, setPrintMethods] = useState([]); // [{ id, type, category, options: { optionName: { imageFile, imagePreview, price, darkPrice, lightPrice } } }]
    const [isPmModalOpen, setIsPmModalOpen] = useState(false);
    const [pmType, setPmType] = useState('');
    // Multi-category state: { catKey: { optName: { price, darkPrice, lightPrice, imageFile, imagePreview } } }
    const [pmCategories, setPmCategories] = useState({});
    const [pmSelectedCat, setPmSelectedCat] = useState(''); // the picker dropdown value
    const [pmExpandedCat, setPmExpandedCat] = useState(''); // which category accordion is open
    const [pmExpandedRow, setPmExpandedRow] = useState(null); // index within expanded cat
    const [pmEditId, setPmEditId] = useState(null);

    // Sizing
    const [sizeChartFile, setSizeChartFile] = useState(null);
    const [sizeChartPreview, setSizeChartPreview] = useState('');
    const [selectedSizes, setSelectedSizes] = useState(new Set());

    // Fetch manufacturer profile
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

    // Fetch print styles
    useEffect(() => {
        if (!user) return;
        const fetchPrintStyles = async () => {
            try {
                const data = await apiFetch(`/api/print-styles?mfg_id=${user.id}`);
                setDbPrintStyles(data || []);
            } catch (err) {
                console.error('Error fetching print styles:', err);
            }
        };
        fetchPrintStyles();
    }, [user]);

    const fetchProducts = async () => {
        if (!user) return;
        try {
            const data = await apiFetch(`/api/products/mfg?cb=${Date.now()}`);
            setProducts(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchProducts();
    }, [user]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiFetch('/api/categories');
                setDbCategories(data || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const categoriesList = useMemo(() => {
        const uniqueCats = new Set(dbCategories.map(c => c.name).filter(Boolean));
        return Array.from(uniqueCats).sort();
    }, [dbCategories]);

    const activeCategoryNames = useMemo(() => {
        return new Set(dbCategories.filter(c => c.active !== false).map(c => c.name).filter(Boolean));
    }, [dbCategories]);

    const isProductAvailable = (p) => {
        if (p.available === false) return false;
        if (!activeCategoryNames.has(p.category)) return false;
        return true;
    };

    const handleCreateClick = () => {
        setEditProductId(null);
        resetForm();
        setIsCreating(true);
    };

    const handleEditClick = (p) => {
        setEditProductId(p.id);
        
        // Pre-fill form data
        setFormData({
            title: p.title || '',
            category: p.category || (categoriesList[0] || ''),
            cost: p.cost || '',
            gender: p.gender || 'unisex',
            details: (p.details || []).join('\n'),
            washCare: (p.wash_care || p.washCare || []).join('\n'),
            referenceFile: null,
            referencePreview: p.cover_image || ''
        });

        // Pre-fill colors
        setColors((p.colors || []).map((c, i) => ({
            id: Date.now() + i,
            color: c.color,
            colorName: c.colorName,
            mode: c.mode || 'dark',
            frontFile: null,
            frontPreview: c.frontImage || c.frontPreview,
            backFile: null,
            backPreview: c.backImage || c.backPreview,
            available: c.available !== false
        })));

        // Pre-fill print methods
        // DB format: [{ style: 'dtg', placements: [{ id: 'tshirt front_pocket', label, cost_dark, cost_light, image, price }] }]
        const parsedMethods = [];
        (p.printing_styles || p.printingStyles || []).forEach(ps => {
            const grouped = {};
            (ps.placements || []).forEach(pl => {
                const opt = pl.label || '';
                let cat = 'default';
                if (pl.id) {
                    if (opt && pl.id.endsWith('_' + opt)) {
                        cat = pl.id.substring(0, pl.id.length - opt.length - 1);
                    } else if (pl.id.includes('_')) {
                        const idx = pl.id.lastIndexOf('_');
                        cat = pl.id.substring(0, idx);
                    } else {
                        cat = pl.id;
                    }
                }
                if (!grouped[cat]) grouped[cat] = {};
                grouped[cat][opt || pl.id] = {
                    imagePreview: pl.image || '',
                    imageFile: null,
                    price: pl.price || '',
                    darkPrice: pl.cost_dark || '',
                    lightPrice: pl.cost_light || ''
                };
            });
            Object.keys(grouped).forEach(cat => {
                const placementsInCat = ps.placements.filter(pl => {
                    const optId = pl.id || '';
                    return optId.startsWith(cat + '_') || optId === cat;
                });
                const isActive = placementsInCat.length > 0 ? placementsInCat.some(pl => pl.active !== false) : true;

                parsedMethods.push({
                    id: Date.now() + Math.random(),
                    type: ps.style,
                    category: cat,
                    options: grouped[cat],
                    active: isActive
                });
            });
        });
        setPrintMethods(parsedMethods);

        // Pre-fill sizes
        setSizeChartFile(null);
        setSizeChartPreview(p.size_chart_image || p.sizeChartImage || '');
        setSelectedSizes(new Set(p.sizes || []));

        setIsCreating(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: categoriesList[0] || '',
            cost: '',
            gender: 'unisex',
            details: '',
            washCare: '',
            referenceFile: null,
            referencePreview: ''
        });
        setColors([]);
        setShowColorPanel(false);
        setPickerSwatch('#000000');
        setPickerName('');
        setPickerMode('dark');
        setPickerFrontFile(null);
        setPickerBackFile(null);
        setPrintMethods([]);
        setSizeChartFile(null);
        setSizeChartPreview('');
        setSelectedSizes(new Set());
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

    // Color Swatch Logic
    const hexToRgbStr = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
    };

    const handleSaveColor = () => {
        if (!pickerName.trim()) {
            showToast('Please provide a color name.', 'error');
            return;
        }
        if (!pickerFrontFile && !editProductId) {
            showToast('Please upload a front reference image.', 'error');
            return;
        }
        if (!pickerBackFile && !editProductId) {
            showToast('Please upload a back reference image.', 'error');
            return;
        }

        const frontPrev = pickerFrontFile ? URL.createObjectURL(pickerFrontFile) : '';
        const backPrev = pickerBackFile ? URL.createObjectURL(pickerBackFile) : '';

        setColors(prev => [...prev, {
            id: Date.now(),
            color: pickerSwatch,
            colorName: pickerName.trim(),
            mode: pickerMode,
            frontFile: pickerFrontFile,
            frontPreview: frontPrev,
            backFile: pickerBackFile,
            backPreview: backPrev
        }]);

        // Reset picker
        setPickerName('');
        setPickerMode('dark');
        setPickerFrontFile(null);
        setPickerBackFile(null);
        setShowColorPanel(false);
    };

    const handleRemoveColor = (id) => {
        setColors(prev => prev.filter(c => c.id !== id));
    };

    // ── Print Methods Modal (multi-category) ──────────────────────
    const openPmModal = () => {
        setPmEditId(null);
        setPmType('');
        setPmCategories({});
        setPmSelectedCat('');
        setPmExpandedCat('');
        setPmExpandedRow(null);
        setIsPmModalOpen(true);
    };

    const closePmModal = () => setIsPmModalOpen(false);

    const handlePmTypeChange = (e) => {
        if (Object.keys(pmCategories).length > 0) {
            if (!window.confirm('Changing Print Type will clear your current configuration. Continue?')) return;
        }
        setPmType(e.target.value);
        setPmCategories({});
        setPmSelectedCat('');
        setPmExpandedCat('');
    };

    // Add a new category to the multi-category dict
    const handleAddPmCategory = () => {
        if (!pmSelectedCat) return;
        if (pmCategories[pmSelectedCat]) {
            showToast('This category is already added.', 'error');
            return;
        }
        const opts = {};
        (PLACEMENT_MATRIX[pmType]?.[pmSelectedCat] || []).forEach(opt => {
            opts[opt] = { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' };
        });
        setPmCategories(prev => ({ ...prev, [pmSelectedCat]: opts }));
        setPmExpandedCat(pmSelectedCat); // auto-expand newly added
        setPmSelectedCat('');
        setPmExpandedRow(null);
    };

    const handleRemovePmCategory = (catKey) => {
        setPmCategories(prev => {
            const next = { ...prev };
            delete next[catKey];
            return next;
        });
        if (pmExpandedCat === catKey) setPmExpandedCat('');
    };

    const updatePmOption = (catKey, optName, field, value) => {
        setPmCategories(prev => ({
            ...prev,
            [catKey]: {
                ...prev[catKey],
                [optName]: { ...prev[catKey][optName], [field]: value }
            }
        }));
    };

    const isOptionValid = (opt, type) => {
        const hasImage = opt.imageFile || opt.imagePreview;
        if (!hasImage) return false;
        if ((type || pmType) === 'dtg') return opt.darkPrice !== '' && opt.lightPrice !== '';
        return opt.price !== '';
    };

    const savePrintMethod = () => {
        // Validate: at least one option configured across all categories
        let totalConfigured = 0;
        Object.values(pmCategories).forEach(catOpts => {
            Object.values(catOpts).forEach(opt => { if (isOptionValid(opt)) totalConfigured++; });
        });
        if (totalConfigured === 0) {
            showToast('Please fully configure at least one placement option.', 'error');
            return;
        }
        // Filter each category to only configured options
        const filteredCats = {};
        Object.keys(pmCategories).forEach(catKey => {
            const configured = {};
            Object.keys(pmCategories[catKey]).forEach(optName => {
                if (isOptionValid(pmCategories[catKey][optName])) configured[optName] = pmCategories[catKey][optName];
            });
            if (Object.keys(configured).length > 0) filteredCats[catKey] = configured;
        });

        // Save as multiple entries (one per category) — preserving original per-category architecture
        if (pmEditId) {
            // Remove ALL entries of the same type (not just the one clicked),
            // because the edit modal shows/edits all categories for that type at once.
            setPrintMethods(prev => {
                // Collect active states from the existing same-type entries to preserve them
                const existingActiveByCategory = {};
                prev.filter(pm => pm.type === pmType).forEach(pm => {
                    existingActiveByCategory[pm.category] = pm.active !== false;
                });

                const filtered = prev.filter(pm => pm.type !== pmType);
                const newEntries = Object.keys(filteredCats).map((catKey, i) => ({
                    id: pmEditId + i,
                    type: pmType,
                    category: catKey,
                    options: filteredCats[catKey],
                    // Preserve active state: default to true for new categories, preserve for existing ones
                    active: existingActiveByCategory.hasOwnProperty(catKey) ? existingActiveByCategory[catKey] : true
                }));
                return [...filtered, ...newEntries];
            });
        } else {
            const newEntries = Object.keys(filteredCats).map((catKey, i) => ({
                id: Date.now() + i,
                type: pmType,
                category: catKey,
                options: filteredCats[catKey],
                active: true
            }));
            setPrintMethods(prev => [...prev, ...newEntries]);
        }
        closePmModal();
    };


    // Edit: load all categories for the same type into the multi-cat UI
    const editPrintMethod = (pm) => {
        setPmEditId(pm.id);
        setPmType(pm.type);
        // Load all existing entries of same type into the modal
        const sametype = printMethods.filter(x => x.type === pm.type);
        const rebuiltCats = {};
        sametype.forEach(entry => {
            const opts = {};
            // Populate fallback options
            const fallbackList = PLACEMENT_MATRIX[entry.type]?.[entry.category] || [];
            fallbackList.forEach(optName => {
                opts[optName] = entry.options[optName] || { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' };
            });
            // Populate custom/previously saved options not in fallback
            Object.keys(entry.options || {}).forEach(optName => {
                if (!opts[optName]) {
                    opts[optName] = entry.options[optName];
                }
            });
            rebuiltCats[entry.category] = opts;
        });
        setPmCategories(rebuiltCats);
        setPmSelectedCat('');
        setPmExpandedCat(pm.category);
        setPmExpandedRow(null);
        setIsPmModalOpen(true);
    };

    const removePrintMethod = (id) => {
        setPrintMethods(prev => prev.filter(pm => pm.id !== id));
    };

    const getNormalizedType = (type) => {
        if (!type) return '';
        const t = type.toLowerCase();
        if (t === 'dtf') return 'dtf';
        if (t === 'dtg') return 'dtg';
        if (t === 'embrio' || t === 'embroidery') return 'embrio';
        return t;
    };

    const handleToggleDbPrintStyle = (styleId, checked) => {
        if (checked) {
            const selectedStyle = dbPrintStyles.find(ps => ps.id === styleId);
            if (!selectedStyle) return;
            // Add all categories/placements from this print style to printMethods
            const newEntries = [];
            (selectedStyle.placementCategories || []).forEach(pc => {
                const opts = {};
                Object.keys(pc.placements || {}).forEach(optName => {
                    const pl = pc.placements[optName];
                    opts[optName] = {
                        price: pl.price !== undefined ? String(pl.price) : '',
                        darkPrice: pl.darkPrice !== undefined ? String(pl.darkPrice) : '',
                        lightPrice: pl.lightPrice !== undefined ? String(pl.lightPrice) : '',
                        imageFile: null,
                        imagePreview: pl.imagePreview || ''
                    };
                });
                newEntries.push({
                    id: styleId + '_' + pc.category + '_' + Date.now() + Math.random(),
                    type: getNormalizedType(selectedStyle.category),
                    category: pc.category,
                    options: opts,
                    fromStyleId: styleId
                });
            });
            setPrintMethods(prev => [...prev, ...newEntries]);
        } else {
            // Remove all print methods that came from this style
            setPrintMethods(prev => prev.filter(pm => pm.fromStyleId !== styleId));
        }
    };

    // Toggle a single category within a saved print style
    const handleTogglePrintCategory = (styleId, pc, checked) => {
        if (checked) {
            const selectedStyle = dbPrintStyles.find(ps => ps.id === styleId);
            if (!selectedStyle) return;
            const opts = {};
            Object.keys(pc.placements || {}).forEach(optName => {
                const pl = pc.placements[optName];
                opts[optName] = {
                    price: pl.price !== undefined ? String(pl.price) : '',
                    darkPrice: pl.darkPrice !== undefined ? String(pl.darkPrice) : '',
                    lightPrice: pl.lightPrice !== undefined ? String(pl.lightPrice) : '',
                    imageFile: null,
                    imagePreview: pl.imagePreview || ''
                };
            });
            const newEntry = {
                id: styleId + '_' + pc.category + '_' + Date.now(),
                type: getNormalizedType(selectedStyle.category),
                category: pc.category,
                options: opts,
                fromStyleId: styleId,
                fromCategory: pc.category
            };
            setPrintMethods(prev => [...prev, newEntry]);
        } else {
            // Remove only the entry matching this style + category
            setPrintMethods(prev => prev.filter(pm => !(pm.fromStyleId === styleId && pm.fromCategory === pc.category)));
        }
    };


    const handleSizeToggle = (size) => {
        const next = new Set(selectedSizes);
        if (next.has(size)) next.delete(size);
        else next.add(size);
        setSelectedSizes(next);
    };

    // Main Submit
    const handleSubmit = async () => {
        if (!formData.title || !formData.category || !formData.cost || !formData.details || !formData.washCare) {
            showToast('Please fill out all required fields (*)', 'error');
            return;
        }
        if (colors.length === 0) {
            showToast('Please add at least one color.', 'error');
            return;
        }
        if (selectedSizes.size === 0) {
            showToast('Please select at least one size.', 'error');
            return;
        }
        if (printMethods.length === 0) {
            showToast('Please add at least one printing method.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // Upload Reference File
            let finalReference = formData.referencePreview;
            if (formData.referenceFile) {
                const ext = formData.referenceFile.name.split('.').pop() || 'jpg';
                const filePath = `products/${user.id}/references/${Date.now()}_ref.${ext}`;
                finalReference = await uploadFile(formData.referenceFile, filePath, 'asat-uploads');
            }

            // Upload Size Chart
            let finalSizeChart = sizeChartPreview;
            if (sizeChartFile) {
                const ext = sizeChartFile.name.split('.').pop() || 'jpg';
                const filePath = `products/${user.id}/size_charts/${Date.now()}_size_chart.${ext}`;
                finalSizeChart = await uploadFile(sizeChartFile, filePath, 'asat-uploads');
            }

            // Upload Color Images
            const finalColors = [];
            for (let c of colors) {
                let fUrl = c.frontPreview;
                let bUrl = c.backPreview;
                if (c.frontFile) {
                    const ext = c.frontFile.name.split('.').pop() || 'jpg';
                    const filePath = `products/${user.id}/${Date.now()}_front_${c.colorName.replace(/\s+/g, '_')}.${ext}`;
                    fUrl = await uploadFile(c.frontFile, filePath, 'asat-uploads');
                }
                if (c.backFile) {
                    const ext = c.backFile.name.split('.').pop() || 'jpg';
                    const filePath = `products/${user.id}/${Date.now()}_back_${c.colorName.replace(/\s+/g, '_')}.${ext}`;
                    bUrl = await uploadFile(c.backFile, filePath, 'asat-uploads');
                }
                finalColors.push({
                    color: c.color,
                    colorName: c.colorName,
                    mode: c.mode,
                    frontImage: fUrl,
                    backImage: bUrl,
                    available: c.available !== false
                });
            }

            // Upload Placement Reference Images and Build printing_styles Array
            const styleGroups = {}; // { dtf: [], dtg: [] }
            for (let pm of printMethods) {
                if (!styleGroups[pm.type]) styleGroups[pm.type] = [];

                for (let optName of Object.keys(pm.options)) {
                    const opt = pm.options[optName];
                    let imgUrl = opt.imagePreview;
                    if (opt.imageFile) {
                        const ext = opt.imageFile.name.split('.').pop() || 'jpg';
                        const filePath = `products/${user.id}/placements/${Date.now()}_${pm.type}_${optName.replace(/\s+/g, '_')}.${ext}`;
                        imgUrl = await uploadFile(opt.imageFile, filePath, 'asat-uploads');
                    }
                    
                    styleGroups[pm.type].push({
                        id: `${pm.category}_${optName}`,
                        label: optName,
                        image: imgUrl,
                        price: parseFloat(opt.price) || 0,
                        cost_dark: parseFloat(opt.darkPrice) || 0,
                        cost_light: parseFloat(opt.lightPrice) || 0,
                        active: pm.active !== false
                    });
                }
            }

            const printing_styles = Object.keys(styleGroups).map(type => ({
                style: type,
                cost: 0, // global style cost not used in this architecture
                placements: styleGroups[type]
            }));

            const payload = {
                title: formData.title.trim(),
                category: formData.category,
                cost: parseFloat(formData.cost) || 0,
                gender: formData.gender,
                cover_image: finalReference || finalColors[0]?.frontImage || '',
                colors: finalColors,
                printing_styles,
                size_chart_image: finalSizeChart,
                sizes: Array.from(selectedSizes),
                details: formData.details.split('\n').map(s => s.trim()).filter(Boolean),
                wash_care: formData.washCare.split('\n').map(s => s.trim()).filter(Boolean),
                mfg_id: user.id,
                mfg_name: companyName,
                available: true
            };

            if (editProductId) {
                await apiFetch(`/api/products/${editProductId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            showToast(editProductId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            setIsCreating(false);
            fetchProducts();
        } catch (err) {
            console.error('Error saving product:', err);
            showToast('Failed to save product: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p => {
        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            return (p.title || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
        }
        return true;
    });

    if (isCreating) {
        return (
            <main className="adm-page" style={{ paddingBottom: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                    <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="adm-page__title" style={{ margin: 0, padding: 0 }}>{editProductId ? 'Edit Product' : 'New Product Configuration'}</h1>
                        <p className="adm-page__subtitle" style={{ margin: 0 }}>Define your blank base product options</p>
                    </div>
                </div>

                <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 25, background: '#1c1c1c', padding: 30, borderRadius: 8, border: '1px solid #333' }}>
                    
                    {/* Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Category *</label>
                        <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }}>
                            {categoriesList.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Name of the Product *</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Premium Cotton T-Shirt"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }}
                        />
                    </div>

                    {/* Upload Reference */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Upload Reference</label>
                        <div style={{ padding: 15, background: '#2c2c2c', border: '1px solid #444', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: formData.referenceFile || formData.referencePreview ? 'white' : '#888' }}>
                                {formData.referenceFile ? formData.referenceFile.name : (formData.referencePreview ? 'Reference Uploaded' : 'No file uploaded')}
                            </span>
                            <button 
                                onClick={() => document.getElementById('refUpload').click()}
                                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                                Choose File
                            </button>
                            <input id="refUpload" type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => {
                                if(e.target.files[0]) {
                                    setFormData({...formData, referenceFile: e.target.files[0]});
                                }
                            }} />
                        </div>
                    </div>

                    {/* Gender & Base Cost row */}
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Gender *</label>
                            <select 
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Base Cost (₹) *</label>
                            <input 
                                type="number" step="0.01" min="0" placeholder="0.00"
                                value={formData.cost}
                                onChange={e => setFormData({...formData, cost: e.target.value})}
                                style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Product Details *</label>
                        <textarea 
                            rows="3" placeholder="Enter product description (each line is a bullet point)"
                            value={formData.details}
                            onChange={e => setFormData({...formData, details: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    {/* Wash Care */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Wash Care Instructions *</label>
                        <textarea 
                            rows="3" placeholder="Enter washing care guidelines (each line is a bullet point)"
                            value={formData.washCare}
                            onChange={e => setFormData({...formData, washCare: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    {/* Colors Module */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 8 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Colors</label>
                            <button type="button" onClick={() => setShowColorPanel(!showColorPanel)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                {showColorPanel ? 'Cancel Color' : '+ Add Color'}
                            </button>
                        </div>

                        {showColorPanel && (
                            <div style={{ padding: 20, background: '#252525', border: '1px solid #444', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 15 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#ccc' }}>Color swatch:</label>
                                    <input type="color" value={pickerSwatch} onChange={e => setPickerSwatch(e.target.value)} style={{ width: 40, height: 40, cursor: 'pointer', border: 'none', background: 'transparent' }} />
                                    <input type="text" value={pickerSwatch} onChange={e => setPickerSwatch(e.target.value)} style={{ width: 100, padding: '6px 10px', background: '#1c1c1c', border: '1px solid #444', color: 'white', borderRadius: 4 }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#ccc' }}>RGB values:</label>
                                    <input type="text" readOnly value={hexToRgbStr(pickerSwatch)} style={{ flex: 1, padding: '6px 10px', background: '#1c1c1c', border: '1px solid #444', color: '#aaa', borderRadius: 4 }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#ccc' }}>Color Name:</label>
                                    <input type="text" placeholder="e.g. Jet Black" value={pickerName} onChange={e => {
                                        setPickerName(e.target.value);
                                        const v = e.target.value.toLowerCase();
                                        if (v.includes('white')) setPickerMode('light');
                                        else if (v.includes('black') || v.includes('navy')) setPickerMode('dark');
                                    }} style={{ flex: 1, padding: '6px 10px', background: '#1c1c1c', border: '1px solid #444', color: 'white', borderRadius: 4 }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#ccc' }}>Garment Mode:</label>
                                    <select value={pickerMode} onChange={e => setPickerMode(e.target.value)} style={{ flex: 1, padding: '6px 10px', background: '#1c1c1c', border: '1px solid #444', color: 'white', borderRadius: 4, outline: 'none' }}>
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                    </select>
                                </div>
                                <div style={{ borderTop: '1px solid #333', paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Front Reference Image:</label>
                                    <input type="file" accept="image/*" onChange={e => setPickerFrontFile(e.target.files[0])} style={{ color: '#ccc', fontSize: '0.8rem' }} />
                                    
                                    <label style={{ fontSize: '0.8rem', color: '#ccc', marginTop: 10 }}>Back View Reference Image:</label>
                                    <input type="file" accept="image/*" onChange={e => setPickerBackFile(e.target.files[0])} style={{ color: '#ccc', fontSize: '0.8rem' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                                    <button onClick={handleSaveColor} style={{ padding: '8px 20px', background: 'var(--gold)', border: 'none', borderRadius: 4, color: 'black', fontWeight: 600, cursor: 'pointer' }}>
                                        Save Color
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {colors.length === 0 && <p style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic' }}>No colors added yet.</p>}
                            {colors.map(color => (
                                <div key={color.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#252525', border: '1px solid #444', borderRadius: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: color.color, border: '1px solid #666' }}></div>
                                            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{color.colorName}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'monospace' }}>({color.color})</span>
                                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: color.mode === 'dark' ? '#333' : '#ddd', color: color.mode === 'dark' ? '#fff' : '#000', borderRadius: 12 }}>{color.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#aaa', cursor: 'pointer', marginLeft: 8 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={color.available !== false} 
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setColors(prev => prev.map(x => x.id === color.id ? { ...x, available: isChecked } : x));
                                                    }} 
                                                    style={{ width: 12, height: 12, accentColor: '#C5A059', cursor: 'pointer' }}
                                                />
                                                Available
                                            </label>
                                        </div>
                                        <button onClick={() => handleRemoveColor(color.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: '#aaa', borderTop: '1px solid #333', paddingTop: 8 }}>
                                        <div><strong style={{color:'#ccc'}}>Front:</strong> {color.frontFile ? color.frontFile.name : (color.frontPreview ? 'Uploaded' : 'None')}</div>
                                        <div><strong style={{color:'#ccc'}}>Back:</strong> {color.backFile ? color.backFile.name : (color.backPreview ? 'Uploaded' : 'None')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Printing Methods Manager — selection only (no manual add/edit/remove) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div style={{ borderBottom: '1px solid #333', paddingBottom: 8 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Printing Styles &amp; Placements</label>
                        </div>

                        {dbPrintStyles.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {dbPrintStyles.map(ps => {
                                    const totalCats = ps.placementCategories?.length || 0;
                                    const enabledCats = (ps.placementCategories || []).filter(pc =>
                                        printMethods.some(pm => pm.fromStyleId === ps.id && pm.fromCategory === pc.category)
                                    ).length;
                                    const allSelected = totalCats > 0 && enabledCats === totalCats;
                                    const someSelected = enabledCats > 0 && enabledCats < totalCats;

                                    return (
                                        <div key={ps.id} style={{ background: '#1c1c1c', border: `1px solid ${enabledCats > 0 ? 'var(--gold)' : '#333'}`, borderRadius: 6, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                                            {/* Style header — select all */}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: enabledCats > 0 ? 'rgba(197,160,89,0.07)' : 'transparent' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={el => { if (el) el.indeterminate = someSelected; }}
                                                    onChange={e => handleToggleDbPrintStyle(ps.id, e.target.checked)}
                                                    style={{ accentColor: 'var(--gold)', width: 15, height: 15, cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{ps.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>
                                                        {ps.category?.toUpperCase()} • {enabledCats}/{totalCats} selected
                                                    </span>
                                                </div>
                                            </label>

                                            {/* Individual category checkboxes */}
                                            {totalCats > 0 && (
                                                <div style={{ borderTop: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                    {(ps.placementCategories || []).map((pc, i) => {
                                                        const isCatEnabled = printMethods.some(pm => pm.fromStyleId === ps.id && pm.fromCategory === pc.category);
                                                        const optCount = Object.keys(pc.placements || {}).length;
                                                        return (
                                                            <label key={pc.category} style={{
                                                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                                                                cursor: 'pointer',
                                                                background: isCatEnabled ? 'rgba(197,160,89,0.04)' : 'transparent',
                                                                borderTop: i > 0 ? '1px solid #222' : 'none',
                                                                transition: 'background 0.15s'
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isCatEnabled}
                                                                    onChange={e => handleTogglePrintCategory(ps.id, pc, e.target.checked)}
                                                                    style={{ accentColor: 'var(--gold)', width: 14, height: 14, cursor: 'pointer' }}
                                                                />
                                                                <span style={{ fontSize: '0.85rem', color: isCatEnabled ? 'white' : '#aaa', fontWeight: isCatEnabled ? 600 : 400, textTransform: 'capitalize', flex: 1 }}>
                                                                    {pc.category}
                                                                </span>
                                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#252525', color: '#777', borderRadius: 10 }}>
                                                                    {optCount} placement{optCount !== 1 ? 's' : ''}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic' }}>
                                No saved print styles found. Please create print styles first from the Print Styles section.
                            </p>
                        )}
                    </div>

                    {/* Size Chart */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: 8 }}>Size Chart</label>
                        <div style={{ padding: 15, background: '#2c2c2c', border: '1px solid #444', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: sizeChartFile || sizeChartPreview ? 'white' : '#888' }}>
                                {sizeChartFile ? sizeChartFile.name : (sizeChartPreview ? 'Size Chart Uploaded' : 'No file uploaded')}
                            </span>
                            <button 
                                onClick={() => document.getElementById('sizeChartUpload').click()}
                                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                                Choose File
                            </button>
                            <input id="sizeChartUpload" type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => {
                                if(e.target.files[0]) {
                                    setSizeChartFile(e.target.files[0]);
                                }
                            }} />
                        </div>
                    </div>

                    {/* Select Sizes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: 8 }}>Select Sizes</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {STANDARD_SIZES.map(size => {
                                const isSelected = selectedSizes.has(size);
                                return (
                                    <div 
                                        key={size}
                                        onClick={() => handleSizeToggle(size)}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', 
                                            background: isSelected ? 'rgba(212,175,55,0.1)' : '#252525', 
                                            border: `1px solid ${isSelected ? 'var(--gold)' : '#444'}`, 
                                            borderRadius: 4, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s'
                                        }}>
                                        <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--gold)' }} />
                                        <span style={{ fontSize: '0.85rem', color: isSelected ? 'var(--gold)' : '#ccc', fontWeight: 600 }}>{size}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #444', paddingTop: 20, marginTop: 10 }}>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            style={{ padding: '15px', background: 'var(--gold)', color: 'black', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: '1rem', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                        <button 
                            onClick={() => setIsCreating(false)} 
                            disabled={isSaving}
                            style={{ padding: '12px', background: 'transparent', color: '#ccc', border: '1px solid #555', borderRadius: 4, fontWeight: 'bold', fontSize: '0.9rem', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                            Cancel / Reset
                        </button>
                    </div>

                </div>

                {/* ── Print Method Modal (multi-category) ── */}
                {isPmModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#1c1c1c', padding: 25, borderRadius: 8, width: 540, maxHeight: '88vh', overflowY: 'auto', border: '1px solid #444', color: 'white' }}>
                            <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>{pmEditId ? 'Edit' : 'Add'} Printing Method</h3>

                            {/* Print Type */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#ccc' }}>Print Type</label>
                                <select value={pmType} onChange={handlePmTypeChange}
                                    style={{ width: '100%', padding: '10px', background: '#2c2c2c', border: '1px solid #555', color: 'white', borderRadius: 4, outline: 'none' }}>
                                    <option value="" disabled>Select Print Type</option>
                                    <option value="dtf">DTF (Direct to Film)</option>
                                    <option value="dtg">DTG (Direct to Garment)</option>
                                    <option value="embrio">Embroidery</option>
                                </select>
                            </div>

                            {/* Saved Print Style Loader */}
                            {pmType && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#ccc' }}>Load from Saved Print Style (optional)</label>
                                    <select 
                                        onChange={e => {
                                            const styleId = e.target.value;
                                            if (styleId) {
                                                const selectedStyle = dbPrintStyles.find(ps => ps.id === styleId);
                                                if (selectedStyle) {
                                                    const rebuiltCats = {};
                                                    (selectedStyle.placementCategories || []).forEach(pc => {
                                                        const opts = {};
                                                        Object.keys(pc.placements || {}).forEach(optName => {
                                                            const pl = pc.placements[optName];
                                                            opts[optName] = {
                                                                price: pl.price !== undefined ? String(pl.price) : '',
                                                                darkPrice: pl.darkPrice !== undefined ? String(pl.darkPrice) : '',
                                                                lightPrice: pl.lightPrice !== undefined ? String(pl.lightPrice) : '',
                                                                imageFile: null,
                                                                imagePreview: pl.imagePreview || ''
                                                            };
                                                        });
                                                        rebuiltCats[pc.category] = opts;
                                                    });
                                                    setPmCategories(rebuiltCats);
                                                    if (Object.keys(rebuiltCats).length > 0) {
                                                        setPmExpandedCat(Object.keys(rebuiltCats)[0]);
                                                    }
                                                }
                                            }
                                        }}
                                        defaultValue=""
                                        style={{ width: '100%', padding: '10px', background: '#2c2c2c', border: '1px solid #555', color: 'white', borderRadius: 4, outline: 'none' }}>
                                        <option value="">-- Select a saved style to auto-fill --</option>
                                        {dbPrintStyles.filter(ps => {
                                            const t = ps.category?.toLowerCase();
                                            const target = pmType?.toLowerCase();
                                            if (target === 'dtf') return t === 'dtf';
                                            if (target === 'dtg') return t === 'dtg';
                                            if (target === 'embrio') return t === 'embrio' || t === 'embroidery';
                                            return false;
                                        }).map(ps => (
                                            <option key={ps.id} value={ps.id}>{ps.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Category picker + Add button */}
                            {pmType && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                id="mfgNewCatInput"
                                                list="mfgDbCategories"
                                                placeholder="Category (e.g. Tshirt Front)"
                                                style={{ flex: 1, padding: '10px', background: '#2c2c2c', border: '1px solid #555', color: 'white', borderRadius: 4, outline: 'none' }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.target.value.trim();
                                                        if (val) {
                                                            if (pmCategories[val]) {
                                                                showToast('Category already added.', 'error');
                                                            } else {
                                                                const opts = {};
                                                                const fallbackOpts = PLACEMENT_MATRIX[pmType]?.[val.toLowerCase()] || [];
                                                                fallbackOpts.forEach(opt => {
                                                                    opts[opt] = { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' };
                                                                });
                                                                setPmCategories(prev => ({ ...prev, [val]: opts }));
                                                                setPmExpandedCat(val);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                            <datalist id="mfgDbCategories">
                                                {dbCategories.map(cat => (
                                                    <option key={cat.id} value={cat.name} />
                                                ))}
                                            </datalist>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const el = document.getElementById('mfgNewCatInput');
                                                    const val = el?.value.trim();
                                                    if (val) {
                                                        if (pmCategories[val]) {
                                                            showToast('Category already added.', 'error');
                                                        } else {
                                                            const opts = {};
                                                            const fallbackOpts = PLACEMENT_MATRIX[pmType]?.[val.toLowerCase()] || [];
                                                            fallbackOpts.forEach(opt => {
                                                                opts[opt] = { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' };
                                                            });
                                                            setPmCategories(prev => ({ ...prev, [val]: opts }));
                                                            setPmExpandedCat(val);
                                                            el.value = '';
                                                        }
                                                    }
                                                }}
                                                style={{ padding: '10px 18px', background: 'white', color: 'black', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                    {Object.keys(pmCategories).length > 0 && (
                                        <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#666' }}>
                                            {Object.keys(pmCategories).length} categor{Object.keys(pmCategories).length === 1 ? 'y' : 'ies'} added
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Added categories with their options */}
                            {Object.keys(pmCategories).length > 0 && (
                                <div style={{ borderTop: '1px solid #333', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: 4 }}>Select Configuration Options</label>

                                    {Object.keys(pmCategories).map(catKey => {
                                        const catOpts = pmCategories[catKey];
                                        const isCatOpen = pmExpandedCat === catKey;
                                        const catConfigured = Object.values(catOpts).filter(o => isOptionValid(o, pmType)).length;

                                        return (
                                            <div key={catKey} style={{ border: `1px solid ${isCatOpen ? 'var(--gold, #c5a030)' : '#3a3a3a'}`, borderRadius: 6, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                                                {/* Category header */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isCatOpen ? 'rgba(197,160,48,0.07)' : '#252525', cursor: 'pointer' }}
                                                    onClick={() => { setPmExpandedCat(isCatOpen ? '' : catKey); setPmExpandedRow(null); }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isCatOpen ? '#c5a030' : 'white', textTransform: 'capitalize' }}>
                                                            {catKey.replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        {catConfigured > 0 && (
                                                            <span style={{ fontSize: '0.65rem', padding: '1px 7px', background: 'rgba(40,167,69,0.2)', color: '#28a745', borderRadius: 10, fontWeight: 700 }}>
                                                                {catConfigured}/{Object.keys(catOpts).length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <button onClick={e => { e.stopPropagation(); handleRemovePmCategory(catKey); }}
                                                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.75rem' }}
                                                            title={`Remove ${catKey}`}>
                                                            <i className="fas fa-times" />
                                                        </button>
                                                        <i className={`fas fa-chevron-${isCatOpen ? 'up' : 'down'}`} style={{ color: '#888', fontSize: '0.7rem' }} />
                                                    </div>
                                                </div>

                                                {/* Option rows */}
                                                {isCatOpen && (
                                                    <div style={{ padding: '10px 12px', background: '#181818', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {/* Add custom option row creator */}
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                                                            <input
                                                                type="text"
                                                                id={`newOptInput_${catKey.replace(/\s+/g, '_')}`}
                                                                placeholder="Add position (e.g. Left Sleeve, Collar)"
                                                                style={{ flex: 1, padding: '8px 10px', background: '#2c2c2c', border: '1px solid #555', color: 'white', borderRadius: 4, outline: 'none', fontSize: '0.78rem' }}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const val = e.target.value.trim();
                                                                        if (val) {
                                                                            setPmCategories(prev => ({
                                                                                ...prev,
                                                                                [catKey]: {
                                                                                    ...prev[catKey],
                                                                                    [val]: { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' }
                                                                                }
                                                                            }));
                                                                            e.target.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const el = document.getElementById(`newOptInput_${catKey.replace(/\s+/g, '_')}`);
                                                                    const val = el?.value.trim();
                                                                    if (val) {
                                                                        setPmCategories(prev => ({
                                                                            ...prev,
                                                                            [catKey]: {
                                                                                ...prev[catKey],
                                                                                [val]: { price: '', darkPrice: '', lightPrice: '', imageFile: null, imagePreview: '' }
                                                                            }
                                                                        }));
                                                                        el.value = '';
                                                                    }
                                                                }}
                                                                style={{ padding: '8px 14px', background: 'white', color: 'black', border: 'none', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                                                + Add Position
                                                            </button>
                                                        </div>

                                                        {Object.keys(catOpts).map((optName, index) => {
                                                            const opt = catOpts[optName];
                                                            const isValid = isOptionValid(opt, pmType);
                                                            const isRowExpanded = pmExpandedRow === `${catKey}_${index}`;
                                                            return (
                                                                <div key={optName} style={{ background: '#222', border: `1px solid ${isValid ? 'rgba(40,167,69,0.4)' : '#333'}`, borderRadius: 5, padding: 10 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                                        onClick={() => setPmExpandedRow(isRowExpanded ? null : `${catKey}_${index}`)}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textTransform: 'capitalize', fontSize: '0.88rem' }}>
                                                                            <div style={{ width: 16, height: 16, border: `2px solid ${isValid ? '#28a745' : '#555'}`, borderRadius: '50%', background: isValid ? '#28a745' : 'transparent', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                                {isValid && <div style={{ width: 4, height: 7, border: 'solid white', borderWidth: '0 2px 2px 0', transform: 'rotate(45deg)', marginBottom: 2 }} />}
                                                                            </div>
                                                                            <span>{optName}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={e => {
                                                                                    e.stopPropagation();
                                                                                    if (window.confirm(`Remove position "${optName}"?`)) {
                                                                                        setPmCategories(prev => {
                                                                                            const nextOpts = { ...prev[catKey] };
                                                                                            delete nextOpts[optName];
                                                                                            return {
                                                                                                ...prev,
                                                                                                [catKey]: nextOpts
                                                                                            };
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}
                                                                                title={`Remove ${optName}`}
                                                                            >
                                                                                <i className="fas fa-trash-alt" />
                                                                            </button>
                                                                            <button onClick={() => setPmExpandedRow(isRowExpanded ? null : `${catKey}_${index}`)}
                                                                                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                                                                <i className={`fas fa-chevron-${isRowExpanded ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.65rem', transition: 'transform 0.2s' }} />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {isRowExpanded && (
                                                                        <div style={{ marginTop: 10, padding: 12, background: '#1a1a1a', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                            {/* Preview box */}
                                                                            <div style={{ border: '1px dashed #555', padding: 10, textAlign: 'center', fontSize: '12px', color: '#777', background: '#222', borderRadius: 4 }}>
                                                                                {opt.imagePreview
                                                                                    ? <img src={opt.imagePreview} alt="preview" style={{ maxHeight: 60, objectFit: 'contain' }} />
                                                                                    : 'print position boundary'}
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#bbb', flexShrink: 0 }}>Reference Image:</label>
                                                                                <input type="file" onChange={e => {
                                                                                    if (e.target.files[0]) {
                                                                                        updatePmOption(catKey, optName, 'imageFile', e.target.files[0]);
                                                                                        updatePmOption(catKey, optName, 'imagePreview', URL.createObjectURL(e.target.files[0]));
                                                                                    }
                                                                                }} style={{ flex: 1, fontSize: '12px', color: '#aaa' }} />
                                                                            </div>
                                                                            {pmType === 'dtg' ? (
                                                                                <>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                        <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#bbb', flexShrink: 0 }}>Dark Garment (₹):</label>
                                                                                        <input type="number" min="0" value={opt.darkPrice}
                                                                                            onChange={e => updatePmOption(catKey, optName, 'darkPrice', e.target.value)}
                                                                                            style={{ flex: 1, padding: '6px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4 }} />
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                        <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#bbb', flexShrink: 0 }}>Light Garment (₹):</label>
                                                                                        <input type="number" min="0" value={opt.lightPrice}
                                                                                            onChange={e => updatePmOption(catKey, optName, 'lightPrice', e.target.value)}
                                                                                            style={{ flex: 1, padding: '6px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4 }} />
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                    <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#bbb', flexShrink: 0 }}>Set Price (₹):</label>
                                                                                    <input type="number" min="0" value={opt.price}
                                                                                        onChange={e => updatePmOption(catKey, optName, 'price', e.target.value)}
                                                                                        style={{ flex: 1, padding: '6px', background: '#2c2c2c', border: '1px solid #444', color: 'white', borderRadius: 4 }} />
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

                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button onClick={closePmModal} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={savePrintMethod} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>Save Method</button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{TOAST_CSS}</style>
                <ToastContainer toasts={toasts} />
            </main>
        );
    }

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">PRODUCTS CATALOGUE</h1>
            <p className="adm-page__subtitle">Manage base products, colors, front/back images, and printing costs</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="adm-settings__btn" style={{ marginTop: 0 }} onClick={handleCreateClick}>
                        <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Base Product
                    </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search base products..."
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
                    />
                    <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}></i>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#ccc', textAlign: 'center', padding: '40px 0' }}>Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '60px 0', background: '#181818', borderRadius: 8, border: '1px solid #333' }}>
                    <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
                    <p>No base products found.</p>
                </div>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(p => {
                        const availableStorefront = isProductAvailable(p);
                        return (
                            <div key={p.id} className="adm-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 200, background: '#111', position: 'relative' }}>
                                    {p.cover_image || (p.colors && p.colors[0]?.frontImage) ? (
                                        <img src={p.cover_image || p.colors[0].frontImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                            <i className="fas fa-image" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        background: availableStorefront ? 'rgba(40, 167, 69, 0.9)' : 'rgba(220, 53, 69, 0.9)',
                                        color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>
                                        {availableStorefront ? 'Available' : 'Unavailable'}
                                    </div>
                                    <div style={{
                                        position: 'absolute', top: 12, left: 12,
                                        background: 'rgba(0,0,0,0.7)',
                                        color: 'var(--gold)', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold',
                                        textTransform: 'uppercase', letterSpacing: '1px'
                                    }}>
                                        {p.category}
                                    </div>
                                </div>
                                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'white' }}>{p.title}</h3>
                                    
                                    <div style={{ display: 'flex', gap: 15, marginBottom: 15, fontSize: '0.8rem', color: '#aaa' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="fas fa-tag"></i> ₹{p.cost}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                                            <i className="fas fa-venus-mars"></i> {p.gender}
                                        </div>
                                    </div>

                                    {/* Colors Preview */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
                                        {p.colors && p.colors.length > 0 ? (
                                            p.colors.map((c, i) => {
                                                const isAvail = c.available !== false;
                                                return (
                                                    <div key={i} title={`${c.colorName} ${isAvail ? '' : '(Unavailable)'}`} style={{
                                                        width: 16, height: 16, borderRadius: '50%', background: c.color, 
                                                        border: isAvail ? '1px solid #555' : '1px dashed #ff4d4d',
                                                        position: 'relative',
                                                        opacity: isAvail ? 1 : 0.4
                                                    }}>
                                                        {!isAvail && (
                                                            <div style={{
                                                                position: 'absolute', top: 1, left: 6, width: 2, height: 12, background: '#ff4d4d', transform: 'rotate(45deg)'
                                                            }} />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>No colors</span>
                                        )}
                                    </div>

                                    {/* Print Styles Preview */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {(p.printing_styles || p.printingStyles || []).map((ps, i) => (
                                            <span key={i} style={{ fontSize: '0.7rem', background: '#333', color: '#ccc', padding: '2px 8px', borderRadius: 4 }}>
                                                {ps.style} ({ps.placements?.length || 0})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', borderTop: '1px solid #333' }}>
                                    <button onClick={() => handleEditClick(p)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', borderRight: '1px solid #333', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                    <button onClick={() => setPendingDeleteProduct(p.id)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(220,53,69,0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                                        <i className="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
