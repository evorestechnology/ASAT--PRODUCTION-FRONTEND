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
/* ─── ZoomableImage Component ─── */
function ZoomableImage({ src, alt, maxHeight = 100, style = {} }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    if (!src) return null;

    return (
        <>
            <div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                title="Hover to zoom · Click to enlarge"
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    overflow: 'hidden',
                    borderRadius: 6,
                    cursor: 'zoom-in',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    background: '#ffffff',
                    boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.18)' : 'none',
                    transition: 'box-shadow 0.3s ease',
                    ...style
                }}
            >
                <img 
                    src={src} 
                    alt={alt || 'Zoomable preview'} 
                    style={{
                        maxHeight: maxHeight,
                        maxWidth: '100%',
                        display: 'block',
                        margin: '0 auto',
                        objectFit: 'contain',
                        transform: isHovered ? 'scale(2.4)' : 'scale(1)',
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        transition: isHovered ? 'transform 0.08s linear' : 'transform 0.3s ease',
                    }} 
                />
                <div style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.72)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.58rem',
                    fontFamily: 'Montserrat, sans-serif',
                    pointerEvents: 'none',
                    opacity: isHovered ? 0 : 0.85,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                }}>
                    <i className="fas fa-search-plus" style={{ fontSize: '0.55rem' }} /> Zoom
                </div>
            </div>

            {/* Lightbox Modal on Click */}
            {isModalOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20
                    }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: -14,
                                right: -14,
                                background: 'var(--gold)',
                                color: '#000',
                                border: 'none',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                        <img 
                            src={src} 
                            alt={alt} 
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                borderRadius: 8,
                                border: '2px solid var(--gold)',
                                background: '#fff',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
                            }} 
                        />
                        {alt && (
                            <div style={{
                                textAlign: 'center',
                                marginTop: 10,
                                color: '#ccc',
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: '0.78rem',
                                letterSpacing: '1px'
                            }}>
                                {alt}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ─── DropZone ─── */
function DropZone({ label, preview, onFile, onRemove, accept = '.png, .jpg, .jpeg, .webp, image/png, image/jpeg, image/webp', onInvalidFile }) {
    const [dragOver, setDragOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const fileInputRef = React.useRef(null);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    const validateAndProcess = (file) => {
        if (!file) return;
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
        if (!isImage) {
            if (onInvalidFile) onInvalidFile('Only PNG, JPG, JPEG, or WEBP image formats are allowed.');
            return;
        }
        onFile(file);
    };

    return (
        <div
            className={`dsn-upload__drop ${dragOver ? 'dsn-upload__drop--active' : ''} ${preview ? 'dsn-upload__drop--has' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) validateAndProcess(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current.click()}
            style={{ cursor: 'pointer', width: '100%', height: '100%', aspectRatio: 'auto', position: 'relative', overflow: 'hidden' }}
        >
            {preview ? (
                <div 
                    className="dsn-upload__drop-preview" 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onMouseMove={handleMouseMove}
                    style={{ 
                        backgroundImage: `url(${preview})`,
                        backgroundPosition: isHovered ? `${mousePos.x}% ${mousePos.y}%` : 'center',
                        backgroundSize: isHovered ? '240%' : 'contain',
                        transition: isHovered ? 'background-size 0.2s ease' : 'all 0.3s ease'
                    }}
                >
                    <div style={{ display: 'flex', gap: 6, position: 'absolute', bottom: 6, right: 6, zIndex: 10 }}>
                        <span className="dsn-upload__drop-change" onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>Change</span>
                        {onRemove && (
                            <span
                                className="dsn-upload__drop-change"
                                onClick={e => { e.stopPropagation(); onRemove(); }}
                                style={{ background: '#dc2626', color: '#ffffff' }}
                            >
                                <i className="fas fa-trash-alt" style={{ fontSize: '0.65rem', marginRight: 3 }} /> Delete
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="dsn-upload__drop-empty">
                    <i className="fas fa-cloud-upload-alt" />
                    <span>{label}</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} accept={accept}
                onChange={e => e.target.files[0] && validateAndProcess(e.target.files[0])}
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

    /* ── Step 2 ────────────────────────────── */
    // colorPlacements: { colorName: [{ id, style, placementId, placementLabel, designFile, designPreview, mockupFile, mockupPreview }] }
    const [colorPlacements, setColorPlacements] = useState({});
    const [activeColorTab, setActiveColorTab] = useState('');
    const [expandedTechnique, setExpandedTechnique] = useState('');
    const [expandedPlacement, setExpandedPlacement] = useState('');

    /* ── Step 3 ────────────────────────────── */
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
    const [designCategory, setDesignCategory] = useState('Aesthetic');
    const [designTags, setDesignTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [showTagInfo, setShowTagInfo] = useState(false);

    /* â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const [dbProducts, setDbProducts] = useState([]);
    const [dbPrintStyles, setDbPrintStyles] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/api/products?cb=${Date.now()}`)
            .then(data => {
                const list = (data || []).map(d => ({
                    id: d.id,
                    mfg_id: d.mfg_id,
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
                    sizeGuide: d.size_chart_image || d.size_guide || d.size_chart || '',
                }));
                setDbProducts(list);
            })
            .catch(err => { console.error('Error loading products:', err); setDbProducts([]); })
            .finally(() => setProductsLoading(false));

        apiFetch(`/api/print-styles?cb=${Date.now()}`)
            .then(data => {
                const list = (data || []).map(row => {
                    let desc = {};
                    try { desc = typeof row.description === 'string' ? JSON.parse(row.description) : (row.description || {}); } catch(e){}
                    return {
                        id: row.id,
                        mfg_id: row.mfg_id,
                        name: row.name,
                        category: (desc.category || row.category || 'DTF').toLowerCase().trim(),
                        active: row.active !== false,
                        placementCategories: desc.placementCategories || []
                    };
                });
                setDbPrintStyles(list);
            })
            .catch(() => setDbPrintStyles([]));
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

    /* ── Derived ────────────────────────── */
    const uniqueCategories = useMemo(() => {
        const cats = new Set(dbProducts.map(p => p.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [dbProducts]);

    /* ── Active tab follows primary color selection ─── */
    useEffect(() => {
        if (primaryColor && selectedColors.includes(primaryColor)) {
            setActiveColorTab(primaryColor);
        } else if (selectedColors.length > 0 && (!activeColorTab || !selectedColors.includes(activeColorTab))) {
            setActiveColorTab(selectedColors[0]);
        } else if (selectedColors.length === 0) {
            setActiveColorTab('');
        }
    }, [selectedColors, primaryColor]);

    /* ── Ensure primary color tab is active when entering Step 2 ─── */
    useEffect(() => {
        if (step === 2 && primaryColor) {
            const isPrimaryConfigured = (colorPlacements[primaryColor] || []).some(
                c => c.designFile && c.mockupFile
            );
            if (!isPrimaryConfigured || !activeColorTab || !selectedColors.includes(activeColorTab)) {
                setActiveColorTab(primaryColor);
            }
        }
    }, [step, primaryColor, colorPlacements, activeColorTab, selectedColors]);

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
            const key = (ps.style || ps.name || ps.type || '').toLowerCase().trim();
            if (!key) return;
            if (!merged[key]) {
                merged[key] = { ...ps, style: key, placements: [] };
            }

            // Find matching live print style from dbPrintStyles if available
            const matchingLiveStyle = dbPrintStyles.find(st => {
                return (selectedProductObj.mfg_id && st.mfg_id && st.mfg_id === selectedProductObj.mfg_id) &&
                    (st.id === ps.id || st.category === key || (st.name && st.name.toLowerCase().trim() === key));
            }) || dbPrintStyles.find(st => {
                return st.id === ps.id || st.category === key || (st.name && st.name.toLowerCase().trim() === key);
            });

            // If the whole print style is inactive, skip it
            if (matchingLiveStyle && matchingLiveStyle.active === false) {
                return;
            }

            const rawPlacements = (ps.placements || []).filter(pl => pl.active !== false && pl.available !== false);
            rawPlacements.forEach(pl => {
                const id = typeof pl === 'object' ? (pl.id || pl.label) : pl;
                const rawLabel = typeof pl === 'object' ? (pl.label || pl.name || id) : pl;
                let category = typeof pl === 'object' ? (pl.category || '') : '';
                let positionLabel = rawLabel;

                if (!category && id) {
                    if (rawLabel && id.endsWith('_' + rawLabel)) {
                        category = id.substring(0, id.length - rawLabel.length - 1);
                    } else if (id.includes('_')) {
                        const idx = id.lastIndexOf('_');
                        category = id.substring(0, idx);
                        if (!rawLabel || rawLabel === id) {
                            positionLabel = id.substring(idx + 1);
                        }
                    }
                }

                // Check live availability from matchingLiveStyle & placement object
                let isLiveAvailable = (typeof pl === 'object' ? (pl.active !== false && pl.available !== false) : true);

                if (matchingLiveStyle && Array.isArray(matchingLiveStyle.placementCategories) && matchingLiveStyle.placementCategories.length > 0) {
                    const normCat = (category || '').toLowerCase().trim().replace(/[\s_\-]/g, '');
                    const normPos = (positionLabel || rawLabel || '').toLowerCase().trim().replace(/[\s_\-]/g, '');

                    for (const pc of matchingLiveStyle.placementCategories) {
                        const pcNorm = (pc.category || '').toLowerCase().trim().replace(/[\s_\-]/g, '');
                        // If category matches
                        if (pcNorm && (pcNorm === normCat || normCat.includes(pcNorm) || pcNorm.includes(normCat))) {
                            if (pc.available === false || pc.active === false) {
                                isLiveAvailable = false;
                                break;
                            }
                            // Check option inside this category
                            const opts = pc.placements || {};
                            const optItems = Array.isArray(opts)
                                ? opts
                                : Object.entries(opts).map(([k, v]) => ({ label: k, ...v }));

                            for (const opt of optItems) {
                                const optNorm = (opt.label || opt.name || '').toLowerCase().trim().replace(/[\s_\-]/g, '');
                                if (optNorm && (optNorm === normPos || normPos === optNorm || normPos.includes(optNorm) || optNorm.includes(normPos))) {
                                    if (opt.available === false || opt.active === false) {
                                        isLiveAvailable = false;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                if (!isLiveAvailable) {
                    return; // Skip unavailable placement!
                }

                const formattedCategory = category
                    ? category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : 'General';
                const formattedPosLabel = positionLabel
                    ? positionLabel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : 'Position';
                const fullDisplayLabel = formattedCategory !== 'General'
                    ? `${formattedCategory} - ${formattedPosLabel}`
                    : formattedPosLabel;

                const item = {
                    id,
                    label: fullDisplayLabel,
                    positionLabel: formattedPosLabel,
                    category: formattedCategory,
                    refImage: typeof pl === 'object' ? (pl.refImage || pl.image) : null,
                    image: typeof pl === 'object' ? (pl.refImage || pl.image) : null,
                    price: typeof pl === 'object' ? (pl.price ?? 0) : 0,
                    cost_dark: typeof pl === 'object' ? (pl.cost_dark ?? pl.darkPrice ?? 0) : 0,
                    cost_light: typeof pl === 'object' ? (pl.cost_light ?? pl.lightPrice ?? 0) : 0,
                    active: true
                };

                if (!merged[key].placements.some(existing => existing.id === id)) {
                    merged[key].placements.push(item);
                }
            });
        });
        return Object.values(merged).filter(ps => ps.placements.length > 0);
    }, [selectedProductObj, dbPrintStyles]);


    /* ── Active tab follows color selection ─── */
    useEffect(() => {
        if (selectedColors.length > 0 && (!activeColorTab || !selectedColors.includes(activeColorTab))) {
            setActiveColorTab(primaryColor || selectedColors[0]);
        } else if (selectedColors.length === 0) {
            setActiveColorTab('');
        }
    }, [selectedColors, primaryColor]);

    /* ── Step 1 handlers ────────────────────────── */
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

    /* ── Step 2 helpers ─────────────────────────── */
    const getPlacementsForStyle = useCallback((styleName) => {
        if (!selectedProductObj) return [];
        const match = availableTechniques.find(
            x => x.style === styleName || x.style?.toLowerCase() === styleName?.toLowerCase()
        );
        return match ? match.placements : [];
    }, [selectedProductObj, availableTechniques]);

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
        if (file) {
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
            if (!isImage) {
                showToast('Only PNG, JPG, or WEBP image formats are allowed.', 'warning');
                return;
            }
        }
        const preview = file ? URL.createObjectURL(file) : '';
        const previewField = field === 'designFile' ? 'designPreview' : 'mockupPreview';
        setColorPlacements(prev => {
            const list = [...(prev[colorName] || [])];
            const idx = list.findIndex(c => c.style === techStyle && c.placementId === placementId);
            if (idx >= 0) {
                list[idx] = { ...list[idx], [field]: file, [previewField]: preview };
            } else if (file) {
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

    /* ──── Step 4 handlers ──────────────────────── */
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

    /* ──── Validation ───────────────────────────── */
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
        if (step === 5) return designTitle.trim() && designerCost !== '' && parseFloat(designerCost) >= 0 && designerNote.trim() && designCategory && designTags.length > 0;
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
                for (const field of ['frontFile', 'backFile', 'modelFile', 'modelFile2']) {
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
            const findPl = (placements, placementId) => {
                if (!placements || !placementId) return null;
                const pidClean = String(placementId).toLowerCase().trim();
                return placements.find(p => {
                    const pId = String(p.id || '').toLowerCase().trim();
                    const pLabel = String(p.label || '').toLowerCase().trim();
                    const pName = String(p.name || '').toLowerCase().trim();
                    return pId === pidClean || pLabel === pidClean || pName === pidClean ||
                           (pId && pidClean && (pId.endsWith('_' + pidClean) || pidClean.endsWith('_' + pId)));
                });
            };

            const maxPrintingCost = selectedColors.reduce((max, color) => {
                const colorCost = (colorPlacements[color] || []).reduce((sum, placement) => {
                    const allStyles = (selectedProductObj.printingStyles || []).filter(
                        x => x.style?.toLowerCase() === placement.style?.toLowerCase()
                    );
                    let plPrice = 0;
                    for (const ps of allStyles) {
                        const pl = findPl(ps.placements, placement.placementId);
                        if (pl) {
                            const isDtg = placement.style?.toLowerCase() === 'dtg';
                            if (isDtg) {
                                const cd = Number(pl.cost_dark) || 0;
                                const cl = Number(pl.cost_light) || 0;
                                plPrice = (cd > 0 || cl > 0) ? Math.max(cd, cl) : (Number(pl.price) || 0);
                            } else {
                                plPrice = Number(pl.price ?? pl.cost ?? pl.cost_dark ?? pl.cost_light ?? 0);
                            }
                            break;
                        }
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
                category: designCategory,
                tags: designTags,
                price: baseCost + maxPrintingCost + dCost,
                description: JSON.stringify({
                    text: designerNote,
                    productionComments,
                    baseProductId: selectedProductId,
                    primaryColor,
                    placements: finalPlacements,
                    customerImages: finalColorMockups,
                    coverImage: coverImageUrl,
                    category: designCategory,
                    tags: designTags,
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

    /* ══════════════════════════════ RENDER ══════════════════════════════ */
    return (
        <main className="dsn-upload">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* ── Progress Bar ────────────────────────────── */}
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

            {/* ══════════════ STEP 1: PRODUCT ══════════════ */}
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
                                        placeholder="Search products by title..."
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
                                                            Base Cost: ₹{(prod.cost || 0).toLocaleString()}
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
                                                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: '#fafafa' }}>
                                                        {prod.details && prod.details.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Product Details</div>
                                                                {prod.details.map((d, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>• {d}</div>)}
                                                            </div>
                                                        )}
                                                        {prod.washCare && prod.washCare.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Wash Care</div>
                                                                {prod.washCare.map((w, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>• {w}</div>)}
                                                            </div>
                                                        )}
                                                        {prod.sizes && prod.sizes.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Available Sizes</div>
                                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                    {prod.sizes.map(s => {
                                                                         const sizeName = typeof s === 'object' && s !== null ? s.size : s;
                                                                         const isAvailable = typeof s === 'object' && s !== null ? (s.available !== false) : true;
                                                                         if (!isAvailable) return null;
                                                                         return (
                                                                             <span key={sizeName} style={{ padding: '3px 12px', background: '#ffffff', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, color: 'var(--dark)' }}>{sizeName}</span>
                                                                         );
                                                                     })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Size Guide Section */}
                                                        <div>
                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <i className="fas fa-ruler-combined" /> Size Guide & Measurements
                                                            </div>
                                                            {prod.sizeGuide ? (
                                                                <div>
                                                                    <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
                                                                        Hover over size chart to zoom · Click to enlarge:
                                                                    </div>
                                                                    <ZoomableImage src={prod.sizeGuide} alt={`${prod.title} Size Guide`} maxHeight={200} />
                                                                </div>
                                                            ) : (
                                                                <div style={{ background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 8, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 8, fontFamily: 'Cinzel, serif', letterSpacing: '0.5px' }}>
                                                                        Standard Sizing Chart (in inches)
                                                                    </div>
                                                                    <div style={{ overflowX: 'auto' }}>
                                                                        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse', textAlign: 'center', color: '#444', fontFamily: 'Montserrat, sans-serif' }}>
                                                                            <thead>
                                                                                <tr style={{ background: 'rgba(197, 160, 89, 0.1)', borderBottom: '1px solid var(--gold)' }}>
                                                                                    <th style={{ padding: '7px 10px', fontWeight: 700 }}>Size</th>
                                                                                    <th style={{ padding: '7px 10px', fontWeight: 700 }}>Chest</th>
                                                                                    <th style={{ padding: '7px 10px', fontWeight: 700 }}>Length</th>
                                                                                    <th style={{ padding: '7px 10px', fontWeight: 700 }}>Sleeve</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ fontWeight: 700, color: 'var(--gold)' }}>S</td><td>38"</td><td>27"</td><td>8.0"</td></tr>
                                                                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ fontWeight: 700, color: 'var(--gold)' }}>M</td><td>40"</td><td>28"</td><td>8.5"</td></tr>
                                                                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ fontWeight: 700, color: 'var(--gold)' }}>L</td><td>42"</td><td>29"</td><td>9.0"</td></tr>
                                                                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ fontWeight: 700, color: 'var(--gold)' }}>XL</td><td>44"</td><td>30"</td><td>9.5"</td></tr>
                                                                                <tr><td style={{ fontWeight: 700, color: 'var(--gold)' }}>XXL</td><td>46"</td><td>31"</td><td>10.0"</td></tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                if (isDisabled) {
                                                    setActiveColorTab(primaryColor);
                                                    showToast(`Please configure the primary color (${primaryColor}) first to unlock secondary colors.`, 'info');
                                                    return;
                                                }
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
                                const placements = tech.placements || [];
                                const configuredCount = placements.filter(pl => {
                                    const c = getPlacementConfig(activeColorTab, techKey, pl.id);
                                    return c && c.designFile && c.mockupFile;
                                }).length;
                                const techLabel = techKey === 'dtf' ? 'Direct to Film (DTF)'
                                    : techKey === 'dtg' ? 'Direct to Garment (DTG)'
                                    : techKey === 'embrio' ? 'Embroidery'
                                    : techKey.toUpperCase();

                                // Group placements by category within this technique
                                const categoryGroups = {};
                                placements.forEach(pl => {
                                    const cat = pl.category || 'General';
                                    if (!categoryGroups[cat]) categoryGroups[cat] = [];
                                    categoryGroups[cat].push(pl);
                                });
                                const categoryEntries = Object.entries(categoryGroups);

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

                                        {/* Placement Category Groups */}
                                        {isOpen && (
                                            <div style={{
                                                borderTop: '1px solid rgba(212,175,55,0.15)',
                                                padding: '12px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 12,
                                                background: '#fdfdfd'
                                            }}>
                                                {categoryEntries.map(([catName, catPlacements]) => {
                                                    const catDoneCount = catPlacements.filter(pl => {
                                                        const c = getPlacementConfig(activeColorTab, techKey, pl.id);
                                                        return c && c.designFile && c.mockupFile;
                                                    }).length;
                                                    const isCatAllDone = catDoneCount === catPlacements.length && catDoneCount > 0;

                                                    return (
                                                        <div key={catName} style={{
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 6,
                                                            overflow: 'hidden',
                                                            background: '#ffffff',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                                        }}>
                                                            {/* Placement Category Header */}
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '10px 14px',
                                                                background: '#f8fafc',
                                                                borderBottom: '1px solid #edf2f7'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                                    <i className="fas fa-layer-group" style={{ color: 'var(--gold)', fontSize: '0.78rem' }} />
                                                                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>
                                                                        {catName}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '0.62rem',
                                                                        padding: '2px 8px',
                                                                        background: isCatAllDone ? 'rgba(46,204,113,0.15)' : (catDoneCount > 0 ? 'rgba(212,175,55,0.15)' : '#f1f5f9'),
                                                                        color: isCatAllDone ? '#27ae60' : (catDoneCount > 0 ? 'var(--gold)' : '#64748b'),
                                                                        borderRadius: 10,
                                                                        fontWeight: 700
                                                                    }}>
                                                                        {catDoneCount}/{catPlacements.length} done
                                                                    </span>
                                                                </div>
                                                                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>
                                                                    {catPlacements.length} position{catPlacements.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>

                                                            {/* Positions inside this Placement Category */}
                                                            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8, background: '#ffffff' }}>
                                                                {catPlacements.map(pl => {
                                                                    const config = getPlacementConfig(activeColorTab, techKey, pl.id);
                                                                    const isConfigured = !!(config?.designFile && config?.mockupFile);
                                                                    const plKey = `${techKey}_${pl.id}`;
                                                                    const isPlExpanded = expandedPlacement === plKey;

                                                                    return (
                                                                        <div key={pl.id} style={{
                                                                            border: `1px solid ${isConfigured ? 'rgba(46,204,113,0.45)' : (isPlExpanded ? 'var(--gold)' : '#e2e8f0')}`,
                                                                            borderRadius: 5,
                                                                            overflow: 'hidden',
                                                                            transition: 'all 0.15s'
                                                                        }}>
                                                                            {/* Position row header */}
                                                                            <div
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'space-between',
                                                                                    padding: '9px 12px',
                                                                                    background: isPlExpanded ? 'rgba(212,175,55,0.03)' : '#ffffff',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                                onClick={() => setExpandedPlacement(isPlExpanded ? '' : plKey)}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                                                    <div style={{
                                                                                        width: 16,
                                                                                        height: 16,
                                                                                        borderRadius: '50%',
                                                                                        flexShrink: 0,
                                                                                        border: `2px solid ${isConfigured ? '#2ecc71' : '#cbd5e1'}`,
                                                                                        background: isConfigured ? '#2ecc71' : 'transparent',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center'
                                                                                    }}>
                                                                                        {isConfigured && <i className="fas fa-check" style={{ color: 'white', fontSize: '0.45rem' }} />}
                                                                                    </div>
                                                                                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, textTransform: 'capitalize' }}>
                                                                                        {pl.positionLabel || pl.label}
                                                                                        {activeColorTab !== primaryColor && (
                                                                                            <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 800, color: '#e67e22', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mandatory</span>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                    {isConfigured && (
                                                                                        <span style={{ fontSize: '0.65rem', color: '#27ae60', fontWeight: 600 }}>Ready</span>
                                                                                    )}
                                                                                    <i className={`fas fa-chevron-${isPlExpanded ? 'up' : 'down'}`} style={{ color: isPlExpanded ? 'var(--gold)' : '#94a3b8', fontSize: '0.65rem' }} />
                                                                                </div>
                                                                            </div>

                                                                            {/* Position config area */}
                                                                            {isPlExpanded && (
                                                                                <div style={{ padding: '14px 12px', background: '#fcfcfc', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #f1f5f9' }}>
                                                                                    {/* Reference boundary image */}
                                                                                    {(pl.refImage || pl.image) ? (
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                                                                                                Print Position Reference (Hover to Zoom)
                                                                                            </div>
                                                                                            <div style={{ border: '1px dashed rgba(212,175,55,0.35)', borderRadius: 6, padding: 8, textAlign: 'center', background: '#ffffff' }}>
                                                                                                <ZoomableImage src={pl.refImage || pl.image} alt={`Print Position: ${pl.positionLabel || pl.label}`} maxHeight={120} />
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div style={{ border: '1px dashed #e2e8f0', borderRadius: 4, padding: '10px', textAlign: 'center', background: '#ffffff', fontSize: '0.72rem', color: '#94a3b8' }}>
                                                                                            [ Print Position Reference Boundary Area ]
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Two upload zones side by side (PNG / JPG) */}
                                                                                    <div className="dsn-upload__drop-grid">
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Upload Design (PNG / JPG) *</div>
                                                                                            <div style={{ height: 110 }}>
                                                                                                <DropZone
                                                                                                    label="Design File (PNG / JPG)"
                                                                                                    preview={config?.designPreview || ''}
                                                                                                    onFile={f => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'designFile', f)}
                                                                                                    onRemove={() => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'designFile', null)}
                                                                                                    accept=".png, .jpg, .jpeg, .webp, image/png, image/jpeg, image/webp"
                                                                                                    onInvalidFile={(msg) => showToast(msg, 'warning')}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Reference Mockup (PNG / JPG) *</div>
                                                                                            <div style={{ height: 110 }}>
                                                                                                <DropZone
                                                                                                    label="Mockup Image (PNG / JPG)"
                                                                                                    preview={config?.mockupPreview || ''}
                                                                                                    onFile={f => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'mockupFile', f)}
                                                                                                    onRemove={() => setPlacementFile(activeColorTab, techKey, pl.id, pl.label, 'mockupFile', null)}
                                                                                                    accept=".png, .jpg, .jpeg, .webp, image/png, image/jpeg, image/webp"
                                                                                                    onInvalidFile={(msg) => showToast(msg, 'warning')}
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

            {/* ══════════════════════════════ STEP 3: COMMENTS ══════════════════════════════ */}
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
                            placeholder="e.g. Place chest print 3 cm below collar · Keep ink density below 80% · Use Pantone match for brand colours..."
                            value={productionComments}
                            onChange={e => setProductionComments(e.target.value)}
                        />
                    </div>
                </section>
            )}

            {/* ══════════════════════════════ STEP 4: CUSTOMER DETAILS ══════════════════════════════ */}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {coverImageFile && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverImageFile(null);
                                            setCoverImagePreview('');
                                        }}
                                        style={{
                                            padding: '6px 14px', background: '#fef2f2', border: '1px solid #ef4444', color: '#dc2626',
                                            borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                                    >
                                        <i className="fas fa-trash-alt" /> Delete
                                    </button>
                                )}
                                <label style={{
                                    padding: '7px 16px', border: '1px solid var(--gold)', color: 'var(--gold)',
                                    borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0
                                }}>
                                    {coverImageFile ? 'Change' : 'Choose File'}
                                    <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" style={{ display: 'none' }} onChange={e => {
                                        if (e.target.files[0]) {
                                            setCoverImageFile(e.target.files[0]);
                                            setCoverImagePreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} />
                                </label>
                            </div>
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
                                    { field: 'modelFile', previewField: 'modelPreview', label: 'Model View 1 (Optional)' },
                                    { field: 'modelFile2', previewField: 'modelPreview2', label: 'Model View 2 (Optional)' },
                                ];
                                return (
                                    <div key={colorName} style={{ border: '1px solid rgba(212,175,55,0.15)', borderRadius: 6, padding: 14, background: '#fafafa' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: colorObj?.color || '#888', border: '1px solid #ccc', display: 'inline-block', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#222' }}>{colorName} Assets</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {mockupSlots.map(({ field, previewField, label }) => (
                                                <div key={field} className="dsn-upload__mockup-row" style={{
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
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {m[field] && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateColorMockup(colorName, field, null)}
                                                                style={{
                                                                    padding: '4px 10px', background: '#fef2f2', border: '1px solid #ef4444', color: '#dc2626',
                                                                    borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                                                                    display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                                                            >
                                                                <i className="fas fa-trash-alt" /> Delete
                                                            </button>
                                                        )}
                                                        <label style={{ padding: '4px 10px', border: '1px solid #ccc', color: '#777', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#777'; }}>
                                                            {m[field] ? 'Change' : 'Choose'}
                                                            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" style={{ display: 'none' }} onChange={e => {
                                                                if (e.target.files[0]) updateColorMockup(colorName, field, e.target.files[0]);
                                                            }} />
                                                        </label>
                                                    </div>
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
                            {(selectedProductObj?.sizes?.length ? selectedProductObj.sizes : STANDARD_SIZES).map(sz => {
                                const sizeName = typeof sz === 'object' && sz !== null ? sz.size : sz;
                                const isAvailable = typeof sz === 'object' && sz !== null ? (sz.available !== false) : true;
                                const isSelected = selectedSizes.includes(sizeName);

                                return (
                                    <label key={sizeName} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                                        border: `1px solid ${isSelected ? 'var(--gold)' : '#e0e0e0'}`,
                                        borderRadius: 4, cursor: isAvailable ? 'pointer' : 'not-allowed', userSelect: 'none',
                                        background: isSelected ? 'rgba(212,175,55,0.06)' : '#ffffff', transition: 'all 0.15s',
                                        opacity: isAvailable ? 1 : 0.55
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected} 
                                                disabled={!isAvailable}
                                                onChange={() => isAvailable && toggleSize(sizeName)}
                                                style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: isAvailable ? 'pointer' : 'not-allowed' }} 
                                            />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--gold)' : '#333' }}>{sizeName}</span>
                                        </div>
                                        {!isAvailable && (
                                            <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '2px 8px', borderRadius: 4, border: '1px solid #fecaca' }}>
                                                Unavailable from Manufacturer
                                            </span>
                                        )}
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
                                💰 Price Preview
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a6d3b', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
                                <span>Your Royalty:</span><span>₹{pricePreview.dCost.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px dashed rgba(212,175,55,0.3)', paddingTop: 8 }}>
                                <span>Customer Pays:</span><span style={{ color: '#b8922a' }}>₹{Math.round(applyMarkup(pricePreview.rawTotal)).toLocaleString()}</span>
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

                    {/* Select Category */}
                    <div className="dsn-profile__group" style={{ marginTop: 16 }}>
                        <label>Select Category *</label>
                        <select className="dsn-upload__input" value={designCategory} onChange={e => setDesignCategory(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                            <option value="Aesthetic">Aesthetic</option>
                            <option value="Nature">Nature</option>
                            <option value="Bold">Bold</option>
                            <option value="Minimal">Minimal</option>
                            <option value="Vintage">Vintage</option>
                            <option value="Graphic">Graphic</option>
                            <option value="Typography">Typography</option>
                            <option value="Abstract">Abstract</option>
                            <option value="Streetwear">Streetwear</option>
                            <option value="Anime">Anime</option>
                            <option value="Sports">Sports</option>
                            <option value="Y2K">Y2K</option>
                        </select>
                    </div>

                    {/* Tags Input (Only 5 tags) */}
                    <div className="dsn-profile__group" style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <label style={{ margin: 0 }}>Tags (Max 5 tags) *</label>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowTagInfo(!showTagInfo)}
                                    onMouseEnter={() => setShowTagInfo(true)}
                                    onMouseLeave={() => setShowTagInfo(false)}
                                    style={{
                                        background: '#f3e8ff', border: '1px solid #c084fc', color: '#7e22ce',
                                        width: 20, height: 20, borderRadius: '50%', fontSize: '0.75rem',
                                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    i
                                </button>
                                {showTagInfo && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 260,
                                        padding: '10px 12px', background: '#1e293b', color: '#f8fafc',
                                        fontSize: '0.72rem', borderRadius: 6, zIndex: 100, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                                        lineHeight: 1.4
                                    }}>
                                        ℹ️ Tags are reviewed by Master. Inappropriate, spam, or tags violating T&C will result in design rejection or removal.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                type="text"
                                className="dsn-upload__input"
                                placeholder={designTags.length >= 5 ? "Max 5 tags reached" : "Enter tag and click Add or press Enter"}
                                value={tagInput}
                                disabled={designTags.length >= 5}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        const clean = tagInput.trim().replace(/^#/, '');
                                        if (clean && !designTags.includes(clean) && designTags.length < 5) {
                                            setDesignTags([...designTags, clean]);
                                            setTagInput('');
                                        }
                                    }
                                }}
                            />
                            <button
                                type="button"
                                disabled={designTags.length >= 5 || !tagInput.trim()}
                                onClick={() => {
                                    const clean = tagInput.trim().replace(/^#/, '');
                                    if (clean && !designTags.includes(clean) && designTags.length < 5) {
                                        setDesignTags([...designTags, clean]);
                                        setTagInput('');
                                    }
                                }}
                                style={{
                                    padding: '8px 16px', background: designTags.length >= 5 ? '#ccc' : 'var(--gold)',
                                    color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: designTags.length >= 5 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Add
                            </button>
                        </div>
                        {/* Tags Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {designTags.map((tag, idx) => (
                                <span key={idx} style={{
                                    background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold)',
                                    color: '#7a5e10', padding: '4px 10px', borderRadius: 16, fontSize: '0.78rem',
                                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => setDesignTags(designTags.filter((_, i) => i !== idx))}
                                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem', padding: 0, lineHeight: 1 }}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
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

