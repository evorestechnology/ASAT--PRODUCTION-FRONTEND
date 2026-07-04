import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

const STEP_LABELS = [
    { num: 1, label: 'Product' },
    { num: 2, label: 'Configure' },
    { num: 3, label: 'Comments' },
    { num: 4, label: 'Customer Details' },
    { num: 5, label: 'Details' },
];

/* â”€â”€â”€ DropZone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DropZone({ label, preview, onFile, accept = 'image/*' }) {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = React.useRef(null);
    return (
        <div
            className={`dsn-upload__drop ${dragOver ? 'dsn-upload__drop--active' : ''} ${preview ? 'dsn-upload__drop--has' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current.click()}
            style={{ cursor: 'pointer', width: '100%', height: '100%', aspectRatio: 'auto' }}
        >
            {preview ? (
                <div className="dsn-upload__drop-preview" style={{ backgroundImage: `url(${preview})` }}>
                    <span className="dsn-upload__drop-change" onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>Change</span>
                </div>
            ) : (
                <div className="dsn-upload__drop-empty">
                    <i className="fas fa-cloud-upload-alt" />
                    <span>{label}</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} accept={accept}
                onChange={e => e.target.files[0] && onFile(e.target.files[0])}
                style={{ display: 'none' }} />
        </div>
    );
}

/* â”€â”€â”€ Reusable label style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SECTION_LABEL_ST = {
    display: 'block', fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '1px', textTransform: 'uppercase', color: '#888', marginBottom: 10,
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function DesignerUpload() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const { applyMarkup } = useCurrency();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* â”€â”€ Step 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [showProductDetails, setShowProductDetails] = useState(false);
    const [selectedColors, setSelectedColors] = useState([]);
    const [primaryColor, setPrimaryColor] = useState('');
    const [productSearchQuery, setProductSearchQuery] = useState('');

    /* â”€â”€ Step 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    // colorPlacements: { colorName: [{ id, style, placementId, placementLabel, designFile, designPreview, mockupFile, mockupPreview }] }
    const [colorPlacements, setColorPlacements] = useState({});
    const [activeColorTab, setActiveColorTab] = useState('');
    const [expandedTechnique, setExpandedTechnique] = useState('');
    const [expandedPlacement, setExpandedPlacement] = useState('');

    /* â”€â”€ Step 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [productionComments, setProductionComments] = useState('');

    /* â”€â”€ Step 4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState('');
    // colorMockups: { colorName: { frontFile, frontPreview, backFile, backPreview, modelFile, modelPreview } }
    const [colorMockups, setColorMockups] = useState({});
    const [selectedSizes, setSelectedSizes] = useState([]);

    /* â”€â”€ Step 5 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [designTitle, setDesignTitle] = useState('');
    const [designerCost, setDesignerCost] = useState('');
    const [designerNote, setDesignerNote] = useState('');

    /* â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [dbProducts, setDbProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/api/products?cb=${Date.now()}`)
            .then(data => {
                const list = (data || []).map(d => ({
                    id: d.id,
                    title: d.title,
                    coverImage: d.cover_image,
                    colors: d.colors || [],
                    mfgName: d.mfg_name,
                    category: d.category,
                    cost: d.cost,
                    sizes: d.sizes || [],
                    gender: d.gender || 'Unisex',
                    printingStyles: d.printing_styles || [],
                    details: d.details || [],
                    washCare: d.wash_care || [],
                }));
                setDbProducts(list);
            })
            .catch(err => { console.error('Error loading products:', err); setDbProducts([]); })
            .finally(() => setProductsLoading(false));
    }, []);

    useEffect(() => {
        if (dbProducts.length > 0) {
            const queryProductId = searchParams.get('productId');
            const queryCategory = searchParams.get('category');
            if (queryCategory) {
                setSelectedCategory(queryCategory);
            }
            if (queryProductId) {
                const matchedProd = dbProducts.find(p => p.id === queryProductId);
                if (matchedProd) {
                    setSelectedProductId(queryProductId);
                    setShowProductDetails(true);
                }
            }
        }
    }, [dbProducts, searchParams]);

    /* â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const uniqueCategories = useMemo(() => {
        const cats = new Set(dbProducts.map(p => p.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [dbProducts]);

    const rawProductsInCategory = useMemo(() => {
        return selectedCategory ? dbProducts.filter(p => p.category === selectedCategory) : [];
    }, [dbProducts, selectedCategory]);

    const productsInCategory = useMemo(() => {
        const query = productSearchQuery.trim().toLowerCase();
        if (!query) return rawProductsInCategory;
        return rawProductsInCategory.filter(p => 
            p.title.toLowerCase().includes(query) || 
            (p.mfgName && p.mfgName.toLowerCase().includes(query))
        );
    }, [rawProductsInCategory, productSearchQuery]);

    const selectedProductObj = useMemo(() =>
        dbProducts.find(p => p.id === selectedProductId),
        [dbProducts, selectedProductId]);

    const availableTechniques = useMemo(() => {
        if (!selectedProductObj?.printingStyles) return [];
        // The DB stores one entry per category (e.g. multiple DTF rows).
        // Merge all entries sharing the same style into one, deduplicating placements by id.
        const merged = {};
        selectedProductObj.printingStyles.forEach(ps => {
            const key = (ps.style || '').toLowerCase();
            if (!merged[key]) {
                merged[key] = { ...ps, placements: [] };
            }
            const activePlacements = (ps.placements || []).filter(pl => pl.active !== false);
            activePlacements.forEach(pl => {
                if (!merged[key].placements.some(existing => existing.id === pl.id)) {
                    merged[key].placements.push(pl);
                }
            });
        });
        return Object.values(merged).filter(ps => ps.placements.length > 0);
    }, [selectedProductObj]);


    /* â”€â”€ Active tab follows color selection â”€â”€â”€ */
    useEffect(() => {
        if (selectedColors.length > 0 && (!activeColorTab || !selectedColors.includes(activeColorTab))) {
            setActiveColorTab(primaryColor || selectedColors[0]);
        } else if (selectedColors.length === 0) {
            setActiveColorTab('');
        }
    }, [selectedColors, primaryColor]);

    /* â”€â”€ Step 1 handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setSelectedProductId('');
        setSelectedColors([]);
        setPrimaryColor('');
        setShowProductDetails(false);
        setColorPlacements({});
    };

    const handleSelectProduct = (productId) => {
        setSelectedProductId(productId);
        setSelectedColors([]);
        setPrimaryColor('');
        setShowProductDetails(false);
        setColorPlacements({});
        setColorMockups({});
        setSelectedSizes([]);
    };

    const toggleColor = (colorName) => {
        setSelectedColors(prev => {
            const next = prev.includes(colorName)
                ? prev.filter(c => c !== colorName)
                : [...prev, colorName];
            if (!next.includes(primaryColor)) setPrimaryColor(next[0] || '');
            return next;
        });
    };

    /* â”€â”€ Step 2 helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const getPlacementsForStyle = useCallback((styleName) => {
        if (!selectedProductObj) return [];
        // Collect placements from ALL entries matching this style name (DB stores one row per category)
        const matchingStyles = (selectedProductObj.printingStyles || []).filter(
            x => x.style === styleName || x.style?.toLowerCase() === styleName?.toLowerCase()
        );
        if (matchingStyles.length === 0) return [];

        const seenIds = new Set();
        const allPlacements = [];
        matchingStyles.forEach(ps => {
            if (!Array.isArray(ps.placements)) return;
            ps.placements.filter(pl => pl.active !== false).forEach(pl => {
                const id = typeof pl === 'object' ? pl.id : pl;
                if (seenIds.has(id)) return; // deduplicate
                seenIds.add(id);
                allPlacements.push(pl);
            });
        });

        return allPlacements.map(pl => {
            const id = typeof pl === 'object' ? pl.id : pl;
            const label = typeof pl === 'object' ? (pl.label || pl.id) : pl;

            // Extract category name from placement id and label
            let categoryName = '';
            if (typeof pl === 'object' && pl.id) {
                const opt = pl.label || '';
                if (opt && pl.id.endsWith('_' + opt)) {
                    categoryName = pl.id.substring(0, pl.id.length - opt.length - 1);
                } else if (pl.id.includes('_')) {
                    const idx = pl.id.lastIndexOf('_');
                    categoryName = pl.id.substring(0, idx);
                } else {
                    categoryName = pl.id;
                }
            }

            const formattedCategory = categoryName
                ? categoryName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : '';
            const formattedLabel = label ? label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
            const displayLabel = formattedCategory
                ? `${formattedCategory} - ${formattedLabel}`
                : formattedLabel;

            return { id, label: displayLabel, refImage: typeof pl === 'object' ? pl.image : null };
        });
    }, [selectedProductObj]);

    // visibleTechniques: for primary color shows ALL techniques;
    // for secondary colors shows ONLY the techniques/placements already configured on the primary.
    const visibleTechniques = useMemo(() => {
        if (!activeColorTab) return availableTechniques;
        if (activeColorTab === primaryColor) return availableTechniques;

        // Collect placements that have been fully configured on the primary color
        const primaryConfigs = (colorPlacements[primaryColor] || []).filter(
            c => c.designFile && c.mockupFile
        );
        if (primaryConfigs.length === 0) return [];

        // Build a filtered copy of the technique list, keeping only configured placements
        const techniqueMap = {};
        primaryConfigs.forEach(pc => {
            const styleKey = pc.style;
            if (!techniqueMap[styleKey]) {
                const origTech = availableTechniques.find(t => t.style === styleKey);
                if (origTech) techniqueMap[styleKey] = { ...origTech, placements: [] };
            }
            if (techniqueMap[styleKey]) {
                const allPlacementsForStyle = getPlacementsForStyle(styleKey);
                const matchedPl = allPlacementsForStyle.find(pl => pl.id === pc.placementId);
                if (matchedPl && !techniqueMap[styleKey].placements.some(p => p.id === matchedPl.id)) {
                    techniqueMap[styleKey].placements.push(matchedPl);
                }
            }
        });
        return Object.values(techniqueMap).filter(t => t.placements.length > 0);
    }, [activeColorTab, primaryColor, availableTechniques, colorPlacements, getPlacementsForStyle]);

    const getPlacementConfig = (colorName, techStyle, placementId) =>
        (colorPlacements[colorName] || []).find(c => c.style === techStyle && c.placementId === placementId) || null;

    const setPlacementFile = (colorName, techStyle, placementId, placementLabel, field, file) => {
        const preview = file ? URL.createObjectURL(file) : '';
        const previewField = field === 'designFile' ? 'designPreview' : 'mockupPreview';
        setColorPlacements(prev => {
            const list = [...(prev[colorName] || [])];
            const idx = list.findIndex(c => c.style === techStyle && c.placementId === placementId);
            if (idx >= 0) {
                list[idx] = { ...list[idx], [field]: file, [previewField]: preview };
            } else {
                list.push({
                    id: `${techStyle}_${placementId}_${Date.now()}`,
                    style: techStyle, placementId, placementLabel,
                    designFile: field === 'designFile' ? file : null,
                    designPreview: field === 'designFile' ? preview : '',
                    mockupFile: field === 'mockupFile' ? file : null,
                    mockupPreview: field === 'mockupFile' ? preview : '',
                });
            }
            return { ...prev, [colorName]: list };
        });
    };

    /* â”€â”€ Step 4 handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const updateColorMockup = (colorName, field, file) => {
        const previewField = field.replace('File', 'Preview');
        const preview = file ? URL.createObjectURL(file) : '';
        setColorMockups(prev => ({
            ...prev,
            [colorName]: { ...(prev[colorName] || {}), [field]: file, [previewField]: preview }
        }));
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    /* â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const canProceed = () => {
        if (step === 1) return !!selectedProductId && selectedColors.length > 0 && !!primaryColor;
        if (step === 2) {
            // 1. Primary color must have at least one fully-configured placement
            const primaryConfigs = (colorPlacements[primaryColor] || []).filter(
                c => c.designFile && c.mockupFile
            );
            if (primaryConfigs.length === 0) return false;

            // 2. Every OTHER selected color must configure EVERY placement that was
            //    configured on the primary color (those are mandatory)
            const otherColors = selectedColors.filter(c => c !== primaryColor);
            return otherColors.every(color => {
                const colorConfigs = colorPlacements[color] || [];
                return primaryConfigs.every(pc => {
                    const match = colorConfigs.find(
                        cc => cc.style === pc.style && cc.placementId === pc.placementId
                    );
                    return match && match.designFile && match.mockupFile;
                });
            });
        }
        if (step === 3) return true;
        if (step === 4) return !!coverImageFile && selectedSizes.length > 0;
        if (step === 5) return designTitle.trim() && designerCost !== '' && parseFloat(designerCost) >= 0 && designerNote.trim();
        return true;
    };

    /* â”€â”€ Price preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const pricePreview = useMemo(() => {
        const baseCost = Number(selectedProductObj?.cost) || 0;
        // Sum the max printing cost across all selected placements for any color
        const maxPrint = selectedColors.reduce((max, color) => {
            const list = colorPlacements[color] || [];
            const colorCost = list.reduce((sum, placement) => {
                const ps = selectedProductObj?.printingStyles?.find(x => x.style === placement.style);
                if (!ps) return sum;
                // Find the specific placement's price within the placements array
                const pl = (ps.placements || []).find(p => p.id === placement.placementId);
                if (!pl) return sum; const plPrice = placement.style?.toLowerCase() === "dtg" ? (Number(pl.cost_dark) || 0) : (Number(pl.price) || 0); return sum + plPrice;
            }, 0);
            return Math.max(max, colorCost);
        }, 0);
        const dCost = Number(designerCost) || 0;
        const rawTotal = baseCost + maxPrint + dCost;
        return { baseCost, maxPrint, dCost, rawTotal };
    }, [selectedProductObj, selectedColors, colorPlacements, designerCost]);

    /* â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const handleSubmit = async () => {
        if (!user || !selectedProductObj || isSubmitting) return;
        setIsSubmitting(true);
        try {
            showToast('Uploading cover image...', 'info');
            let coverImageUrl = '';
            if (coverImageFile) {
                const ext = coverImageFile.name.split('.').pop() || 'jpg';
                coverImageUrl = await uploadFile(coverImageFile, `designs/${user.id}/${Date.now()}_cover.${ext}`, 'asat-uploads');
            }

            showToast('Uploading color mockups...', 'info');
            const finalColorMockups = {};
            const allImageUrls = [coverImageUrl].filter(Boolean);
            for (const colorName of selectedColors) {
                const m = colorMockups[colorName] || {};
                const uploaded = {};
                for (const field of ['frontFile', 'backFile', 'modelFile']) {
                    if (m[field]) {
                        const ext = m[field].name.split('.').pop() || 'jpg';
                        const url = await uploadFile(m[field], `designs/${user.id}/${Date.now()}_${colorName}_${field}.${ext}`, 'asat-uploads');
                        uploaded[field.replace('File', 'Url')] = url;
                        allImageUrls.push(url);
                    }
                }
                finalColorMockups[colorName] = uploaded;
            }

            showToast('Uploading placement files...', 'info');
            const finalPlacements = {};
            for (const colorName of selectedColors) {
                finalPlacements[colorName] = [];
                for (const item of (colorPlacements[colorName] || [])) {
                    let designUrl = '';
                    let mockupUrl = '';
                    if (item.designFile) {
                        const ext = item.designFile.name.split('.').pop() || 'png';
                        designUrl = await uploadFile(item.designFile, `designs/${user.id}/${Date.now()}_design_${colorName}_${item.placementId}.${ext}`, 'asat-uploads');
                    }
                    if (item.mockupFile) {
                        const ext = item.mockupFile.name.split('.').pop() || 'jpg';
                        mockupUrl = await uploadFile(item.mockupFile, `designs/${user.id}/${Date.now()}_mockup_${colorName}_${item.placementId}.${ext}`, 'asat-uploads');
                        allImageUrls.push(mockupUrl);
                    }
                    finalPlacements[colorName].push({ style: item.style, placementId: item.placementId, placementLabel: item.placementLabel, designUrl, mockupUrl });
                }
            }

            showToast('Saving design...', 'info');
            const mapGender = (g) => {
                const gl = String(g || '').toLowerCase().trim();
                if (gl === 'men' || gl === 'male') return 'male';
                if (gl === 'women' || gl === 'female') return 'female';
                return 'unisex';
            };

            const baseCost = Number(selectedProductObj.cost) || 0;
            const maxPrintingCost = selectedColors.reduce((max, color) => {
                const colorCost = (colorPlacements[color] || []).reduce((sum, placement) => {
                    // Find the specific placement entry by id to get its price
                    const allStyles = (selectedProductObj.printingStyles || []).filter(
                        x => x.style?.toLowerCase() === placement.style?.toLowerCase()
                    );
                    let plPrice = 0;
                    for (const ps of allStyles) {
                        const pl = (ps.placements || []).find(p => p.id === placement.placementId);
                        if (pl) { plPrice = placement.style?.toLowerCase() === "dtg" ? (Number(pl.cost_dark) || 0) : (Number(pl.price) || 0); break; }
                    }
                    return sum + plPrice;
                }, 0);
                return Math.max(max, colorCost);
            }, 0);
            const dCost = Number(designerCost) || 0;

            const designData = {
                designer_id: user.id,
                designer_username: profile?.username || user.email?.split('@')[0] || 'designer',
                title: designTitle.trim(),
                price: baseCost + maxPrintingCost + dCost,
                description: JSON.stringify({
                    text: designerNote,
                    productionComments,
                    baseProductId: selectedProductId,
                    primaryColor,
                    placements: finalPlacements,
                    customerImages: finalColorMockups,
                    coverImage: coverImageUrl,
                    pricing: { baseCost, printingCost: maxPrintingCost, designerCost: dCost },
                }),
                status: 'pending',
                images: allImageUrls,
                colors: selectedColors,
                sizes: selectedSizes,
                gender: mapGender(selectedProductObj.gender),
                collection: selectedProductObj.category || 'Default',
                base_product_id: selectedProductId || null,
            };

            await apiFetch('/api/designs', { method: 'POST', body: JSON.stringify(designData) });
            showToast('Design submitted for review! Redirecting...', 'success');
            setTimeout(() => navigate('/designer/designs'), 2000);
        } catch (err) {
            console.error('Error submitting design:', err);
            showToast('Could not submit design: ' + err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       RENDER
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    return (
        <main className="dsn-upload">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* â”€â”€ Progress Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="dsn-upload__progress">
                {STEP_LABELS.map(({ num, label }) => (
                    <div key={num} className={`dsn-upload__step ${step > num ? 'done' : ''} ${step === num ? 'active' : ''}`}>
                        <div className="dsn-upload__step-dot">
                            {step > num ? <i className="fas fa-check" /> : num}
                        </div>
                        <span className="dsn-upload__step-label">{label}</span>
                    </div>
                ))}
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP 1: PRODUCT â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 1 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Select Product</h3>

                    {/* Category */}
                    <div className="dsn-profile__group" style={{ marginBottom: 24 }}>
                        <label>Select Category *</label>
                        {productsLoading ? (
                            <div style={{ color: '#888', fontSize: '0.85rem', padding: '10px 0' }}>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Loading categories...
                            </div>
                        ) : (
                            <select className="dsn-upload__select" value={selectedCategory} onChange={e => handleCategoryChange(e.target.value)}>
                                <option value="" disabled>Choose a category</option>
                                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Products Under Category */}
                    {selectedCategory && (
                        <div style={{ marginBottom: 24 }}>
                            <label style={SECTION_LABEL_ST}>Available Products</label>
                            
                            {/* Product Search Box */}
                            {rawProductsInCategory.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <input 
                                        type="text" 
                                        className="dsn-upload__input"
                                        placeholder="Search products by title or manufacturer..."
                                        value={productSearchQuery}
                                        onChange={e => setProductSearchQuery(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}

                            {productsInCategory.length === 0 ? (
                                <div style={{ color: '#888', fontSize: '0.85rem', padding: '16px 0' }}>No products match your search or category selection.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {productsInCategory.map(prod => {
                                        const isActive = selectedProductId === prod.id;
                                        const isExpanded = isActive && showProductDetails;
                                        return (
                                            <div key={prod.id} style={{
                                                border: `1px solid ${isActive ? 'var(--gold)' : '#e5e5e5'}`,
                                                borderRadius: 6, background: isActive ? 'rgba(212,175,55,0.05)' : '#ffffff',
                                                transition: 'all 0.2s', overflow: 'hidden'
                                            }}>
                                                {/* Header row */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                                                    <input type="checkbox" checked={isActive}
                                                        onChange={() => handleSelectProduct(isActive ? '' : prod.id)}
                                                        style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer', flexShrink: 0 }} />
                                                    {prod.coverImage && (
                                                        <img src={prod.coverImage} alt={prod.title}
                                                            style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                                                    )}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isActive ? 'var(--gold)' : '#222', marginBottom: 2 }}>
                                                            {prod.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#777' }}>
                                                            by {prod.mfgName || 'Manufacturer'} &nbsp;Â·&nbsp; Base Cost: ₹{(prod.cost || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => { if (!isActive) handleSelectProduct(prod.id); setShowProductDetails(v => isActive ? !v : true); }}
                                                        style={{ fontSize: '0.72rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                        {isExpanded ? 'Hide Details' : 'Show Details'}
                                                    </button>
                                                </div>
 
                                                {/* Details accordion */}
                                                {isExpanded && (
                                                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fafafa' }}>
                                                        {prod.details && prod.details.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Product Details</div>
                                                                {prod.details.map((d, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>â€¢ {d}</div>)}
                                                            </div>
                                                        )}
                                                        {prod.washCare && prod.washCare.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Wash Care</div>
                                                                {prod.washCare.map((w, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>â€¢ {w}</div>)}
                                                            </div>
                                                        )}
                                                        {prod.sizes && prod.sizes.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Available Sizes</div>
                                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                    {prod.sizes.map(s => (
                                                                        <span key={s} style={{ padding: '2px 10px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.72rem', color: '#444' }}>{s}</span>
                                                                    ))}
                                                                </div>
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
                    )}

                    {/* Colors */}
                    {selectedProductObj && (
                        <div style={{ marginBottom: 24 }}>
                            <label style={SECTION_LABEL_ST}>Available Colors</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(selectedProductObj.colors || []).filter(c => c.available !== false).map(c => {
                                    const isChecked = selectedColors.includes(c.colorName);
                                    return (
                                        <label key={c.colorName} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', border: `1px solid ${isChecked ? 'var(--gold)' : '#e5e5e5'}`,
                                            borderRadius: 4, cursor: 'pointer', userSelect: 'none',
                                            background: isChecked ? 'rgba(212,175,55,0.06)' : '#ffffff', transition: 'all 0.15s'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <input type="checkbox" checked={isChecked} onChange={() => toggleColor(c.colorName)}
                                                    style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }} />
                                                <span style={{
                                                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                                    background: c.color, border: `1px solid ${c.color === '#ffffff' || c.color?.toLowerCase() === '#fff' ? '#e0e0e0' : '#ccc'}`,
                                                    display: 'inline-block'
                                                }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? 'var(--gold)' : '#333' }}>{c.colorName}</span>
                                                {c.mode && (
                                                    <span style={{
                                                        fontSize: '0.6rem', padding: '1px 6px',
                                                        background: c.mode === 'dark' ? '#333' : '#e8e8e8',
                                                        color: c.mode === 'dark' ? '#fff' : '#333',
                                                        borderRadius: 10, fontWeight: 600
                                                    }}>{c.mode}</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#555' }}>Available</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Primary Color */}
                    {selectedColors.length > 0 && (
                        <div className="dsn-profile__group">
                            <label>Set Primary Color *</label>
                            <select className="dsn-upload__select" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}>
                                <option value="" disabled>Choose Primary Color</option>
                                {selectedColors.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}
                </section>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP 2: CONFIGURE â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 2 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Configure Your Design</h3>
                    {activeColorTab === primaryColor ? (
                        <p className="dsn-upload__hint">
                            <strong>Step 1 of 2 (Primary Color):</strong> Expand a print technique and upload your design file + reference mockup for each placement you want to use.
                            The placements you configure here will become <strong>mandatory</strong> for all other selected colors.
                        </p>
                    ) : (
                        <p className="dsn-upload__hint">
                            <strong>Step 2 of 2 (Secondary Color):</strong> The placements below are inherited from your primary color and are <strong>mandatory</strong>. Upload a design file and mockup for each one.
                        </p>
                    )}

                    {/* Color Tabs */}
                    {(() => {
                        const isPrimaryConfigured = (colorPlacements[primaryColor] || []).some(
                            c => c.designFile && c.mockupFile
                        );
                        return (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e5e5', paddingBottom: 0, flexWrap: 'wrap' }}>
                                {selectedColors.map(colorName => {
                                    const colorObj = selectedProductObj?.colors?.find(c => c.colorName === colorName);
                                    const isActive = activeColorTab === colorName;
                                    const isPrimary = colorName === primaryColor;
                                    const isDisabled = !isPrimary && !isPrimaryConfigured;
                                    const hasConfig = !isDisabled && (colorPlacements[colorName] || []).some(
                                        c => c.designFile && c.mockupFile
                                    );
                                    return (
                                        <button
                                            key={colorName}
                                            type="button"
                                            disabled={isDisabled}
                                            title={isDisabled ? `Configure "${primaryColor}" first` : (isPrimary ? 'Primary color' : 'Secondary color')}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setActiveColorTab(colorName);
                                                setExpandedTechnique('');
                                                setExpandedPlacement('');
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '9px 16px', border: 'none',
                                                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                                                background: 'transparent',
                                                color: isDisabled ? '#bbb' : (isActive ? 'var(--gold)' : '#666'),
                                                fontSize: '0.82rem', fontWeight: 600,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                                marginBottom: '-1px',
                                                opacity: isDisabled ? 0.5 : 1,
                                            }}>
                                            <span style={{
                                                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                                                background: colorObj?.color || '#888', border: '1px solid #ccc', display: 'inline-block'
                                            }} />
                                            {colorName}
                                            {isPrimary && (
                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: 0.5, color: isActive ? 'var(--gold)' : '#aaa', textTransform: 'uppercase' }}>Primary</span>
                                            )}
                                            {isDisabled && <i className="fas fa-lock" style={{ color: '#ccc', fontSize: '0.65rem' }} />}
                                            {hasConfig && <i className="fas fa-check-circle" style={{ color: '#2ecc71', fontSize: '0.75rem' }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {/* Print Technique Accordions */}
                    {activeColorTab && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {visibleTechniques.length === 0 ? (
                                <div style={{ color: '#888', fontSize: '0.85rem', padding: 20, border: '1px dashed #e0e0e0', borderRadius: 6, textAlign: 'center' }}>
                                    {activeColorTab === primaryColor
                                        ? 'No printing techniques configured for this product.'
                                        : 'Configure the primary color first to unlock placements for this color.'}
                                </div>
                            ) : visibleTechniques.map(tech => {
                                const techKey = tech.style;
                                const isOpen = expandedTechnique === techKey;
                                const placements = tech.placements;
                                const configuredCount = placements.filter(pl => {
                                    const c = getPlacementConfig(activeColorTab, techKey, pl.id);
                                    return c && c.designFile && c.mockupFile;
                                }).length;
                                const techLabel = techKey === 'dtf' ? 'Direct to Film (DTF)'
                                    : techKey === 'dtg' ? 'Direct to Garment (DTG)'
                                    : techKey === 'embrio' ? 'Embroidery'
                                    : techKey.toUpperCase();

                                return (
                                    <div key={techKey} style={{
                                        border: `1px solid ${isOpen ? 'var(--gold)' : 'rgba(212,175,55,0.2)'}`,
                                        borderRadius: 6, overflow: 'hidden', transition: 'all 0.2s',
                                        boxShadow: isOpen ? '0 4px 15px rgba(212,175,55,0.06)' : 'none'
                                    }}>
                                        {/* Technique header */}
                                        <div
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '13px 16px', cursor: 'pointer',
                                                background: isOpen ? 'rgba(212,175,55,0.06)' : '#fafafa',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => { setExpandedTechnique(isOpen ? '' : techKey); setExpandedPlacement(''); }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isOpen ? 'var(--gold)' : '#222' }}>
                                                    {techLabel}
                                                </span>
                                                {configuredCount > 0 && (
                                                    <span style={{
                                                        fontSize: '0.62rem', padding: '2px 8px',
                                                        background: configuredCount === placements.length ? 'rgba(46,204,113,0.15)' : 'rgba(212,175,55,0.15)',
                                                        color: configuredCount === placements.length ? '#27ae60' : 'var(--gold)',
                                                        borderRadius: 12, fontWeight: 700
                                                    }}>{configuredCount}/{placements.length} done</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '0.7rem', color: '#777' }}>
                                                    {isOpen ? 'Click to close' : `${placements.length} placements`}
                                                </span>
                                                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: isOpen ? 'var(--gold)' : '#888', fontSize: '0.7rem' }} />
                                            </div>
                                        </div>

                                        {/* Placement rows */}
                                        {isOpen && (
                                            <div style={{
                                                borderTop: '1px solid rgba(212,175,55,0.15)',
                                                padding: '10px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 8,
                                                background: '#fdfdfd',
                                                maxHeight: '480px',
                                                overflowY: 'auto'
                                            }}>
                                                {placements.map(pl => {
                                                    const config = getPlacementConfig(activeColorTab, techKey, pl.id);
                                                    const isConfigured = !!(config?.designFile && config?.mockupFile);
                                                    const plKey = `${techKey}_${pl.id}`;
                                                    const isPlExpanded = expandedPlacement === plKey;
                                                    return (
                                                        <div key={pl.id} style={{
                                                            border: `1px solid ${isConfigured ? 'rgba(46,204,113,0.45)' : '#e8e8e8'}`,
                                                            borderRadius: 4, overflow: 'hidden'
                                                        }}>
                                                            {/* Placement row header */}
                                                            <div
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: isPlExpanded ? '#fbfaf8' : '#ffffff', cursor: 'pointer' }}
                                                                onClick={() => setExpandedPlacement(isPlExpanded ? '' : plKey)}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                                    <div style={{
                                                                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                                                        border: `2px solid ${isConfigured ? '#2ecc71' : '#bbbbbb'}`,
                                                                        background: isConfigured ? '#2ecc71' : 'transparent',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }}>
                                                                        {isConfigured && <i className="fas fa-check" style={{ color: 'white', fontSize: '0.45rem' }} />}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.82rem', color: '#333', fontWeight: 500, textTransform: 'capitalize' }}>
                                                                        {pl.label}
                                                                        {activeColorTab !== primaryColor && (
                                                                            <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 800, color: '#e67e22', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mandatory</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <i className={`fas fa-chevron-${isPlExpanded ? 'up' : 'down'}`} style={{ color: '#888', fontSize: '0.65rem' }} />
                                                            </div>

                                                            {/* Placement config area */}
                                                            {isPlExpanded && (
                                                                <div style={{ padding: '14px 12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #f0f0f0' }}>
                                                                    {/* Reference boundary image */}
                                                                    {pl.refImage ? (
                                                                        <div>
                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Print Position Reference</div>
                                                                            <div style={{ border: '1px dashed rgba(212,175,55,0.25)', borderRadius: 4, padding: 8, textAlign: 'center', background: '#fafafa' }}>
                                                                                <img src={pl.refImage} alt="print position" style={{ maxHeight: 80, objectFit: 'contain' }} />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ border: '1px dashed #e0e0e0', borderRadius: 4, padding: '10px', textAlign: 'center', background: '#fafafa', fontSize: '0.72rem', color: '#777' }}>
                                                                            [ Print Position Reference Boundary Area ]
                                                                        </div>
                                                                    )}

                                                                    {/* Two upload zones side by side */}
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Upload Design *</div>
                                                                            <div style={{ height: 110 }}>
                                                                                <DropZone
                                                                                    label="Design File (PNG/AI/PDF)"
                                                                                    preview={config?.designPreview || ''}
                                                                                    onFile={f => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'designFile', f)}
                                                                                    accept=".png,.ai,.pdf,image/*"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Reference Mockup *</div>
                                                                            <div style={{ height: 110 }}>
                                                                                <DropZone
                                                                                    label="Mockup Image"
                                                                                    preview={config?.mockupPreview || ''}
                                                                                    onFile={f => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'mockupFile', f)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
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
                </section>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP 3: COMMENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 3 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Production Comments</h3>
                    <p className="dsn-upload__hint">
                        Specify position coordinates, ink limits, density instructions, or any other special notes for the manufacturer.
                        This field is optional but recommended for precision.
                    </p>
                    <div className="dsn-profile__group">
                        <label>Comments <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                            className="dsn-upload__textarea dsn-upload__textarea--lg"
                            rows={6}
                            placeholder="e.g. Place chest print 3 cm below collar Â· Keep ink density below 80% Â· Use Pantone match for brand colours..."
                            value={productionComments}
                            onChange={e => setProductionComments(e.target.value)}
                        />
                    </div>
                </section>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP 4: CUSTOMER DETAILS â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 4 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Customer Details</h3>
                    <p className="dsn-upload__hint">Upload storefront assets customers will see when browsing your design.</p>

                    {/* Cover Image */}
                    <div style={{ marginBottom: 28 }}>
                        <label style={SECTION_LABEL_ST}>Cover Image *</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: '#fafafa',
                            border: `1px solid ${coverImageFile ? 'var(--gold)' : '#e0e0e0'}`, borderRadius: 6
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {coverImagePreview && (
                                    <img src={coverImagePreview} alt="cover"
                                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #ddd' }} />
                                )}
                                <span style={{ fontSize: '0.82rem', color: coverImageFile ? '#333' : '#777' }}>
                                    {coverImageFile ? coverImageFile.name : 'No file uploaded'}
                                </span>
                            </div>
                            <label style={{
                                padding: '7px 16px', border: '1px solid var(--gold)', color: 'var(--gold)',
                                borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0
                            }}>
                                Choose File
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                    if (e.target.files[0]) {
                                        setCoverImageFile(e.target.files[0]);
                                        setCoverImagePreview(URL.createObjectURL(e.target.files[0]));
                                    }
                                }} />
                            </label>
                        </div>
                    </div>

                    {/* Color Mockup Assets */}
                    <div style={{ marginBottom: 28 }}>
                        <label style={SECTION_LABEL_ST}>Color Mockup Assets</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {selectedColors.map(colorName => {
                                const colorObj = selectedProductObj?.colors?.find(c => c.colorName === colorName);
                                const m = colorMockups[colorName] || {};
                                const mockupSlots = [
                                    { field: 'frontFile', previewField: 'frontPreview', label: 'Front View' },
                                    { field: 'backFile', previewField: 'backPreview', label: 'Back View' },
                                    { field: 'modelFile', previewField: 'modelPreview', label: 'Model View' },
                                ];
                                return (
                                    <div key={colorName} style={{ border: '1px solid rgba(212,175,55,0.15)', borderRadius: 6, padding: 14, background: '#fafafa' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: colorObj?.color || '#888', border: '1px solid #ccc', display: 'inline-block', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#222' }}>{colorName} Assets</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {mockupSlots.map(({ field, previewField, label }) => (
                                                <div key={field} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '8px 12px', background: '#ffffff',
                                                    border: `1px solid ${m[field] ? 'rgba(212,175,55,0.45)' : '#e0e0e0'}`, borderRadius: 4
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {m[previewField] && (
                                                            <img src={m[previewField]} alt={label} style={{ width: 30, height: 30, borderRadius: 3, objectFit: 'cover', border: '1px solid #ddd' }} />
                                                        )}
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: m[field] ? '#222' : '#777' }}>{label}:</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#555' }}>{m[field] ? m[field].name : 'No file'}</span>
                                                    </div>
                                                    <label style={{ padding: '4px 10px', border: '1px solid #ccc', color: '#777', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#777'; }}>
                                                        Choose
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                                            if (e.target.files[0]) updateColorMockup(colorName, field, e.target.files[0]);
                                                        }} />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sizes Configuration */}
                    <div>
                        <label style={SECTION_LABEL_ST}>Sizes Configuration *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(selectedProductObj?.sizes?.length ? selectedProductObj.sizes : STANDARD_SIZES).map(size => {
                                const isSelected = selectedSizes.includes(size);
                                return (
                                    <label key={size} style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                        border: `1px solid ${isSelected ? 'var(--gold)' : '#e0e0e0'}`,
                                        borderRadius: 4, cursor: 'pointer', userSelect: 'none',
                                        background: isSelected ? 'rgba(212,175,55,0.06)' : '#ffffff', transition: 'all 0.15s'
                                    }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSize(size)}
                                            style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--gold)' : '#333' }}>{size}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STEP 5: DESIGN DETAILS â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 5 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Design Details</h3>

                    <div className="dsn-profile__group">
                        <label>Design Name *</label>
                        <input type="text" className="dsn-upload__input"
                            placeholder="Enter design catalog reference name"
                            value={designTitle} onChange={e => setDesignTitle(e.target.value)} />
                    </div>

                    <div className="dsn-profile__group">
                        <label>Your Royalty / Cost (₹ INR) *</label>
                        <div className="dsn-auth__field" style={{ background: '#fafafa', border: '1px solid #ddd', borderRadius: 4 }}>
                            <span style={{ padding: '0 10px', color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
                            <input type="number" placeholder="e.g. 200" value={designerCost}
                                onChange={e => setDesignerCost(e.target.value)} min="0"
                                style={{ border: 'none', background: 'transparent', color: '#333', outline: 'none' }} />
                        </div>
                    </div>

                    {/* Live Price Preview */}
                    {selectedProductObj && (
                        <div style={{ marginBottom: 20, background: 'linear-gradient(135deg,#ffffff 0%,#fdfbf7 100%)', padding: 18, borderRadius: 8, border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 4px 20px rgba(212,175,55,0.06)' }}>
                            <h4 style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                ðŸ’° Price Preview
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#555', fontSize: '0.85rem' }}>
                                <span>Base Product:</span><span>₹{pricePreview.baseCost.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#555', fontSize: '0.85rem' }}>
                                <span>Max Printing Cost:</span><span>₹{pricePreview.maxPrint.toLocaleString()}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid rgba(212,175,55,0.15)', margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a6d3b', fontSize: '0.95rem', fontWeight: 700 }}>
                                <span>Your Royalty:</span><span>₹{pricePreview.dCost.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="dsn-profile__group">
                        <label>
                            Designer Note * &nbsp;
                            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 400 }}>(visible to customers — up to 3 lines)</span>
                        </label>
                        <textarea className="dsn-upload__textarea" rows={3}
                            placeholder="Share the story behind your design , inspiration, mood, target audience..."
                            value={designerNote} onChange={e => setDesignerNote(e.target.value)} />
                    </div>
                </section>
            )}

            {/* â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="dsn-upload__nav">
                {step > 1 && (
                    <button className="dsn-upload__nav-btn dsn-upload__nav-btn--back" onClick={() => setStep(s => s - 1)}>
                        <i className="fas fa-arrow-left" /> Back
                    </button>
                )}
                <div className="dsn-upload__nav-spacer" />

                {step < 5 ? (
                    <button
                        className="dsn-auth__btn"
                        disabled={!canProceed()}
                        onClick={() => { if (canProceed()) setStep(s => s + 1); }}
                        title={!canProceed() ? 'Please complete all required fields' : ''}
                    >
                        <span>Next</span><i className="fas fa-arrow-right" />
                    </button>
                ) : (
                    <button
                        className="dsn-auth__btn dsn-auth__btn--submit"
                        disabled={!canProceed() || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting
                            ? <><i className="fas fa-circle-notch fa-spin" /><span>Submitting...</span></>
                            : <><span>Submit for Review</span><i className="fas fa-paper-plane" /></>}
                    </button>
                )}
            </div>
        </main>
    );
}

export default DesignerUpload;

