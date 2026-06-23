import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';


const COLOR_PALETTE = [
    { name: 'Black', hex: '#000000' }, { name: 'Navy Blue', hex: '#1B2A4A' },
    { name: 'Red', hex: '#C0392B' }, { name: 'Olive', hex: '#556B2F' },
    { name: 'White', hex: '#FFFFFF' }, { name: 'Burgundy', hex: '#800020' },
    { name: 'Sand', hex: '#F5DEB3' }, { name: 'Charcoal', hex: '#2F2F2F' },
];

const IMAGE_SLOTS = ['Cover Image', 'Front View', 'Back View', 'Left Side View', 'Right Side View', 'Design Mockup'];
const APPAREL_ZONES = ['Front Design', 'Back Design', 'Front Right Shoulder', 'Front Left Shoulder', 'Back Right Shoulder', 'Back Left Shoulder'];
const BOTTOM_ZONES = ['Front Pant Upper', 'Front Pant Lower', 'Back Pant Upper', 'Back Pant Lower'];

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

function DesignerUpload() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const { applyMarkup } = useCurrency();
    const [step, setStep] = useState(1);

    // Step 1
    const [selectedColors, setSelectedColors] = useState([]);
    
    // Step 2: Placement Specifications (Per Color)
    const [colorPlacements, setColorPlacements] = useState({}); // { colorName: [ { id, style, placementId, placementLabel, designFile, designPreview, mockupFile, mockupPreview } ] }
    const [activePlacementColorTab, setActivePlacementColorTab] = useState('');

    // Step 2 form inputs
    const [formStyle, setFormStyle] = useState('');
    const [formPlacement, setFormPlacement] = useState('');
    const [formDesignFile, setFormDesignFile] = useState(null);
    const [formDesignPreview, setFormDesignPreview] = useState('');
    const [formMockupFile, setFormMockupFile] = useState(null);
    const [formMockupPreview, setFormMockupPreview] = useState('');

    // Step 3: Manufacturer Reference Images (Per Color)
    const [manufacturerRefs, setManufacturerRefs] = useState({}); // { colorName: [ { file, preview } ] }
    const [activeMfgRefColorTab, setActiveMfgRefColorTab] = useState('');

    // Step 4: Details & Customer Images
    const [designTitle, setDesignTitle] = useState('');
    const [description, setDescription] = useState('');
    const [designerCost, setDesignerCost] = useState('');
    const [customerImages, setCustomerImages] = useState({}); // { colorName: [ { file, preview } ] }
    const [activeCustomerImgColorTab, setActiveCustomerImgColorTab] = useState('');

    // Dynamic products from Supabase
    const [dbProducts, setDbProducts] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_upload_products');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const uniqueProducts = useMemo(() => {
        const seen = new Set();
        return dbProducts.filter(p => {
            const titleLower = p.title?.trim().toLowerCase();
            if (!titleLower || seen.has(titleLower)) return false;
            seen.add(titleLower);
            return true;
        });
    }, [dbProducts]);
    const [productsLoading, setProductsLoading] = useState(() => {
        try {
            const saved = sessionStorage.getItem('asat_designer_upload_products');
            return saved ? false : true;
        } catch (e) {
            return true;
        }
    });
    const [selectedProductId, setSelectedProductId] = useState('');

    useEffect(() => {
        const hasCache = sessionStorage.getItem('asat_designer_upload_products');
        if (!hasCache) {
            setProductsLoading(true);
        }
        apiFetch('/api/products')
            .then((data) => {
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
                    printingStyles: d.printing_styles || []
                }));
                setDbProducts(list);
                try {
                    sessionStorage.setItem('asat_designer_upload_products', JSON.stringify(list));
                } catch (e) {}
            })
            .catch((err) => {
                console.error("Error loading products:", err);
                setDbProducts([]);
            })
            .finally(() => setProductsLoading(false));
    }, []);

    const selectedProductObj = dbProducts.find(p => p.id === selectedProductId);

    useEffect(() => {
        if (selectedProductObj) {
            setDesignTitle(selectedProductObj.title || '');
        } else {
            setDesignTitle('');
        }
    }, [selectedProductId, selectedProductObj]);

    useEffect(() => {
        if (selectedColors.length > 0) {
            if (!activePlacementColorTab || !selectedColors.includes(activePlacementColorTab)) {
                setActivePlacementColorTab(selectedColors[0]);
            }
            if (!activeMfgRefColorTab || !selectedColors.includes(activeMfgRefColorTab)) {
                setActiveMfgRefColorTab(selectedColors[0]);
            }
            if (!activeCustomerImgColorTab || !selectedColors.includes(activeCustomerImgColorTab)) {
                setActiveCustomerImgColorTab(selectedColors[0]);
            }
        } else {
            setActivePlacementColorTab('');
            setActiveMfgRefColorTab('');
            setActiveCustomerImgColorTab('');
        }
    }, [selectedColors, activePlacementColorTab, activeMfgRefColorTab, activeCustomerImgColorTab]);

    const availableMethods = useMemo(() => {
        if (!selectedProductObj || !selectedProductObj.printingStyles || selectedProductObj.printingStyles.length === 0) {
            return ['DTG', 'DTF', 'Embroidery'];
        }
        // Filter out styles that have no placements assigned
        const filtered = selectedProductObj.printingStyles.filter(ps => Array.isArray(ps.placements) && ps.placements.length > 0);
        if (filtered.length === 0) {
            return selectedProductObj.printingStyles.map(ps => ps.style);
        }
        return filtered.map(ps => ps.style);
    }, [selectedProductObj]);

    const getPlacementsForStyle = useCallback((styleName) => {
        if (!selectedProductObj || !selectedProductObj.printingStyles) return [];
        const ps = selectedProductObj.printingStyles.find(x => x.style === styleName);
        if (!ps || !Array.isArray(ps.placements)) return [];
        return ps.placements.map(pl => {
            const id = typeof pl === 'object' ? pl.id : pl;
            const label = typeof pl === 'object' ? pl.label : (PLACEMENT_LABELS[pl] || pl);
            return { id, label };
        });
    }, [selectedProductObj]);

    useEffect(() => {
        if (availableMethods.length > 0) {
            if (!formStyle || !availableMethods.includes(formStyle)) {
                setFormStyle(availableMethods[0]);
            }
        } else {
            setFormStyle('');
        }
    }, [availableMethods, formStyle]);

    useEffect(() => {
        if (formStyle) {
            const list = getPlacementsForStyle(formStyle);
            setFormPlacement(list[0]?.id || '');
        }
    }, [formStyle, getPlacementsForStyle]);

    const handleDirectDownload = async (url, filename) => {
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
        } catch (err) {
            console.error("Direct download failed, opening in new tab:", err);
            window.open(url, '_blank');
        }
    };

    // Color toggle
    const toggleColor = (colorName) => {
        setSelectedColors(prev => {
            if (prev.includes(colorName)) {
                return prev.filter(c => c !== colorName);
            }
            return [...prev, colorName];
        });
    };

    // Form add configuration handler
    const handleAddConfig = (e) => {
        e.preventDefault();
        if (!formStyle || !formPlacement || !formDesignFile || !formMockupFile) {
            showToast('Please select printing style, placement, design file, and mockup preview.', 'error');
            return;
        }
        const placementsList = getPlacementsForStyle(formStyle);
        const placementLabel = placementsList.find(x => x.id === formPlacement)?.label || formPlacement;
        
        const newConfig = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            style: formStyle,
            placementId: formPlacement,
            placementLabel: placementLabel,
            designFile: formDesignFile,
            designPreview: formDesignPreview,
            mockupFile: formMockupFile,
            mockupPreview: formMockupPreview
        };

        setColorPlacements(prev => ({
            ...prev,
            [activePlacementColorTab]: [...(prev[activePlacementColorTab] || []), newConfig]
        }));

        setFormDesignFile(null);
        setFormDesignPreview('');
        setFormMockupFile(null);
        setFormMockupPreview('');
        showToast('Placement specification added successfully!', 'success');
    };

    const handleRemoveConfig = (colorName, id) => {
        setColorPlacements(prev => ({
            ...prev,
            [colorName]: (prev[colorName] || []).filter(item => item.id !== id)
        }));
    };

    const handleAddMfgRef = (file) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setManufacturerRefs(prev => ({
            ...prev,
            [activeMfgRefColorTab]: [...(prev[activeMfgRefColorTab] || []), { file, preview }]
        }));
    };

    const handleRemoveMfgRef = (colorName, index) => {
        setManufacturerRefs(prev => ({
            ...prev,
            [colorName]: (prev[colorName] || []).filter((_, i) => i !== index)
        }));
    };

    const handleAddCustomerImage = (file) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setCustomerImages(prev => ({
            ...prev,
            [activeCustomerImgColorTab]: [...(prev[activeCustomerImgColorTab] || []), { file, preview }]
        }));
    };

    const handleRemoveCustomerImage = (colorName, index) => {
        setCustomerImages(prev => ({
            ...prev,
            [colorName]: (prev[colorName] || []).filter((_, i) => i !== index)
        }));
    };

    // Validation per step
    const canProceed = () => {
        if (step === 1) return selectedProductId && selectedColors.length > 0;
        if (step === 2) {
            return selectedColors.every(color => {
                const list = colorPlacements[color] || [];
                return list.length > 0;
            });
        }
        if (step === 3) {
            return selectedColors.every(color => {
                const list = manufacturerRefs[color] || [];
                return list.length > 0;
            });
        }
        if (step === 4) {
            const hasStorefrontImages = selectedColors.every(color => {
                const list = customerImages[color] || [];
                return list.length > 0;
            });
            return designTitle.trim() && designerCost !== '' && parseFloat(designerCost) >= 0 && description.trim() && hasStorefrontImages;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!user || !selectedProductObj) return;
        try {
            showToast('Uploading customer images...', 'info');
            const finalCustomerImages = {};
            const allCustomerUrls = [];
            for (const colorName of selectedColors) {
                finalCustomerImages[colorName] = [];
                const list = customerImages[colorName] || [];
                for (const img of list) {
                    if (img.file) {
                        const ext = img.file.name.split('.').pop() || 'jpg';
                        const filePath = `designs/${user.id}/${Date.now()}_customer_${colorName}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
                        const url = await uploadFile('asat-uploads', filePath, img.file);
                        finalCustomerImages[colorName].push(url);
                        allCustomerUrls.push(url);
                    }
                }
                // Automatically append the base product's size chart image if it exists
                if (selectedProductObj.sizeChartImage) {
                    finalCustomerImages[colorName].push(selectedProductObj.sizeChartImage);
                }
            }

            // Also append the size chart image to the root images list if it exists
            if (selectedProductObj.sizeChartImage && !allCustomerUrls.includes(selectedProductObj.sizeChartImage)) {
                allCustomerUrls.push(selectedProductObj.sizeChartImage);
            }

            showToast('Uploading placement specifications...', 'info');
            const finalPlacements = {};
            for (const colorName of selectedColors) {
                finalPlacements[colorName] = [];
                const list = colorPlacements[colorName] || [];
                for (const item of list) {
                    let designUrl = '';
                    let mockupUrl = '';
                    if (item.designFile) {
                        const ext = item.designFile.name.split('.').pop() || 'jpg';
                        const filePath = `designs/${user.id}/${Date.now()}_design_${colorName}_${item.placementId}.${ext}`;
                        designUrl = await uploadFile('asat-uploads', filePath, item.designFile);
                    }
                    if (item.mockupFile) {
                        const ext = item.mockupFile.name.split('.').pop() || 'jpg';
                        const filePath = `designs/${user.id}/${Date.now()}_mockup_${colorName}_${item.placementId}.${ext}`;
                        mockupUrl = await uploadFile('asat-uploads', filePath, item.mockupFile);
                    }
                    finalPlacements[colorName].push({
                        style: item.style,
                        placementId: item.placementId,
                        placementLabel: item.placementLabel,
                        designUrl,
                        mockupUrl
                    });
                }
            }

            showToast('Uploading manufacturer references...', 'info');
            const finalManufacturerRefs = {};
            for (const colorName of selectedColors) {
                finalManufacturerRefs[colorName] = [];
                const list = manufacturerRefs[colorName] || [];
                for (const img of list) {
                    if (img.file) {
                        const ext = img.file.name.split('.').pop() || 'jpg';
                        const filePath = `designs/${user.id}/${Date.now()}_mfgRef_${colorName}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
                        const url = await uploadFile('asat-uploads', filePath, img.file);
                        finalManufacturerRefs[colorName].push(url);
                    }
                }
            }

            showToast('Saving design details...', 'info');
            const mapGender = (g) => {
                const gl = String(g || '').toLowerCase().trim();
                if (gl === 'men' || gl === 'man' || gl === 'male') return 'male';
                if (gl === 'women' || gl === 'woman' || gl === 'female') return 'female';
                return 'unisex';
            };

            const baseCost = Number(selectedProductObj?.cost) || 0;
            const markup = 0;
            const maxPrintingCost = selectedColors.reduce((max, color) => {
                const list = colorPlacements[color] || [];
                const colorCost = list.reduce((sum, placement) => {
                    const ps = selectedProductObj?.printingStyles?.find(x => x.style === placement.style);
                    return sum + (ps ? Number(ps.cost) || 0 : 0);
                }, 0);
                return Math.max(max, colorCost);
            }, 0);
            const dCost = Number(designerCost) || 0;
            const calculatedTotalPrice = baseCost + maxPrintingCost + dCost + markup;

            const designData = {
                designer_id: user.id,
                designer_username: profile?.username || user.email?.split('@')[0] || 'designer',
                title: designTitle.trim(),
                price: calculatedTotalPrice,
                description: JSON.stringify({
                    text: description,
                    baseProductId: selectedProductId,
                    placements: finalPlacements,
                    manufacturerRefs: finalManufacturerRefs,
                    customerImages: finalCustomerImages,
                    pricing: {
                        baseCost,
                        printingCost: maxPrintingCost,
                        designerCost: dCost,
                        markup
                    }
                }),
                status: 'pending',
                images: allCustomerUrls,
                colors: selectedColors,
                sizes: selectedProductObj.sizes || [],
                gender: mapGender(selectedProductObj.gender),
                collection: selectedProductObj.collection || 'Default',
                base_product_id: selectedProductId || null,
            };

            await apiFetch('/api/designs', {
                method: 'POST',
                body: JSON.stringify(designData)
            });

            showToast('Design submitted for review! Redirecting...', 'success');
            setTimeout(() => navigate('/designer/designs'), 2000);
        } catch (err) {
            console.error("Error creating Supabase design document:", err);
            showToast("Could not submit design. Please try again: " + err.message, 'error');
        }
    };

    // Drop zone component
    const DropZone = ({ label, preview, onFile, accept = 'image/*', isMfgBase = false }) => {
        const [dragOver, setDragOver] = useState(false);
        const fileInputRef = React.useRef(null);

        const handleDownload = async (e) => {
            if (e) e.stopPropagation();
            if (!preview) return;
            try {
                const response = await fetch(preview);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${label.replace(/\s+/g, '_')}_template.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error("Failed to download directly, opening in new tab:", err);
                window.open(preview, '_blank');
            }
        };

        const handleContainerClick = (e) => {
            if (preview && isMfgBase) {
                handleDownload(e);
            } else {
                fileInputRef.current.click();
            }
        };

        const handleUploadClick = (e) => {
            e.stopPropagation();
            fileInputRef.current.click();
        };

        return (
            <div
                className={`dsn-upload__drop ${dragOver ? 'dsn-upload__drop--active' : ''} ${preview ? 'dsn-upload__drop--has' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files[0]); }}
                onClick={handleContainerClick}
                style={{ cursor: 'pointer' }}
            >
                {preview ? (
                    <div className="dsn-upload__drop-preview" style={{ backgroundImage: `url(${preview})` }}>
                        {isMfgBase && (
                            <>
                                <span style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    background: 'var(--gold)',
                                    color: '#111',
                                    fontSize: '0.55rem',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '2px',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    zIndex: 10
                                }}>
                                    Base Canvas
                                </span>
                                <button 
                                    onClick={handleDownload}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(0, 0, 0, 0.75)',
                                        color: 'var(--gold)',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        zIndex: 15,
                                        border: '1px solid var(--gold)',
                                        transition: 'all 0.2s ease',
                                        padding: 0
                                    }}
                                    className="dsn-upload__download-btn"
                                    title="Download Template"
                                    type="button"
                                >
                                    <i className="fas fa-download"></i>
                                </button>
                            </>
                        )}
                        <span className="dsn-upload__drop-change" onClick={handleUploadClick}>Change</span>
                    </div>
                ) : (
                    <div className="dsn-upload__drop-empty">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>{label}</span>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept={accept} 
                    onChange={e => e.target.files[0] && onFile(e.target.files[0])} 
                    style={{ display: 'none' }}
                />
            </div>
        );
    };

    return (
        <main className="dsn-upload">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            {/* Progress Bar — 5 steps */}
            <div className="dsn-upload__progress">
                {['Product & Colors', 'Placement Specs', 'Mfg References', 'Customer Details', 'Review'].map((label, i) => (
                    <div key={i} className={`dsn-upload__step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                        <div className="dsn-upload__step-dot">{step > i + 1 ? <i className="fas fa-check"></i> : i + 1}</div>
                        <span className="dsn-upload__step-label">{label}</span>
                    </div>
                ))}
            </div>

            {/* ─── STEP 1: Product & Color ─── */}
            {step === 1 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Select Base Product</h3>
                    {productsLoading ? (
                        <div style={{ color: '#888', padding: '12px 0', fontSize: '0.9rem' }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Loading available base products...
                        </div>
                    ) : dbProducts.length === 0 ? (
                        <div style={{ color: '#888', padding: '12px 0', fontSize: '0.9rem' }}>
                            No base products available yet.
                        </div>
                    ) : (
                        <div className="dsn-upload__product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {uniqueProducts.map(prod => {
                                const productCoverImage = prod.coverImage || prod.colors?.[0]?.frontImage || 'https://via.placeholder.com/200x250?text=No+Image';
                                const isActive = selectedProductId === prod.id;
                                return (
                                    <div
                                        key={prod.id}
                                        className={`dsn-upload__product-btn ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedProductId(prod.id);
                                            setSelectedColors([]);
                                            setColorPlacements({});
                                            setManufacturerRefs({});
                                        }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            background: isActive ? 'rgba(197,160,89,0.06)' : '#fafafa',
                                            border: isActive ? '2px solid var(--gold)' : '1px solid #ddd',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isActive ? '0 10px 25px rgba(197,160,89,0.12)' : 'none',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {/* Product Cover Preview */}
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '220px',
                                                background: `url(${productCoverImage}) center/cover no-repeat`,
                                                borderRadius: '6px',
                                                marginBottom: '12px',
                                                border: '1px solid #eee'
                                            }}
                                        ></div>

                                        {/* Info */}
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isActive ? 'var(--gold)' : '#111', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {prod.title}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>
                                            by {prod.mfgName || 'Manufacturer'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                                            Base Cost: ₹{(prod.cost || 0).toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedProductId && selectedProductObj && (
                        <>
                            <h3 className="dsn-upload__heading" style={{ marginTop: '30px' }}>Select Colors</h3>
                            <div className="dsn-upload__color-grid">
                                {(selectedProductObj.colors || []).map(c => (
                                    <button key={c.colorName} className={`dsn-upload__color-btn ${selectedColors.includes(c.colorName) ? 'active' : ''}`} onClick={() => toggleColor(c.colorName)}>
                                        <span className="dsn-upload__color-swatch" style={{ background: c.color, border: c.color === '#FFFFFF' ? '1px solid #ddd' : 'none' }}></span>
                                        <span>{c.colorName}</span>
                                        {selectedColors.includes(c.colorName) && <i className="fas fa-check-circle"></i>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {selectedColors.length > 0 && selectedProductObj && (
                        <>
                            <h3 className="dsn-upload__heading" style={{ marginTop: '30px' }}>Download Color Reference Canvases</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '24px' }}>
                                {selectedColors.map(colorName => {
                                    const colorObj = selectedProductObj.colors?.find(c => c.colorName === colorName);
                                    if (!colorObj) return null;
                                    return (
                                        <div key={colorName} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', background: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                                                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: colorObj.color, border: '1px solid #ccc' }}></span>
                                                {colorName}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {colorObj.frontImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDirectDownload(colorObj.frontImage, `${colorName}_Front_Canvas.jpg`)}
                                                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.65rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#333' }}
                                                    >
                                                        <i className="fas fa-download" style={{ color: 'var(--gold)' }}></i> Front
                                                    </button>
                                                )}
                                                {colorObj.backImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDirectDownload(colorObj.backImage, `${colorName}_Back_Canvas.jpg`)}
                                                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.65rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#333' }}
                                                    >
                                                        <i className="fas fa-download" style={{ color: 'var(--gold)' }}></i> Back
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* ─── STEP 2: Placement Specifications Per Color ─── */}
            {step === 2 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Configure Printing & Placements</h3>
                    <p className="dsn-upload__hint">Add print and placement specifications for each selected color. You must add at least one configuration per color.</p>

                    {/* Color Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        {selectedColors.map(color => {
                            const colorObj = selectedProductObj.colors?.find(c => c.colorName === color);
                            const hexColor = colorObj ? colorObj.color : '#ffffff';
                            const isActive = activePlacementColorTab === color;
                            const hasConfig = (colorPlacements[color] || []).length > 0;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setActivePlacementColorTab(color)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        border: isActive ? '2px solid var(--gold)' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: isActive ? 'rgba(197,160,89,0.06)' : 'white',
                                        color: isActive ? 'var(--gold)' : '#333',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: hexColor, border: '1px solid #ccc' }}></span>
                                    {color}
                                    {hasConfig && <i className="fas fa-check-circle" style={{ color: '#2ecc71', marginLeft: '4px' }}></i>}
                                </button>
                            );
                        })}
                    </div>

                    {activePlacementColorTab && (
                        <div>
                            {/* List of current specs */}
                            <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                                Specifications for {activePlacementColorTab} ({(colorPlacements[activePlacementColorTab] || []).length})
                            </h4>
                            
                            {(colorPlacements[activePlacementColorTab] || []).length === 0 ? (
                                <div style={{ padding: '20px', border: '1px dashed #ddd', borderRadius: '6px', textAlign: 'center', color: '#888', fontSize: '0.8rem', background: '#fafafa', marginBottom: '24px' }}>
                                    No print or placement configurations added for this color yet. Fill out the form below to add one.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginBottom: '24px' }}>
                                    {(colorPlacements[activePlacementColorTab] || []).map(item => (
                                        <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveConfig(activePlacementColorTab, item.id)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.9rem' }}
                                                title="Remove configuration"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#333' }}>
                                                <i className="fas fa-print" style={{ color: 'var(--gold)', marginRight: '6px' }}></i> {item.style} — {item.placementLabel}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 600, marginBottom: '4px' }}>Design Artwork:</div>
                                                    <div style={{ width: '100%', height: '80px', borderRadius: '4px', border: '1px solid #eee', background: `url(${item.designPreview}) center/contain no-repeat #f9f9f9` }}></div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 600, marginBottom: '4px' }}>Mockup View:</div>
                                                    <div style={{ width: '100%', height: '80px', borderRadius: '4px', border: '1px solid #eee', background: `url(${item.mockupPreview}) center/contain no-repeat #f9f9f9` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Form to add specification */}
                            <form onSubmit={handleAddConfig} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', background: '#fafafa' }}>
                                <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', fontWeight: 700, margin: '0 0 16px 0', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                    Add Placement Configuration
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '16px' }}>
                                    <div className="dsn-profile__group">
                                        <label>Printing Style</label>
                                        <select 
                                            className="dsn-upload__select"
                                            value={formStyle}
                                            onChange={e => setFormStyle(e.target.value)}
                                        >
                                            {availableMethods.map(style => (
                                                <option key={style} value={style}>{style}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="dsn-profile__group">
                                        <label>Placement Zone</label>
                                        <select
                                            className="dsn-upload__select"
                                            value={formPlacement}
                                            onChange={e => setFormPlacement(e.target.value)}
                                            disabled={getPlacementsForStyle(formStyle).length === 0}
                                        >
                                            {getPlacementsForStyle(formStyle).length === 0 ? (
                                                <option value="">No zones allocated</option>
                                            ) : (
                                                getPlacementsForStyle(formStyle).map(pl => (
                                                    <option key={pl.id} value={pl.id}>{pl.label}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', fontWeight: 600, marginBottom: '6px' }}>Reference Design File (PNG/AI/PDF)</label>
                                        <DropZone 
                                            label="Design File (PNG/AI/PDF)" 
                                            preview={formDesignPreview} 
                                            onFile={f => { setFormDesignFile(f); setFormDesignPreview(URL.createObjectURL(f)); }} 
                                            accept=".png,.ai,.pdf,image/*" 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', fontWeight: 600, marginBottom: '6px' }}>Image With Design Added (Mockup)</label>
                                        <DropZone 
                                            label="Mockup Preview Image" 
                                            preview={formMockupPreview} 
                                            onFile={f => { setFormMockupFile(f); setFormMockupPreview(URL.createObjectURL(f)); }} 
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="dsn-auth__btn"
                                    style={{ width: 'auto', padding: '10px 24px' }}
                                >
                                    <span>Add Configuration</span><i className="fas fa-plus"></i>
                                </button>
                            </form>
                        </div>
                    )}
                </section>
            )}

            {/* ─── STEP 3: Manufacturer Reference Images ─── */}
            {step === 3 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Manufacturer Reference Images</h3>
                    <p className="dsn-upload__hint">Upload final finished references with all designs visible for manufacturer reference. Must upload at least one per color.</p>

                    {/* Color Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        {selectedColors.map(color => {
                            const colorObj = selectedProductObj.colors?.find(c => c.colorName === color);
                            const hexColor = colorObj ? colorObj.color : '#ffffff';
                            const isActive = activeMfgRefColorTab === color;
                            const hasRefs = (manufacturerRefs[color] || []).length > 0;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setActiveMfgRefColorTab(color)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        border: isActive ? '2px solid var(--gold)' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: isActive ? 'rgba(197,160,89,0.06)' : 'white',
                                        color: isActive ? 'var(--gold)' : '#333',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: hexColor, border: '1px solid #ccc' }}></span>
                                    {color}
                                    {hasRefs && <i className="fas fa-check-circle" style={{ color: '#2ecc71', marginLeft: '4px' }}></i>}
                                </button>
                            );
                        })}
                    </div>

                    {activeMfgRefColorTab && (
                        <div>
                            <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                                Reference Images for {activeMfgRefColorTab} ({(manufacturerRefs[activeMfgRefColorTab] || []).length})
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                                {(manufacturerRefs[activeMfgRefColorTab] || []).map((img, index) => (
                                    <div key={index} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '8px', background: 'white', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMfgRef(activeMfgRefColorTab, index)}
                                            style={{ position: 'absolute', top: '6px', right: '6px', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.65rem' }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <div style={{ width: '100%', height: '150px', background: `url(${img.preview}) center/contain no-repeat #f9f9f9`, borderRadius: '4px' }}></div>
                                    </div>
                                ))}
                                
                                <div style={{ height: '168px' }}>
                                    <DropZone 
                                        label="Add Reference Image" 
                                        preview="" 
                                        onFile={handleAddMfgRef} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ─── STEP 4: Details & Customer Images ─── */}
            {step === 4 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Details & Customer Images</h3>
                    <p className="dsn-upload__hint">Enter design information and upload images that customers will see in the store.</p>

                    <div className="dsn-upload__details-grid" style={{ marginBottom: '24px' }}>
                        <div className="dsn-profile__group">
                            <label>Design Name *</label>
                            <input 
                                type="text" 
                                className="dsn-upload__input"
                                placeholder="e.g. Vintage Gold emblem Tee" 
                                value={designTitle}
                                onChange={e => setDesignTitle(e.target.value)}
                            />
                        </div>
                        <div className="dsn-profile__group">
                            <label>Designer Royalty / Cost (₹ INR) *</label>
                            <div className="dsn-auth__field" style={{ background: 'white' }}>
                                <span style={{ padding: '0 10px', color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
                                <input type="number" placeholder="e.g. 200" value={designerCost} onChange={e => setDesignerCost(e.target.value)} min="0" style={{ border: 'none', background: 'transparent' }} />
                            </div>
                            
                            {/* Live Pricing Breakdown for Designer */}
                            {selectedProductObj && (
                                <div style={{ marginTop: '15px', background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', padding: '18px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(197,160,89,0.25)' }}>
                                    <h4 style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#C5A059', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif" }}>💰 Price Preview</h4>
                                    {(() => {
                                        const baseCost = Number(selectedProductObj?.cost || 0);
                                        const maxPrint = selectedColors.reduce((max, color) => {
                                            const list = colorPlacements[color] || [];
                                            const colorCost = list.reduce((sum, placement) => {
                                                const ps = selectedProductObj?.printingStyles?.find(x => x.style === placement.style);
                                                return sum + (ps ? Number(ps.cost) || 0 : 0);
                                            }, 0);
                                            return Math.max(max, colorCost);
                                        }, 0);
                                        const dCost = Number(designerCost) || 0;
                                        const rawTotal = baseCost + maxPrint + dCost;
                                        return (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#aaa' }}>
                                                    <span>Base Product:</span>
                                                    <span>₹{baseCost.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#aaa' }}>
                                                    <span>Max Printing Cost:</span>
                                                    <span>₹{maxPrint.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#C5A059' }}>
                                                    <span>Your Royalty:</span>
                                                    <span>₹{dCost.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666', fontSize: '0.75rem' }}>
                                                    <span>Raw Sub-total:</span>
                                                    <span>₹{rawTotal.toLocaleString()}</span>
                                                </div>
                                                <hr style={{ border: 'none', borderTop: '1px solid rgba(197,160,89,0.2)', margin: '8px 0' }} />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                                                    <span>Customer Selling Price <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 400 }}>(excl. GST)</span></span>
                                                    <span style={{ color: '#C5A059' }}>₹{Math.round(applyMarkup(rawTotal)).toLocaleString()}</span>
                                                </div>
                                                <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.72rem', fontFamily: "'Montserrat', sans-serif" }}>Master markup & GST are applied at checkout by ASAT. Your royalty is guaranteed regardless.</p>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        <div className="dsn-profile__group dsn-profile__group--full">
                            <label>Design Description *</label>
                            <textarea className="dsn-upload__textarea dsn-upload__textarea--lg" rows="5" placeholder="Tell the story behind your design — inspiration, mood, and target audience..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                        </div>
                    </div>

                    <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                        Customer Storefront Images
                    </h4>
                    <p className="dsn-upload__hint">Upload showcasing images for each color separately. Customers will see these when they select the color.</p>

                    {/* Color Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        {selectedColors.map(color => {
                            const colorObj = selectedProductObj.colors?.find(c => c.colorName === color);
                            const hexColor = colorObj ? colorObj.color : '#ffffff';
                            const isActive = activeCustomerImgColorTab === color;
                            const hasImages = (customerImages[color] || []).length > 0;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setActiveCustomerImgColorTab(color)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        border: isActive ? '2px solid var(--gold)' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: isActive ? 'rgba(197,160,89,0.06)' : 'white',
                                        color: isActive ? 'var(--gold)' : '#333',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: hexColor, border: '1px solid #ccc' }}></span>
                                    {color}
                                    {hasImages && <i className="fas fa-check-circle" style={{ color: '#2ecc71', marginLeft: '4px' }}></i>}
                                </button>
                            );
                        })}
                    </div>

                    {activeCustomerImgColorTab && (
                        <div>
                            <h5 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem', fontWeight: 700, marginBottom: '12px', color: '#333' }}>
                                Storefront Images for {activeCustomerImgColorTab} ({(customerImages[activeCustomerImgColorTab] || []).length})
                            </h5>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                                {(customerImages[activeCustomerImgColorTab] || []).map((img, index) => (
                                    <div key={index} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '8px', background: 'white', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomerImage(activeCustomerImgColorTab, index)}
                                            style={{ position: 'absolute', top: '6px', right: '6px', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.65rem' }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <div style={{ width: '100%', height: '150px', background: `url(${img.preview}) center/contain no-repeat #f9f9f9`, borderRadius: '4px' }}></div>
                                    </div>
                                ))}
                                <div style={{ height: '168px' }}>
                                    <DropZone 
                                        label="Add Customer Image" 
                                        preview="" 
                                        onFile={handleAddCustomerImage} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ─── STEP 5: Review & Submit ─── */}
            {step === 5 && (
                <section className="dsn-upload__section">
                    <h3 className="dsn-upload__heading">Review Your Design</h3>

                    <div className="dsn-upload__review-block">
                        <h4>Product Details</h4>
                        <div className="dsn-upload__review-grid">
                            <div><strong>Design Title:</strong> {designTitle}</div>
                            <div><strong>Base Product:</strong> {selectedProductObj?.title}</div>
                            <div><strong>Final Retail Price:</strong> ₹{(
                                (Number(selectedProductObj?.cost) || 0) + 
                                selectedColors.reduce((max, color) => {
                                    const list = colorPlacements[color] || [];
                                    const colorCost = list.reduce((sum, placement) => {
                                        const ps = selectedProductObj?.printingStyles?.find(x => x.style === placement.style);
                                        return sum + (ps ? Number(ps.cost) || 0 : 0);
                                    }, 0);
                                    return Math.max(max, colorCost);
                                }, 0) + 
                                (Number(designerCost) || 0)
                            ).toLocaleString()}</div>
                            <div><strong>Selected Colors:</strong> {selectedColors.join(', ')}</div>
                        </div>
                    </div>

                    <div className="dsn-upload__review-block">
                        <h4>Description</h4>
                        <p>{description || '—'}</p>
                    </div>

                    <div className="dsn-upload__review-block">
                        <h4>Customer Storefront Images</h4>
                        {selectedColors.map(color => {
                            const list = customerImages[color] || [];
                            return (
                                <div key={color} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
                                        {color} Storefront Images ({list.length})
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {list.map((img, idx) => (
                                            <div key={idx} style={{ width: '60px', height: '60px', borderRadius: '4px', border: '1px solid #ddd', background: `url(${img.preview}) center/cover no-repeat` }}></div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="dsn-upload__review-block">
                        <h4>Printing & Placements Specs</h4>
                        {selectedColors.map(color => {
                            const list = colorPlacements[color] || [];
                            return (
                                <div key={color} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
                                        {color} Configurations ({list.length})
                                    </div>
                                    <div style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {list.map((item, idx) => (
                                            <div key={idx} style={{ fontSize: '0.72rem', color: '#555' }}>
                                                • {item.style} on <strong>{item.placementLabel}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="dsn-upload__review-block">
                        <h4>Manufacturer Reference Images</h4>
                        {selectedColors.map(color => {
                            const list = manufacturerRefs[color] || [];
                            return (
                                <div key={color} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
                                        {color} References ({list.length})
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {list.map((img, idx) => (
                                            <div key={idx} style={{ width: '60px', height: '60px', borderRadius: '4px', border: '1px solid #ddd', background: `url(${img.preview}) center/cover no-repeat` }}></div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Navigation */}
            <div className="dsn-upload__nav">
                {step > 1 && <button className="dsn-upload__nav-btn dsn-upload__nav-btn--back" onClick={() => setStep(s => s - 1)}><i className="fas fa-arrow-left"></i> Back</button>}
                <div className="dsn-upload__nav-spacer"></div>
                {step < 5 ? (
                    <button className="dsn-auth__btn" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
                        <span>Next</span><i className="fas fa-arrow-right"></i>
                    </button>
                ) : (
                    <button className="dsn-auth__btn dsn-auth__btn--submit" onClick={handleSubmit}>
                        <span>Submit for Review</span><i className="fas fa-paper-plane"></i>
                    </button>
                )}
            </div>
        </main>
    );
}

export default DesignerUpload;
