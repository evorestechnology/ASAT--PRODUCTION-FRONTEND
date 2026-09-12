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
    const [sizesList, setSizesList] = useState([]); // [{ size: 'M', available: true }]
    const [customSizeInput, setCustomSizeInput] = useState('');

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
            const matchingDbStyle = dbPrintStyles.find(dps =>
                dps.id === ps.id ||
                (dps.category && dps.category.toLowerCase() === (ps.style || '').toLowerCase()) ||
                (dps.name && dps.name.toLowerCase() === (ps.style || '').toLowerCase())
            );
            const fromStyleId = matchingDbStyle ? matchingDbStyle.id : (ps.style || 'style');

            const grouped = {};
            (ps.placements || []).forEach(pl => {
                const opt = pl.label || '';
                let cat = pl.category || 'default';
                if (cat === 'default' && pl.id) {
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
                    lightPrice: pl.cost_light || '',
                    available: pl.active !== false && pl.available !== false
                };
            });
            Object.keys(grouped).forEach(cat => {
                const placementsInCat = ps.placements.filter(pl => {
                    const optId = pl.id || '';
                    const plCat = pl.category || '';
                    return plCat === cat || optId.startsWith(cat + '_') || optId === cat;
                });
                const isActive = placementsInCat.length > 0 ? placementsInCat.some(pl => pl.active !== false && pl.available !== false) : true;

                parsedMethods.push({
                    id: fromStyleId + '_' + cat + '_' + Date.now() + Math.random(),
                    type: ps.style,
                    category: cat,
                    options: grouped[cat],
                    fromStyleId: fromStyleId,
                    fromCategory: cat,
                    active: isActive
                });
            });
        });
        setPrintMethods(parsedMethods);

        // Pre-fill sizes
        setSizeChartFile(null);
        setSizeChartPreview(p.size_chart_image || p.sizeChartImage || '');
        const rawSizes = p.sizes || [];
        const parsedSizes = rawSizes.map(s => {
            if (typeof s === 'string') return { size: s, available: true };
            if (typeof s === 'object' && s !== null && s.size) {
                return { size: s.size, available: s.available !== false };
            }
            return { size: String(s), available: true };
        });
        setSizesList(parsedSizes);
        setCustomSizeInput('');

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
        setSizesList([]);
        setCustomSizeInput('');
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
        if (!pickerFrontFile) {
            showToast('Please upload a front reference image.', 'error');
            return;
        }
        if (!pickerBackFile) {
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
            backPreview: backPrev,
            available: true
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
                    active: Object.prototype.hasOwnProperty.call(existingActiveByCategory, catKey) ? existingActiveByCategory[catKey] : true
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
                        imagePreview: pl.imagePreview || '',
                        available: pl.available !== false
                    };
                });
                newEntries.push({
                    id: styleId + '_' + pc.category + '_' + Date.now() + Math.random(),
                    type: getNormalizedType(selectedStyle.category),
                    category: pc.category,
                    options: opts,
                    fromStyleId: styleId,
                    active: pc.available !== false
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
                    imagePreview: pl.imagePreview || '',
                    available: pl.available !== false
                };
            });
            const newEntry = {
                id: styleId + '_' + pc.category + '_' + Date.now(),
                type: getNormalizedType(selectedStyle.category),
                category: pc.category,
                options: opts,
                fromStyleId: styleId,
                fromCategory: pc.category,
                active: pc.available !== false
            };
            setPrintMethods(prev => [...prev, newEntry]);
        } else {
            // Remove only the entry matching this style + category
            setPrintMethods(prev => prev.filter(pm => !(pm.fromStyleId === styleId && pm.fromCategory === pc.category)));
        }
    };


    const handleAddSize = (sizeName) => {
        const trimmed = (sizeName || '').trim();
        if (!trimmed) return;
        const existingIndex = sizesList.findIndex(s => s.size.toLowerCase() === trimmed.toLowerCase());
        if (existingIndex !== -1) {
            showToast(`Size "${sizesList[existingIndex].size}" is already added to this product.`, 'info');
            return;
        }
        setSizesList(prev => [...prev, { size: trimmed, available: true }]);
        showToast(`Added size "${trimmed}"`, 'success');
    };

    const handleToggleSizeAvailability = (index) => {
        setSizesList(prev => prev.map((item, idx) => {
            if (idx === index) {
                return { ...item, available: !item.available };
            }
            return item;
        }));
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
        if (sizesList.length === 0) {
            showToast('Please add at least one size.', 'error');
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
                    
                    const darkP = parseFloat(opt.darkPrice) || 0;
                    const lightP = parseFloat(opt.lightPrice) || 0;
                    const flatP = parseFloat(opt.price) || 0;

                    styleGroups[pm.type].push({
                        id: `${pm.category}_${optName}`,
                        label: optName,
                        category: pm.category,
                        image: imgUrl,
                        price: pm.type === 'dtg' ? (darkP || lightP || flatP) : flatP,
                        cost_dark: darkP,
                        cost_light: lightP,
                        active: (pm.active !== false && opt.available !== false)
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
                sizes: sizesList,
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

                <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 25, background: '#ffffff', padding: 32, borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    
                    {/* Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category * {editProductId && '(Locked)'}</label>
                        <select 
                            disabled={!!editProductId}
                            title={editProductId ? "Category cannot be changed once product is created" : ""}
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: editProductId ? '#f3f4f6' : '#ffffff', opacity: editProductId ? 0.75 : 1, border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none', cursor: editProductId ? 'not-allowed' : 'pointer' }}>
                            {categoriesList.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name of the Product * {editProductId && '(Locked)'}</label>
                        <input 
                            type="text" 
                            disabled={!!editProductId}
                            title={editProductId ? "Product name cannot be changed once product is created" : ""}
                            placeholder="e.g. Premium Cotton T-Shirt"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: editProductId ? '#f3f4f6' : '#ffffff', opacity: editProductId ? 0.75 : 1, border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none', cursor: editProductId ? 'not-allowed' : 'text' }}
                        />
                    </div>

                    {/* Upload Reference */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Reference</label>
                        <div style={{ padding: 15, background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: formData.referenceFile || formData.referencePreview ? '#111827' : '#6b7280' }}>
                                {formData.referenceFile ? formData.referenceFile.name : (formData.referencePreview ? 'Reference Uploaded' : 'No file uploaded')}
                            </span>
                            <button 
                                onClick={() => document.getElementById('refUpload').click()}
                                style={{ padding: '6px 14px', background: '#ffffff', border: '1px solid #C5A059', color: '#8c6b2d', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
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
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Gender * {editProductId && '(Locked)'}</label>
                            <select 
                                disabled={!!editProductId}
                                title={editProductId ? "Target gender cannot be changed once product is created" : ""}
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                style={{ width: '100%', padding: '10px 14px', background: editProductId ? '#f3f4f6' : '#ffffff', opacity: editProductId ? 0.75 : 1, border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none', cursor: editProductId ? 'not-allowed' : 'pointer' }}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Cost (₹) *</label>
                            <input 
                                type="number" step="0.01" min="0" placeholder="0.00"
                                value={formData.cost}
                                onChange={e => setFormData({...formData, cost: e.target.value})}
                                style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Details *</label>
                        <textarea 
                            rows="3" placeholder="Enter product description (each line is a bullet point)"
                            value={formData.details}
                            onChange={e => setFormData({...formData, details: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    {/* Wash Care */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wash Care Instructions *</label>
                        <textarea 
                            rows="3" placeholder="Enter washing care guidelines (each line is a bullet point)"
                            value={formData.washCare}
                            onChange={e => setFormData({...formData, washCare: e.target.value})}
                            style={{ width: '100%', padding: '10px 14px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    {/* Colors Module */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Colors</label>
                            <button type="button" onClick={() => setShowColorPanel(!showColorPanel)} style={{ background: 'none', border: 'none', color: '#C5A059', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                                {showColorPanel ? 'Cancel Color' : '+ Add Color'}
                            </button>
                        </div>

                        {showColorPanel && (
                            <div style={{ padding: 20, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 15 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>Color swatch:</label>
                                    <input type="color" value={pickerSwatch} onChange={e => setPickerSwatch(e.target.value)} style={{ width: 40, height: 40, cursor: 'pointer', border: 'none', background: 'transparent' }} />
                                    <input type="text" value={pickerSwatch} onChange={e => setPickerSwatch(e.target.value)} style={{ width: 100, padding: '8px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6, outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>RGB values:</label>
                                    <input type="text" readOnly value={hexToRgbStr(pickerSwatch)} style={{ flex: 1, padding: '8px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', color: '#6b7280', borderRadius: 6 }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>Color Name:</label>
                                    <input type="text" placeholder="e.g. Jet Black" value={pickerName} onChange={e => {
                                        setPickerName(e.target.value);
                                        const v = e.target.value.toLowerCase();
                                        if (v.includes('white')) setPickerMode('light');
                                        else if (v.includes('black') || v.includes('navy')) setPickerMode('dark');
                                    }} style={{ flex: 1, padding: '8px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6, outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <label style={{ width: 100, fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>Garment Mode:</label>
                                    <select value={pickerMode} onChange={e => setPickerMode(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6, outline: 'none' }}>
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                    </select>
                                </div>
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>Front Reference Image:</label>
                                    <input type="file" accept="image/*" onChange={e => setPickerFrontFile(e.target.files[0])} style={{ color: '#4b5563', fontSize: '0.8rem' }} />
                                    
                                    <label style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 600, marginTop: 10 }}>Back View Reference Image:</label>
                                    <input type="file" accept="image/*" onChange={e => setPickerBackFile(e.target.files[0])} style={{ color: '#4b5563', fontSize: '0.8rem' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                                    <button onClick={handleSaveColor} style={{ padding: '8px 22px', background: '#111114', border: 'none', borderRadius: 20, color: '#ffffff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                                        Save Color
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {colors.length === 0 && <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>No colors added yet.</p>}
                            {colors.map(color => (
                                <div key={color.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: color.color, border: '1px solid #d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}></div>
                                            <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{color.colorName}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>({color.color})</span>
                                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: color.mode === 'dark' ? '#1f2937' : '#f3f4f6', color: color.mode === 'dark' ? '#ffffff' : '#374151', borderRadius: 12, fontWeight: 600 }}>{color.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#4b5563', cursor: 'pointer', marginLeft: 8 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={color.available !== false} 
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setColors(prev => prev.map(x => x.id === color.id ? { ...x, available: isChecked } : x));
                                                    }} 
                                                    style={{ width: 13, height: 13, accentColor: '#C5A059', cursor: 'pointer' }}
                                                />
                                                Available
                                            </label>
                                        </div>
                                        {!editProductId && (
                                            <button onClick={() => handleRemoveColor(color.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Remove</button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                                        <div><strong style={{color:'#374151'}}>Front:</strong> {color.frontFile ? color.frontFile.name : (color.frontPreview ? 'Uploaded' : 'None')}</div>
                                        <div><strong style={{color:'#374151'}}>Back:</strong> {color.backFile ? color.backFile.name : (color.backPreview ? 'Uploaded' : 'None')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Printing Methods Manager — selection only (no manual add/edit/remove) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Printing Styles &amp; Placements</label>
                        </div>

                        {dbPrintStyles.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {dbPrintStyles.map(ps => {
                                    const isPmCatActive = (pc) => {
                                        return printMethods.some(pm => 
                                            (pm.fromStyleId === ps.id || pm.type?.toLowerCase() === ps.category?.toLowerCase() || pm.type?.toLowerCase() === ps.name?.toLowerCase()) &&
                                            (pm.fromCategory?.toLowerCase() === pc.category?.toLowerCase() || pm.category?.toLowerCase() === pc.category?.toLowerCase())
                                        );
                                    };

                                    const totalCats = ps.placementCategories?.length || 0;
                                    const enabledCats = (ps.placementCategories || []).filter(pc => isPmCatActive(pc)).length;
                                    const allSelected = totalCats > 0 && enabledCats === totalCats;
                                    const someSelected = enabledCats > 0 && enabledCats < totalCats;

                                    return (
                                        <div key={ps.id} style={{ background: '#ffffff', border: `1px solid ${enabledCats > 0 ? '#C5A059' : '#e5e7eb'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
                                            {/* Style header — select all */}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: enabledCats > 0 ? 'rgba(197,160,89,0.08)' : '#fafafa' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={el => { if (el) el.indeterminate = someSelected; }}
                                                    onChange={e => handleToggleDbPrintStyle(ps.id, e.target.checked)}
                                                    style={{ accentColor: 'var(--gold, #C5A059)', width: 16, height: 16, cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{ps.name}</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                                        {ps.category?.toUpperCase()} • {enabledCats}/{totalCats} selected
                                                    </span>
                                                </div>
                                            </label>

                                            {/* Individual category checkboxes */}
                                            {totalCats > 0 && (
                                                <div style={{ borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                    {(ps.placementCategories || []).map((pc, i) => {
                                                        const isCatEnabled = isPmCatActive(pc);
                                                        const optCount = Object.keys(pc.placements || {}).length;
                                                        return (
                                                            <label key={pc.category} style={{
                                                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                                                                cursor: 'pointer',
                                                                background: isCatEnabled ? 'rgba(197,160,89,0.04)' : 'transparent',
                                                                borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                                                                transition: 'background 0.15s'
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isCatEnabled}
                                                                    onChange={e => handleTogglePrintCategory(ps.id, pc, e.target.checked)}
                                                                    style={{ accentColor: 'var(--gold, #C5A059)', width: 14, height: 14, cursor: 'pointer' }}
                                                                />
                                                                <span style={{ fontSize: '0.85rem', color: isCatEnabled ? '#111827' : '#6b7280', fontWeight: isCatEnabled ? 600 : 400, textTransform: 'capitalize', flex: 1 }}>
                                                                    {pc.category}
                                                                </span>
                                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#f3f4f6', color: '#4b5563', borderRadius: 10, fontWeight: 500 }}>
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
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                                No saved print styles found. Please create print styles first from the Print Styles section.
                            </p>
                        )}
                    </div>

                    {/* Size Chart */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>Size Chart {editProductId && '(Locked)'}</label>
                        <div style={{ padding: 15, background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: sizeChartFile || sizeChartPreview ? '#111827' : '#6b7280' }}>
                                {sizeChartFile ? sizeChartFile.name : (sizeChartPreview ? 'Size Chart Uploaded' : 'No file uploaded')}
                            </span>
                            <button 
                                disabled={!!editProductId}
                                onClick={() => document.getElementById('sizeChartUpload').click()}
                                style={{ padding: '6px 14px', background: '#ffffff', border: '1px solid #C5A059', color: '#8c6b2d', borderRadius: 6, cursor: editProductId ? 'not-allowed' : 'pointer', opacity: editProductId ? 0.5 : 1, fontWeight: 600, fontSize: '0.8rem' }}>
                                Choose File
                            </button>
                            <input id="sizeChartUpload" type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => {
                                if(e.target.files[0]) {
                                    setSizeChartFile(e.target.files[0]);
                                }
                            }} />
                        </div>
                    </div>

                    {/* Select & Manage Sizes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                                    Sizes Configuration *
                                </label>
                                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                    Once added, sizes cannot be deleted — only set to Available or Unavailable status.
                                </span>
                            </div>
                        </div>

                        {/* Add Custom Size Input */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                value={customSizeInput}
                                onChange={e => setCustomSizeInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (customSizeInput.trim()) {
                                            handleAddSize(customSizeInput);
                                            setCustomSizeInput('');
                                        }
                                    }
                                }}
                                placeholder="Type custom size (e.g. 4XL, 32x34, Free Size)"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    background: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    color: '#111827',
                                    borderRadius: 8,
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (customSizeInput.trim()) {
                                        handleAddSize(customSizeInput);
                                        setCustomSizeInput('');
                                    } else {
                                        showToast('Please type a size name to add.', 'warning');
                                    }
                                }}
                                style={{
                                    padding: '10px 18px',
                                    background: '#111114',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                + Add Size
                            </button>
                        </div>

                        {/* Preset Standard Sizes */}
                        <div>
                            <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: 6 }}>
                                Quick Add Presets:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {STANDARD_SIZES.map(stdSize => {
                                    const addedItem = sizesList.find(s => s.size.toLowerCase() === stdSize.toLowerCase());
                                    const isAdded = !!addedItem;
                                    const isAvailable = isAdded && addedItem.available !== false;
                                    return (
                                        <button
                                            key={stdSize}
                                            type="button"
                                            onClick={() => {
                                                if (isAdded) {
                                                    const idx = sizesList.findIndex(s => s.size.toLowerCase() === stdSize.toLowerCase());
                                                    handleToggleSizeAvailability(idx);
                                                } else {
                                                    handleAddSize(stdSize);
                                                }
                                            }}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: 6,
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                background: isAdded
                                                    ? (isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)')
                                                    : '#f3f4f6',
                                                color: isAdded
                                                    ? (isAvailable ? '#059669' : '#d97706')
                                                    : '#4b5563',
                                                border: `1px solid ${
                                                    isAdded
                                                        ? (isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)')
                                                        : '#e5e7eb'
                                                }`
                                            }}
                                            title={isAdded ? `Click to set ${stdSize} ${isAvailable ? 'Unavailable' : 'Available'}` : `Click to add ${stdSize}`}
                                        >
                                            {stdSize} {isAdded ? (isAvailable ? '✓' : '⏸') : '+'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Product Sizes List */}
                        <div style={{ marginTop: 6 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                                Configured Sizes ({sizesList.length}):
                            </span>

                            {sizesList.length === 0 ? (
                                <div style={{ padding: '16px', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>
                                    No sizes added yet. Select a preset above or type a custom size.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {sizesList.map((item, idx) => {
                                        const isAvail = item.available !== false;
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    background: '#ffffff',
                                                    border: `1px solid ${isAvail ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                                    borderRadius: 8,
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                                                        {item.size}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        padding: '2px 8px',
                                                        borderRadius: 10,
                                                        fontWeight: 700,
                                                        background: isAvail ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                        color: isAvail ? '#059669' : '#d97706',
                                                        border: `1px solid ${isAvail ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                                                    }}>
                                                        {isAvail ? 'AVAILABLE' : 'UNAVAILABLE'}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSizeAvailability(idx)}
                                                        style={{
                                                            padding: '5px 12px',
                                                            background: isAvail ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                                            color: isAvail ? '#d97706' : '#059669',
                                                            border: `1px solid ${isAvail ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                                            borderRadius: 6,
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        {isAvail ? 'Set Unavailable' : 'Set Available'}
                                                    </button>
                                                    <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                                        (Cannot be deleted)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 10 }}>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            style={{ padding: '14px', background: '#111114', color: '#ffffff', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: '0.95rem', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                        <button 
                            onClick={() => setIsCreating(false)} 
                            disabled={isSaving}
                            style={{ padding: '12px', background: '#ffffff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 24, fontWeight: 600, fontSize: '0.9rem', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                            Cancel / Reset
                        </button>
                    </div>

                </div>

                {/* ── Print Method Modal (multi-category) ── */}
                {isPmModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#ffffff', padding: 28, borderRadius: 14, width: 560, maxHeight: '88vh', overflowY: 'auto', border: '1px solid #e5e7eb', color: '#111827', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '1.2rem', fontWeight: 700 }}>{pmEditId ? 'Edit' : 'Add'} Printing Method</h3>

                            {/* Print Type */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Print Type</label>
                                <select value={pmType} onChange={handlePmTypeChange}
                                    style={{ width: '100%', padding: '10px 12px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none' }}>
                                    <option value="" disabled>Select Print Type</option>
                                    <option value="dtf">DTF (Direct to Film)</option>
                                    <option value="dtg">DTG (Direct to Garment)</option>
                                    <option value="embrio">Embroidery</option>
                                </select>
                            </div>

                            {/* Saved Print Style Loader */}
                            {pmType && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Load from Saved Print Style (optional)</label>
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
                                        style={{ width: '100%', padding: '10px 12px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none' }}>
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
                                                style={{ flex: 1, padding: '10px 12px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 8, outline: 'none' }}
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
                                                style={{ padding: '10px 18px', background: '#111114', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                    {Object.keys(pmCategories).length > 0 && (
                                        <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                                            {Object.keys(pmCategories).length} categor{Object.keys(pmCategories).length === 1 ? 'y' : 'ies'} added
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Added categories with their options */}
                            {Object.keys(pmCategories).length > 0 && (
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Select Configuration Options</label>

                                    {Object.keys(pmCategories).map(catKey => {
                                        const catOpts = pmCategories[catKey];
                                        const isCatOpen = pmExpandedCat === catKey;
                                        const catConfigured = Object.values(catOpts).filter(o => isOptionValid(o, pmType)).length;

                                        return (
                                            <div key={catKey} style={{ border: `1px solid ${isCatOpen ? 'var(--gold, #C5A059)' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                                {/* Category header */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isCatOpen ? 'rgba(197,160,89,0.08)' : '#f9fafb', cursor: 'pointer' }}
                                                    onClick={() => { setPmExpandedCat(isCatOpen ? '' : catKey); setPmExpandedRow(null); }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isCatOpen ? '#8c6b2d' : '#111827', textTransform: 'capitalize' }}>
                                                            {catKey.replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        {catConfigured > 0 && (
                                                            <span style={{ fontSize: '0.65rem', padding: '1px 7px', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 10, fontWeight: 700 }}>
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
                                                        <i className={`fas fa-chevron-${isCatOpen ? 'up' : 'down'}`} style={{ color: '#6b7280', fontSize: '0.7rem' }} />
                                                    </div>
                                                </div>

                                                {/* Option rows */}
                                                {isCatOpen && (
                                                    <div style={{ padding: '12px 14px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #e5e7eb' }}>
                                                        {/* Add custom option row creator */}
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                                                            <input
                                                                type="text"
                                                                id={`newOptInput_${catKey.replace(/\s+/g, '_')}`}
                                                                placeholder="Add position (e.g. Left Sleeve, Collar)"
                                                                style={{ flex: 1, padding: '8px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6, outline: 'none', fontSize: '0.78rem' }}
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
                                                                style={{ padding: '8px 14px', background: '#111114', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                                                                + Add Position
                                                            </button>
                                                        </div>

                                                        {Object.keys(catOpts).map((optName, index) => {
                                                            const opt = catOpts[optName];
                                                            const isValid = isOptionValid(opt, pmType);
                                                            const isRowExpanded = pmExpandedRow === `${catKey}_${index}`;
                                                            return (
                                                                <div key={optName} style={{ background: '#ffffff', border: `1px solid ${isValid ? 'rgba(16,185,129,0.4)' : '#e5e7eb'}`, borderRadius: 6, padding: 10 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                                        onClick={() => setPmExpandedRow(isRowExpanded ? null : `${catKey}_${index}`)}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textTransform: 'capitalize', fontSize: '0.88rem' }}>
                                                                            <div style={{ width: 16, height: 16, border: `2px solid ${isValid ? '#059669' : '#d1d5db'}`, borderRadius: '50%', background: isValid ? '#059669' : 'transparent', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                                {isValid && <div style={{ width: 4, height: 7, border: 'solid white', borderWidth: '0 2px 2px 0', transform: 'rotate(45deg)', marginBottom: 2 }} />}
                                                                            </div>
                                                                            <span style={{ color: '#111827', fontWeight: 600 }}>{optName}</span>
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
                                                                                style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}
                                                                                title={`Remove ${optName}`}
                                                                            >
                                                                                <i className="fas fa-trash-alt" />
                                                                            </button>
                                                                            <button onClick={() => setPmExpandedRow(isRowExpanded ? null : `${catKey}_${index}`)}
                                                                                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                                                                <i className={`fas fa-chevron-${isRowExpanded ? 'up' : 'down'}`} style={{ color: '#6b7280', fontSize: '0.65rem', transition: 'transform 0.2s' }} />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {isRowExpanded && (
                                                                        <div style={{ marginTop: 10, padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                            {/* Preview box */}
                                                                            <div style={{ border: '1px dashed #d1d5db', padding: 10, textAlign: 'center', fontSize: '12px', color: '#6b7280', background: '#ffffff', borderRadius: 4 }}>
                                                                                {opt.imagePreview
                                                                                    ? <img src={opt.imagePreview} alt="preview" style={{ maxHeight: 60, objectFit: 'contain' }} />
                                                                                    : 'print position boundary'}
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 600, flexShrink: 0 }}>Reference Image:</label>
                                                                                <input type="file" onChange={e => {
                                                                                    if (e.target.files[0]) {
                                                                                        updatePmOption(catKey, optName, 'imageFile', e.target.files[0]);
                                                                                        updatePmOption(catKey, optName, 'imagePreview', URL.createObjectURL(e.target.files[0]));
                                                                                    }
                                                                                }} style={{ flex: 1, fontSize: '12px', color: '#4b5563' }} />
                                                                            </div>
                                                                            {pmType === 'dtg' ? (
                                                                                <>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                        <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 600, flexShrink: 0 }}>Dark Garment (₹):</label>
                                                                                        <input type="number" min="0" value={opt.darkPrice}
                                                                                            onChange={e => updatePmOption(catKey, optName, 'darkPrice', e.target.value)}
                                                                                            style={{ flex: 1, padding: '6px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6 }} />
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                        <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 600, flexShrink: 0 }}>Light Garment (₹):</label>
                                                                                        <input type="number" min="0" value={opt.lightPrice}
                                                                                            onChange={e => updatePmOption(catKey, optName, 'lightPrice', e.target.value)}
                                                                                            style={{ flex: 1, padding: '6px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6 }} />
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                    <label style={{ width: 120, margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 600, flexShrink: 0 }}>Set Price (₹):</label>
                                                                                    <input type="number" min="0" value={opt.price}
                                                                                        onChange={e => updatePmOption(catKey, optName, 'price', e.target.value)}
                                                                                        style={{ flex: 1, padding: '6px 10px', background: '#ffffff', border: '1px solid #d1d5db', color: '#111827', borderRadius: 6 }} />
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

                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                                <button onClick={closePmModal} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: 20, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button onClick={savePrintMethod} style={{ background: '#111114', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: 20, cursor: 'pointer', fontWeight: 700 }}>Save Method</button>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="adm-settings__btn" style={{ marginTop: 0, padding: '10px 20px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={handleCreateClick}>
                        <i className="fas fa-plus"></i> Add Base Product
                    </button>
                </div>

                <div className="adm-search-wrap" style={{ minWidth: 280 }}>
                    <i className="fas fa-search adm-search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search base products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="adm-search-input"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0', fontSize: '0.95rem' }}>Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0', background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <i className="fas fa-box-open" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.4, color: '#9ca3af' }}></i>
                    <p style={{ margin: 0, fontWeight: 500 }}>No base products found.</p>
                </div>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(p => {
                        const availableStorefront = isProductAvailable(p);
                        return (
                            <div key={p.id} className="adm-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', borderRadius: 14 }}>
                                <div style={{ height: 200, background: '#f8fafc', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                                    {p.cover_image || (p.colors && p.colors[0]?.frontImage) ? (
                                        <img src={p.cover_image || p.colors[0].frontImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                            <i className="fas fa-image" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        background: availableStorefront ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                                        color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700,
                                        letterSpacing: '0.5px'
                                    }}>
                                        {availableStorefront ? 'Available' : 'Unavailable'}
                                    </div>
                                    <div style={{
                                        position: 'absolute', top: 12, left: 12,
                                        background: 'rgba(17, 17, 20, 0.85)',
                                        color: 'var(--gold, #C5A059)', padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        {p.category}
                                    </div>
                                </div>
                                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{p.title}</h3>
                                    
                                    <div style={{ display: 'flex', gap: 15, marginBottom: 15, fontSize: '0.8rem', color: '#6b7280' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#111827' }}>
                                            <i className="fas fa-tag" style={{ color: '#C5A059' }}></i> ₹{p.cost}
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
                                                        width: 18, height: 18, borderRadius: '50%', background: c.color, 
                                                        border: isAvail ? '1px solid #d1d5db' : '1px dashed #ef4444',
                                                        position: 'relative',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                        opacity: isAvail ? 1 : 0.4
                                                    }}>
                                                        {!isAvail && (
                                                            <div style={{
                                                                position: 'absolute', top: 2, left: 7, width: 2, height: 12, background: '#ef4444', transform: 'rotate(45deg)'
                                                            }} />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No colors</span>
                                        )}
                                    </div>

                                    {/* Print Styles Preview */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {(p.printing_styles || p.printingStyles || []).map((ps, i) => (
                                            <span key={i} style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                                                {ps.style} ({ps.placements?.length || 0})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', borderTop: '1px solid #e5e7eb' }}>
                                    <button onClick={() => handleEditClick(p)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#111827', fontWeight: 600, cursor: 'pointer', borderRight: '1px solid #e5e7eb', transition: 'background 0.2s', fontSize: '0.85rem' }} onMouseOver={e => e.target.style.background = '#f9fafb'} onMouseOut={e => e.target.style.background = 'transparent'}>
                                        <i className="fas fa-edit" style={{ marginRight: 6 }}></i> Edit
                                    </button>
                                    <button onClick={() => setPendingDeleteProduct(p.id)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#dc3545', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.85rem' }} onMouseOver={e => e.target.style.background = '#fef2f2'} onMouseOut={e => e.target.style.background = 'transparent'}>
                                        <i className="fas fa-trash" style={{ marginRight: 6 }}></i> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {pendingDeleteProduct && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-content" style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb', color: '#111827', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
                            <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem', fontWeight: 700 }}>Delete Product</h3>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', color: '#4b5563', fontSize: '0.9rem' }}>
                            Are you sure you want to permanently delete this product?
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="adm-settings__btn" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', marginTop: 0, borderRadius: 20, padding: '8px 18px' }} onClick={() => setPendingDeleteProduct(null)}>Cancel</button>
                            <button className="adm-settings__btn" style={{ background: '#dc3545', color: '#fff', marginTop: 0, borderRadius: 20, padding: '8px 20px' }} onClick={executeDelete}>Delete</button>
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
